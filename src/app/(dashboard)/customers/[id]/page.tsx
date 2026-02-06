import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  DollarSign,
  Star,
  Clock,
  Package,
  Heart,
  Award,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Crown,
  Zap,
  UserCheck,
  Target,
  Activity,
} from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { TrendAreaChart, DonutChart, CategoryBarChart } from "@/components/charts";

async function getCustomerData(id: string) {
  const supabase = await createClient();

  // Get customer details with new CDP fields
  const { data: customer } = await supabase
    .from("customers")
    .select(`
      id,
      customer_code,
      name,
      email,
      phone,
      address,
      gender,
      birthday,
      created_at,
      rfm_score,
      rfm_segment,
      rfm_recency,
      rfm_frequency,
      rfm_monetary,
      total_spent,
      order_count,
      first_purchase,
      last_purchase,
      lifecycle_stage,
      clv_tier,
      clv_predicted,
      avg_order_value,
      purchase_frequency,
      churn_risk,
      days_to_next_purchase,
      engagement_score,
      preferred_channel,
      preferred_category
    `)
    .eq("id", id)
    .single();

  if (!customer) {
    return null;
  }

  // Get customer orders
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_code,
      order_date,
      net_amount,
      total_discount,
      payment_method,
      store_id,
      stores(name)
    `)
    .eq("customer_id", id)
    .order("order_date", { ascending: false });

  // Get NPS responses
  const { data: npsResponses } = await supabase
    .from("nps_responses")
    .select("id, score, category, feedback, responded_at")
    .eq("customer_id", id)
    .order("responded_at", { ascending: false });

  // Get engagement timeline
  const { data: engagements } = await supabase
    .from("customer_engagements")
    .select("id, engagement_type, channel, reference_id, reference_type, metadata, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Get segment memberships
  const { data: segmentMemberships } = await supabase
    .from("customer_segment_memberships")
    .select("id, score, assigned_at, segment_rule_id, segment_rules(name, rule_type, description)")
    .eq("customer_id", id);

  // Get order items for product analysis
  const orderIds = (orders || []).map((o) => o.id);
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      id,
      quantity,
      unit_price,
      total_amount,
      product_id,
      products(name, category, brand)
    `)
    .in("order_id", orderIds.length > 0 ? orderIds : ["none"]);

  // Process data
  const allOrders = orders || [];
  const allItems = orderItems || [];
  const allNPS = npsResponses || [];

  // Monthly spending trend
  const monthlySpending: Record<string, number> = {};
  allOrders.forEach((o) => {
    const month = o.order_date?.substring(0, 7);
    if (month) {
      monthlySpending[month] = (monthlySpending[month] || 0) + (parseFloat(o.net_amount as any) || 0);
    }
  });

  const spendingTrend = Object.entries(monthlySpending)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([date, value]) => ({ date, value }));

  // Category distribution
  const categoryCount: Record<string, number> = {};
  allItems.forEach((item: any) => {
    const category = item.products?.category || "Other";
    categoryCount[category] = (categoryCount[category] || 0) + (item.quantity || 1);
  });

  const categoryData = Object.entries(categoryCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Store distribution
  const storeCount: Record<string, number> = {};
  allOrders.forEach((o: any) => {
    const storeName = o.stores?.name || "Unknown";
    storeCount[storeName] = (storeCount[storeName] || 0) + 1;
  });

  const storeData = Object.entries(storeCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Payment method distribution
  const paymentCount: Record<string, number> = {};
  allOrders.forEach((o) => {
    const method = o.payment_method || "Other";
    paymentCount[method] = (paymentCount[method] || 0) + 1;
  });

  const paymentData = Object.entries(paymentCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top products
  const productSpend: Record<string, { name: string; total: number; count: number }> = {};
  allItems.forEach((item: any) => {
    const productName = item.products?.name || "Unknown";
    if (!productSpend[productName]) {
      productSpend[productName] = { name: productName, total: 0, count: 0 };
    }
    productSpend[productName].total += parseFloat(item.total_amount as any) || 0;
    productSpend[productName].count += item.quantity || 1;
  });

  const topProducts = Object.values(productSpend)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Calculate averages
  const avgOrderValue = allOrders.length > 0
    ? allOrders.reduce((sum, o) => sum + (parseFloat(o.net_amount as any) || 0), 0) / allOrders.length
    : 0;

  // Days since last purchase
  const daysSinceLastPurchase = customer.last_purchase
    ? Math.floor((Date.now() - new Date(customer.last_purchase).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Latest NPS
  const latestNPS = allNPS[0]?.score ?? null;
  const avgNPS = allNPS.length > 0
    ? Math.round(allNPS.reduce((sum, n) => sum + n.score, 0) / allNPS.length)
    : null;

  // Build engagement timeline from multiple sources
  const allEngagements = engagements || [];

  // Add orders to timeline
  const orderEngagements = allOrders.map((o: any) => ({
    id: o.id,
    type: "purchase",
    channel: "in_store",
    title: `Order ${o.order_code}`,
    description: `${formatCurrencyInternal(parseFloat(o.net_amount))} at ${o.stores?.name || "Unknown"}`,
    date: o.order_date,
    metadata: { order_id: o.id, amount: o.net_amount },
  }));

  // Add NPS to timeline
  const npsEngagements = allNPS.map((n) => ({
    id: n.id,
    type: "nps_response",
    channel: "survey",
    title: `NPS Response: ${n.score}`,
    description: n.feedback || (n.score >= 9 ? "Promoter" : n.score >= 7 ? "Passive" : "Detractor"),
    date: n.responded_at,
    metadata: { score: n.score },
  }));

  // Combine and sort timeline
  const timeline = [...orderEngagements, ...npsEngagements, ...allEngagements.map((e) => ({
    id: e.id,
    type: e.engagement_type,
    channel: e.channel,
    title: e.engagement_type.replace("_", " "),
    description: JSON.stringify(e.metadata),
    date: e.created_at,
    metadata: e.metadata,
  }))]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  return {
    customer,
    orders: allOrders,
    npsResponses: allNPS,
    spendingTrend,
    categoryData,
    storeData,
    paymentData,
    topProducts,
    avgOrderValue,
    daysSinceLastPurchase,
    latestNPS,
    avgNPS,
    totalItems: allItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
    timeline,
    segmentMemberships: segmentMemberships || [],
  };
}

function formatCurrencyInternal(value: number | null): string {
  if (!value) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCustomerData(id);

  if (!data) {
    notFound();
  }

  const { customer, orders, npsResponses } = data;

  const formatCurrency = (value: number | null) => {
    if (!value) return "0";
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toLocaleString();
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

  const lifecycleColors: Record<string, { bg: string; text: string; icon: any }> = {
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

  const timelineIcons: Record<string, { icon: any; color: string }> = {
    purchase: { icon: ShoppingCart, color: "text-emerald-400" },
    nps_response: { icon: Star, color: "text-amber-400" },
    campaign_sent: { icon: Mail, color: "text-blue-400" },
    campaign_opened: { icon: Mail, color: "text-cyan-400" },
    store_visit: { icon: Package, color: "text-purple-400" },
  };

  const categoryColors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4"];
  const paymentColors = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#64748b"];

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/customers"
          className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
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
              <p className="text-xs text-slate-400">Gender</p>
              <p className="text-sm font-medium text-white">{customer.gender || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
              <Phone className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Phone</p>
              <p className="text-sm font-medium text-white">{customer.phone || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Mail className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-medium text-white truncate max-w-[200px]">
                {customer.email || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Calendar className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Customer Since</p>
              <p className="text-sm font-medium text-white">
                {customer.first_purchase
                  ? new Date(customer.first_purchase).toLocaleDateString("vi-VN")
                  : customer.created_at
                  ? new Date(customer.created_at).toLocaleDateString("vi-VN")
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Lifetime Value"
          value={`${formatCurrency(customer.total_spent)} VND`}
          iconName="DollarSign"
          color="emerald"
        />
        <KPICard
          title="Total Orders"
          value={customer.order_count || orders.length}
          iconName="ShoppingCart"
          color="blue"
        />
        <KPICard
          title="Avg Order Value"
          value={`${formatCurrency(data.avgOrderValue)}`}
          iconName="TrendingUp"
          color="purple"
        />
        <KPICard
          title="Days Since Purchase"
          value={data.daysSinceLastPurchase ?? "N/A"}
          iconName="Clock"
          color={data.daysSinceLastPurchase && data.daysSinceLastPurchase > 90 ? "red" : "cyan"}
        />
        <KPICard
          title="NPS Score"
          value={data.latestNPS ?? "N/A"}
          iconName="Star"
          color={data.latestNPS && data.latestNPS >= 9 ? "emerald" : data.latestNPS && data.latestNPS >= 7 ? "amber" : "red"}
          subtitle={data.latestNPS ? (data.latestNPS >= 9 ? "Promoter" : data.latestNPS >= 7 ? "Passive" : "Detractor") : undefined}
        />
      </div>

      {/* Predictive Metrics */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          Predictive Analytics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Predicted CLV */}
          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Predicted CLV</p>
              {customer.clv_tier && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${clvColors[customer.clv_tier]?.bg} text-white`}>
                  {customer.clv_tier.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-emerald-400">
              {formatCurrency(customer.clv_predicted)} VND
            </p>
            <p className="text-xs text-slate-500 mt-2">Future value prediction</p>
          </div>

          {/* Churn Risk */}
          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Churn Risk</p>
              <AlertTriangle className={`h-4 w-4 ${
                (customer.churn_risk || 0) > 70 ? "text-red-400" :
                (customer.churn_risk || 0) > 40 ? "text-amber-400" : "text-emerald-400"
              }`} />
            </div>
            <p className={`text-2xl font-bold ${
              (customer.churn_risk || 0) > 70 ? "text-red-400" :
              (customer.churn_risk || 0) > 40 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {(customer.churn_risk || 0).toFixed(0)}%
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  (customer.churn_risk || 0) > 70 ? "bg-red-500" :
                  (customer.churn_risk || 0) > 40 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${customer.churn_risk || 0}%` }}
              />
            </div>
          </div>

          {/* Days to Next Purchase */}
          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Est. Next Purchase</p>
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">
              {customer.days_to_next_purchase !== null && customer.days_to_next_purchase >= 0
                ? `${customer.days_to_next_purchase} days`
                : "Overdue"}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Avg frequency: {customer.purchase_frequency ? `${Math.round(customer.purchase_frequency)} days` : "N/A"}
            </p>
          </div>

          {/* Purchase Frequency */}
          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-400">Avg Order Value</p>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">
              {formatCurrency(customer.avg_order_value)} VND
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {customer.order_count} orders total
            </p>
          </div>
        </div>
      </div>

      {/* RFM Analysis */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-400" />
          RFM Analysis
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">Recency Score</p>
                <p className="text-3xl font-bold text-cyan-400">{customer.rfm_recency || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-cyan-400/30" />
            </div>
            <p className="text-xs text-slate-500">
              Days since last purchase: {data.daysSinceLastPurchase ?? "N/A"}
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full"
                style={{ width: `${((customer.rfm_recency || 0) / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">Frequency Score</p>
                <p className="text-3xl font-bold text-emerald-400">{customer.rfm_frequency || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-emerald-400/30" />
            </div>
            <p className="text-xs text-slate-500">
              Total orders: {customer.order_count || orders.length}
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${((customer.rfm_frequency || 0) / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-400">Monetary Score</p>
                <p className="text-3xl font-bold text-amber-400">{customer.rfm_monetary || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-400/30" />
            </div>
            <p className="text-xs text-slate-500">
              Total spent: {formatCurrency(customer.total_spent)} VND
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${((customer.rfm_monetary || 0) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend */}
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Spending History</h2>
          {data.spendingTrend.length > 0 ? (
            <TrendAreaChart
              data={data.spendingTrend}
              dataKey="value"
              height={250}
              color="#10b981"
              showGrid={true}
            />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              No spending data available
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Purchase Categories</h2>
          {data.categoryData.length > 0 ? (
            <>
              <DonutChart
                data={data.categoryData.map((d, i) => ({
                  ...d,
                  color: categoryColors[i % categoryColors.length],
                }))}
                height={180}
                innerRadius={40}
                outerRadius={70}
                showLabels={false}
              />
              <div className="mt-4 space-y-2">
                {data.categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                      />
                      <span className="text-sm text-slate-300 truncate max-w-[120px]">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">{cat.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-500">
              No category data
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-400" />
            Favorite Products
          </h2>
          <div className="space-y-4">
            {data.topProducts.length > 0 ? (
              data.topProducts.map((product, index) => {
                const maxSpend = data.topProducts[0]?.total || 1;
                const percentage = (product.total / maxSpend) * 100;
                return (
                  <div key={product.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold ${
                            index < 3
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="text-sm text-slate-300 truncate max-w-[180px]">
                          {product.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(product.total)}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{product.count} items purchased</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">No product data</div>
            )}
          </div>
        </div>

        {/* Engagement Timeline */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            Engagement Timeline
          </h2>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
            {data.timeline.length > 0 ? (
              data.timeline.map((event: any, index: number) => {
                const iconConfig = timelineIcons[event.type] || { icon: Activity, color: "text-slate-400" };
                const IconComponent = iconConfig.icon;
                return (
                  <div key={event.id || index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700/50`}>
                        <IconComponent className={`h-4 w-4 ${iconConfig.color}`} />
                      </div>
                      {index < data.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-slate-700 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-white text-sm">{event.title}</p>
                        <span className="text-xs text-slate-500">
                          {event.date ? new Date(event.date).toLocaleDateString("vi-VN") : ""}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{event.description}</p>
                      <span className="inline-flex mt-2 px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                        {event.type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">No engagement history</div>
            )}
          </div>
        </div>
      </div>

      {/* NPS Feedback Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS Feedback */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            NPS Feedback History
          </h2>
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
            {npsResponses.length > 0 ? (
              npsResponses.map((nps) => {
                const category =
                  nps.score >= 9 ? "Promoter" : nps.score >= 7 ? "Passive" : "Detractor";
                return (
                  <div
                    key={nps.id}
                    className={`p-4 rounded-lg border ${
                      category === "Promoter"
                        ? "bg-emerald-500/5 border-emerald-500/20"
                        : category === "Passive"
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          category === "Promoter"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : category === "Passive"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        <Star className="h-3 w-3" />
                        {nps.score}
                      </span>
                      <span className="text-xs text-slate-500">
                        {nps.responded_at
                          ? new Date(nps.responded_at).toLocaleDateString("vi-VN")
                          : ""}
                      </span>
                    </div>
                    {nps.feedback && (
                      <p className="text-sm text-slate-300">{nps.feedback}</p>
                    )}
                    {!nps.feedback && (
                      <p className="text-sm text-slate-500 italic">No feedback provided</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500">No NPS responses</div>
            )}
          </div>
        </div>

        {/* Segment Memberships */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-400" />
            Segment Memberships
          </h2>
          <div className="space-y-3">
            {/* Built-in segments */}
            {customer.lifecycle_stage && (
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${lifecycleColors[customer.lifecycle_stage]?.bg || "bg-slate-500"}`} />
                  <div>
                    <p className="font-medium text-white text-sm">Lifecycle: {customer.lifecycle_stage.replace("_", " ")}</p>
                    <p className="text-xs text-slate-500">System segment</p>
                  </div>
                </div>
                <Link href={`/segments/lifecycle/${customer.lifecycle_stage}`} className="text-xs text-emerald-400 hover:underline">
                  View segment
                </Link>
              </div>
            )}
            {customer.clv_tier && (
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${clvColors[customer.clv_tier]?.bg || "bg-slate-500"}`} />
                  <div>
                    <p className="font-medium text-white text-sm">CLV: {customer.clv_tier.toUpperCase()}</p>
                    <p className="text-xs text-slate-500">Value tier</p>
                  </div>
                </div>
                <Link href={`/segments/clv/${customer.clv_tier}`} className="text-xs text-emerald-400 hover:underline">
                  View segment
                </Link>
              </div>
            )}
            {customer.rfm_segment && (
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-purple-500" />
                  <div>
                    <p className="font-medium text-white text-sm">RFM: {customer.rfm_segment}</p>
                    <p className="text-xs text-slate-500">Behavioral segment</p>
                  </div>
                </div>
                <Link href={`/segments/rfm/${encodeURIComponent(customer.rfm_segment)}`} className="text-xs text-emerald-400 hover:underline">
                  View segment
                </Link>
              </div>
            )}
            {/* Custom segments */}
            {data.segmentMemberships.map((membership: any) => (
              <div key={membership.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-cyan-500" />
                  <div>
                    <p className="font-medium text-white text-sm">{membership.segment_rules?.name}</p>
                    <p className="text-xs text-slate-500">{membership.segment_rules?.rule_type} segment</p>
                  </div>
                </div>
                {membership.score && (
                  <span className="text-xs text-cyan-400">{membership.score}% match</span>
                )}
              </div>
            ))}
            {!customer.lifecycle_stage && !customer.clv_tier && !customer.rfm_segment && data.segmentMemberships.length === 0 && (
              <div className="text-center py-8 text-slate-500">Not in any segments</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-400" />
            Order History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/30">
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">
                  Order Code
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Date</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Store</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Payment</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {orders.slice(0, 10).map((order: any) => (
                <tr key={order.id} className="hover:bg-slate-700/20">
                  <td className="px-6 py-4">
                    <span className="font-medium text-white">{order.order_code}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {order.order_date
                      ? new Date(order.order_date).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-slate-300">{order.stores?.name || "-"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 rounded text-xs bg-slate-700 text-slate-300">
                      {order.payment_method || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-white">
                      {formatCurrency(parseFloat(order.net_amount))} VND
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-slate-500">No orders found</div>
          )}
          {orders.length > 10 && (
            <div className="p-4 text-center border-t border-slate-700/50">
              <span className="text-sm text-slate-400">
                Showing 10 of {orders.length} orders
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
