import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Crown,
  Zap,
  AlertTriangle,
  Clock,
  TrendingUp,
  UserCheck,
} from "lucide-react";

interface CustomerHeaderProps {
  customer: {
    id: string;
    name: string;
    customer_code: string;
    phone?: string;
    email?: string;
    gender?: string;
    birthday?: string;
    first_purchase?: string;
    created_at?: string;
    lifecycle_stage?: string;
    clv_tier?: string;
    rfm_segment?: string;
  };
  language?: "vi" | "en";
}

const lifecycleColors: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  new: { bg: "bg-purple-500", text: "text-purple-400", icon: Zap },
  active: { bg: "bg-emerald-500", text: "text-emerald-400", icon: UserCheck },
  loyal: { bg: "bg-blue-500", text: "text-blue-400", icon: Crown },
  at_risk: { bg: "bg-amber-500", text: "text-amber-400", icon: AlertTriangle },
  churned: { bg: "bg-red-500", text: "text-red-400", icon: Clock },
  reactivated: { bg: "bg-cyan-500", text: "text-cyan-400", icon: TrendingUp },
};

const clvColors: Record<string, { bg: string; text: string }> = {
  vip: { bg: "bg-amber-500", text: "text-amber-400" },
  high: { bg: "bg-emerald-500", text: "text-emerald-400" },
  medium: { bg: "bg-blue-500", text: "text-blue-400" },
  low: { bg: "bg-slate-500", text: "text-slate-400" },
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

const labels = {
  vi: {
    gender: "Giới tính",
    phone: "Điện thoại",
    email: "Email",
    customerSince: "Khách hàng từ",
    na: "N/A",
  },
  en: {
    gender: "Gender",
    phone: "Phone",
    email: "Email",
    customerSince: "Customer Since",
    na: "N/A",
  },
};

export function CustomerHeader({ customer, language = "vi" }: CustomerHeaderProps) {
  const t = labels[language];

  return (
    <div className="space-y-4">
      {/* Back Button & Name */}
      <div className="flex items-center gap-4">
        <Link
          href="/customers"
          className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
            {customer.lifecycle_stage && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  lifecycleColors[customer.lifecycle_stage]?.bg || "bg-slate-500"
                } text-white`}
              >
                {customer.lifecycle_stage.replace("_", " ").toUpperCase()}
              </span>
            )}
            {customer.clv_tier && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  clvColors[customer.clv_tier]?.bg || "bg-slate-500"
                } text-white`}
              >
                {customer.clv_tier === "vip" && <Crown className="h-3 w-3" />}
                {customer.clv_tier.toUpperCase()}
              </span>
            )}
            {customer.rfm_segment && (
              <span
                className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                  rfmColors[customer.rfm_segment] || "bg-slate-500/20 text-slate-400 border-slate-500/30"
                }`}
              >
                {customer.rfm_segment}
              </span>
            )}
          </div>
          <p className="text-slate-400 mt-1">{customer.customer_code}</p>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.gender}</p>
              <p className="text-sm font-medium text-white">{customer.gender || t.na}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Phone className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.phone}</p>
              <p className="text-sm font-medium text-white">{customer.phone || t.na}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Mail className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.email}</p>
              <p className="text-sm font-medium text-white truncate max-w-[200px]">
                {customer.email || t.na}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Calendar className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.customerSince}</p>
              <p className="text-sm font-medium text-white">
                {customer.first_purchase
                  ? new Date(customer.first_purchase).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")
                  : customer.created_at
                  ? new Date(customer.created_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")
                  : t.na}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
