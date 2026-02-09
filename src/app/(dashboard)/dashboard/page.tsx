import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import {
  Users,
  ShoppingCart,
  TrendingUp,
  Star,
  DollarSign,
  Store,
  Activity,
  Target,
  Zap,
} from "lucide-react";
import GlobalFilters from "@/components/filters/GlobalFilters";
import { KPICard } from "@/components/ui/KPICard";
import {
  TrendAreaChart,
  MultiLineChart,
  DonutChart,
  CategoryBarChart,
  NPSGauge,
  Heatmap,
} from "@/components/charts";

async function getDashboardData(period: string, storeId?: string, segment?: string) {
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

  // Build customers query with segment filter
  let customersQuery = supabase
    .from("customers")
    .select("id, rfm_score, rfm_segment, total_spent, order_count");

  if (segment && segment !== "all") {
    customersQuery = customersQuery.eq("rfm_segment", segment);
  }

  const { data: customers } = await customersQuery;
  const filteredCustomerIds = (customers || []).map((c) => c.id);

  // Build orders query with filters
  let ordersQuery = supabase
    .from("orders")
    .select("id, order_date, net_amount, store_id, customer_id")
    .gte("order_date", from.toISOString())
    .lte("order_date", now.toISOString());

  if (storeId && storeId !== "all") {
    ordersQuery = ordersQuery.eq("store_id", storeId);
  }

  // If segment filter is active, only get orders from those customers
  if (segment && segment !== "all" && filteredCustomerIds.length > 0) {
    ordersQuery = ordersQuery.in("customer_id", filteredCustomerIds);
  }

  const [
    { data: orders },
    { data: npsResponses },
    { data: stores },
    { count: totalCustomers },
  ] = await Promise.all([
    ordersQuery,
    supabase
      .from("nps_responses")
      .select("id, score, responded_at, customer_id")
      .gte("responded_at", from.toISOString())
      .lte("responded_at", now.toISOString()),
    supabase.from("stores").select("id, name"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
  ]);

  // Filter NPS by segment if needed
  let filteredNPS = npsResponses || [];
  if (segment && segment !== "all" && filteredCustomerIds.length > 0) {
    filteredNPS = filteredNPS.filter((n) => filteredCustomerIds.includes(n.customer_id));
  }

  const allOrders = orders || [];
  const allCustomers = customers || [];
  const allNPS = filteredNPS;

  // Calculate KPIs
  const totalRevenue = allOrders.reduce(
    (sum, o) => sum + (parseFloat(o.net_amount as any) || 0),
    0
  );
  const totalOrders = allOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const uniqueCustomers = new Set(allOrders.map((o) => o.customer_id).filter(Boolean)).size;

  // NPS calculation
  const promoters = allNPS.filter((n) => n.score >= 9).length;
  const detractors = allNPS.filter((n) => n.score <= 6).length;
  const npsScore =
    allNPS.length > 0
      ? Math.round(((promoters - detractors) / allNPS.length) * 100)
      : 0;

  // Revenue by day (last 30 days for sparkline)
  const dailyRevenue: Record<string, number> = {};
  allOrders.forEach((o) => {
    const date = o.order_date?.split("T")[0];
    if (date) {
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (parseFloat(o.net_amount as any) || 0);
    }
  });

  const revenueTrend = Object.entries(dailyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      value: revenue,
    }));

  const revenueSparkline = revenueTrend.slice(-14).map((d) => d.value);

  // Monthly revenue trend
  const monthlyRevenue: Record<string, { revenue: number; orders: number }> = {};
  allOrders.forEach((o) => {
    const month = o.order_date?.substring(0, 7);
    if (month) {
      if (!monthlyRevenue[month]) monthlyRevenue[month] = { revenue: 0, orders: 0 };
      monthlyRevenue[month].revenue += parseFloat(o.net_amount as any) || 0;
      monthlyRevenue[month].orders += 1;
    }
  });

  const monthlyTrend = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, data]) => ({
      date: month,
      revenue: data.revenue,
      orders: data.orders,
    }));

  // RFM Distribution
  const rfmDistribution: Record<string, number> = {};
  allCustomers.forEach((c) => {
    if (c.rfm_segment) {
      rfmDistribution[c.rfm_segment] = (rfmDistribution[c.rfm_segment] || 0) + 1;
    }
  });

  const rfmData = Object.entries(rfmDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Store performance
  const storeRevenue: Record<string, { name: string; revenue: number }> = {};
  (stores || []).forEach((s) => {
    storeRevenue[s.id] = { name: s.name, revenue: 0 };
  });
  allOrders.forEach((o) => {
    if (o.store_id && storeRevenue[o.store_id]) {
      storeRevenue[o.store_id].revenue += parseFloat(o.net_amount as any) || 0;
    }
  });

  const topStores = Object.entries(storeRevenue)
    .map(([_, data]) => ({ name: data.name, value: data.revenue }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // NPS monthly trend
  const monthlyNPS: Record<string, { promoters: number; detractors: number; total: number }> = {};
  allNPS.forEach((n) => {
    const month = n.responded_at?.substring(0, 7);
    if (month) {
      if (!monthlyNPS[month]) monthlyNPS[month] = { promoters: 0, detractors: 0, total: 0 };
      monthlyNPS[month].total += 1;
      if (n.score >= 9) monthlyNPS[month].promoters += 1;
      else if (n.score <= 6) monthlyNPS[month].detractors += 1;
    }
  });

  const npsTrend = Object.entries(monthlyNPS)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      date: month,
      value: data.total > 0 ? Math.round(((data.promoters - data.detractors) / data.total) * 100) : 0,
    }));

  // Orders by day of week (for heatmap)
  const ordersByDayHour: Record<string, Record<string, number>> = {};
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  allOrders.forEach((o) => {
    if (o.order_date) {
      const date = new Date(o.order_date);
      const day = days[date.getDay()];
      const hour = date.getHours().toString().padStart(2, "0") + ":00";
      if (!ordersByDayHour[day]) ordersByDayHour[day] = {};
      ordersByDayHour[day][hour] = (ordersByDayHour[day][hour] || 0) + 1;
    }
  });

  const heatmapData: { x: string; y: string; value: number }[] = [];
  days.forEach((day) => {
    for (let h = 8; h <= 20; h += 2) {
      const hour = h.toString().padStart(2, "0") + ":00";
      heatmapData.push({
        x: hour,
        y: day,
        value: ordersByDayHour[day]?.[hour] || 0,
      });
    }
  });

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    uniqueCustomers,
    totalCustomersInDB: totalCustomers || 0,
    npsScore,
    npsResponses: allNPS.length,
    revenueSparkline,
    revenueTrend,
    monthlyTrend,
    rfmData,
    topStores,
    npsTrend,
    heatmapData,
    promotersPct: allNPS.length > 0 ? ((promoters / allNPS.length) * 100).toFixed(1) : "0",
    detractorsPct: allNPS.length > 0 ? ((detractors / allNPS.length) * 100).toFixed(1) : "0",
  };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; store?: string; segment?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || "all";
  const storeId = params.store;
  const segment = params.segment;

  const data = await getDashboardData(period, storeId, segment);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString();
  };

  const rfmColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4", "#64748b", "#ec4899"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Real-time business performance overview
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400">Live Data</span>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />}>
        <GlobalFilters />
      </Suspense>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={`${formatCurrency(data.totalRevenue)} VND`}
          iconName="DollarSign"
          color="emerald"
          sparklineData={data.revenueSparkline}
          change={12.5}
          changeLabel="vs prev period"
        />
        <KPICard
          title="Total Orders"
          value={data.totalOrders.toLocaleString()}
          iconName="ShoppingCart"
          color="blue"
          change={8.2}
          changeLabel="vs prev period"
        />
        <KPICard
          title="Active Customers"
          value={data.uniqueCustomers.toLocaleString()}
          iconName="Users"
          color="purple"
          subtitle={`of ${data.totalCustomersInDB.toLocaleString()} total`}
          change={15.7}
          changeLabel="vs prev period"
        />
        <KPICard
          title="NPS Score"
          value={data.npsScore}
          iconName="Star"
          color={data.npsScore >= 50 ? "emerald" : data.npsScore >= 0 ? "amber" : "red"}
          subtitle={data.npsScore >= 70 ? "World Class" : data.npsScore >= 50 ? "Excellent" : data.npsScore >= 30 ? "Good" : "Needs Work"}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-slate-400">Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(data.avgOrderValue)}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-slate-400">Conversion Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {data.totalCustomersInDB > 0
              ? ((data.uniqueCustomers / data.totalCustomersInDB) * 100).toFixed(1)
              : "0"}%
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-slate-400">Promoters</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{data.promotersPct}%</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Store className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-slate-400">NPS Responses</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.npsResponses.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Revenue Trend</h2>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-slate-400">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded" />
                <span className="text-slate-400">Orders</span>
              </div>
            </div>
          </div>
          <MultiLineChart
            data={data.monthlyTrend}
            lines={[
              { key: "revenue", name: "Revenue", color: "#10b981" },
              { key: "orders", name: "Orders", color: "#06b6d4" },
            ]}
            height={300}
          />
        </div>

        {/* NPS Gauge */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-white mb-4">Net Promoter Score</h2>
          <NPSGauge value={data.npsScore} size={160} />
          <div className="mt-4 grid grid-cols-2 gap-4 w-full">
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-400">{data.promotersPct}%</p>
              <p className="text-xs text-slate-400">Promoters</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-400">{data.detractorsPct}%</p>
              <p className="text-xs text-slate-400">Detractors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RFM Segments */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Customer Segments</h2>
          <DonutChart
            data={data.rfmData.slice(0, 6).map((d, i) => ({
              ...d,
              color: rfmColors[i % rfmColors.length],
            }))}
            height={220}
            innerRadius={50}
            outerRadius={80}
            showLabels={false}
          />
          <div className="mt-4 space-y-2">
            {data.rfmData.slice(0, 5).map((segment, i) => (
              <div key={segment.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: rfmColors[i % rfmColors.length] }}
                  />
                  <span className="text-sm text-slate-300 truncate max-w-[120px]">
                    {segment.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-white">
                  {segment.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stores */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Top Performing Stores</h2>
          <div className="space-y-4">
            {data.topStores.map((store, index) => {
              const maxRevenue = data.topStores[0]?.value || 1;
              const percentage = (store.value / maxRevenue) * 100;
              return (
                <div key={store.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
                          index < 3
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-300 truncate max-w-[120px]">
                        {store.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {formatCurrency(store.value)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NPS Trend */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">NPS Trend</h2>
          <TrendAreaChart
            data={data.npsTrend}
            dataKey="value"
            height={220}
            color="#10b981"
            showGrid={true}
          />
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-slate-400">Latest</p>
              <p className="text-xl font-bold text-white">
                {data.npsTrend[data.npsTrend.length - 1]?.value || 0}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-slate-400">Avg</p>
              <p className="text-xl font-bold text-white">
                {data.npsTrend.length > 0
                  ? Math.round(
                      data.npsTrend.reduce((sum, d) => sum + d.value, 0) / data.npsTrend.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Order Activity Heatmap</h2>
        <p className="text-sm text-slate-400 mb-4">Orders by day of week and hour</p>
        <Heatmap data={data.heatmapData} height={250} />
      </div>
    </div>
  );
}
