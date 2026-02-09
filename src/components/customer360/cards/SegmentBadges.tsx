import Link from "next/link";
import { Crown, Zap, AlertTriangle, Clock, TrendingUp, UserCheck } from "lucide-react";

interface SegmentBadgesProps {
  lifecycleStage?: string | null;
  clvTier?: string | null;
  rfmSegment?: string | null;
  showLinks?: boolean;
  size?: "sm" | "md" | "lg";
}

const lifecycleConfig: Record<string, { bg: string; icon: React.ElementType; label: string }> = {
  new: { bg: "bg-purple-500", icon: Zap, label: "NEW" },
  active: { bg: "bg-emerald-500", icon: UserCheck, label: "ACTIVE" },
  loyal: { bg: "bg-blue-500", icon: Crown, label: "LOYAL" },
  at_risk: { bg: "bg-amber-500", icon: AlertTriangle, label: "AT RISK" },
  churned: { bg: "bg-red-500", icon: Clock, label: "CHURNED" },
  reactivated: { bg: "bg-cyan-500", icon: TrendingUp, label: "REACTIVATED" },
};

const clvConfig: Record<string, { bg: string; icon?: React.ElementType }> = {
  vip: { bg: "bg-amber-500", icon: Crown },
  high: { bg: "bg-emerald-500" },
  medium: { bg: "bg-blue-500" },
  low: { bg: "bg-slate-500" },
};

const rfmColors: Record<string, string> = {
  Champions: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Loyal Customers": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Potential Loyalists": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "At Risk": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "New Customers": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Hibernating: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "Can't Lose Them": "bg-red-500/20 text-red-400 border-red-500/30",
  "Need Attention": "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const sizeClasses = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-3 py-1 text-xs gap-1.5",
  lg: "px-4 py-1.5 text-sm gap-2",
};

export function SegmentBadges({
  lifecycleStage,
  clvTier,
  rfmSegment,
  showLinks = false,
  size = "md",
}: SegmentBadgesProps) {
  const badges = [];

  // Lifecycle badge
  if (lifecycleStage && lifecycleConfig[lifecycleStage]) {
    const config = lifecycleConfig[lifecycleStage];
    const Icon = config.icon;
    const badge = (
      <span
        key="lifecycle"
        className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium ${config.bg} text-white`}
      >
        <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {config.label}
      </span>
    );
    badges.push(
      showLinks ? (
        <Link key="lifecycle" href={`/segments/lifecycle/${lifecycleStage}`}>
          {badge}
        </Link>
      ) : (
        badge
      )
    );
  }

  // CLV badge
  if (clvTier && clvConfig[clvTier]) {
    const config = clvConfig[clvTier];
    const Icon = config.icon;
    const badge = (
      <span
        key="clv"
        className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium ${config.bg} text-white`}
      >
        {Icon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
        {clvTier.toUpperCase()}
      </span>
    );
    badges.push(
      showLinks ? (
        <Link key="clv" href={`/segments/clv/${clvTier}`}>
          {badge}
        </Link>
      ) : (
        badge
      )
    );
  }

  // RFM badge
  if (rfmSegment) {
    const colorClass = rfmColors[rfmSegment] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
    const badge = (
      <span
        key="rfm"
        className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium border ${colorClass}`}
      >
        {rfmSegment}
      </span>
    );
    badges.push(
      showLinks ? (
        <Link key="rfm" href={`/segments/rfm/${encodeURIComponent(rfmSegment)}`}>
          {badge}
        </Link>
      ) : (
        badge
      )
    );
  }

  if (badges.length === 0) return null;

  return <div className="flex flex-wrap gap-2">{badges}</div>;
}
