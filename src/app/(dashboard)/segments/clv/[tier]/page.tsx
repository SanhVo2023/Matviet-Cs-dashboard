import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Download, Users, TrendingUp, Clock, DollarSign, Crown } from "lucide-react";

const clvConfig: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  vip: { label: "VIP", color: "text-amber-400", bgColor: "bg-amber-500", description: "Top 5% by customer lifetime value" },
  high: { label: "High Value", color: "text-emerald-400", bgColor: "bg-emerald-500", description: "Top 20% by customer lifetime value" },
  medium: { label: "Medium Value", color: "text-blue-400", bgColor: "bg-blue-500", description: "Top 50% by customer lifetime value" },
  low: { label: "Low Value", color: "text-slate-400", bgColor: "bg-slate-500", description: "Bottom 50% by customer lifetime value" },
};

async function getSegmentData(tier: string) {
  const supabase = await createClient();

  // Get customers in this CLV tier
  const { data: customers, count } = await supabase
    .from("customers")
    .select("id, name, customer_code, phone, email, order_count, total_spent, avg_order_value, clv_predicted, lifecycle_stage, churn_risk, last_purchase", { count: "exact" })
    .eq("clv_tier", tier)
    .order("clv_predicted", { ascending: false })
    .limit(100);

  // Get aggregate stats
  const { data: statsData } = await supabase
    .from("customers")
    .select("total_spent, clv_predicted, order_count, avg_order_value")
    .eq("clv_tier", tier);

  const stats = {
    totalCustomers: count || 0,
    totalRevenue: 0,
    avgCLV: 0,
    avgOrderValue: 0,
    avgOrders: 0,
  };

  if (statsData && statsData.length > 0) {
    stats.totalRevenue = statsData.reduce((sum, c) => sum + (parseFloat(c.total_spent as any) || 0), 0);
    stats.avgCLV = statsData.reduce((sum, c) => sum + (parseFloat(c.clv_predicted as any) || 0), 0) / statsData.length;
    stats.avgOrderValue = statsData.reduce((sum, c) => sum + (parseFloat(c.avg_order_value as any) || 0), 0) / statsData.length;
    stats.avgOrders = statsData.reduce((sum, c) => sum + (c.order_count || 0), 0) / statsData.length;
  }

  return { customers: customers || [], stats };
}

export default async function CLVSegmentPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
  const config = clvConfig[tier] || { label: tier, color: "text-slate-400", bgColor: "bg-slate-500", description: "" };
  const { customers, stats } = await getSegmentData(tier);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return Math.round(value).toLocaleString();
  };

  const lifecycleBadgeColor: Record<string, string> = {
    new: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    loyal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    at_risk: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    churned: "bg-red-500/20 text-red-400 border-red-500/30",
    reactivated: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/segments"
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {tier === "vip" && <Crown className="h-6 w-6 text-amber-400" />}
            <div className={`w-3 h-3 rounded-full ${config.bgColor}`} />
            <h1 className="text-3xl font-bold text-white">{config.label} Customers</h1>
          </div>
          <p className="text-slate-400 mt-1">{config.description}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors">
          <Download className="h-5 w-5" />
          Export
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-slate-400" />
            <span className="text-sm text-slate-400">Total Customers</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalCustomers.toLocaleString()}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <span className="text-sm text-slate-400">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-amber-400" />
            <span className="text-sm text-slate-400">Avg CLV</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.avgCLV)}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-slate-400">Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.avgOrderValue)}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-slate-400">Avg Orders</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgOrders.toFixed(1)}</p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Customers ({stats.totalCustomers.toLocaleString()})</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Customer</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Lifecycle</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Orders</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Total Spent</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Predicted CLV</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Last Purchase</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-700/20 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{customer.name}</p>
                    <p className="text-sm text-slate-400">{customer.phone || customer.email || customer.customer_code}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {customer.lifecycle_stage && (
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${lifecycleBadgeColor[customer.lifecycle_stage] || "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                      {customer.lifecycle_stage.replace("_", " ")}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-slate-300">{customer.order_count || 0}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-white font-medium">{formatCurrency(parseFloat(customer.total_spent as any) || 0)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-emerald-400 font-medium">{formatCurrency(parseFloat(customer.clv_predicted as any) || 0)}</span>
                </td>
                <td className="px-6 py-4 text-right text-slate-400 text-sm">
                  {customer.last_purchase ? new Date(customer.last_purchase).toLocaleDateString("vi-VN") : "-"}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {customers.length === 0 && (
          <div className="text-center py-12 text-slate-400">No customers in this segment</div>
        )}
      </div>
    </div>
  );
}
