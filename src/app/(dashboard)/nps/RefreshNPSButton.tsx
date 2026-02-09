"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { refreshNPSData } from "./actions";

export function RefreshNPSButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStatus("Syncing NPS data...");

    try {
      const result = await refreshNPSData();

      if (!result.success) {
        throw new Error(result.error || "Unknown error");
      }

      const stats = result.stats;
      setStatus(`Done! ${stats?.npsInserted || 0} new, ${stats?.eligible || 0} eligible`);

      // Short delay to show success message
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Reload the page to show updated data
      router.refresh();
      setStatus(null);
    } catch (error) {
      console.error("Refresh error:", error);
      setStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      // Keep error message visible for 5 seconds
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {status && (
        <span
          className={`text-sm ${
            status.startsWith("Error") ? "text-red-400" : "text-slate-400"
          }`}
        >
          {status}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${
            isRefreshing
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }
        `}
      >
        <svg
          className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        {isRefreshing ? "Refreshing..." : "Refresh Data"}
      </button>
    </div>
  );
}
