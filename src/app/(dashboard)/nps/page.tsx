import { createClient } from "@/lib/supabase/server";
import {
  Star,
  Store,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import {
  MultiLineChart,
  NPSGauge,
} from "@/components/charts";
import { RefreshNPSButton } from "./RefreshNPSButton";
import { MonthSelector } from "./MonthSelector";

interface MonthlyNPS {
  month: string;
  total_responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps_score: number;
  with_feedback: number;
}

interface StoreMonthlyNPS {
  store_id: string;
  store_name: string;
  store_code: string;
  month: string;
  total_responses: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps_score: number;
}

interface FeedbackRate {
  month: string;
  customers_with_orders: number;
  customers_with_feedback: number;
  feedback_rate_pct: number;
}

interface RecentFeedback {
  score: number;
  feedback: string;
  responded_at: string;
  category: string;
  store_name: string | null;
}

// Time intelligence helper
function getMonthsInRange(range: string, availableMonths: string[]): string[] {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  switch (range) {
    case "this-month":
      return [currentMonth];
    case "last-month": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return [`${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`];
    }
    case "last-3-months": {
      const months: string[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      return months;
    }
    case "last-6-months": {
      const months: string[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      return months;
    }
    case "ytd": {
      const months: string[] = [];
      for (let m = 0; m <= now.getMonth(); m++) {
        months.push(`${now.getFullYear()}-${String(m + 1).padStart(2, "0")}`);
      }
      return months;
    }
    case "last-year": {
      const lastYear = now.getFullYear() - 1;
      const months: string[] = [];
      for (let m = 0; m < 12; m++) {
        months.push(`${lastYear}-${String(m + 1).padStart(2, "0")}`);
      }
      return months;
    }
    default:
      return availableMonths;
  }
}

function getRangeLabel(range: string): string {
  switch (range) {
    case "this-month": return "This Month";
    case "last-month": return "Last Month";
    case "last-3-months": return "Last 3 Months";
    case "last-6-months": return "Last 6 Months";
    case "ytd": return "Year to Date";
    case "last-year": return "Last Year";
    default: return "All Time";
  }
}

// Fast query using materialized views
async function getNPSAnalytics() {
  const supabase = await createClient();

  // Query pre-aggregated materialized views (instant!)
  const [monthlyResult, storeResult, feedbackRateResult] = await Promise.all([
    supabase.from("nps_monthly_stats").select("*").order("month", { ascending: true }),
    supabase.from("nps_store_monthly_stats").select("*").order("month", { ascending: false }),
    supabase.from("feedback_rate_monthly").select("*").order("month", { ascending: true }),
  ]);

  const monthlyNPS: MonthlyNPS[] = (monthlyResult.data || []).map(m => ({
    month: m.month?.substring(0, 7) || "",
    total_responses: Number(m.total_responses) || 0,
    promoters: Number(m.promoters) || 0,
    passives: Number(m.passives) || 0,
    detractors: Number(m.detractors) || 0,
    nps_score: Number(m.nps_score) || 0,
    with_feedback: Number(m.with_feedback) || 0,
  }));

  const storeMonthlyNPS: StoreMonthlyNPS[] = (storeResult.data || []).map(s => ({
    store_id: s.store_id,
    store_name: s.store_name || "",
    store_code: s.store_code || "",
    month: s.month?.substring(0, 7) || "",
    total_responses: Number(s.total_responses) || 0,
    promoters: Number(s.promoters) || 0,
    passives: Number(s.passives) || 0,
    detractors: Number(s.detractors) || 0,
    nps_score: Number(s.nps_score) || 0,
  }));

  const feedbackRates: FeedbackRate[] = (feedbackRateResult.data || []).map(f => ({
    month: f.month?.substring(0, 7) || "",
    customers_with_orders: Number(f.customers_with_orders) || 0,
    customers_with_feedback: Number(f.customers_with_feedback) || 0,
    feedback_rate_pct: Number(f.feedback_rate_pct) || 0,
  }));

  // Calculate overall stats from monthly data
  const totals = monthlyNPS.reduce(
    (acc, m) => ({
      total: acc.total + m.total_responses,
      promoters: acc.promoters + m.promoters,
      passives: acc.passives + m.passives,
      detractors: acc.detractors + m.detractors,
    }),
    { total: 0, promoters: 0, passives: 0, detractors: 0 }
  );

  const npsScore = totals.total > 0
    ? Math.round(((totals.promoters - totals.detractors) / totals.total) * 100)
    : 0;

  const totalCustomers = feedbackRates.reduce((acc, f) => acc + f.customers_with_orders, 0);
  const totalFeedback = feedbackRates.reduce((acc, f) => acc + f.customers_with_feedback, 0);
  const overallFeedbackRate = totalCustomers > 0
    ? Math.round((totalFeedback / totalCustomers) * 1000) / 10
    : 0;

  // Get recent feedback (still need raw query for this)
  const { data: recentFeedbackData } = await supabase
    .from("nps_responses")
    .select(`
      score, feedback, responded_at,
      orders!inner(store_id, stores(name))
    `)
    .not("feedback", "is", null)
    .neq("feedback", "")
    .order("responded_at", { ascending: false })
    .limit(20);

  const recentFeedback: RecentFeedback[] = (recentFeedbackData || []).map((r: any) => ({
    score: r.score,
    feedback: r.feedback,
    responded_at: r.responded_at,
    category: r.score >= 9 ? "Promoter" : r.score >= 7 ? "Passive" : "Detractor",
    store_name: r.orders?.stores?.name || null,
  }));

  // Get score distribution
  const { data: distData } = await supabase
    .from("nps_responses")
    .select("score")
    .not("order_id", "is", null);

  const scoreDistribution = Array.from({ length: 11 }, (_, i) => ({
    name: i.toString(),
    value: (distData || []).filter((r: any) => r.score === i).length,
  }));

  const availableMonths = [...new Set(monthlyNPS.map(m => m.month))].sort((a, b) => b.localeCompare(a));

  return {
    overallStats: {
      total_responses: totals.total,
      promoters: totals.promoters,
      passives: totals.passives,
      detractors: totals.detractors,
      nps_score: npsScore,
      feedback_rate: overallFeedbackRate,
    },
    monthlyNPS,
    storeMonthlyNPS,
    feedbackRates,
    recentFeedback,
    scoreDistribution,
    availableMonths,
  };
}

export default async function NPSPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; range?: string }>;
}) {
  const params = await searchParams;
  const selectedMonth = params.month || "all";
  const selectedRange = params.range;

  const data = await getNPSAnalytics();
  const { overallStats, monthlyNPS, storeMonthlyNPS, feedbackRates, recentFeedback, scoreDistribution, availableMonths } = data;

  // Determine which months to include
  let targetMonths: string[] = [];
  let periodLabel = "All Time";

  if (selectedRange) {
    targetMonths = getMonthsInRange(selectedRange, availableMonths);
    periodLabel = getRangeLabel(selectedRange);
  } else if (selectedMonth !== "all") {
    targetMonths = [selectedMonth];
    periodLabel = new Date(selectedMonth + "-01").toLocaleDateString("vi-VN", { year: "numeric", month: "long" });
  }

  // Filter data by selected period
  const filteredMonthlyNPS = targetMonths.length > 0
    ? monthlyNPS.filter(m => targetMonths.includes(m.month))
    : monthlyNPS;

  const filteredFeedbackRates = targetMonths.length > 0
    ? feedbackRates.filter(f => targetMonths.includes(f.month))
    : feedbackRates;

  // Calculate stats for filtered data
  const filteredTotals = filteredMonthlyNPS.reduce(
    (acc, m) => ({
      total: acc.total + m.total_responses,
      promoters: acc.promoters + m.promoters,
      passives: acc.passives + m.passives,
      detractors: acc.detractors + m.detractors,
    }),
    { total: 0, promoters: 0, passives: 0, detractors: 0 }
  );

  const filteredNpsScore = filteredTotals.total > 0
    ? Math.round(((filteredTotals.promoters - filteredTotals.detractors) / filteredTotals.total) * 100)
    : 0;

  const filteredCustomers = filteredFeedbackRates.reduce((acc, f) => acc + f.customers_with_orders, 0);
  const filteredFeedback = filteredFeedbackRates.reduce((acc, f) => acc + f.customers_with_feedback, 0);
  const filteredFeedbackRate = filteredCustomers > 0
    ? Math.round((filteredFeedback / filteredCustomers) * 1000) / 10
    : 0;

  const displayStats = targetMonths.length === 0
    ? overallStats
    : {
        total_responses: filteredTotals.total,
        promoters: filteredTotals.promoters,
        passives: filteredTotals.passives,
        detractors: filteredTotals.detractors,
        nps_score: filteredNpsScore,
        feedback_rate: filteredFeedbackRate,
      };

  const promoterPct = displayStats.total_responses > 0
    ? ((displayStats.promoters / displayStats.total_responses) * 100).toFixed(1)
    : "0";
  const passivePct = displayStats.total_responses > 0
    ? ((displayStats.passives / displayStats.total_responses) * 100).toFixed(1)
    : "0";
  const detractorPct = displayStats.total_responses > 0
    ? ((displayStats.detractors / displayStats.total_responses) * 100).toFixed(1)
    : "0";

  // Filter store data by selected period
  const filteredStoreData = targetMonths.length > 0
    ? storeMonthlyNPS.filter(s => targetMonths.includes(s.month))
    : storeMonthlyNPS.filter(s => s.month === availableMonths[0]);

  // Aggregate store data if multiple months are selected
  const aggregatedStoreNPS = targetMonths.length > 1
    ? Object.values(
        filteredStoreData.reduce((acc, s) => {
          if (!acc[s.store_id]) {
            acc[s.store_id] = {
              store_id: s.store_id,
              store_name: s.store_name,
              store_code: s.store_code,
              month: periodLabel,
              total_responses: 0,
              promoters: 0,
              passives: 0,
              detractors: 0,
              nps_score: 0,
            };
          }
          acc[s.store_id].total_responses += s.total_responses;
          acc[s.store_id].promoters += s.promoters;
          acc[s.store_id].passives += s.passives;
          acc[s.store_id].detractors += s.detractors;
          return acc;
        }, {} as Record<string, StoreMonthlyNPS>)
      ).map(s => ({
        ...s,
        nps_score: s.total_responses > 0
          ? Math.round(((s.promoters - s.detractors) / s.total_responses) * 100)
          : 0,
      }))
    : filteredStoreData;

  const filteredStoreNPS = aggregatedStoreNPS.sort((a, b) => b.nps_score - a.nps_score);

  // Use filtered data for trends when period is selected
  const npsTrendData = filteredMonthlyNPS.map(m => ({
    date: m.month,
    score: m.nps_score,
    responses: m.total_responses,
  }));

  const feedbackRateTrend = filteredFeedbackRates.map(f => ({
    date: f.month,
    rate: f.feedback_rate_pct,
  }));

  // Calculate filtered score distribution
  const filteredScoreDistribution = Array.from({ length: 11 }, (_, i) => ({
    name: i.toString(),
    value: 0,
  }));

  // We need to recalculate score distribution based on filtered period
  // For now, use the overall if we have it, or show a message that it's overall

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">NPS Analytics</h1>
          <p className="text-sm sm:text-base text-slate-400 mt-1">
            {periodLabel} • Eligible: ±30 days
          </p>
        </div>
        <RefreshNPSButton />
      </div>

      {/* Filter - responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="text-sm text-slate-400">Filter by Month:</label>
        <MonthSelector availableMonths={availableMonths} selectedMonth={selectedMonth} />
      </div>

      {/* KPI Cards - responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KPICard
          title="NPS Score"
          value={displayStats.nps_score}
          iconName="Star"
          color={displayStats.nps_score >= 50 ? "emerald" : displayStats.nps_score >= 0 ? "amber" : "red"}
          subtitle={displayStats.nps_score >= 70 ? "World Class" : displayStats.nps_score >= 50 ? "Excellent" : displayStats.nps_score >= 30 ? "Good" : "Needs Work"}
        />
        <KPICard
          title="Eligible Responses"
          value={displayStats.total_responses.toLocaleString()}
          iconName="MessageSquare"
          color="blue"
        />
        <KPICard
          title="Feedback Rate"
          value={displayStats.feedback_rate + "%"}
          iconName="TrendingUp"
          color="cyan"
          subtitle="of customers gave feedback"
        />
        <KPICard
          title="Promoters"
          value={displayStats.promoters.toLocaleString() + " (" + promoterPct + "%)"}
          iconName="ThumbsUp"
          color="emerald"
        />
        <KPICard
          title="Detractors"
          value={displayStats.detractors.toLocaleString() + " (" + detractorPct + "%)"}
          iconName="ThumbsDown"
          color="red"
        />
      </div>

      {/* NPS Gauge and Trend - responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 flex flex-col items-center justify-center">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">Net Promoter Score</h2>
          <div className="scale-75 sm:scale-100 origin-center">
            <NPSGauge value={displayStats.nps_score} size={240} />
          </div>
          <div className="mt-4 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-6 w-full">
            <div className="text-center p-2 sm:p-3 bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-500/20">
              <p className="text-xl sm:text-3xl font-bold text-emerald-400">{promoterPct}%</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Promoters</p>
              <p className="text-xs text-emerald-400/70 hidden sm:block">{displayStats.promoters.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-amber-500/10 rounded-lg sm:rounded-xl border border-amber-500/20">
              <p className="text-xl sm:text-3xl font-bold text-amber-400">{passivePct}%</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Passives</p>
              <p className="text-xs text-amber-400/70 hidden sm:block">{displayStats.passives.toLocaleString()}</p>
            </div>
            <div className="text-center p-2 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl border border-red-500/20">
              <p className="text-xl sm:text-3xl font-bold text-red-400">{detractorPct}%</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">Detractors</p>
              <p className="text-xs text-red-400/70 hidden sm:block">{displayStats.detractors.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">NPS Trend by Month</h2>
          <MultiLineChart
            data={npsTrendData}
            lines={[{ key: "score", name: "NPS Score", color: "#10b981" }]}
            height={280}
          />
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          NPS by Month
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Month</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Responses</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Promoters</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Passives</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Detractors</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">NPS</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">With Feedback</th>
              </tr>
            </thead>
            <tbody>
              {filteredMonthlyNPS.slice().reverse().map((m, idx) => (
                <tr key={m.month} className={idx % 2 === 0 ? "bg-slate-800/30" : ""}>
                  <td className="py-3 px-4 text-white font-medium">
                    {new Date(m.month + "-01").toLocaleDateString("vi-VN", { year: "numeric", month: "short" })}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">{m.total_responses.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-emerald-400">{m.promoters.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-amber-400">{m.passives.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-red-400">{m.detractors.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={m.nps_score >= 50 ? "font-bold text-emerald-400" : m.nps_score >= 0 ? "font-bold text-amber-400" : "font-bold text-red-400"}>
                      {m.nps_score}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-cyan-400">{m.with_feedback.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Store className="h-5 w-5 text-cyan-400" />
          NPS by Store ({targetMonths.length > 0 ? periodLabel : (availableMonths[0] || "N/A")})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Store</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Code</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Responses</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Promoters</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Passives</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">Detractors</th>
                <th className="text-right py-3 px-4 text-slate-400 font-medium">NPS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStoreNPS.length > 0 ? (
                filteredStoreNPS.map((s, idx) => (
                  <tr key={s.store_code + "-" + s.month} className={idx % 2 === 0 ? "bg-slate-800/30" : ""}>
                    <td className="py-3 px-4 text-white font-medium">{s.store_name}</td>
                    <td className="py-3 px-4 text-slate-400">{s.store_code}</td>
                    <td className="py-3 px-4 text-right text-slate-300">{s.total_responses}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{s.promoters}</td>
                    <td className="py-3 px-4 text-right text-amber-400">{s.passives}</td>
                    <td className="py-3 px-4 text-right text-red-400">{s.detractors}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={s.nps_score >= 50 ? "font-bold text-emerald-400" : s.nps_score >= 0 ? "font-bold text-amber-400" : "font-bold text-red-400"}>
                        {s.nps_score}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No store data for this month</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Feedback Rate Trend
          </h2>
          <MultiLineChart
            data={feedbackRateTrend}
            lines={[{ key: "rate", name: "Feedback Rate %", color: "#06b6d4" }]}
            height={250}
          />
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Feedback Rate by Month
          </h2>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Month</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Customers</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Feedback</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbackRates.slice().reverse().map((f, idx) => (
                  <tr key={f.month} className={idx % 2 === 0 ? "bg-slate-800/30" : ""}>
                    <td className="py-2 px-3 text-white">
                      {new Date(f.month + "-01").toLocaleDateString("vi-VN", { year: "numeric", month: "short" })}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{f.customers_with_orders.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-cyan-400">{f.customers_with_feedback.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right">
                      <span className={f.feedback_rate_pct >= 10 ? "font-medium text-emerald-400" : f.feedback_rate_pct >= 5 ? "font-medium text-amber-400" : "font-medium text-red-400"}>
                        {f.feedback_rate_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Score Distribution <span className="text-sm font-normal text-slate-500">(All Time)</span></h2>
          <div className="flex items-end justify-between h-48 gap-1">
            {scoreDistribution.map((item, index) => {
              const maxValue = Math.max(...scoreDistribution.map(d => d.value));
              const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const barColor = index >= 9 ? "bg-emerald-500" : index >= 7 ? "bg-amber-500" : "bg-red-500";
              return (
                <div key={item.name} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs text-slate-400 mb-1">{item.value > 0 ? item.value : ""}</span>
                    <div className={"w-full rounded-t transition-all " + barColor} style={{ height: height + "%", minHeight: item.value > 0 ? "4px" : "0" }} />
                  </div>
                  <span className="text-xs text-slate-400 mt-2">{item.name}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-xs">
            <span className="text-red-400">Detractors (0-6)</span>
            <span className="text-amber-400">Passives (7-8)</span>
            <span className="text-emerald-400">Promoters (9-10)</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            Recent Feedback <span className="text-sm font-normal text-slate-500">(Latest 20)</span>
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {recentFeedback.length > 0 ? (
              recentFeedback.map((item, index) => {
                const bgClass = item.category === "Promoter" ? "bg-emerald-500/5 border-emerald-500/20" : item.category === "Passive" ? "bg-amber-500/5 border-amber-500/20" : "bg-red-500/5 border-red-500/20";
                const badgeClass = item.category === "Promoter" ? "bg-emerald-500/20 text-emerald-400" : item.category === "Passive" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400";
                return (
                  <div key={index} className={"p-3 rounded-lg border " + bgClass}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium " + badgeClass}>
                          <Star className="h-3 w-3" />
                          {item.score}
                        </span>
                        {item.store_name && (
                          <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{item.store_name}</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{new Date(item.responded_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{item.feedback}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">No feedback available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
