import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Customer360View } from "@/components/customer360/Customer360View";

async function getCustomerData(id: string) {
  const supabase = await createClient();

  // Get customer details with CDP fields
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select(`
      id,
      customer_code,
      name,
      email,
      phone,
      address,
      gender,
      date_of_birth,
      created_at,
      rfm_score,
      rfm_r_score,
      rfm_f_score,
      rfm_m_score,
      rfm_recency,
      rfm_frequency,
      rfm_monetary,
      segment_id,
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

  // Map fields for component compatibility
  const customerData = {
    ...customer,
    birthday: customer.date_of_birth,
    rfm_segment: null as string | null, // Will be looked up from segment_id if needed
  };

  // Parallel data fetching for performance
  const [
    ordersResult,
    npsResult,
    timelineResult,
    messagesResult,
    healthScoreResult,
    preferencesResult,
    segmentMembershipsResult,
  ] = await Promise.all([
    // Get customer orders
    supabase
      .from("orders")
      .select(`
        id,
        order_number,
        order_date,
        net_amount,
        total_discount,
        payment_method,
        store_id,
        stores(name)
      `)
      .eq("customer_id", id)
      .order("order_date", { ascending: false }),

    // Get NPS responses
    supabase
      .from("nps_responses")
      .select("id, score, category, feedback, responded_at")
      .eq("customer_id", id)
      .order("responded_at", { ascending: false }),

    // Get unified timeline events (with error handling)
    (async () => {
      try {
        const res = await supabase
          .from("v_customer_timeline")
          .select("*")
          .eq("customer_id", id)
          .order("event_date", { ascending: false })
          .limit(100);
        return res;
      } catch {
        return { data: [], error: null };
      }
    })(),

    // Get SMS/ZNS messages
    supabase
      .from("sms_zns_messages")
      .select(`
        id,
        channel,
        content,
        message_type,
        brandname,
        sent_at,
        total_cost,
        success_count,
        fail_count
      `)
      .eq("customer_id", id)
      .order("sent_at", { ascending: false }),

    // Get health score (maySingleRowNotExist)
    supabase
      .from("customer_health_scores")
      .select("*")
      .eq("customer_id", id)
      .maybeSingle(),

    // Get preferences (maySingleRowNotExist)
    supabase
      .from("customer_preferences")
      .select("*")
      .eq("customer_id", id)
      .maybeSingle(),

    // Get segment memberships
    supabase
      .from("customer_segment_memberships")
      .select("id, score, assigned_at, segment_rule_id, segment_rules(name, rule_type, description)")
      .eq("customer_id", id),
  ]);

  const orders = ordersResult.data || [];
  const npsResponses = npsResult.data || [];
  const timelineEvents = timelineResult.data || [];
  const messages = messagesResult.data || [];
  const healthScore = healthScoreResult.data;
  const preferences = preferencesResult.data;
  const segmentMemberships = segmentMembershipsResult.data || [];

  // Get order items for product analysis
  const orderIds = orders.map((o) => o.id);
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

  const allItems = orderItems || [];

  // Process data for charts

  // Monthly spending trend
  const monthlySpending: Record<string, number> = {};
  orders.forEach((o) => {
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
  orders.forEach((o: any) => {
    const storeName = o.stores?.name || "Unknown";
    storeCount[storeName] = (storeCount[storeName] || 0) + 1;
  });

  const storeData = Object.entries(storeCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Payment method distribution
  const paymentCount: Record<string, number> = {};
  orders.forEach((o) => {
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
  const avgOrderValue = orders.length > 0
    ? orders.reduce((sum, o) => sum + (parseFloat(o.net_amount as any) || 0), 0) / orders.length
    : 0;

  // Days since last purchase
  const daysSinceLastPurchase = customer.last_purchase
    ? Math.floor((Date.now() - new Date(customer.last_purchase).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // NPS metrics
  const latestNPS = npsResponses[0]?.score ?? null;
  const avgNPS = npsResponses.length > 0
    ? Math.round(npsResponses.reduce((sum, n) => sum + n.score, 0) / npsResponses.length)
    : null;

  return {
    customer: customerData,
    orders,
    npsResponses,
    timelineEvents,
    messages,
    healthScore,
    preferences,
    segmentMemberships,
    spendingTrend,
    categoryData,
    storeData,
    paymentData,
    topProducts,
    orderItems: allItems,
    avgOrderValue,
    daysSinceLastPurchase,
    latestNPS,
    avgNPS,
  };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  // Validate ID exists and is a valid UUID
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const data = await getCustomerData(id);

  if (!data || !data.customer) {
    notFound();
  }

  // If no health score, try to calculate it
  if (!data.healthScore) {
    const supabase = await createClient();
    await supabase.rpc("calculate_customer_health_score", { p_customer_id: id });
    // Re-fetch health score
    const { data: newHealthScore } = await supabase
      .from("customer_health_scores")
      .select("*")
      .eq("customer_id", id)
      .single();
    data.healthScore = newHealthScore;
  }

  return (
    <Customer360View
      customer={data.customer}
      orders={data.orders}
      npsResponses={data.npsResponses}
      timelineEvents={data.timelineEvents}
      messages={data.messages}
      healthScore={data.healthScore}
      preferences={data.preferences}
      segmentMemberships={data.segmentMemberships}
      spendingTrend={data.spendingTrend}
      categoryData={data.categoryData}
      storeData={data.storeData}
      paymentData={data.paymentData}
      topProducts={data.topProducts}
      orderItems={data.orderItems}
      avgOrderValue={data.avgOrderValue}
      daysSinceLastPurchase={data.daysSinceLastPurchase}
      latestNPS={data.latestNPS}
      avgNPS={data.avgNPS}
      language="vi"
    />
  );
}
