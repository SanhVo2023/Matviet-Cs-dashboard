"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface MonthSelectorProps {
  availableMonths: string[];
  selectedMonth: string;
}

export function MonthSelector({ availableMonths, selectedMonth }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("month");
      params.delete("range");
    } else if (value.startsWith("range:")) {
      params.delete("month");
      params.set("range", value.replace("range:", ""));
    } else {
      params.delete("range");
      params.set("month", value);
    }

    router.push(`/nps${params.toString() ? `?${params.toString()}` : ""}`);
  };

  // Get current selection value
  const currentRange = searchParams.get("range");
  const currentValue = currentRange ? `range:${currentRange}` : selectedMonth;

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm cursor-pointer hover:border-slate-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
    >
      <optgroup label="Time Intelligence">
        <option value="all">All Time</option>
        <option value="range:this-month">This Month</option>
        <option value="range:last-month">Last Month</option>
        <option value="range:last-3-months">Last 3 Months</option>
        <option value="range:last-6-months">Last 6 Months</option>
        <option value="range:ytd">Year to Date</option>
        <option value="range:last-year">Last Year</option>
      </optgroup>
      <optgroup label="Specific Month">
        {availableMonths.map((month) => (
          <option key={month} value={month}>
            {new Date(month + "-01").toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "long",
            })}
          </option>
        ))}
      </optgroup>
    </select>
  );
}
