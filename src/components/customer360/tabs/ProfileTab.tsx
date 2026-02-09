"use client";

import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Clock,
  Star,
  AlertTriangle,
  Award,
  Target,
  Crown,
  Zap,
  UserCheck,
} from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { HealthScoreCard } from "../cards/HealthScoreCard";

interface CustomerData {
  total_spent: number | null;
  order_count: number | null;
  avg_order_value: number | null;
  clv_predicted: number | null;
  clv_tier: string | null;
  churn_risk: number | null;
  days_to_next_purchase: number | null;
  purchase_frequency: number | null;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  rfm_segment: string | null;
  lifecycle_stage: string | null;
}

interface HealthScoreData {
  overall_score: number;
  recency_component: number;
  frequency_component: number;
  monetary_component: number;
  nps_component: number;
  engagement_component: number;
}

interface SegmentMembership {
  id: string;
  score: number | null;
  segment_rules?: {
    name: string;
    rule_type: string;
    description: string;
  };
}

interface ProfileTabProps {
  customer: CustomerData;
  healthScore: HealthScoreData | null;
  segmentMemberships: SegmentMembership[];
  avgOrderValue: number;
  daysSinceLastPurchase: number | null;
  latestNPS: number | null;
  language?: "vi" | "en";
}

const labels = {
  vi: {
    lifetimeValue: "Tổng Chi Tiêu",
    totalOrders: "Tổng Đơn Hàng",
    avgOrderValue: "GTTB Đơn Hàng",
    daysSincePurchase: "Ngày Từ Mua",
    npsScore: "Điểm NPS",
    predictiveAnalytics: "Phân Tích Dự Đoán",
    predictedCLV: "CLV Dự Đoán",
    churnRisk: "Rủi Ro Rời Bỏ",
    estNextPurchase: "Mua Tiếp Dự Kiến",
    avgFrequency: "Tần suất TB",
    days: "ngày",
    overdue: "Quá hạn",
    rfmAnalysis: "Phân Tích RFM",
    recencyScore: "Điểm Gần Đây",
    frequencyScore: "Điểm Tần Suất",
    monetaryScore: "Điểm Chi Tiêu",
    daysSinceLast: "Ngày từ lần cuối",
    totalOrdersLabel: "Tổng đơn hàng",
    totalSpent: "Tổng chi tiêu",
    segmentMemberships: "Phân Khúc",
    viewSegment: "Xem phân khúc",
    notInSegments: "Không thuộc phân khúc nào",
    lifecycle: "Vòng đời",
    systemSegment: "Phân khúc hệ thống",
    valueTier: "Mức giá trị",
    behavioralSegment: "Phân khúc hành vi",
    match: "khớp",
    promoter: "Ủng hộ",
    passive: "Trung lập",
    detractor: "Phản đối",
  },
  en: {
    lifetimeValue: "Lifetime Value",
    totalOrders: "Total Orders",
    avgOrderValue: "Avg Order Value",
    daysSincePurchase: "Days Since Purchase",
    npsScore: "NPS Score",
    predictiveAnalytics: "Predictive Analytics",
    predictedCLV: "Predicted CLV",
    churnRisk: "Churn Risk",
    estNextPurchase: "Est. Next Purchase",
    avgFrequency: "Avg frequency",
    days: "days",
    overdue: "Overdue",
    rfmAnalysis: "RFM Analysis",
    recencyScore: "Recency Score",
    frequencyScore: "Frequency Score",
    monetaryScore: "Monetary Score",
    daysSinceLast: "Days since last purchase",
    totalOrdersLabel: "Total orders",
    totalSpent: "Total spent",
    segmentMemberships: "Segment Memberships",
    viewSegment: "View segment",
    notInSegments: "Not in any segments",
    lifecycle: "Lifecycle",
    systemSegment: "System segment",
    valueTier: "Value tier",
    behavioralSegment: "Behavioral segment",
    match: "match",
    promoter: "Promoter",
    passive: "Passive",
    detractor: "Detractor",
  },
};

const lifecycleColors: Record<string, { bg: string }> = {
  new: { bg: "bg-purple-500" },
  active: { bg: "bg-emerald-500" },
  loyal: { bg: "bg-blue-500" },
  at_risk: { bg: "bg-amber-500" },
  churned: { bg: "bg-red-500" },
  reactivated: { bg: "bg-cyan-500" },
};

const clvColors: Record<string, { bg: string }> = {
  vip: { bg: "bg-amber-500" },
  high: { bg: "bg-emerald-500" },
  medium: { bg: "bg-blue-500" },
  low: { bg: "bg-slate-500" },
};

function formatCurrency(value: number | null): string {
  if (!value) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

export function ProfileTab({
  customer,
  healthScore,
  segmentMemberships,
  avgOrderValue,
  daysSinceLastPurchase,
  latestNPS,
  language = "vi",
}: ProfileTabProps) {
  const t = labels[language];

  const getNPSLabel = () => {
    if (!latestNPS) return undefined;
    if (latestNPS >= 9) return t.promoter;
    if (latestNPS >= 7) return t.passive;
    return t.detractor;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title={t.lifetimeValue}
          value={`${formatCurrency(customer.total_spent)} VND`}
          iconName="DollarSign"
          color="emerald"
        />
        <KPICard
          title={t.totalOrders}
          value={customer.order_count || 0}
          iconName="ShoppingCart"
          color="blue"
        />
        <KPICard
          title={t.avgOrderValue}
          value={`${formatCurrency(avgOrderValue)}`}
          iconName="TrendingUp"
          color="purple"
        />
        <KPICard
          title={t.daysSincePurchase}
          value={daysSinceLastPurchase ?? "N/A"}
          iconName="Clock"
          color={daysSinceLastPurchase && daysSinceLastPurchase > 90 ? "red" : "cyan"}
        />
        <KPICard
          title={t.npsScore}
          value={latestNPS ?? "N/A"}
          iconName="Star"
          color={latestNPS && latestNPS >= 9 ? "emerald" : latestNPS && latestNPS >= 7 ? "amber" : "red"}
          subtitle={getNPSLabel()}
        />
      </div>

      {/* Health Score & Predictive Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Score Card */}
        <HealthScoreCard data={healthScore} language={language} />

        {/* Predictive Analytics */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            {t.predictiveAnalytics}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Predicted CLV */}
            <div className="bg-slate-900/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{t.predictedCLV}</p>
                {customer.clv_tier && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${clvColors[customer.clv_tier]?.bg} text-white`}>
                    {customer.clv_tier.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(customer.clv_predicted)} VND
              </p>
            </div>

            {/* Churn Risk */}
            <div className="bg-slate-900/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{t.churnRisk}</p>
                <AlertTriangle className={`h-4 w-4 ${
                  (customer.churn_risk || 0) > 70 ? "text-red-400" :
                  (customer.churn_risk || 0) > 40 ? "text-amber-400" : "text-emerald-400"
                }`} />
              </div>
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

            {/* Days to Next Purchase */}
            <div className="bg-slate-900/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{t.estNextPurchase}</p>
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {customer.days_to_next_purchase !== null && customer.days_to_next_purchase >= 0
                  ? `${customer.days_to_next_purchase} ${t.days}`
                  : t.overdue}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {t.avgFrequency}: {customer.purchase_frequency ? `${Math.round(customer.purchase_frequency)} ${t.days}` : "N/A"}
              </p>
            </div>

            {/* AOV */}
            <div className="bg-slate-900/50 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{t.avgOrderValue}</p>
                <DollarSign className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-purple-400">
                {formatCurrency(customer.avg_order_value)} VND
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {customer.order_count} {t.totalOrdersLabel.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RFM Analysis */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-400" />
          {t.rfmAnalysis}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">{t.recencyScore}</p>
                <p className="text-3xl font-bold text-cyan-400">{customer.rfm_recency || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-cyan-400/30" />
            </div>
            <p className="text-xs text-slate-500">
              {t.daysSinceLast}: {daysSinceLastPurchase ?? "N/A"}
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${((customer.rfm_recency || 0) / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">{t.frequencyScore}</p>
                <p className="text-3xl font-bold text-emerald-400">{customer.rfm_frequency || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-emerald-400/30" />
            </div>
            <p className="text-xs text-slate-500">
              {t.totalOrdersLabel}: {customer.order_count || 0}
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${((customer.rfm_frequency || 0) / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">{t.monetaryScore}</p>
                <p className="text-3xl font-bold text-amber-400">{customer.rfm_monetary || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-400/30" />
            </div>
            <p className="text-xs text-slate-500">
              {t.totalSpent}: {formatCurrency(customer.total_spent)} VND
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${((customer.rfm_monetary || 0) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Segment Memberships */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-400" />
          {t.segmentMemberships}
        </h2>
        <div className="space-y-3">
          {customer.lifecycle_stage && (
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${lifecycleColors[customer.lifecycle_stage]?.bg || "bg-slate-500"}`} />
                <div>
                  <p className="font-medium text-white text-sm">{t.lifecycle}: {customer.lifecycle_stage.replace("_", " ")}</p>
                  <p className="text-xs text-slate-500">{t.systemSegment}</p>
                </div>
              </div>
              <Link href={`/segments/lifecycle/${customer.lifecycle_stage}`} className="text-xs text-emerald-400 hover:underline">
                {t.viewSegment}
              </Link>
            </div>
          )}
          {customer.clv_tier && (
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${clvColors[customer.clv_tier]?.bg || "bg-slate-500"}`} />
                <div>
                  <p className="font-medium text-white text-sm">CLV: {customer.clv_tier.toUpperCase()}</p>
                  <p className="text-xs text-slate-500">{t.valueTier}</p>
                </div>
              </div>
              <Link href={`/segments/clv/${customer.clv_tier}`} className="text-xs text-emerald-400 hover:underline">
                {t.viewSegment}
              </Link>
            </div>
          )}
          {customer.rfm_segment && (
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full bg-purple-500" />
                <div>
                  <p className="font-medium text-white text-sm">RFM: {customer.rfm_segment}</p>
                  <p className="text-xs text-slate-500">{t.behavioralSegment}</p>
                </div>
              </div>
              <Link href={`/segments/rfm/${encodeURIComponent(customer.rfm_segment)}`} className="text-xs text-emerald-400 hover:underline">
                {t.viewSegment}
              </Link>
            </div>
          )}
          {segmentMemberships.map((membership) => (
            <div key={membership.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full bg-cyan-500" />
                <div>
                  <p className="font-medium text-white text-sm">{membership.segment_rules?.name}</p>
                  <p className="text-xs text-slate-500">{membership.segment_rules?.rule_type} segment</p>
                </div>
              </div>
              {membership.score && (
                <span className="text-xs text-cyan-400">{membership.score}% {t.match}</span>
              )}
            </div>
          ))}
          {!customer.lifecycle_stage && !customer.clv_tier && !customer.rfm_segment && segmentMemberships.length === 0 && (
            <div className="text-center py-8 text-slate-500">{t.notInSegments}</div>
          )}
        </div>
      </div>
    </div>
  );
}
