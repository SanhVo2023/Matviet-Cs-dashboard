"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine,
} from "recharts";

// Common tooltip style
const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
  },
  labelStyle: { color: "#f8fafc", fontWeight: 600 },
  itemStyle: { color: "#94a3b8" },
};

// Color palette
export const COLORS = {
  primary: "#10b981",
  secondary: "#06b6d4",
  accent: "#8b5cf6",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#64748b",
  gradient: ["#10b981", "#06b6d4"],
};

export const SEGMENT_COLORS: Record<string, string> = {
  Champions: "#10b981",
  "Loyal Customers": "#3b82f6",
  "Potential Loyalists": "#06b6d4",
  "At Risk": "#f59e0b",
  "New Customers": "#8b5cf6",
  Hibernating: "#64748b",
};

// Format helpers
const formatCurrency = (value: number) => {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
};

const formatNumber = (value: number) => {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
};

// ============================================================
// AREA CHART - Revenue/Sales Trend
// ============================================================
interface AreaChartProps {
  data: { date: string; value: number; [key: string]: string | number }[];
  dataKey?: string;
  height?: number;
  showGrid?: boolean;
  color?: string;
  gradientId?: string;
}

export function TrendAreaChart({
  data,
  dataKey = "value",
  height = 300,
  showGrid = true,
  color = COLORS.primary,
  gradientId = "areaGradient",
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          tickFormatter={formatCurrency}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value) => [formatCurrency(Number(value) || 0), "Value"]}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// MULTI-LINE CHART - Comparison
// ============================================================
interface MultiLineChartProps {
  data: any[];
  lines: { key: string; name: string; color: string }[];
  height?: number;
}

export function MultiLineChart({ data, lines, height = 300 }: MultiLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={formatNumber} />
        <Tooltip {...tooltipStyle} />
        <Legend
          wrapperStyle={{ paddingTop: "10px" }}
          formatter={(value) => <span className="text-slate-300">{value}</span>}
        />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// BAR CHART - Category Comparison
// ============================================================
interface BarChartProps {
  data: { name: string; value: number; [key: string]: string | number }[];
  height?: number;
  layout?: "horizontal" | "vertical";
  showValues?: boolean;
  colorByName?: boolean;
}

export function CategoryBarChart({
  data,
  height = 300,
  layout = "vertical",
  showValues = true,
  colorByName = true,
}: BarChartProps) {
  if (layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={formatNumber} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#64748b"
            fontSize={11}
            width={120}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} formatter={(value) => formatNumber(Number(value) || 0)} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colorByName ? SEGMENT_COLORS[entry.name] || COLORS.muted : COLORS.primary}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={formatNumber} />
        <Tooltip {...tooltipStyle} formatter={(value) => formatNumber(Number(value) || 0)} />
        <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// DONUT CHART - Distribution
// ============================================================
interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  centerLabel?: string;
  centerValue?: string | number;
}

export function DonutChart({
  data,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLabels = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          label={
            showLabels
              ? ({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`
              : false
          }
          labelLine={showLabels}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || SEGMENT_COLORS[entry.name] || COLORS.muted}
            />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => {
            const numValue = Number(value) || 0;
            return [
              `${formatNumber(numValue)} (${((numValue / total) * 100).toFixed(1)}%)`,
              String(name),
            ];
          }}
        />
        {centerLabel && (
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-400 text-xs"
          >
            {centerLabel}
          </text>
        )}
        {centerValue && (
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white text-2xl font-bold"
          >
            {centerValue}
          </text>
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// COMPOSED CHART - Revenue + Orders
// ============================================================
interface ComposedChartProps {
  data: any[];
  barKey: string;
  lineKey: string;
  barName?: string;
  lineName?: string;
  height?: number;
}

export function RevenueOrdersChart({
  data,
  barKey,
  lineKey,
  barName = "Revenue",
  lineName = "Orders",
  height = 300,
}: ComposedChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
        <YAxis
          yAxisId="left"
          stroke="#64748b"
          fontSize={11}
          tickFormatter={formatCurrency}
          tickLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#64748b"
          fontSize={11}
          tickFormatter={formatNumber}
          tickLine={false}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => {
            const numValue = Number(value) || 0;
            const strName = String(name);
            return [
              strName === barName ? formatCurrency(numValue) : formatNumber(numValue),
              strName,
            ];
          }}
        />
        <Legend
          wrapperStyle={{ paddingTop: "10px" }}
          formatter={(value) => <span className="text-slate-300">{value}</span>}
        />
        <Bar
          yAxisId="left"
          dataKey={barKey}
          name={barName}
          fill={COLORS.primary}
          radius={[4, 4, 0, 0]}
          opacity={0.8}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey={lineKey}
          name={lineName}
          stroke={COLORS.secondary}
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// NPS GAUGE CHART - Enhanced version
// ============================================================
interface GaugeChartProps {
  value: number;
  size?: number;
  promoters?: number;
  passives?: number;
  detractors?: number;
}

export function NPSGauge({ value, size = 280 }: GaugeChartProps) {
  // Calculate radius based on size
  const radius = size * 0.35;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;

  // NPS ranges from -100 to 100, normalize to 0-100 for display
  const normalizedValue = Math.max(0, Math.min(100, ((value + 100) / 200) * 100));
  const strokeDasharray = `${(normalizedValue / 100) * circumference} ${circumference}`;

  const getColor = () => {
    if (value >= 70) return "#10b981"; // emerald
    if (value >= 50) return "#06b6d4"; // cyan
    if (value >= 30) return "#f59e0b"; // amber
    if (value >= 0) return "#fb923c"; // orange
    return "#ef4444"; // red
  };

  const getLabel = () => {
    if (value >= 70) return "World Class";
    if (value >= 50) return "Excellent";
    if (value >= 30) return "Good";
    if (value >= 0) return "Needs Work";
    return "Critical";
  };

  const getGradientId = () => {
    if (value >= 70) return "gaugeGradientExcellent";
    if (value >= 50) return "gaugeGradientGood";
    if (value >= 30) return "gaugeGradientFair";
    return "gaugeGradientPoor";
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="gaugeGradientExcellent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="gaugeGradientGood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="gaugeGradientFair" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="gaugeGradientPoor" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#334155"
          strokeWidth={strokeWidth - 4}
          fill="none"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${getGradientId()})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          filter="url(#glow)"
        />
      </svg>

      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="font-bold text-white leading-none"
          style={{ fontSize: size * 0.22 }}
        >
          {value}
        </span>
        <span
          className="font-medium mt-1"
          style={{
            fontSize: size * 0.07,
            color: getColor()
          }}
        >
          {getLabel()}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// SPARKLINE - Mini trend
// ============================================================
interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({
  data,
  color = COLORS.primary,
  width = 100,
  height = 30,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// HEATMAP - Store/Time performance
// ============================================================
interface HeatmapCell {
  x: string;
  y: string;
  value: number;
}

interface HeatmapProps {
  data: HeatmapCell[];
  xLabels?: string[];
  yLabels?: string[];
  height?: number;
}

export function Heatmap({ data, xLabels: providedXLabels, yLabels: providedYLabels, height = 300 }: HeatmapProps) {
  // Auto-extract labels from data if not provided
  const xLabels = providedXLabels || [...new Set(data.map((d) => d.x))].sort();
  const yLabels = providedYLabels || [...new Set(data.map((d) => d.y))];

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity > 0.8) return "bg-emerald-500";
    if (intensity > 0.6) return "bg-emerald-600";
    if (intensity > 0.4) return "bg-emerald-700";
    if (intensity > 0.2) return "bg-emerald-800";
    if (intensity > 0) return "bg-emerald-900";
    return "bg-slate-800";
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex">
          <div className="w-16 shrink-0" /> {/* Spacer for y-labels */}
          {xLabels.map((label) => (
            <div key={label} className="flex-1 min-w-[48px] text-center text-xs text-slate-400 pb-2">
              {label}
            </div>
          ))}
        </div>
        {yLabels.map((yLabel) => (
          <div key={yLabel} className="flex items-center">
            <div className="w-16 shrink-0 text-xs text-slate-400 pr-2 truncate">{yLabel}</div>
            {xLabels.map((xLabel) => {
              const cell = data.find((d) => d.x === xLabel && d.y === yLabel);
              const value = cell?.value || 0;
              return (
                <div
                  key={`${xLabel}-${yLabel}`}
                  className={`flex-1 min-w-[48px] h-8 m-0.5 rounded ${getColor(value)} flex items-center justify-center transition-colors hover:ring-1 hover:ring-white/20`}
                  title={`${yLabel} - ${xLabel}: ${formatNumber(value)}`}
                >
                  <span className="text-xs text-white/80">{value > 0 ? formatNumber(value) : ""}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
