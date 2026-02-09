"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface NPSTrendProps {
  data: { month: string; score: number; responses: number }[];
}

export function NPSTrendChart({ data }: NPSTrendProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} domain={[-100, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#f8fafc" }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#10b981"
          strokeWidth={3}
          dot={{ fill: "#10b981", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface DistributionProps {
  data: { name: string; value: number; color: string }[];
}

export function NPSDistributionChart({ data }: DistributionProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
        <YAxis
          stroke="#94a3b8"
          fontSize={12}
          tickFormatter={(v) => `${(v / 1e9).toFixed(0)}B`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
          formatter={(value) => [`${((Number(value) || 0) / 1e6).toFixed(0)}M VND`, "Revenue"]}
        />
        <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface RFMMatrixProps {
  data: { segment: string; count: number; value: number }[];
}

export function RFMSegmentChart({ data }: RFMMatrixProps) {
  const colors: Record<string, string> = {
    Champions: "#10b981",
    "Loyal Customers": "#3b82f6",
    "Potential Loyalists": "#06b6d4",
    "At Risk": "#f59e0b",
    "New Customers": "#8b5cf6",
    Hibernating: "#64748b",
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis type="number" stroke="#94a3b8" fontSize={12} />
        <YAxis
          type="category"
          dataKey="segment"
          stroke="#94a3b8"
          fontSize={11}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
          }}
          formatter={(value) => [(Number(value) || 0).toLocaleString(), "Customers"]}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[entry.segment] || "#64748b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
