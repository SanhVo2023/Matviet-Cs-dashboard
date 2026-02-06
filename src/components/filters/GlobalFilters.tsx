"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar, Store, Users, Filter, X, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Store {
  id: string;
  store_code: string;
  name: string;
}

const SEGMENTS = [
  { value: "all", label: "All Segments" },
  { value: "Champions", label: "Champions" },
  { value: "Loyal Customers", label: "Loyal Customers" },
  { value: "Potential Loyalists", label: "Potential Loyalists" },
  { value: "At Risk", label: "At Risk" },
  { value: "New Customers", label: "New Customers" },
  { value: "Hibernating", label: "Hibernating" },
];

const DATE_PRESETS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to Date" },
  { value: "1y", label: "Last 12 months" },
  { value: "all", label: "All Time" },
];

export default function GlobalFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [stores, setStores] = useState<Store[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Current filter values
  const dateRange = searchParams.get("period") || "all";
  const storeId = searchParams.get("store") || "all";
  const segment = searchParams.get("segment") || "all";

  const supabase = createClient();

  useEffect(() => {
    // Fetch stores for filter
    supabase
      .from("stores")
      .select("id, store_code, name")
      .order("name")
      .then(({ data }) => {
        if (data) setStores(data);
      });
  }, [supabase]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasActiveFilters = dateRange !== "all" || storeId !== "all" || segment !== "all";

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-400" />
          <span className="font-medium text-white">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              Active
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Time Period
          </label>
          <select
            value={dateRange}
            onChange={(e) => updateFilter("period", e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            {DATE_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Store */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            <Store className="h-4 w-4 inline mr-1" />
            Store
          </label>
          <select
            value={storeId}
            onChange={(e) => updateFilter("store", e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* Segment */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            <Users className="h-4 w-4 inline mr-1" />
            Customer Segment
          </label>
          <select
            value={segment}
            onChange={(e) => updateFilter("segment", e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          >
            {SEGMENTS.map((seg) => (
              <option key={seg.value} value={seg.value}>
                {seg.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateRange = searchParams.get("period") || "all";

  const updatePeriod = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("period");
    } else {
      params.set("period", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      {DATE_PRESETS.slice(0, 4).map((preset) => (
        <button
          key={preset.value}
          onClick={() => updatePeriod(preset.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            dateRange === preset.value
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
