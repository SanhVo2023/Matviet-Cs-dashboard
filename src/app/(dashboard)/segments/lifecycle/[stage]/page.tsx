import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Download, Users, TrendingUp, Clock, DollarSign } from "lucide-react";

const lifecycleConfig: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  new: { label: "New", color: "text-purple-400", bgColor: "bg-purple-500", description: "First purchase within 30 days" },
  active: { label: "Active", color: "text-emerald-400", bgColor: "bg-emerald-500", description: "Purchased within expected frequency" },
  loyal: { label: "Loyal", color: "text-blue-400", bgColor: "bg-blue-500", description: "5+ orders, purchased within 60 days" },
  at_risk: { label: "At Risk", color: "text-amber-400", bgColor: "bg-amber-500", description: "Past expected purchase date by 30-60 days" },
  churned: { label: "Churned", color: "text-red-400", bgColor: "bg-red-500", description: "No purchase for 90+ days" },
  reactivated: { label: "Reactivated", color: "text-cyan-400", bgColor: "bg-cyan-500", description: "Returned after being churned" },
};

async function getSegmentData(stage: string) {
  const supabase = await createClient();

  // Get customers in this lifecycle stage
  const { data: customers, count } = await supabase
    .from("customers")
    .select("id, name, customer_code, phone, email, order_count, total_spent, avg_order_value, clv_tier, churn_risk, last_purchase, days_to_next_purchase", { count: "exact" })
    .eq("lifecycle_stage", stage)
    .order("total_spent", { ascending: false })
    .limit(100);

  // Get aggregate stats
  const { data: statsData } = await supabase
    .from("customers")
    .select("total_spent, avg_order_value, order_count, churn_risk")
    .eq("lifecycle_stage", stage);

  const stats = {
    totalCustomers: count || 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    avgChurnRisk: 0,
    avgOrders: 0,
  };

  if (statsData && statsData.length > 0) {
    stats.totalRevenue = statsData.reduce((sum, c) => sum + (parseFloat(c.total_spent as any) || 0), 0);
    stats.avgOrderValue = statsData.reduce((sum, c) => sum + (parseFloat(c.avg_order_value as any) || 0), 0) / statsData.length;
    stats.avgChurnRisk = statsData.reduce((sum, c) => sum + (parseFloat(c.churn_risk as any) || 0), 0) / statsData.length;
    stats.avgOrders = statsData.reduce((sum, c) => sum + (c.order_count || 0), 0) / statsData.length;
  }

  return { customers: customers || [], stats };
}

export default async function LifecycleSegmentPage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage } = await params;
  const config = lifecycleConfig[stage] || { label: stage, color: "text-slate-400", bgColor: "bg-slate-500", description: "" };
  const { customers, stats } = await getSegmentData(stage);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return Math.round(value).toLocaleString();
  };

  const clvBadgeColor: Record<string, string> = {
    vip: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
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

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-red-400" />
            <span className="text-sm text-slate-400">Avg Churn Risk</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.avgChurnRisk.toFixed(1)}%</p>
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
              <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">CLV Tier</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Orders</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Total Spent</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Churn Risk</th>
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
                  {customer.clv_tier && (
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${clvBadgeColor[customer.clv_tier] || "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                      {customer.clv_tier.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right text-slate-300">{customer.order_count || 0}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-white font-medium">{formatCurrency(parseFloat(customer.total_spent as any) || 0)}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-medium ${(customer.churn_risk || 0) > 70 ? "text-red-400" : (customer.churn_risk || 0) > 40 ? "text-amber-400" : "text-emerald-400"}`}>
                    {(customer.churn_risk || 0).toFixed(0)}%
                  </span>
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
