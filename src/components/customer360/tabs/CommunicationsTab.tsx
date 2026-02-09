"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Mail,
  Phone,
  Bell,
} from "lucide-react";

interface Message {
  id: string;
  channel: string;
  content: string;
  message_type?: string;
  brandname?: string;
  sent_at: string;
  total_cost?: number;
  success_count?: number;
  fail_count?: number;
}

interface CustomerPreferences {
  preferred_channel?: string;
  sms_opt_in?: boolean;
  zns_opt_in?: boolean;
  email_opt_in?: boolean;
}

interface CommunicationsTabProps {
  messages: Message[];
  preferences: CustomerPreferences | null;
  language?: "vi" | "en";
}

const labels = {
  vi: {
    communicationsHistory: "Lịch Sử Tin Nhắn",
    summary: "Tổng Quan",
    totalMessages: "Tổng tin nhắn",
    smsMessages: "Tin SMS",
    znsMessages: "Tin ZNS",
    deliveryRate: "Tỷ lệ gửi thành công",
    preferences: "Tùy Chọn Liên Hệ",
    preferredChannel: "Kênh ưa thích",
    smsOptIn: "SMS",
    znsOptIn: "ZNS",
    emailOptIn: "Email",
    enabled: "Đã bật",
    disabled: "Đã tắt",
    allMessages: "Tất cả",
    sms: "SMS",
    zns: "ZNS",
    noMessages: "Chưa có tin nhắn nào",
    content: "Nội dung",
    status: "Trạng thái",
    date: "Ngày gửi",
    cost: "Chi phí",
    success: "Thành công",
    failed: "Thất bại",
    showing: "Hiển thị",
    of: "trong",
    messages: "tin nhắn",
    loadMore: "Xem thêm",
  },
  en: {
    communicationsHistory: "Communications History",
    summary: "Summary",
    totalMessages: "Total Messages",
    smsMessages: "SMS Messages",
    znsMessages: "ZNS Messages",
    deliveryRate: "Delivery Rate",
    preferences: "Contact Preferences",
    preferredChannel: "Preferred Channel",
    smsOptIn: "SMS",
    znsOptIn: "ZNS",
    emailOptIn: "Email",
    enabled: "Enabled",
    disabled: "Disabled",
    allMessages: "All",
    sms: "SMS",
    zns: "ZNS",
    noMessages: "No messages yet",
    content: "Content",
    status: "Status",
    date: "Date",
    cost: "Cost",
    success: "Success",
    failed: "Failed",
    showing: "Showing",
    of: "of",
    messages: "messages",
    loadMore: "Load More",
  },
};

function formatCurrency(value: number | null): string {
  if (!value) return "0";
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

export function CommunicationsTab({
  messages,
  preferences,
  language = "vi",
}: CommunicationsTabProps) {
  const t = labels[language];
  const [filter, setFilter] = useState<"all" | "sms" | "zns">("all");
  const [visibleCount, setVisibleCount] = useState(10);

  // Calculate summary stats
  const stats = useMemo(() => {
    const smsMessages = messages.filter((m) => m.channel === "sms");
    const znsMessages = messages.filter((m) => m.channel === "zns");
    const totalSuccess = messages.reduce((sum, m) => sum + (m.success_count || 0), 0);
    const totalFail = messages.reduce((sum, m) => sum + (m.fail_count || 0), 0);
    const deliveryRate = totalSuccess + totalFail > 0
      ? (totalSuccess / (totalSuccess + totalFail)) * 100
      : 0;

    return {
      total: messages.length,
      sms: smsMessages.length,
      zns: znsMessages.length,
      deliveryRate,
    };
  }, [messages]);

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (filter === "all") return messages;
    return messages.filter((m) => m.channel === filter);
  }, [messages, filter]);

  const visibleMessages = filteredMessages.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMessages.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <MessageSquare className="h-5 w-5 text-blue-400" />
            </div>
            <p className="text-sm text-slate-400">{t.totalMessages}</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
            </div>
            <p className="text-sm text-slate-400">{t.smsMessages}</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.sms}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <p className="text-sm text-slate-400">{t.znsMessages}</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.zns}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="text-sm text-slate-400">{t.deliveryRate}</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{stats.deliveryRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Preferences & Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preferences */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            {t.preferences}
          </h2>
          <div className="space-y-4">
            {/* Preferred Channel */}
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <span className="text-sm text-slate-300">{t.preferredChannel}</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {preferences?.preferred_channel?.toUpperCase() || "SMS"}
              </span>
            </div>

            {/* SMS Opt-in */}
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-300">{t.smsOptIn}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                preferences?.sms_opt_in !== false
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {preferences?.sms_opt_in !== false ? t.enabled : t.disabled}
              </span>
            </div>

            {/* ZNS Opt-in */}
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-slate-300">{t.znsOptIn}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                preferences?.zns_opt_in !== false
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {preferences?.zns_opt_in !== false ? t.enabled : t.disabled}
              </span>
            </div>

            {/* Email Opt-in */}
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-400" />
                <span className="text-sm text-slate-300">{t.emailOptIn}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                preferences?.email_opt_in !== false
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}>
                {preferences?.email_opt_in !== false ? t.enabled : t.disabled}
              </span>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-400" />
              {t.communicationsHistory}
            </h2>
            <div className="flex gap-2">
              {(["all", "sms", "zns"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === f
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-700/50 text-slate-400 hover:text-white"
                  }`}
                >
                  {f === "all" ? t.allMessages : f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Count */}
          {filteredMessages.length > 0 && (
            <p className="text-sm text-slate-400 mb-4">
              {t.showing} {visibleMessages.length} {t.of} {filteredMessages.length} {t.messages}
            </p>
          )}

          {/* Messages */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {visibleMessages.length > 0 ? (
              visibleMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {msg.channel === "sms" ? (
                          <MessageSquare className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Zap className="h-4 w-4 text-purple-400" />
                        )}
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          msg.channel === "sms"
                            ? "bg-cyan-500/20 text-cyan-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}>
                          {msg.channel.toUpperCase()}
                        </span>
                        {msg.brandname && (
                          <span className="text-xs text-slate-500">{msg.brandname}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{msg.content}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500">
                        {new Date(msg.sent_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                      </p>
                      <p className="text-xs text-slate-600">
                        {new Date(msg.sent_at).toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {msg.total_cost && (
                        <p className="text-xs text-amber-400 mt-1">{formatCurrency(msg.total_cost)} VND</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {(msg.success_count !== undefined || msg.fail_count !== undefined) && (
                      <>
                        <div className="flex items-center gap-1 text-xs">
                          <CheckCircle className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">{msg.success_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <XCircle className="h-3 w-3 text-red-400" />
                          <span className="text-red-400">{msg.fail_count || 0}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500">{t.noMessages}</div>
            )}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="px-6 py-2 bg-slate-700/50 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors"
              >
                {t.loadMore}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
