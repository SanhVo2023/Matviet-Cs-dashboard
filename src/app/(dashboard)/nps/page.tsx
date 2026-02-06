import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react";
import GlobalFilters from "@/components/filters/GlobalFilters";
import { KPICard } from "@/components/ui/KPICard";
import {
  TrendAreaChart,
  MultiLineChart,
  DonutChart,
  CategoryBarChart,
  NPSGauge,
} from "@/components/charts";

async function getNPSData(period: string, storeId?: string, segment?: string) {
  const supabase = await createClient();

  // Get date range
  const now = new Date();
  let from = new Date(2024, 0, 1);

  switch (period) {
    case "7d":
      from.setDate(now.getDate() - 7);
      break;
    case "30d":
      from.setDate(now.getDate() - 30);
      break;
    case "90d":
      from.setDate(now.getDate() - 90);
      break;
    case "ytd":
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case "1y":
      from.setFullYear(now.getFullYear() - 1);
      break;
  }

  // If segment filter, get customer IDs first
  let filteredCustomerIds: string[] | null = null;
  if (segment && segment !== "all") {
    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("rfm_segment", segment);
    filteredCustomerIds = (customers || []).map((c) => c.id);
  }

  // Get NPS responses
  let query = supabase
    .from("nps_responses")
    .select("id, score, category, feedback, responded_at, customer_id")
    .gte("responded_at", from.toISOString())
    .lte("responded_at", now.toISOString())
    .order("responded_at", { ascending: false });

  // Filter by segment if needed
  if (filteredCustomerIds && filteredCustomerIds.length > 0) {
    query = query.in("customer_id", filteredCustomerIds);
  }

  const { data: responses } = await query;
  const allResponses = responses || [];

  // Calculate NPS metrics
  const promoters = allResponses.filter((r) => r.score >= 9);
  const passives = allResponses.filter((r) => r.score >= 7 && r.score <= 8);
  const detractors = allResponses.filter((r) => r.score <= 6);
  const total = allResponses.length;

  const npsScore =
    total > 0
      ? Math.round(((promoters.length - detractors.length) / total) * 100)
      : 0;

  // Response rate by day
  const dailyResponses: Record<string, { promoters: number; passives: number; detractors: number; total: number }> = {};
  allResponses.forEach((r) => {
    const date = r.responded_at?.split("T")[0];
    if (date) {
      if (!dailyResponses[date]) {
        dailyResponses[date] = { promoters: 0, passives: 0, detractors: 0, total: 0 };
      }
      dailyResponses[date].total += 1;
      if (r.score >= 9) dailyResponses[date].promoters += 1;
      else if (r.score >= 7) dailyResponses[date].passives += 1;
      else dailyResponses[date].detractors += 1;
    }
  });

  // Monthly NPS trend
  const monthlyNPS: Record<string, { promoters: number; detractors: number; total: number }> = {};
  allResponses.forEach((r) => {
    const month = r.responded_at?.substring(0, 7);
    if (month) {
      if (!monthlyNPS[month]) {
        monthlyNPS[month] = { promoters: 0, detractors: 0, total: 0 };
      }
      monthlyNPS[month].total += 1;
      if (r.score >= 9) monthlyNPS[month].promoters += 1;
      else if (r.score <= 6) monthlyNPS[month].detractors += 1;
    }
  });

  const npsTrend = Object.entries(monthlyNPS)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, data]) => ({
      date: month,
      score: data.total > 0 ? Math.round(((data.promoters - data.detractors) / data.total) * 100) : 0,
      responses: data.total,
    }));

  // Score distribution (0-10)
  const scoreDistribution = Array.from({ length: 11 }, (_, i) => ({
    name: i.toString(),
    value: allResponses.filter((r) => r.score === i).length,
  }));

  // Recent feedback
  const recentFeedback = allResponses
    .filter((r) => r.feedback && r.feedback.trim())
    .slice(0, 15)
    .map((r) => ({
      score: r.score,
      feedback: r.feedback,
      date: r.responded_at,
      category: r.score >= 9 ? "Promoter" : r.score >= 7 ? "Passive" : "Detractor",
    }));

  // Calculate response rate trend (last 7 days)
  const last7DaysResponses = Object.entries(dailyResponses)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .map(([_, data]) => data.total);

  return {
    npsScore,
    total,
    promoters: promoters.length,
    passives: passives.length,
    detractors: detractors.length,
    npsTrend,
    scoreDistribution,
    recentFeedback,
    responseSparkline: last7DaysResponses.reverse(),
  };
}

export default async function NPSPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; store?: string; segment?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || "all";
  const storeId = params.store;
  const segment = params.segment;

  const data = await getNPSData(period, storeId, segment);

  const promoterPct = data.total > 0 ? ((data.promoters / data.total) * 100).toFixed(1) : "0";
  const passivePct = data.total > 0 ? ((data.passives / data.total) * 100).toFixed(1) : "0";
  const detractorPct = data.total > 0 ? ((data.detractors / data.total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">NPS Analytics</h1>
        <p className="text-slate-400 mt-1">
          Track customer satisfaction and feedback trends
        </p>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />}>
        <GlobalFilters />
      </Suspense>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="NPS Score"
          value={data.npsScore}
          iconName="Star"
          color={data.npsScore >= 50 ? "emerald" : data.npsScore >= 0 ? "amber" : "red"}
          subtitle={data.npsScore >= 70 ? "World Class" : data.npsScore >= 50 ? "Excellent" : data.npsScore >= 30 ? "Good" : "Needs Work"}
        />
        <KPICard
          title="Total Responses"
          value={data.total.toLocaleString()}
          iconName="MessageSquare"
          color="blue"
          sparklineData={data.responseSparkline}
        />
        <KPICard
          title="Promoters"
          value={`${data.promoters.toLocaleString()} (${promoterPct}%)`}
          iconName="ThumbsUp"
          color="emerald"
        />
        <KPICard
          title="Detractors"
          value={`${data.detractors.toLocaleString()} (${detractorPct}%)`}
          iconName="ThumbsDown"
          color="red"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NPS Gauge */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-white mb-6">Net Promoter Score</h2>
          <NPSGauge value={data.npsScore} size={180} />
          <div className="mt-6 grid grid-cols-3 gap-4 w-full">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{promoterPct}%</p>
              <p className="text-xs text-slate-400">Promoters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{passivePct}%</p>
              <p className="text-xs text-slate-400">Passives</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{detractorPct}%</p>
              <p className="text-xs text-slate-400">Detractors</p>
            </div>
          </div>
        </div>

        {/* NPS Trend */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">NPS Trend Over Time</h2>
          <MultiLineChart
            data={data.npsTrend}
            lines={[
              { key: "score", name: "NPS Score", color: "#10b981" },
            ]}
            height={280}
          />
        </div>
      </div>

      {/* Score Distribution & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Score Distribution</h2>
          <div className="flex items-end justify-between h-48 gap-1">
            {data.scoreDistribution.map((item, index) => {
              const maxValue = Math.max(...data.scoreDistribution.map((d) => d.value));
              const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              const color =
                index >= 9 ? "bg-emerald-500" : index >= 7 ? "bg-amber-500" : "bg-red-500";

              return (
                <div key={item.name} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <span className="text-xs text-slate-400 mb-1">
                      {item.value > 0 ? item.value : ""}
                    </span>
                    <div
                      className={`w-full ${color} rounded-t transition-all`}
                      style={{ height: `${height}%`, minHeight: item.value > 0 ? "4px" : "0" }}
                    />
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

        {/* Recent Feedback */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Feedback</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {data.recentFeedback.length > 0 ? (
              data.recentFeedback.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    item.category === "Promoter"
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : item.category === "Passive"
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-red-500/5 border-red-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.category === "Promoter"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : item.category === "Passive"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      <Star className="h-3 w-3" />
                      {item.score}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.date
                        ? new Date(item.date).toLocaleDateString("vi-VN")
                        : ""}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">{item.feedback}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                No feedback available for this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Response Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Promoters */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                <ThumbsUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Promoters</p>
                <p className="text-xs text-slate-400">Score 9-10</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-emerald-400 mb-2">
              {data.promoters.toLocaleString()}
            </p>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${promoterPct}%` }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {promoterPct}% of total responses
            </p>
          </div>

          {/* Passives */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Minus className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Passives</p>
                <p className="text-xs text-slate-400">Score 7-8</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-amber-400 mb-2">
              {data.passives.toLocaleString()}
            </p>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${passivePct}%` }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {passivePct}% of total responses
            </p>
          </div>

          {/* Detractors */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                <ThumbsDown className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-white">Detractors</p>
                <p className="text-xs text-slate-400">Score 0-6</p>
              </div>
            </div>
            <p className="text-4xl font-bold text-red-400 mb-2">
              {data.detractors.toLocaleString()}
            </p>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${detractorPct}%` }}
              />
            </div>
            <p className="text-sm text-slate-400 mt-2">
              {detractorPct}% of total responses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
