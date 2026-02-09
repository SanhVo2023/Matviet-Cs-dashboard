"use client";

import {
  TrendingUp,
  Glasses,
  Eye,
  DollarSign,
  Clock,
  Activity,
  AlertTriangle,
  Target,
} from "lucide-react";
import { TrendAreaChart } from "@/components/charts";

interface CustomerData {
  total_spent: number | null;
  order_count: number | null;
  avg_order_value: number | null;
  clv_predicted: number | null;
  clv_tier: string | null;
  churn_risk: number | null;
  purchase_frequency: number | null;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  rfm_segment: string | null;
  engagement_score: number | null;
}

interface OrderItem {
  quantity: number;
  products?: {
    name: string;
    category: string;
    brand: string;
  };
}

interface AnalyticsTabProps {
  customer: CustomerData;
  spendingTrend: { date: string; value: number }[];
  orderItems: OrderItem[];
  daysSinceLastPurchase: number | null;
  avgNPS: number | null;
  language?: "vi" | "en";
}

const labels = {
  vi: {
    opticalKPIs: "KPI Ngành Kính Mắt",
    framesOwned: "Số Gọng Kính",
    lensesOwned: "Số Mắt Kính",
    multiplePairs: "Nhiều Cặp Kính",
    avgOrderValue: "GTTB Đơn Hàng",
    purchaseFrequency: "Tần Suất Mua",
    days: "ngày",
    lastPurchase: "Ngày mua cuối",
    predictiveMetrics: "Dự Đoán & Phân Tích",
    clvPredicted: "CLV Dự Đoán",
    churnRisk: "Rủi Ro Rời Bỏ",
    engagementScore: "Điểm Tương Tác",
    npsAverage: "NPS Trung Bình",
    rfmVisual: "Trực Quan RFM",
    recency: "Gần đây",
    frequency: "Tần suất",
    monetary: "Chi tiêu",
    spendingTrend: "Xu Hướng Chi Tiêu",
    noData: "Chưa có dữ liệu",
    yes: "Có",
    no: "Không",
    segmentComparison: "So Sánh Với Phân Khúc",
    yourValue: "Giá trị của bạn",
    segmentAvg: "TB phân khúc",
    items: "sản phẩm",
    aboveAverage: "Trên trung bình",
    belowAverage: "Dưới trung bình",
  },
  en: {
    opticalKPIs: "Optical Industry KPIs",
    framesOwned: "Frames Purchased",
    lensesOwned: "Lenses Purchased",
    multiplePairs: "Multiple Pairs",
    avgOrderValue: "Avg Order Value",
    purchaseFrequency: "Purchase Frequency",
    days: "days",
    lastPurchase: "Last purchase",
    predictiveMetrics: "Predictive Metrics",
    clvPredicted: "Predicted CLV",
    churnRisk: "Churn Risk",
    engagementScore: "Engagement Score",
    npsAverage: "Average NPS",
    rfmVisual: "RFM Visualization",
    recency: "Recency",
    frequency: "Frequency",
    monetary: "Monetary",
    spendingTrend: "Spending Trend",
    noData: "No data available",
    yes: "Yes",
    no: "No",
    segmentComparison: "Segment Comparison",
    yourValue: "Your value",
    segmentAvg: "Segment avg",
    items: "items",
    aboveAverage: "Above average",
    belowAverage: "Below average",
  },
};

function formatCurrency(value: number | null): string {
  if (!value) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

export function AnalyticsTab({
  customer,
  spendingTrend,
  orderItems,
  daysSinceLastPurchase,
  avgNPS,
  language = "vi",
}: AnalyticsTabProps) {
  const t = labels[language];

  // Calculate optical-specific KPIs
  const framesCount = orderItems
    .filter((item) =>
      item.products?.category?.toLowerCase().includes("frame") ||
      item.products?.category?.toLowerCase().includes("gọng") ||
      item.products?.name?.toLowerCase().includes("frame") ||
      item.products?.name?.toLowerCase().includes("gọng")
    )
    .reduce((sum, item) => sum + (item.quantity || 1), 0);

  const lensesCount = orderItems
    .filter((item) =>
      item.products?.category?.toLowerCase().includes("lens") ||
      item.products?.category?.toLowerCase().includes("mắt kính") ||
      item.products?.category?.toLowerCase().includes("tròng") ||
      item.products?.name?.toLowerCase().includes("lens") ||
      item.products?.name?.toLowerCase().includes("tròng")
    )
    .reduce((sum, item) => sum + (item.quantity || 1), 0);

  const hasMultiplePairs = framesCount >= 2;

  // Simulated segment averages (in real app, fetch from database)
  const segmentAverages = {
    avgOrderValue: 2500000,
    purchaseFrequency: 180,
    clv: 15000000,
    engagementScore: 60,
  };

  const rfmMax = 5;

  return (
    <div className="space-y-6">
      {/* Optical KPIs */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Glasses className="h-5 w-5 text-cyan-400" />
          {t.opticalKPIs}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Frames */}
          <div className="bg-slate-900/50 rounded-xl p-5 text-center">
            <Glasses className="h-8 w-8 text-blue-400 mx-auto mb-3" />
            <p className="text-3xl font-bold text-white">{framesCount}</p>
            <p className="text-sm text-slate-400 mt-1">{t.framesOwned}</p>
          </div>

          {/* Lenses */}
          <div className="bg-slate-900/50 rounded-xl p-5 text-center">
            <Eye className="h-8 w-8 text-purple-400 mx-auto mb-3" />
            <p className="text-3xl font-bold text-white">{lensesCount}</p>
            <p className="text-sm text-slate-400 mt-1">{t.lensesOwned}</p>
          </div>

          {/* Multiple Pairs */}
          <div className="bg-slate-900/50 rounded-xl p-5 text-center">
            <Target className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <p className={`text-3xl font-bold ${hasMultiplePairs ? "text-emerald-400" : "text-slate-400"}`}>
              {hasMultiplePairs ? t.yes : t.no}
            </p>
            <p className="text-sm text-slate-400 mt-1">{t.multiplePairs}</p>
          </div>

          {/* AOV */}
          <div className="bg-slate-900/50 rounded-xl p-5 text-center">
            <DollarSign className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">{formatCurrency(customer.avg_order_value)}</p>
            <p className="text-sm text-slate-400 mt-1">{t.avgOrderValue}</p>
          </div>

          {/* Frequency */}
          <div className="bg-slate-900/50 rounded-xl p-5 text-center">
            <Clock className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
            <p className="text-2xl font-bold text-white">
              {customer.purchase_frequency ? `${Math.round(customer.purchase_frequency)}` : "-"}
            </p>
            <p className="text-sm text-slate-400 mt-1">{t.purchaseFrequency} ({t.days})</p>
          </div>
        </div>
      </div>

      {/* RFM Visual & Spending Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFM Visual */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            {t.rfmVisual}
          </h2>
          <div className="flex justify-center items-end h-48 gap-6">
            {/* Recency Bar */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-40 bg-slate-700 rounded-lg overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-cyan-500 to-cyan-400 transition-all duration-500"
                  style={{ height: `${((customer.rfm_recency || 0) / rfmMax) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{customer.rfm_recency || 0}</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">{t.recency}</p>
            </div>

            {/* Frequency Bar */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-40 bg-slate-700 rounded-lg overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ height: `${((customer.rfm_frequency || 0) / rfmMax) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{customer.rfm_frequency || 0}</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">{t.frequency}</p>
            </div>

            {/* Monetary Bar */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-40 bg-slate-700 rounded-lg overflow-hidden">
                <div
                  className="absolute bottom-0 w-full bg-gradient-to-t from-amber-500 to-amber-400 transition-all duration-500"
                  style={{ height: `${((customer.rfm_monetary || 0) / rfmMax) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{customer.rfm_monetary || 0}</span>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2">{t.monetary}</p>
            </div>
          </div>
          {customer.rfm_segment && (
            <div className="mt-6 text-center">
              <span className="inline-flex px-4 py-2 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {customer.rfm_segment}
              </span>
            </div>
          )}
        </div>

        {/* Spending Trend */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            {t.spendingTrend}
          </h2>
          {spendingTrend.length > 0 ? (
            <TrendAreaChart
              data={spendingTrend}
              dataKey="value"
              height={200}
              color="#10b981"
              showGrid={true}
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-500">
              {t.noData}
            </div>
          )}
        </div>
      </div>

      {/* Predictive Metrics */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          {t.predictiveMetrics}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* CLV */}
          <div className="bg-slate-900/50 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-2">{t.clvPredicted}</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(customer.clv_predicted)} VND</p>
            <div className="mt-3 flex items-center gap-2">
              {(customer.clv_predicted || 0) >= segmentAverages.clv ? (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400">{t.aboveAverage}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-amber-400 rotate-180" />
                  <span className="text-xs text-amber-400">{t.belowAverage}</span>
                </>
              )}
            </div>
          </div>

          {/* Churn Risk */}
          <div className="bg-slate-900/50 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-2">{t.churnRisk}</p>
            <p className={`text-2xl font-bold ${
              (customer.churn_risk || 0) > 70 ? "text-red-400" :
              (customer.churn_risk || 0) > 40 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {(customer.churn_risk || 0).toFixed(0)}%
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (customer.churn_risk || 0) > 70 ? "bg-red-500" :
                  (customer.churn_risk || 0) > 40 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${customer.churn_risk || 0}%` }}
              />
            </div>
          </div>

          {/* Engagement Score */}
          <div className="bg-slate-900/50 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-2">{t.engagementScore}</p>
            <p className="text-2xl font-bold text-blue-400">{customer.engagement_score || 0}</p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${customer.engagement_score || 0}%` }}
              />
            </div>
          </div>

          {/* NPS Average */}
          <div className="bg-slate-900/50 rounded-xl p-5">
            <p className="text-sm text-slate-400 mb-2">{t.npsAverage}</p>
            <p className={`text-2xl font-bold ${
              (avgNPS || 0) >= 9 ? "text-emerald-400" :
              (avgNPS || 0) >= 7 ? "text-amber-400" : "text-red-400"
            }`}>
              {avgNPS !== null ? avgNPS.toFixed(1) : "-"}/10
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (avgNPS || 0) >= 9 ? "bg-emerald-500" :
                  (avgNPS || 0) >= 7 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${(avgNPS || 0) * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
