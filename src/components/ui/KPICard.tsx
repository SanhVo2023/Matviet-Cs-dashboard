"use client";

import { useId } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  iconName: string; // Changed from icon: LucideIcon to iconName: string
  color: "emerald" | "blue" | "purple" | "amber" | "cyan" | "red";
  sparklineData?: number[];
  subtitle?: string;
}

const colorConfig = {
  emerald: {
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    iconBg: "bg-emerald-500",
    iconShadow: "shadow-emerald-500/30",
    accent: "text-emerald-400",
    border: "border-emerald-500/20",
    sparkline: "#10b981",
  },
  blue: {
    gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    iconBg: "bg-blue-500",
    iconShadow: "shadow-blue-500/30",
    accent: "text-blue-400",
    border: "border-blue-500/20",
    sparkline: "#3b82f6",
  },
  purple: {
    gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
    iconBg: "bg-purple-500",
    iconShadow: "shadow-purple-500/30",
    accent: "text-purple-400",
    border: "border-purple-500/20",
    sparkline: "#8b5cf6",
  },
  amber: {
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    iconBg: "bg-amber-500",
    iconShadow: "shadow-amber-500/30",
    accent: "text-amber-400",
    border: "border-amber-500/20",
    sparkline: "#f59e0b",
  },
  cyan: {
    gradient: "from-cyan-500/20 via-cyan-500/10 to-transparent",
    iconBg: "bg-cyan-500",
    iconShadow: "shadow-cyan-500/30",
    accent: "text-cyan-400",
    border: "border-cyan-500/20",
    sparkline: "#06b6d4",
  },
  red: {
    gradient: "from-red-500/20 via-red-500/10 to-transparent",
    iconBg: "bg-red-500",
    iconShadow: "shadow-red-500/30",
    accent: "text-red-400",
    border: "border-red-500/20",
    sparkline: "#ef4444",
  },
};

// Helper function to get icon component from name
function getIconComponent(iconName: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[iconName] || LucideIcons.HelpCircle;
}

// Simple SVG Sparkline
function Sparkline({
  data,
  color,
  width = 80,
  height = 32,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const uniqueId = useId();

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const gradientId = `sparkline-gradient${uniqueId}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height * 0.8 - height * 0.1}
        r="3"
        fill={color}
      />
    </svg>
  );
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  iconName,
  color,
  sparklineData,
  subtitle,
}: KPICardProps) {
  const config = colorConfig[color];
  const isPositive = change !== undefined && change >= 0;
  const isNeutral = change === 0;
  const Icon = getIconComponent(iconName);

  return (
    <div className="relative group">
      {/* Card */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-3 sm:p-5 transition-all duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-black/20">
        {/* Gradient Background */}
        <div
          className={`absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl ${config.gradient} rounded-full blur-2xl opacity-60`}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Top Row - Icon & Title */}
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl ${config.iconBg} shadow-lg ${config.iconShadow}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-400 line-clamp-1">{title}</p>
                {subtitle && <p className={`text-xs ${config.accent} mt-0.5 hidden sm:block`}>{subtitle}</p>}
              </div>
            </div>
          </div>

          {/* Value Row */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-lg sm:text-2xl font-bold text-white tracking-tight">{value}</p>

              {/* Change indicator */}
              {change !== undefined && (
                <div className="flex items-center gap-1.5 mt-2">
                  <div
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                      isNeutral
                        ? "bg-slate-700/50"
                        : isPositive
                        ? "bg-emerald-500/10"
                        : "bg-red-500/10"
                    }`}
                  >
                    {isNeutral ? (
                      <Minus className="h-3 w-3 text-slate-400" />
                    ) : isPositive ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-400" />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        isNeutral
                          ? "text-slate-400"
                          : isPositive
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {isPositive && change !== 0 ? "+" : ""}
                      {change.toFixed(1)}%
                    </span>
                  </div>
                  {changeLabel && <span className="text-xs text-slate-500">{changeLabel}</span>}
                </div>
              )}
            </div>

            {/* Sparkline */}
            {sparklineData && sparklineData.length > 1 && (
              <div className="opacity-80">
                <Sparkline data={sparklineData} color={config.sparkline} width={72} height={28} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact KPI for secondary metrics
export function CompactKPI({
  label,
  value,
  iconName,
  color = "slate",
}: {
  label: string;
  value: string | number;
  iconName: string;
  color?: "emerald" | "blue" | "purple" | "amber" | "cyan" | "red" | "slate";
}) {
  const Icon = getIconComponent(iconName);
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    cyan: "text-cyan-400 bg-cyan-500/10",
    red: "text-red-400 bg-red-500/10",
    slate: "text-slate-400 bg-slate-700/50",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

// Large Hero KPI for prominent display
export function HeroKPI({
  title,
  value,
  subtitle,
  iconName,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  iconName: string;
  color: "emerald" | "blue" | "purple" | "amber" | "cyan";
  trend?: { value: number; label?: string };
}) {
  const config = colorConfig[color];
  const isPositive = trend && trend.value >= 0;
  const Icon = getIconComponent(iconName);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/70 backdrop-blur-sm border border-slate-800 p-8">
      {/* Large gradient background */}
      <div
        className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-bl ${config.gradient} rounded-full blur-3xl opacity-40`}
      />

      <div className="relative flex items-start gap-6">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${config.iconBg} shadow-xl ${config.iconShadow}`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
          <div className="flex items-center gap-3 mt-2">
            {subtitle && <p className={`text-sm ${config.accent}`}>{subtitle}</p>}
            {trend && (
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    isPositive ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {trend.value.toFixed(1)}%
                </span>
                {trend.label && <span className="text-xs text-slate-500 ml-1">{trend.label}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat row for inline statistics
export function StatRow({
  items,
}: {
  items: { label: string; value: string | number; color?: string }[];
}) {
  return (
    <div className="flex items-center divide-x divide-slate-700/50">
      {items.map((item, index) => (
        <div
          key={index}
          className={`flex-1 text-center ${index > 0 ? "pl-4" : ""} ${
            index < items.length - 1 ? "pr-4" : ""
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">{item.label}</p>
          <p className={`text-lg font-bold ${item.color || "text-white"}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// Mini stat badge
export function MiniStat({
  label,
  value,
  change,
}: {
  label: string;
  value: string | number;
  change?: number;
}) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="flex items-center justify-between py-2 px-1">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white">{value}</span>
        {change !== undefined && (
          <span
            className={`text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
          >
            {isPositive ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
