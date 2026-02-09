"use client";

import { useState, useMemo } from "react";
import { Filter, Calendar, Search } from "lucide-react";
import { TimelineEventCard } from "../cards/TimelineEventCard";

interface TimelineEvent {
  event_id: string;
  event_type: string;
  channel: string;
  title: string;
  description: string;
  event_value: number | null;
  event_date: string;
  source_table: string;
  metadata: Record<string, unknown>;
}

interface TimelineTabProps {
  events: TimelineEvent[];
  language?: "vi" | "en";
}

const labels = {
  vi: {
    title: "Dòng Thời Gian Hoạt Động",
    allEvents: "Tất cả",
    purchases: "Mua hàng",
    messages: "Tin nhắn",
    nps: "NPS",
    filter: "Lọc",
    noEvents: "Chưa có hoạt động nào",
    searchPlaceholder: "Tìm kiếm...",
    showing: "Hiển thị",
    of: "trong",
    events: "sự kiện",
  },
  en: {
    title: "Activity Timeline",
    allEvents: "All Events",
    purchases: "Purchases",
    messages: "Messages",
    nps: "NPS",
    filter: "Filter",
    noEvents: "No activities yet",
    searchPlaceholder: "Search...",
    showing: "Showing",
    of: "of",
    events: "events",
  },
};

type FilterType = "all" | "purchase" | "message" | "nps";

export function TimelineTab({ events, language = "vi" }: TimelineTabProps) {
  const t = labels[language];
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  const filterOptions: { id: FilterType; label: string }[] = [
    { id: "all", label: t.allEvents },
    { id: "purchase", label: t.purchases },
    { id: "message", label: t.messages },
    { id: "nps", label: t.nps },
  ];

  const filteredEvents = useMemo(() => {
    let result = events;

    // Apply type filter
    if (filter === "purchase") {
      result = result.filter((e) => e.event_type === "purchase");
    } else if (filter === "message") {
      result = result.filter((e) => e.event_type === "sms_sent" || e.event_type === "zns_sent");
    } else if (filter === "nps") {
      result = result.filter((e) => e.event_type === "nps_response");
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description?.toLowerCase().includes(query) ||
          e.channel.toLowerCase().includes(query)
      );
    }

    // Sort by date descending
    return result.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
  }, [events, filter, searchQuery]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEvents.length;

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          {t.title}
        </h2>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-48"
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilter(option.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === option.id
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Events count */}
      {filteredEvents.length > 0 && (
        <p className="text-sm text-slate-400">
          {t.showing} {visibleEvents.length} {t.of} {filteredEvents.length} {t.events}
        </p>
      )}

      {/* Timeline */}
      <div className="relative">
        {visibleEvents.length > 0 ? (
          <div className="space-y-0">
            {visibleEvents.map((event, index) => (
              <TimelineEventCard
                key={event.event_id}
                event={event}
                language={language}
                isLast={index === visibleEvents.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/30">
            {t.noEvents}
          </div>
        )}

        {/* Load more button */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="px-6 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
            >
              {language === "vi" ? "Xem thêm" : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
