import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Crown,
  Clock,
  Target,
  ChevronRight,
  PlusCircle,
  Zap,
  AlertTriangle,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";

// Lifecycle stage config
const lifecycleConfig: Record<
  string,
  { label: string; color: string; icon: any; description: string }
> = {
  new: {
    label: "New",
    color: "bg-purple-500",
    icon: Zap,
    description: "First purchase within 30 days",
  },
  active: {
    label: "Active",
    color: "bg-emerald-500",
    icon: UserCheck,
    description: "Purchased within expected frequency",
  },
  loyal: {
    label: "Loyal",
    color: "bg-blue-500",
    icon: Crown,
    description: "5+ orders, purchased within 60 days",
  },
  at_risk: {
    label: "At Risk",
    color: "bg-amber-500",
    icon: AlertTriangle,
    description: "Past expected purchase date by 30-60 days",
  },
  churned: {
    label: "Churned",
    color: "bg-red-500",
    icon: UserX,
    description: "No purchase for 90+ days",
  },
  reactivated: {
    label: "Reactivated",
    color: "bg-cyan-500",
    icon: RefreshCw,
    description: "Returned after being churned",
  },
};

// CLV tier config
const clvConfig: Record<
  string,
  { label: string; color: string; description: string }
> = {
  vip: {
    label: "VIP",
    color: "bg-amber-500",
    description: "Top 5% by customer lifetime value",
  },
  high: {
    label: "High Value",
    color: "bg-emerald-500",
    description: "Top 20% by customer lifetime value",
  },
  medium: {
    label: "Medium Value",
    color: "bg-blue-500",
    description: "Top 50% by customer lifetime value",
  },
  low: {
    label: "Low Value",
    color: "bg-slate-500",
    description: "Bottom 50% by customer lifetime value",
  },
};

// RFM segment config
const rfmConfig: Record<string, { color: string; description: string }> = {
  Champions: {
    color: "bg-emerald-500",
    description: "Best customers - high recency, frequency, monetary",
  },
  "Loyal Customers": {
    color: "bg-blue-500",
    description: "Regular buyers with good spend",
  },
  "Potential Loyalists": {
    color: "bg-cyan-500",
    description: "Recent customers with potential",
  },
  "New Customers": {
    color: "bg-purple-500",
    description: "Recently acquired customers",
  },
  Promising: {
    color: "bg-teal-500",
    description: "New with medium frequency",
  },
  "Need Attention": {
    color: "bg-amber-500",
    description: "Above average but declining",
  },
  "About to Sleep": {
    color: "bg-orange-500",
    description: "Low recent activity, risk of churning",
  },
  "At Risk": {
    color: "bg-red-400",
    description: "High value but haven't purchased recently",
  },
  "Can't Lose Them": {
    color: "bg-rose-500",
    description: "Made big purchases but long ago",
  },
  Hibernating: {
    color: "bg-slate-500",
    description: "Last purchase was long ago, low frequency",
  },
  Lost: {
    color: "bg-slate-600",
    description: "Lowest recency, frequency, and monetary",
  },
};

async function getSegmentData() {
  const supabase = await createClient();

  // Get lifecycle stage counts
  const { data: lifecycleData } = await supabase
    .from("customers")
    .select("lifecycle_stage")
    .not("lifecycle_stage", "is", null);

  const lifecycleCounts: Record<string, number> = {};
  (lifecycleData || []).forEach((c) => {
    if (c.lifecycle_stage) {
      lifecycleCounts[c.lifecycle_stage] =
        (lifecycleCounts[c.lifecycle_stage] || 0) + 1;
    }
  });

  // Get CLV tier counts with avg values
  const { data: clvData } = await supabase
    .from("customers")
    .select("clv_tier, total_spent, clv_predicted")
    .not("clv_tier", "is", null);

  const clvStats: Record<
    string,
    { count: number; totalSpent: number; avgCLV: number }
  > = {};
  (clvData || []).forEach((c) => {
    if (c.clv_tier) {
      if (!clvStats[c.clv_tier]) {
        clvStats[c.clv_tier] = { count: 0, totalSpent: 0, avgCLV: 0 };
      }
      clvStats[c.clv_tier].count++;
      clvStats[c.clv_tier].totalSpent += parseFloat(c.total_spent) || 0;
      clvStats[c.clv_tier].avgCLV += parseFloat(c.clv_predicted) || 0;
    }
  });

  Object.keys(clvStats).forEach((tier) => {
    if (clvStats[tier].count > 0) {
      clvStats[tier].avgCLV = clvStats[tier].avgCLV / clvStats[tier].count;
    }
  });

  // Get RFM segment counts
  const { data: rfmData } = await supabase
    .from("customers")
    .select("rfm_score")
    .not("rfm_score", "is", null);

  const rfmCounts: Record<string, number> = {};
  (rfmData || []).forEach((c) => {
    if (c.rfm_score) {
      rfmCounts[c.rfm_score] = (rfmCounts[c.rfm_score] || 0) + 1;
    }
  });

  // Get custom segment rules
  const { data: customSegments } = await supabase
    .from("segment_rules")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Get total customers
  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true });

  return {
    lifecycleCounts,
    clvStats,
    rfmCounts,
    customSegments: customSegments || [],
    totalCustomers: totalCustomers || 0,
  };
}

export default async function SegmentsPage() {
  const data = await getSegmentData();

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString();
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Customer Segments</h1>
          <p className="text-slate-400 mt-1">
            Analyze and target customers by behavior, value, and lifecycle
          </p>
        </div>
        <Link
          href="/segments/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
        >
          <PlusCircle className="h-5 w-5" />
          Create Segment
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-slate-400">Total Customers</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(data.totalCustomers)}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-slate-400">VIP Customers</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(data.clvStats["vip"]?.count || 0)}
          </p>
          <p className="text-xs text-amber-400 mt-1">
            Avg CLV: {formatCurrency(data.clvStats["vip"]?.avgCLV || 0)}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-slate-400">At Risk</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(data.lifecycleCounts["at_risk"] || 0)}
          </p>
          <p className="text-xs text-red-400 mt-1">Need re-engagement</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-slate-400">New Customers</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatNumber(data.lifecycleCounts["new"] || 0)}
          </p>
          <p className="text-xs text-purple-400 mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Lifecycle Segments */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">
              Lifecycle Stages
            </h2>
          </div>
          <span className="text-sm text-slate-400">
            Based on purchase recency and frequency
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(lifecycleConfig).map(([key, config]) => {
            const Icon = config.icon;
            const count = data.lifecycleCounts[key] || 0;
            const percentage =
              data.totalCustomers > 0
                ? ((count / data.totalCustomers) * 100).toFixed(1)
                : 0;

            return (
              <Link
                key={key}
                href={`/segments/lifecycle/${key}`}
                className="group bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.color}`}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {config.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(count)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{percentage}%</p>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {config.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CLV Tiers */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">
              Customer Lifetime Value Tiers
            </h2>
          </div>
          <span className="text-sm text-slate-400">
            Predicted future value based on behavior
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(clvConfig).map(([key, config]) => {
            const stats = data.clvStats[key] || {
              count: 0,
              totalSpent: 0,
              avgCLV: 0,
            };

            return (
              <Link
                key={key}
                href={`/segments/clv/${key}`}
                className="group bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                    <span className="font-medium text-white">
                      {config.label}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
                </div>

                <p className="text-3xl font-bold text-white mb-2">
                  {formatNumber(stats.count)}
                </p>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Spent</span>
                    <span className="text-white">
                      {formatCurrency(stats.totalSpent)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Avg CLV</span>
                    <span className="text-emerald-400">
                      {formatCurrency(stats.avgCLV)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  {config.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* RFM Segments */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">RFM Segments</h2>
          </div>
          <span className="text-sm text-slate-400">
            Recency, Frequency, Monetary analysis
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(data.rfmCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([segment, count]) => {
              const config = rfmConfig[segment] || {
                color: "bg-slate-500",
                description: "",
              };

              return (
                <Link
                  key={segment}
                  href={`/segments/rfm/${encodeURIComponent(segment)}`}
                  className="group flex items-center justify-between bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${config.color}`} />
                    <div>
                      <p className="font-medium text-white text-sm">
                        {segment}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatNumber(count)} customers
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                </Link>
              );
            })}
        </div>
      </div>

      {/* Custom Segments */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">
              Custom Segments
            </h2>
          </div>
          <Link
            href="/segments/create"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            + Create New
          </Link>
        </div>

        {data.customSegments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.customSegments.map((segment) => (
              <Link
                key={segment.id}
                href={`/segments/custom/${segment.id}`}
                className="group bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{segment.name}</span>
                  <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                </div>
                {segment.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {segment.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    {segment.rule_type} segment
                  </span>
                  <span className="text-white">
                    {formatNumber(segment.customer_count || 0)} customers
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No custom segments yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Create custom segments to target specific customer groups
            </p>
            <Link
              href="/segments/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Create Segment
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
