"use client";

import { Activity, Clock, ShoppingCart, DollarSign, Star, MessageSquare } from "lucide-react";

interface HealthScoreData {
  overall_score: number;
  recency_component: number;
  frequency_component: number;
  monetary_component: number;
  nps_component: number;
  engagement_component: number;
}

interface HealthScoreCardProps {
  data: HealthScoreData | null;
  language?: "vi" | "en";
}

const labels = {
  vi: {
    title: "Điểm Sức Khỏe Khách Hàng",
    recency: "Gần đây",
    frequency: "Tần suất",
    monetary: "Chi tiêu",
    nps: "NPS",
    engagement: "Tương tác",
    excellent: "Xuất sắc",
    good: "Tốt",
    average: "Trung bình",
    needsAttention: "Cần chú ý",
    noData: "Chưa có dữ liệu",
  },
  en: {
    title: "Customer Health Score",
    recency: "Recency",
    frequency: "Frequency",
    monetary: "Monetary",
    nps: "NPS",
    engagement: "Engagement",
    excellent: "Excellent",
    good: "Good",
    average: "Average",
    needsAttention: "Needs Attention",
    noData: "No data available",
  },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return { text: "text-emerald-400", bg: "bg-emerald-500", ring: "ring-emerald-500/20" };
  if (score >= 60) return { text: "text-blue-400", bg: "bg-blue-500", ring: "ring-blue-500/20" };
  if (score >= 40) return { text: "text-amber-400", bg: "bg-amber-500", ring: "ring-amber-500/20" };
  return { text: "text-red-400", bg: "bg-red-500", ring: "ring-red-500/20" };
};

const getScoreLabel = (score: number, language: "vi" | "en") => {
  const t = labels[language];
  if (score >= 80) return t.excellent;
  if (score >= 60) return t.good;
  if (score >= 40) return t.average;
  return t.needsAttention;
};

export function HealthScoreCard({ data, language = "vi" }: HealthScoreCardProps) {
  const t = labels[language];

  if (!data) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">{t.title}</h3>
        </div>
        <div className="text-center py-8 text-slate-500">{t.noData}</div>
      </div>
    );
  }

  const scoreColor = getScoreColor(data.overall_score);
  const components = [
    { key: "recency", label: t.recency, value: data.recency_component, icon: Clock, color: "cyan" },
    { key: "frequency", label: t.frequency, value: data.frequency_component, icon: ShoppingCart, color: "emerald" },
    { key: "monetary", label: t.monetary, value: data.monetary_component, icon: DollarSign, color: "amber" },
    { key: "nps", label: t.nps, value: data.nps_component, icon: Star, color: "purple" },
    { key: "engagement", label: t.engagement, value: data.engagement_component, icon: MessageSquare, color: "blue" },
  ];

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">{t.title}</h3>
      </div>

      {/* Main Score Circle */}
      <div className="flex justify-center mb-8">
        <div className={`relative w-36 h-36 rounded-full ring-8 ${scoreColor.ring} flex items-center justify-center`}>
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="10"
                fill="none"
                className={scoreColor.text}
                strokeDasharray={`${data.overall_score * 2.83} 283`}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="text-center z-10">
            <span className={`text-4xl font-bold ${scoreColor.text}`}>{data.overall_score}</span>
            <p className="text-xs text-slate-400 mt-1">{getScoreLabel(data.overall_score, language)}</p>
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="space-y-4">
        {components.map((comp) => {
          const Icon = comp.icon;
          const compColor = getScoreColor(comp.value);
          return (
            <div key={comp.key} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-${comp.color}-500/20`}>
                <Icon className={`h-4 w-4 text-${comp.color}-400`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{comp.label}</span>
                  <span className={`text-sm font-medium ${compColor.text}`}>{comp.value}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${compColor.bg}`}
                    style={{ width: `${comp.value}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
