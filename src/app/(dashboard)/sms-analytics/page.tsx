"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquare,
  Send,
  DollarSign,
  Users,
  TrendingUp,
  Phone,
  Zap,
  Calendar,
  BarChart3,
  ShoppingCart,
  Target,
  Percent,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Campaign descriptions
const campaignDescriptions: Record<string, { vi: string; en: string }> = {
  "Birthday": {
    vi: "Chương trình tri ân nhân dịp tháng sinh nhật khách hàng, tặng mã giảm giá 20%",
    en: "Customer birthday appreciation program with 20% discount voucher"
  },
  "Advertising Campaign": {
    vi: "Chiến dịch quảng cáo khuyến mãi theo mùa và sự kiện đặc biệt",
    en: "Seasonal promotions and special event advertising campaigns"
  },
  "Win back customer 6-12-18M": {
    vi: "Chương trình win-back khách hàng không mua hàng 6-12-18 tháng",
    en: "Win-back program for customers inactive for 6-12-18 months"
  },
  "Mắt Việt Membership": {
    vi: "Chương trình thành viên Mắt Việt với ưu đãi đặc biệt",
    en: "Mắt Việt membership program with special benefits"
  },
  "Store Anniversary": {
    vi: "Kỷ niệm sinh nhật cửa hàng với nhiều ưu đãi hấp dẫn",
    en: "Store anniversary celebration with attractive offers"
  },
  "Voucher for Eye Check": {
    vi: "Voucher khuyến khích khách hàng đi khám mắt định kỳ",
    en: "Voucher encouraging customers for regular eye checkups"
  },
  "CS Voucher after XNBH": {
    vi: "Voucher chăm sóc khách hàng sau khi xác nhận bán hàng",
    en: "Customer care voucher after sales confirmation"
  },
  "Online XNBH Campaign": {
    vi: "Chiến dịch xác nhận bán hàng online",
    en: "Online sales confirmation campaign"
  },
  "Warranty Confirmation": {
    vi: "Xác nhận thông tin bảo hành sản phẩm cho khách hàng",
    en: "Product warranty confirmation for customers"
  },
  "OTP": {
    vi: "Mã xác thực OTP cho đăng nhập và giao dịch",
    en: "OTP verification code for login and transactions"
  },
  "Other": {
    vi: "Các tin nhắn khác chưa được phân loại",
    en: "Other uncategorized messages"
  },
};

// Translations
const translations = {
  en: {
    title: "SMS/ZNS Analytics",
    subtitle: "Campaign performance, revenue attribution & ROI analysis",
    allChannels: "All Channels",
    smsOnly: "SMS Only",
    znsOnly: "ZNS Only",
    totalMessages: "Total Messages",
    attributedRevenue: "Attributed Revenue",
    transactions: "transactions",
    conversionRate: "Conversion Rate",
    converted: "converted",
    campaignRoi: "Campaign ROI",
    spend: "Spend",
    deliveryRate: "Delivery Rate",
    avgTransactionValue: "Avg. Transaction Value",
    costPerMessage: "Cost per Message",
    costPerConversion: "Cost per Conversion",
    smsChannel: "SMS Channel",
    brandnameSms: "Brandname SMS messages",
    znsChannel: "ZNS Channel",
    zaloNotification: "Zalo Notification Service",
    messages: "Messages",
    recipients: "Recipients",
    revenue: "Revenue",
    conversions: "Conversions",
    monthlyPerformance: "Monthly Performance",
    monthlyPerformanceDesc: "Messages, spend & revenue by month",
    month: "Month",
    total: "Total",
    roi: "ROI",
    campaignPerformance: "Campaign Performance",
    campaignPerformanceDesc: "Messages & spend by campaign type",
    revenueAttribution: "Revenue Attribution by Campaign",
    revenueAttributionDesc: "Last Touch attribution (30-day window) - Conversion Intent Only",
    campaignType: "Campaign Type",
    convRate: "Conv. Rate",
    avgOrder: "Avg Order",
    conversionIntent: "Conversion Intent",
    noConversionIntent: "No Conversion Intent",
    monthlyVolumeTrend: "Monthly Volume Trend",
    campaignPerformanceByMonth: "Campaign Performance by Month",
    campaignPerformanceByMonthDesc: "Select a campaign to view messages sent & revenue",
    allCampaigns: "All Campaigns",
    totalRevenue: "Total Revenue",
    totalConversions: "Total Conversions",
    totalSpend: "Total Spend",
    campaignSummary: "Campaign Summary",
    smsPerformance: "SMS Performance",
    znsPerformance: "ZNS Performance",
    description: "Description",
    clickToExpand: "Click to expand",
  },
  vi: {
    title: "Phân tích SMS/ZNS",
    subtitle: "Hiệu suất chiến dịch, phân bổ doanh thu & phân tích ROI",
    allChannels: "Tất cả kênh",
    smsOnly: "Chỉ SMS",
    znsOnly: "Chỉ ZNS",
    totalMessages: "Tổng tin nhắn",
    attributedRevenue: "Doanh thu phân bổ",
    transactions: "giao dịch",
    conversionRate: "Tỷ lệ chuyển đổi",
    converted: "đã chuyển đổi",
    campaignRoi: "ROI chiến dịch",
    spend: "Chi phí",
    deliveryRate: "Tỷ lệ gửi thành công",
    avgTransactionValue: "Giá trị TB/giao dịch",
    costPerMessage: "Chi phí/tin nhắn",
    costPerConversion: "Chi phí/chuyển đổi",
    smsChannel: "Kênh SMS",
    brandnameSms: "Tin nhắn SMS Brandname",
    znsChannel: "Kênh ZNS",
    zaloNotification: "Dịch vụ thông báo Zalo",
    messages: "Tin nhắn",
    recipients: "Người nhận",
    revenue: "Doanh thu",
    conversions: "Chuyển đổi",
    monthlyPerformance: "Hiệu suất theo tháng",
    monthlyPerformanceDesc: "Tin nhắn, chi phí & doanh thu theo tháng",
    month: "Tháng",
    total: "Tổng",
    roi: "ROI",
    campaignPerformance: "Hiệu suất chiến dịch",
    campaignPerformanceDesc: "Tin nhắn & chi phí theo loại chiến dịch",
    revenueAttribution: "Phân bổ doanh thu theo chiến dịch",
    revenueAttributionDesc: "Phân bổ Last Touch (30 ngày) - Chỉ chiến dịch chuyển đổi",
    campaignType: "Loại chiến dịch",
    convRate: "Tỷ lệ CĐ",
    avgOrder: "TB/đơn",
    conversionIntent: "Mục đích chuyển đổi",
    noConversionIntent: "Không có mục đích chuyển đổi",
    monthlyVolumeTrend: "Xu hướng số lượng theo tháng",
    campaignPerformanceByMonth: "Hiệu suất chiến dịch theo tháng",
    campaignPerformanceByMonthDesc: "Chọn chiến dịch để xem tin nhắn & doanh thu",
    allCampaigns: "Tất cả chiến dịch",
    totalRevenue: "Tổng doanh thu",
    totalConversions: "Tổng chuyển đổi",
    totalSpend: "Tổng chi phí",
    campaignSummary: "Tổng quan chiến dịch",
    smsPerformance: "Hiệu suất SMS",
    znsPerformance: "Hiệu suất ZNS",
    description: "Mô tả",
    clickToExpand: "Nhấn để mở rộng",
  },
};

interface MonthlyData {
  report_month: string;
  channel: string;
  total_messages: number;
  successful_messages: number;
  unique_recipients: number;
  total_cost: number;
}

interface CampaignData {
  campaign_name: string;
  message_channel: string;
  total_messages: number;
  successful_messages: number;
  unique_recipients: number;
  total_cost: number;
}

interface RevenueData {
  report_month: string;
  channel: string;
  campaign_type: string;
  conversion_intent: string;
  total_messages: number;
  matched_customers: number;
  conversions: number;
  attributed_revenue: number;
  attributed_orders: number;
}

interface CampaignMessagesData {
  report_month: string;
  channel: string;
  campaign_type: string;
  conversion_intent: string;
  total_messages: number;
  successful_messages: number;
  total_cost: number;
}

export default function SMSAnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [campaignMessagesData, setCampaignMessagesData] = useState<CampaignMessagesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [lang, setLang] = useState<"en" | "vi">("vi");
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  const t = translations[lang];

  const toggleCampaignExpand = (campaignName: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignName)) {
        newSet.delete(campaignName);
      } else {
        newSet.add(campaignName);
      }
      return newSet;
    });
  };

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch monthly summary from cache
      const { data: monthlyRaw } = await supabase
        .from("sms_monthly_stats_cache")
        .select("*")
        .order("report_month", { ascending: true });

      // Fetch campaign performance from cache
      const { data: campaignRaw } = await supabase
        .from("sms_campaign_stats_cache")
        .select("*")
        .order("total_messages", { ascending: false });

      // Fetch revenue attribution data from pre-computed cache (fast & reliable)
      const { data: revenueRaw, error: revenueError } = await supabase
        .from("sms_revenue_cache")
        .select("*")
        .order("report_month", { ascending: true });

      // Fetch campaign messages data (ALL sent messages, not just matched)
      const { data: campaignMsgsRaw } = await supabase
        .from("sms_campaign_messages_cache")
        .select("*")
        .order("report_month", { ascending: true });

      if (revenueError) {
        console.error("Revenue cache error:", revenueError);
      }

      const allRevenueData: RevenueData[] = revenueRaw || [];

      setMonthlyData(monthlyRaw || []);
      setCampaignData(campaignRaw || []);
      setRevenueData(allRevenueData);
      setCampaignMessagesData(campaignMsgsRaw || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Calculate totals
  const totals = monthlyData.reduce(
    (acc, row) => {
      acc.totalMessages += row.total_messages || 0;
      acc.successfulMessages += row.successful_messages || 0;
      acc.uniqueRecipients += row.unique_recipients || 0;
      acc.totalCost += row.total_cost || 0;
      return acc;
    },
    { totalMessages: 0, successfulMessages: 0, uniqueRecipients: 0, totalCost: 0 }
  );

  // Calculate revenue totals from attribution data (only sales intent campaigns)
  const revenueTotals = revenueData.reduce(
    (acc, row) => {
      // Only count revenue for sales intent campaigns
      if (row.conversion_intent === "sales") {
        acc.transactions += row.attributed_orders || 0;
        acc.revenue += Number(row.attributed_revenue) || 0;
        acc.converted += row.conversions || 0;
      }
      // Count all messages for total reach
      acc.matchedMessages += row.total_messages || 0;
      acc.matchedCustomers += row.matched_customers || 0;
      return acc;
    },
    { transactions: 0, revenue: 0, converted: 0, matchedMessages: 0, matchedCustomers: 0 }
  );

  // Aggregate actual sent messages by campaign type (from campaign messages cache)
  const campaignMessages = campaignMessagesData.reduce((acc, row) => {
    const key = row.campaign_type;
    if (!acc[key]) {
      acc[key] = { messages: 0, cost: 0, intent: row.conversion_intent };
    }
    acc[key].messages += row.total_messages || 0;
    acc[key].cost += Number(row.total_cost) || 0;
    return acc;
  }, {} as Record<string, { messages: number; cost: number; intent: string }>);

  // Aggregate revenue attribution by campaign type (from revenue cache)
  const campaignRevenue = revenueData.reduce((acc, row) => {
    const key = row.campaign_type;
    if (!acc[key]) {
      acc[key] = { conversions: 0, revenue: 0, orders: 0 };
    }
    acc[key].conversions += row.conversions || 0;
    acc[key].revenue += Number(row.attributed_revenue) || 0;
    acc[key].orders += row.attributed_orders || 0;
    return acc;
  }, {} as Record<string, { conversions: number; revenue: number; orders: number }>);

  // Combine actual messages with revenue attribution
  const campaignAttribution = Object.keys(campaignMessages).reduce((acc, key) => {
    acc[key] = {
      messages: campaignMessages[key]?.messages || 0,
      cost: campaignMessages[key]?.cost || 0,
      intent: campaignMessages[key]?.intent || 'none',
      conversions: campaignRevenue[key]?.conversions || 0,
      revenue: campaignRevenue[key]?.revenue || 0,
      orders: campaignRevenue[key]?.orders || 0,
    };
    return acc;
  }, {} as Record<string, { messages: number; cost: number; intent: string; conversions: number; revenue: number; orders: number }>);

  // Aggregate campaign data by channel (SMS vs ZNS) for expandable cards
  const campaignByChannel = campaignMessagesData.reduce((acc, row) => {
    const key = row.campaign_type;
    if (!acc[key]) {
      acc[key] = {
        sms: { messages: 0, cost: 0 },
        zns: { messages: 0, cost: 0 },
        intent: row.conversion_intent,
      };
    }
    if (row.channel === 'sms') {
      acc[key].sms.messages += row.total_messages || 0;
      acc[key].sms.cost += Number(row.total_cost) || 0;
    } else {
      acc[key].zns.messages += row.total_messages || 0;
      acc[key].zns.cost += Number(row.total_cost) || 0;
    }
    return acc;
  }, {} as Record<string, { sms: { messages: number; cost: number }; zns: { messages: number; cost: number }; intent: string }>);

  // Get unique months for filter (from campaign messages data for actual sent)
  const months = [...new Set(campaignMessagesData.map((d) => d.report_month))].sort();

  // Get unique campaign types for dropdown (from actual messages)
  const campaignTypes = [...new Set(campaignMessagesData.map((d) => d.campaign_type))].sort();

  // Get campaign data by month (actual sent messages + revenue from attribution)
  const getMonthlyDataForCampaign = (campaignType: string) => {
    return months.map(month => {
      // Actual messages from campaign messages cache
      const msgData = campaignMessagesData.filter(d =>
        d.report_month === month &&
        (campaignType === "all" || d.campaign_type === campaignType)
      );
      // Revenue from attribution cache
      const revData = revenueData.filter(d =>
        d.report_month === month &&
        (campaignType === "all" || d.campaign_type === campaignType)
      );
      return {
        month,
        messages: msgData.reduce((sum, d) => sum + (d.total_messages || 0), 0),
        cost: msgData.reduce((sum, d) => sum + Number(d.total_cost || 0), 0),
        revenue: revData.reduce((sum, d) => sum + Number(d.attributed_revenue || 0), 0),
        conversions: revData.reduce((sum, d) => sum + (d.conversions || 0), 0),
      };
    });
  };

  const campaignMonthlyData = getMonthlyDataForCampaign(selectedCampaign);

  // Filter data by channel
  const filteredMonthly =
    selectedChannel === "all"
      ? monthlyData
      : monthlyData.filter((d) => d.channel === selectedChannel);

  // Aggregate by channel
  const channelStats = monthlyData.reduce(
    (acc, row) => {
      const channel = row.channel === "zns" ? "zns" : "sms";
      acc[channel].messages += row.total_messages || 0;
      acc[channel].success += row.successful_messages || 0;
      acc[channel].recipients += row.unique_recipients || 0;
      acc[channel].cost += row.total_cost || 0;
      return acc;
    },
    {
      sms: { messages: 0, success: 0, recipients: 0, cost: 0 },
      zns: { messages: 0, success: 0, recipients: 0, cost: 0 },
    }
  );

  // Aggregate revenue by channel (only sales intent for revenue/conversions)
  const channelRevenue = revenueData.reduce(
    (acc, row) => {
      const channel = row.channel === "zns" ? "zns" : "sms";
      // Only count revenue for sales intent campaigns
      if (row.conversion_intent === "sales") {
        acc[channel].revenue += Number(row.attributed_revenue) || 0;
        acc[channel].conversions += row.conversions || 0;
        acc[channel].orders += row.attributed_orders || 0;
      }
      acc[channel].matched += row.total_messages || 0;
      return acc;
    },
    {
      sms: { revenue: 0, conversions: 0, orders: 0, matched: 0 },
      zns: { revenue: 0, conversions: 0, orders: 0, matched: 0 },
    }
  );

  const formatNumber = (num: number) => new Intl.NumberFormat("vi-VN").format(num);
  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(num);
  const formatMonth = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", { month: "short", year: "numeric" });
  };

  // Calculate ROI
  const roi = totals.totalCost > 0 ? ((revenueTotals.revenue - totals.totalCost) / totals.totalCost) * 100 : 0;
  const atv = revenueTotals.transactions > 0 ? revenueTotals.revenue / revenueTotals.transactions : 0;
  const conversionRate = totals.uniqueRecipients > 0 ? (revenueTotals.converted / totals.uniqueRecipients) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-slate-400">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "vi" ? "en" : "vi")}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white hover:bg-slate-700 transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">{lang === "vi" ? "VI" : "EN"}</span>
          </button>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{t.allChannels}</option>
            <option value="sms">{t.smsOnly}</option>
            <option value="zns">{t.znsOnly}</option>
          </select>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 rounded-xl p-6 border border-blue-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">{t.totalMessages}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {formatNumber(totals.totalMessages)}
              </p>
              <p className="text-blue-400 text-sm mt-1">
                {formatNumber(channelStats.sms.messages)} SMS • {formatNumber(channelStats.zns.messages)} ZNS
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-6 border border-emerald-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-300 text-sm">{t.attributedRevenue}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {formatCurrency(revenueTotals.revenue)}
              </p>
              <p className="text-emerald-400 text-sm mt-1">
                {formatNumber(revenueTotals.transactions)} {t.transactions}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">{t.conversionRate}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {conversionRate.toFixed(1)}%
              </p>
              <p className="text-purple-400 text-sm mt-1">
                {formatNumber(revenueTotals.converted)} {t.converted}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Target className="h-7 w-7 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 rounded-xl p-6 border border-orange-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">{t.campaignRoi}</p>
              <p className="text-3xl font-bold text-white mt-1">
                {roi.toFixed(0)}%
              </p>
              <p className="text-orange-400 text-sm mt-1">
                {t.spend}: {formatCurrency(totals.totalCost)}
              </p>
            </div>
            <div className="h-14 w-14 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wide">{t.deliveryRate}</p>
          <p className="text-xl font-bold text-white mt-1">
            {totals.totalMessages > 0
              ? ((totals.successfulMessages / totals.totalMessages) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wide">{t.avgTransactionValue}</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(atv)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wide">{t.costPerMessage}</p>
          <p className="text-xl font-bold text-white mt-1">
            {formatCurrency(totals.totalMessages > 0 ? totals.totalCost / totals.totalMessages : 0)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wide">{t.costPerConversion}</p>
          <p className="text-xl font-bold text-white mt-1">
            {formatCurrency(revenueTotals.converted > 0 ? totals.totalCost / revenueTotals.converted : 0)}
          </p>
        </div>
      </div>

      {/* Channel Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS Stats */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Phone className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t.smsChannel}</h3>
              <p className="text-sm text-slate-400">{t.brandnameSms}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.messages}</p>
              <p className="text-white font-bold text-lg">{formatNumber(channelStats.sms.messages)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.recipients}</p>
              <p className="text-white font-bold text-lg">{formatNumber(channelStats.sms.recipients)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.deliveryRate}</p>
              <p className="text-emerald-400 font-bold text-lg">
                {channelStats.sms.messages > 0
                  ? ((channelStats.sms.success / channelStats.sms.messages) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
              <p className="text-emerald-400 text-xs">{t.revenue}</p>
              <p className="text-emerald-400 font-bold text-lg">{formatCurrency(channelRevenue.sms.revenue)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.conversions}</p>
              <p className="text-purple-400 font-bold text-lg">{formatNumber(channelRevenue.sms.conversions)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.spend}</p>
              <p className="text-orange-400 font-bold text-lg">{formatCurrency(channelStats.sms.cost)}</p>
            </div>
          </div>
        </div>

        {/* ZNS Stats */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t.znsChannel}</h3>
              <p className="text-sm text-slate-400">{t.zaloNotification}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.messages}</p>
              <p className="text-white font-bold text-lg">{formatNumber(channelStats.zns.messages)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.recipients}</p>
              <p className="text-white font-bold text-lg">{formatNumber(channelStats.zns.recipients)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.deliveryRate}</p>
              <p className="text-emerald-400 font-bold text-lg">
                {channelStats.zns.messages > 0
                  ? ((channelStats.zns.success / channelStats.zns.messages) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
              <p className="text-emerald-400 text-xs">{t.revenue}</p>
              <p className="text-emerald-400 font-bold text-lg">{formatCurrency(channelRevenue.zns.revenue)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.conversions}</p>
              <p className="text-purple-400 font-bold text-lg">{formatNumber(channelRevenue.zns.conversions)}</p>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{t.spend}</p>
              <p className="text-orange-400 font-bold text-lg">{formatCurrency(channelStats.zns.cost)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Table */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t.monthlyPerformance}</h3>
              <p className="text-sm text-slate-400">{t.monthlyPerformanceDesc}</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">{t.month}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">SMS</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">ZNS</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.total}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.spend}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.revenue}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.roi}</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => {
                const smsData = monthlyData.find((d) => d.report_month === month && d.channel === "sms");
                const znsData = monthlyData.find((d) => d.report_month === month && d.channel === "zns");
                // Sum attributed revenue for this month from all campaigns
                const monthRevenue = revenueData
                  .filter((d) => d.report_month === month)
                  .reduce((sum, d) => sum + Number(d.attributed_revenue || 0), 0);
                const monthConversions = revenueData
                  .filter((d) => d.report_month === month)
                  .reduce((sum, d) => sum + (d.conversions || 0), 0);
                const smsCount = smsData?.total_messages || 0;
                const znsCount = znsData?.total_messages || 0;
                const totalCost = (smsData?.total_cost || 0) + (znsData?.total_cost || 0);
                const monthRoi = totalCost > 0 ? ((monthRevenue - totalCost) / totalCost) * 100 : 0;

                return (
                  <tr key={month} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white font-medium">{formatMonth(month)}</td>
                    <td className="py-3 px-4 text-right text-blue-400">{formatNumber(smsCount)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">{formatNumber(znsCount)}</td>
                    <td className="py-3 px-4 text-right text-white font-medium">{formatNumber(smsCount + znsCount)}</td>
                    <td className="py-3 px-4 text-right text-orange-400">{formatCurrency(totalCost)}</td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      {formatCurrency(monthRevenue)}
                      {monthConversions > 0 && (
                        <span className="text-xs text-slate-400 ml-1">({monthConversions})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        monthRoi > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {monthRoi > 0 ? "+" : ""}{monthRoi.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{t.campaignPerformance}</h3>
            <p className="text-sm text-slate-400">{t.campaignPerformanceDesc}</p>
          </div>
        </div>

        {/* Expandable Campaign Cards */}
        <div className="space-y-3">
          {Object.entries(campaignByChannel)
            .sort((a, b) => {
              const totalA = a[1].sms.messages + a[1].zns.messages;
              const totalB = b[1].sms.messages + b[1].zns.messages;
              return totalB - totalA;
            })
            .map(([campaignName, channelData]) => {
              const isExpanded = expandedCampaigns.has(campaignName);
              const totalMessages = channelData.sms.messages + channelData.zns.messages;
              const totalCost = channelData.sms.cost + channelData.zns.cost;
              const attribution = campaignAttribution[campaignName];
              const description = campaignDescriptions[campaignName];
              const isConversionIntent = channelData.intent === 'sales';

              return (
                <div key={campaignName} className="bg-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden">
                  {/* Header - Always visible */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => toggleCampaignExpand(campaignName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium text-lg">{campaignName}</h4>
                            {isConversionIntent ? (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                                {t.conversionIntent}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-600/50 text-slate-300 text-xs rounded">
                                {t.noConversionIntent}
                              </span>
                            )}
                          </div>
                          {description && (
                            <p className="text-slate-400 text-sm">{description[lang]}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-slate-400 text-xs">{t.messages}</p>
                            <p className="text-white font-bold">{formatNumber(totalMessages)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 text-xs">{t.spend}</p>
                            <p className="text-orange-400 font-bold">{formatCurrency(totalCost)}</p>
                          </div>
                          {attribution && attribution.revenue > 0 && (
                            <div className="text-right">
                              <p className="text-slate-400 text-xs">{t.revenue}</p>
                              <p className="text-emerald-400 font-bold">{formatCurrency(attribution.revenue)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content - SMS and ZNS breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-600/50 p-4 bg-slate-800/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* SMS Performance */}
                        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Phone className="h-4 w-4 text-blue-400" />
                            <h5 className="text-blue-400 font-medium">{t.smsPerformance}</h5>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-slate-400 text-xs">{t.messages}</p>
                              <p className="text-white font-bold text-xl">{formatNumber(channelData.sms.messages)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">{t.spend}</p>
                              <p className="text-orange-400 font-bold text-xl">{formatCurrency(channelData.sms.cost)}</p>
                            </div>
                          </div>
                          {channelData.sms.messages > 0 && (
                            <div className="mt-3 pt-3 border-t border-blue-500/20">
                              <p className="text-slate-400 text-xs">{t.costPerMessage}</p>
                              <p className="text-white font-medium">
                                {formatCurrency(channelData.sms.cost / channelData.sms.messages)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* ZNS Performance */}
                        <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="h-4 w-4 text-emerald-400" />
                            <h5 className="text-emerald-400 font-medium">{t.znsPerformance}</h5>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-slate-400 text-xs">{t.messages}</p>
                              <p className="text-white font-bold text-xl">{formatNumber(channelData.zns.messages)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">{t.spend}</p>
                              <p className="text-orange-400 font-bold text-xl">{formatCurrency(channelData.zns.cost)}</p>
                            </div>
                          </div>
                          {channelData.zns.messages > 0 && (
                            <div className="mt-3 pt-3 border-t border-emerald-500/20">
                              <p className="text-slate-400 text-xs">{t.costPerMessage}</p>
                              <p className="text-white font-medium">
                                {formatCurrency(channelData.zns.cost / channelData.zns.messages)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Revenue Attribution for this campaign */}
                      {attribution && (attribution.revenue > 0 || attribution.conversions > 0) && (
                        <div className="mt-4 pt-4 border-t border-slate-600/50">
                          <h5 className="text-white font-medium mb-3">{t.revenueAttribution}</h5>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-slate-400 text-xs">{t.conversions}</p>
                              <p className="text-purple-400 font-bold text-lg">{formatNumber(attribution.conversions)}</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-slate-400 text-xs">{t.revenue}</p>
                              <p className="text-emerald-400 font-bold text-lg">{formatCurrency(attribution.revenue)}</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-slate-400 text-xs">{t.convRate}</p>
                              <p className="text-cyan-400 font-bold text-lg">
                                {totalMessages > 0 ? ((attribution.conversions / totalMessages) * 100).toFixed(2) : 0}%
                              </p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3">
                              <p className="text-slate-400 text-xs">{t.roi}</p>
                              <p className={`font-bold text-lg ${
                                totalCost > 0 && ((attribution.revenue - totalCost) / totalCost) * 100 > 0
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}>
                                {totalCost > 0 ? (((attribution.revenue - totalCost) / totalCost) * 100).toFixed(0) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Campaign Revenue Attribution */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{t.revenueAttribution}</h3>
            <p className="text-sm text-slate-400">{t.revenueAttributionDesc}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 text-sm font-medium py-3 px-4">{t.campaignType}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.messages}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.conversions}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.convRate}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.attributedRevenue}</th>
                <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">{t.avgOrder}</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(campaignAttribution)
                .sort((a, b) => b[1].revenue - a[1].revenue)
                .map(([campaignType, data]) => {
                  const convRate = data.messages > 0 ? (data.conversions / data.messages) * 100 : 0;
                  const avgOrder = data.orders > 0 ? data.revenue / data.orders : 0;
                  const isConversionIntent = data.intent === 'sales';

                  return (
                    <tr key={campaignType} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4">
                        <span className="text-white font-medium">{campaignType}</span>
                        {isConversionIntent ? (
                          <span className="ml-2 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                            {t.conversionIntent}
                          </span>
                        ) : (
                          <span className="ml-2 px-2 py-0.5 bg-slate-600/50 text-slate-300 text-xs rounded">
                            {t.noConversionIntent}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-white">{formatNumber(data.messages)}</td>
                      <td className="py-3 px-4 text-right text-purple-400">{formatNumber(data.conversions)}</td>
                      <td className="py-3 px-4 text-right text-cyan-400">{convRate.toFixed(2)}%</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-medium">
                        {data.revenue > 0 ? formatCurrency(data.revenue) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {avgOrder > 0 ? formatCurrency(avgOrder) : '-'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Bar Chart Visualization */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">{t.monthlyVolumeTrend}</h3>
        {(() => {
          const chartHeight = 200;
          const monthlyTotals = months.map(month => {
            const smsData = campaignMessagesData.filter(d => d.report_month === month && d.channel === "sms");
            const znsData = campaignMessagesData.filter(d => d.report_month === month && d.channel === "zns");
            const smsCount = smsData.reduce((sum, d) => sum + (d.total_messages || 0), 0);
            const znsCount = znsData.reduce((sum, d) => sum + (d.total_messages || 0), 0);
            return { month, smsCount, znsCount, total: smsCount + znsCount };
          });
          const maxTotal = Math.max(...monthlyTotals.map(m => m.total), 1);

          return (
            <div className="flex items-end gap-3" style={{ height: `${chartHeight}px` }}>
              {monthlyTotals.map(({ month, smsCount, znsCount, total }) => {
                const barHeight = (total / maxTotal) * chartHeight;
                const smsHeight = total > 0 ? (smsCount / total) * barHeight : 0;
                const znsHeight = total > 0 ? (znsCount / total) * barHeight : 0;

                return (
                  <div key={month} className="flex-1 flex flex-col items-center group relative">
                    <div className="w-full flex flex-col justify-end" style={{ height: `${chartHeight}px` }}>
                      {/* ZNS on top */}
                      <div
                        className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-400"
                        style={{ height: `${znsHeight}px` }}
                      />
                      {/* SMS on bottom */}
                      <div
                        className={`w-full bg-blue-500 transition-all hover:bg-blue-400 ${znsCount === 0 ? 'rounded-t' : ''}`}
                        style={{ height: `${smsHeight}px` }}
                      />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs whitespace-nowrap z-10 shadow-xl">
                      <p className="text-white font-medium mb-1">{formatMonth(month)}</p>
                      <p className="text-blue-400">SMS: {formatNumber(smsCount)}</p>
                      <p className="text-emerald-400">ZNS: {formatNumber(znsCount)}</p>
                      <p className="text-white">Total: {formatNumber(total)}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 whitespace-nowrap">
                      {new Date(month).toLocaleDateString("vi-VN", { month: "short" })}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-slate-400">SMS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
            <span className="text-sm text-slate-400">ZNS</span>
          </div>
        </div>
      </div>

      {/* Campaign Messages & Revenue by Month Chart with Dropdown */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t.campaignPerformanceByMonth}</h3>
              <p className="text-sm text-slate-400">{t.campaignPerformanceByMonthDesc}</p>
            </div>
          </div>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[200px]"
          >
            <option value="all">{t.allCampaigns}</option>
            {campaignTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Messages Bar Chart */}
        {(() => {
          const chartHeight = 220;
          const maxMessages = Math.max(...campaignMonthlyData.map(d => d.messages), 1);

          return (
            <div className="flex items-end gap-3 mb-4" style={{ height: `${chartHeight}px` }}>
              {campaignMonthlyData.map((data) => {
                const barHeight = (data.messages / maxMessages) * chartHeight;
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center group relative">
                    <div className="w-full flex flex-col justify-end" style={{ height: `${chartHeight}px` }}>
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all hover:from-purple-500 hover:to-purple-300 cursor-pointer"
                        style={{ height: `${barHeight}px` }}
                      />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-900 border border-slate-600 rounded-lg p-3 text-xs whitespace-nowrap z-10 shadow-xl">
                      <p className="text-white font-medium mb-1">{formatMonth(data.month)}</p>
                      <p className="text-blue-400">{t.messages}: {formatNumber(data.messages)}</p>
                      <p className="text-orange-400">{t.spend}: {formatCurrency(data.cost)}</p>
                      <p className="text-emerald-400">{t.revenue}: {formatCurrency(data.revenue)}</p>
                      <p className="text-purple-400">{t.conversions}: {formatNumber(data.conversions)}</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 whitespace-nowrap">
                      {new Date(data.month).toLocaleDateString("vi-VN", { month: "short" })}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Summary Stats for Selected Campaign */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700">
          <div className="text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide">{t.totalRevenue}</p>
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(campaignMonthlyData.reduce((sum, d) => sum + d.revenue, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide">{t.totalSpend}</p>
            <p className="text-xl font-bold text-orange-400">
              {formatCurrency(campaignMonthlyData.reduce((sum, d) => sum + d.cost, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide">{t.totalMessages}</p>
            <p className="text-xl font-bold text-blue-400">
              {formatNumber(campaignMonthlyData.reduce((sum, d) => sum + d.messages, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs uppercase tracking-wide">{t.totalConversions}</p>
            <p className="text-xl font-bold text-purple-400">
              {formatNumber(campaignMonthlyData.reduce((sum, d) => sum + d.conversions, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
