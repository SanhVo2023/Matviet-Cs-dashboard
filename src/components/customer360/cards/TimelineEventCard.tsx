import {
  ShoppingCart,
  MessageSquare,
  Zap,
  Star,
  Store,
  Activity,
} from "lucide-react";

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

interface TimelineEventCardProps {
  event: TimelineEvent;
  language?: "vi" | "en";
  isLast?: boolean;
}

const eventConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  purchase: { icon: ShoppingCart, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  sms_sent: { icon: MessageSquare, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  zns_sent: { icon: Zap, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  nps_response: { icon: Star, color: "text-amber-400", bgColor: "bg-amber-500/20" },
  store_visit: { icon: Store, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  message_sent: { icon: MessageSquare, color: "text-slate-400", bgColor: "bg-slate-500/20" },
};

function formatCurrency(value: number | null): string {
  if (!value) return "";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

export function TimelineEventCard({ event, language = "vi", isLast = false }: TimelineEventCardProps) {
  const config = eventConfig[event.event_type] || { icon: Activity, color: "text-slate-400", bgColor: "bg-slate-500/20" };
  const Icon = config.icon;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(language === "vi" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get additional display info based on event type
  const getEventDetails = () => {
    const meta = event.metadata || {};
    switch (event.event_type) {
      case "purchase":
        return {
          badge: meta.payment_method as string,
          subtext: meta.store_name as string,
          value: event.event_value ? `${formatCurrency(event.event_value)} VND` : null,
        };
      case "sms_sent":
      case "zns_sent":
        return {
          badge: event.channel.toUpperCase(),
          subtext: event.description,
          value: event.event_value ? `${formatCurrency(event.event_value)} VND` : null,
        };
      case "nps_response":
        return {
          badge: meta.category as string,
          subtext: meta.feedback as string,
          value: event.event_value ? `${event.event_value}/10` : null,
        };
      default:
        return {
          badge: event.channel,
          subtext: event.description,
          value: null,
        };
    }
  };

  const details = getEventDetails();

  return (
    <div className="flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.color}`} />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-slate-700/50 mt-2" />
        )}
      </div>

      {/* Event content */}
      <div className="flex-1 pb-6">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-white">{event.title}</h4>
                {details.badge && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
                    {details.badge}
                  </span>
                )}
              </div>
              {details.subtext && (
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{details.subtext}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-500">{formatDate(event.event_date)}</p>
              <p className="text-xs text-slate-600">{formatTime(event.event_date)}</p>
              {details.value && (
                <p className={`text-sm font-semibold mt-1 ${config.color}`}>{details.value}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
