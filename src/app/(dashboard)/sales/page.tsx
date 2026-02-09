import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { Store } from "lucide-react";
import GlobalFilters from "@/components/filters/GlobalFilters";
import { KPICard } from "@/components/ui/KPICard";
import {
  TrendAreaChart,
  RevenueOrdersChart,
  CategoryBarChart,
  DonutChart,
  MultiLineChart,
} from "@/components/charts";

// Helper to parse date filter
function getDateFilter(period: string): { from: Date; to: Date } {
  const now = new Date();
  const to = now;
  let from = new Date();

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
    default:
      from = new Date(2024, 0, 1); // All time
  }

  return { from, to };
}

async function getSalesData(period: string, storeId?: string, segment?: string) {
  const supabase = await createClient();
  const { from, to } = getDateFilter(period);

  // If segment filter, get customer IDs first
  let filteredCustomerIds: string[] | null = null;
  if (segment && segment !== "all") {
    const { data: customers } = await supabase
      .from("customers")
      .select("id")
      .eq("rfm_segment", segment);
    filteredCustomerIds = (customers || []).map((c) => c.id);
  }

  // Build base query
  let ordersQuery = supabase
    .from("orders")
    .select("id, order_date, net_amount, total_discount, store_id, customer_id, payment_method")
    .gte("order_date", from.toISOString())
    .lte("order_date", to.toISOString());

  if (storeId && storeId !== "all") {
    ordersQuery = ordersQuery.eq("store_id", storeId);
  }

  if (filteredCustomerIds && filteredCustomerIds.length > 0) {
    ordersQuery = ordersQuery.in("customer_id", filteredCustomerIds);
  }

  const { data: orders } = await ordersQuery;
  const allOrders = orders || [];

  // Calculate KPIs
  const totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.net_amount as any) || 0), 0);
  const totalOrders = allOrders.length;
  const totalDiscount = allOrders.reduce((sum, o) => sum + (parseFloat(o.total_discount as any) || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const uniqueCustomers = new Set(allOrders.map((o) => o.customer_id).filter(Boolean)).size;

  // Daily revenue for trend
  const dailyRevenue: Record<string, { revenue: number; orders: number }> = {};
  allOrders.forEach((o) => {
    const date = o.order_date?.split("T")[0];
    if (date) {
      if (!dailyRevenue[date]) dailyRevenue[date] = { revenue: 0, orders: 0 };
      dailyRevenue[date].revenue += parseFloat(o.net_amount as any) || 0;
      dailyRevenue[date].orders += 1;
    }
  });

  const revenueTrend = Object.entries(dailyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      revenue: data.revenue,
      orders: data.orders,
    }));

  // Monthly aggregation
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

  // Payment method distribution
  const paymentMethods: Record<string, number> = {};
  allOrders.forEach((o) => {
    const method = o.payment_method || "Khác";
    paymentMethods[method] = (paymentMethods[method] || 0) + 1;
  });

  const paymentDistribution = Object.entries(paymentMethods)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Store performance
  const { data: storeOrders } = await supabase
    .from("orders")
    .select("store_id, net_amount, stores(name)")
    .gte("order_date", from.toISOString())
    .lte("order_date", to.toISOString());

  const storePerformance: Record<string, { revenue: number; name: string }> = {};
  (storeOrders || []).forEach((o: any) => {
    if (o.store_id) {
      if (!storePerformance[o.store_id]) {
        storePerformance[o.store_id] = { revenue: 0, name: o.stores?.name || "Unknown" };
      }
      storePerformance[o.store_id].revenue += parseFloat(o.net_amount) || 0;
    }
  });

  const topStores = Object.entries(storePerformance)
    .map(([id, data]) => ({ name: data.name, value: data.revenue }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Recent sparkline data (last 14 days revenue)
  const last14Days = revenueTrend.slice(-14).map((d) => d.revenue);

  return {
    totalRevenue,
    totalOrders,
    totalDiscount,
    avgOrderValue,
    uniqueCustomers,
    revenueTrend: period === "7d" || period === "30d" ? revenueTrend : monthlyTrend,
    paymentDistribution,
    topStores,
    sparkline: last14Days,
  };
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; store?: string; segment?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || "all";
  const storeId = params.store;
  const segment = params.segment;

  const data = await getSalesData(period, storeId, segment);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString();
  };

  const paymentColors = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#64748b"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Analytics</h1>
          <p className="text-slate-400 mt-1">Track revenue, orders, and store performance</p>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />}>
        <GlobalFilters />
      </Suspense>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Revenue"
          value={`${formatCurrency(data.totalRevenue)} VND`}
          iconName="DollarSign"
          color="emerald"
          sparklineData={data.sparkline}
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
          title="Avg Order Value"
          value={`${formatCurrency(data.avgOrderValue)}`}
          iconName="TrendingUp"
          color="purple"
          change={3.1}
          changeLabel="vs prev period"
        />
        <KPICard
          title="Unique Customers"
          value={data.uniqueCustomers.toLocaleString()}
          iconName="Users"
          color="cyan"
          change={15.7}
          changeLabel="vs prev period"
        />
        <KPICard
          title="Total Discounts"
          value={`${formatCurrency(data.totalDiscount)}`}
          iconName="CreditCard"
          color="amber"
          change={-2.3}
          changeLabel="vs prev period"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend - Large */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Revenue & Orders Trend</h2>
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
          <RevenueOrdersChart
            data={data.revenueTrend}
            barKey="revenue"
            lineKey="orders"
            barName="Revenue"
            lineName="Orders"
            height={350}
          />
        </div>

        {/* Payment Methods */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Payment Methods</h2>
          <DonutChart
            data={data.paymentDistribution.map((d, i) => ({
              ...d,
              color: paymentColors[i % paymentColors.length],
            }))}
            height={250}
            innerRadius={50}
            outerRadius={80}
            showLabels={false}
          />
          <div className="mt-4 space-y-2">
            {data.paymentDistribution.map((method, i) => (
              <div key={method.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: paymentColors[i % paymentColors.length] }}
                  />
                  <span className="text-sm text-slate-300">{method.name}</span>
                </div>
                <span className="text-sm font-medium text-white">{method.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Store Performance */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Top Performing Stores</h2>
          <Store className="h-5 w-5 text-slate-400" />
        </div>
        <CategoryBarChart
          data={data.topStores}
          height={400}
          layout="vertical"
          colorByName={false}
        />
      </div>
    </div>
  );
}
