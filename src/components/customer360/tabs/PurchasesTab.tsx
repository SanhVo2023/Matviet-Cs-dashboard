"use client";

import { Package, Heart, Store, CreditCard } from "lucide-react";
import { TrendAreaChart, DonutChart } from "@/components/charts";

interface Order {
  id: string;
  order_number?: string;
  order_code?: string;
  order_date: string;
  net_amount: number;
  total_discount?: number;
  payment_method?: string;
  stores?: { name: string };
}

interface TopProduct {
  name: string;
  total: number;
  count: number;
}

interface PurchasesTabProps {
  orders: Order[];
  spendingTrend: { date: string; value: number }[];
  categoryData: { name: string; value: number }[];
  storeData: { name: string; value: number }[];
  paymentData: { name: string; value: number }[];
  topProducts: TopProduct[];
  language?: "vi" | "en";
}

const labels = {
  vi: {
    spendingHistory: "Lịch Sử Chi Tiêu",
    categories: "Danh Mục Sản Phẩm",
    favoriteProducts: "Sản Phẩm Yêu Thích",
    storeDistribution: "Phân Bố Cửa Hàng",
    paymentMethods: "Phương Thức Thanh Toán",
    orderHistory: "Lịch Sử Đơn Hàng",
    orderCode: "Mã Đơn Hàng",
    date: "Ngày",
    store: "Cửa Hàng",
    payment: "Thanh Toán",
    amount: "Số Tiền",
    noSpendingData: "Chưa có dữ liệu chi tiêu",
    noCategoryData: "Chưa có dữ liệu danh mục",
    noProductData: "Chưa có dữ liệu sản phẩm",
    noOrders: "Chưa có đơn hàng",
    showing: "Hiển thị",
    of: "trong",
    orders: "đơn hàng",
    itemsPurchased: "sản phẩm đã mua",
    visits: "lần mua",
    transactions: "giao dịch",
  },
  en: {
    spendingHistory: "Spending History",
    categories: "Purchase Categories",
    favoriteProducts: "Favorite Products",
    storeDistribution: "Store Distribution",
    paymentMethods: "Payment Methods",
    orderHistory: "Order History",
    orderCode: "Order Code",
    date: "Date",
    store: "Store",
    payment: "Payment",
    amount: "Amount",
    noSpendingData: "No spending data available",
    noCategoryData: "No category data",
    noProductData: "No product data",
    noOrders: "No orders found",
    showing: "Showing",
    of: "of",
    orders: "orders",
    itemsPurchased: "items purchased",
    visits: "visits",
    transactions: "transactions",
  },
};

const categoryColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4"];
const paymentColors = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#64748b"];

function formatCurrency(value: number | null): string {
  if (!value) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

export function PurchasesTab({
  orders,
  spendingTrend,
  categoryData,
  storeData,
  paymentData,
  topProducts,
  language = "vi",
}: PurchasesTabProps) {
  const t = labels[language];

  return (
    <div className="space-y-6">
      {/* Spending Trend & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">{t.spendingHistory}</h2>
          {spendingTrend.length > 0 ? (
            <TrendAreaChart
              data={spendingTrend}
              dataKey="value"
              height={250}
              color="#10b981"
              showGrid={true}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              {t.noSpendingData}
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">{t.categories}</h2>
          {categoryData.length > 0 ? (
            <>
              <DonutChart
                data={categoryData.map((d, i) => ({
                  ...d,
                  color: categoryColors[i % categoryColors.length],
                }))}
                height={180}
                innerRadius={40}
                outerRadius={70}
                showLabels={false}
              />
              <div className="mt-4 space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                      />
                      <span className="text-sm text-slate-300 truncate max-w-[120px]">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">{cat.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-500">
              {t.noCategoryData}
            </div>
          )}
        </div>
      </div>

      {/* Products & Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-400" />
            {t.favoriteProducts}
          </h2>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => {
                const maxSpend = topProducts[0]?.total || 1;
                const percentage = (product.total / maxSpend) * 100;
                return (
                  <div key={product.name}>
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
                        <span className="text-sm text-slate-300 truncate max-w-[180px]">
                          {product.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(product.total)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{product.count} {t.itemsPurchased}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">{t.noProductData}</div>
            )}
          </div>
        </div>

        {/* Store & Payment Distribution */}
        <div className="space-y-6">
          {/* Store Distribution */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-cyan-400" />
              {t.storeDistribution}
            </h2>
            <div className="space-y-3">
              {storeData.length > 0 ? (
                storeData.slice(0, 5).map((store, index) => {
                  const maxVisits = storeData[0]?.value || 1;
                  const percentage = (store.value / maxVisits) * 100;
                  return (
                    <div key={store.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300">{store.name}</span>
                        <span className="text-sm font-medium text-white">{store.value} {t.visits}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-500">No store data</div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-400" />
              {t.paymentMethods}
            </h2>
            <div className="space-y-3">
              {paymentData.length > 0 ? (
                paymentData.slice(0, 4).map((payment, index) => {
                  const total = paymentData.reduce((sum, p) => sum + p.value, 0);
                  const percentage = (payment.value / total) * 100;
                  return (
                    <div key={payment.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: paymentColors[index % paymentColors.length] }}
                        />
                        <span className="text-sm text-slate-300">{payment.name}</span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {percentage.toFixed(0)}% ({payment.value} {t.transactions})
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-slate-500">No payment data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-400" />
            {t.orderHistory}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/30">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">{t.orderCode}</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">{t.date}</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">{t.store}</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">{t.payment}</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">{t.amount}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {orders.slice(0, 10).map((order) => (
                <tr key={order.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4">
                    <span className="font-medium text-white">{order.order_code || order.order_number}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {order.order_date
                      ? new Date(order.order_date).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{order.stores?.name || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                      {order.payment_method || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-white">
                      {formatCurrency(order.net_amount)} VND
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-slate-500">{t.noOrders}</div>
          )}
          {orders.length > 10 && (
            <div className="p-4 text-center border-t border-slate-700/50">
              <span className="text-sm text-slate-400">
                {t.showing} 10 {t.of} {orders.length} {t.orders}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
