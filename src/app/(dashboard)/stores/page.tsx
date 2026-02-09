import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import {
  Store,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Award,
  MapPin,
} from "lucide-react";
import GlobalFilters from "@/components/filters/GlobalFilters";
import {
  CategoryBarChart,
  MultiLineChart,
  DonutChart,
} from "@/components/charts";

async function getStoreData(period: string) {
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

  // Get all stores
  const { data: stores } = await supabase
    .from("stores")
    .select("id, store_code, name, address")
    .order("name");

  // Get orders with store info
  const { data: orders } = await supabase
    .from("orders")
    .select("id, store_id, net_amount, order_date, customer_id")
    .gte("order_date", from.toISOString())
    .lte("order_date", now.toISOString());

  // Aggregate by store
  const storeStats: Record<
    string,
    {
      name: string;
      code: string;
      revenue: number;
      orders: number;
      customers: Set<string>;
      monthlyRevenue: Record<string, number>;
    }
  > = {};

  (stores || []).forEach((s) => {
    storeStats[s.id] = {
      name: s.name,
      code: s.store_code,
      revenue: 0,
      orders: 0,
      customers: new Set(),
      monthlyRevenue: {},
    };
  });

  (orders || []).forEach((o) => {
    if (o.store_id && storeStats[o.store_id]) {
      storeStats[o.store_id].revenue += parseFloat(o.net_amount as any) || 0;
      storeStats[o.store_id].orders += 1;
      if (o.customer_id) {
        storeStats[o.store_id].customers.add(o.customer_id);
      }

      // Monthly breakdown
      const month = o.order_date?.substring(0, 7);
      if (month) {
        storeStats[o.store_id].monthlyRevenue[month] =
          (storeStats[o.store_id].monthlyRevenue[month] || 0) +
          (parseFloat(o.net_amount as any) || 0);
      }
    }
  });

  // Convert to array and sort
  const storeList = Object.entries(storeStats)
    .map(([id, data]) => ({
      id,
      name: data.name,
      code: data.code,
      revenue: data.revenue,
      orders: data.orders,
      customers: data.customers.size,
      avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
      monthlyRevenue: data.monthlyRevenue,
    }))
    .filter((s) => s.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  // Get top 5 for monthly comparison
  const top5Stores = storeList.slice(0, 5);
  const allMonths = new Set<string>();
  top5Stores.forEach((s) => {
    Object.keys(s.monthlyRevenue).forEach((m) => allMonths.add(m));
  });

  const monthlyComparison = Array.from(allMonths)
    .sort()
    .slice(-6)
    .map((month) => {
      const point: any = { date: month };
      top5Stores.forEach((s) => {
        point[s.name] = s.monthlyRevenue[month] || 0;
      });
      return point;
    });

  // Revenue distribution by store
  const totalRevenue = storeList.reduce((sum, s) => sum + s.revenue, 0);
  const revenueDistribution = storeList.slice(0, 8).map((s) => ({
    name: s.name,
    value: s.revenue,
    percentage: totalRevenue > 0 ? (s.revenue / totalRevenue) * 100 : 0,
  }));

  return {
    stores: storeList,
    top5Stores,
    monthlyComparison,
    revenueDistribution,
    totalRevenue,
    totalOrders: orders?.length || 0,
  };
}

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || "all";

  const data = await getStoreData(period);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString();
  };

  const storeColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Store Performance</h1>
        <p className="text-slate-400 mt-1">
          Compare revenue, orders, and customer metrics across stores
        </p>
      </div>

      {/* Filters */}
      <Suspense
        fallback={<div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />}
      >
        <GlobalFilters />
      </Suspense>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Store className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Stores</p>
              <p className="text-2xl font-bold text-white">{data.stores.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(data.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <ShoppingCart className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Orders</p>
              <p className="text-2xl font-bold text-white">
                {data.totalOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Award className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Top Store</p>
              <p className="text-lg font-bold text-white truncate">
                {data.stores[0]?.name || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Top 5 Stores - Monthly Trend
          </h2>
          <MultiLineChart
            data={data.monthlyComparison}
            lines={data.top5Stores.map((s, i) => ({
              key: s.name,
              name: s.name,
              color: storeColors[i % storeColors.length],
            }))}
            height={350}
          />
        </div>

        {/* Revenue Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Revenue Distribution
          </h2>
          <DonutChart
            data={data.revenueDistribution.map((d, i) => ({
              name: d.name,
              value: d.value,
              color: storeColors[i % storeColors.length],
            }))}
            height={300}
            innerRadius={60}
            outerRadius={100}
            showLabels={false}
          />
        </div>
      </div>

      {/* Store Rankings Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white">Store Rankings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/30">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  Rank
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  Store
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                  Revenue
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                  Orders
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                  Customers
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">
                  Avg Order
                </th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.stores.slice(0, 20).map((store, index) => {
                const share =
                  data.totalRevenue > 0
                    ? (store.revenue / data.totalRevenue) * 100
                    : 0;
                return (
                  <tr key={store.id} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          index < 3
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-white">{store.name}</p>
                        <p className="text-xs text-slate-500">{store.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-white">
                        {formatCurrency(store.revenue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">
                      {store.orders.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">
                      {store.customers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-300">
                      {formatCurrency(store.avgOrderValue)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-12 text-right">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
