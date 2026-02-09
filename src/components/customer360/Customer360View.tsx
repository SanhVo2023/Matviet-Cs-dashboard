"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CustomerTabs, TabContent, type TabId } from "./CustomerTabs";
import { CustomerHeader } from "./CustomerHeader";
import { ProfileTab } from "./tabs/ProfileTab";
import { TimelineTab } from "./tabs/TimelineTab";
import { PurchasesTab } from "./tabs/PurchasesTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { CommunicationsTab } from "./tabs/CommunicationsTab";

interface Customer360ViewProps {
  customer: any;
  orders: any[];
  npsResponses: any[];
  timelineEvents: any[];
  messages: any[];
  healthScore: any;
  preferences: any;
  segmentMemberships: any[];
  spendingTrend: { date: string; value: number }[];
  categoryData: { name: string; value: number }[];
  storeData: { name: string; value: number }[];
  paymentData: { name: string; value: number }[];
  topProducts: { name: string; total: number; count: number }[];
  orderItems: any[];
  avgOrderValue: number;
  daysSinceLastPurchase: number | null;
  latestNPS: number | null;
  avgNPS: number | null;
  language?: "vi" | "en";
}

// Inner component that uses useSearchParams
function Customer360Inner(props: Customer360ViewProps & { initialTab?: TabId }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromUrl = searchParams?.get("tab") as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl || props.initialTab || "profile");

  // Update URL when tab changes
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("tab", tab);
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  };

  // Sync with URL on mount
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const { customer, orders, npsResponses, timelineEvents, messages, healthScore, preferences, segmentMemberships, spendingTrend, categoryData, storeData, paymentData, topProducts, orderItems, avgOrderValue, daysSinceLastPurchase, latestNPS, avgNPS, language = "vi" } = props;

  return (
    <div className="space-y-6">
      {/* Header */}
      <CustomerHeader customer={customer} language={language} />

      {/* Tab Navigation */}
      <CustomerTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        language={language}
      />

      {/* Tab Content */}
      <TabContent isActive={activeTab === "profile"}>
        <ProfileTab
          customer={customer}
          healthScore={healthScore}
          segmentMemberships={segmentMemberships}
          avgOrderValue={avgOrderValue}
          daysSinceLastPurchase={daysSinceLastPurchase}
          latestNPS={latestNPS}
          language={language}
        />
      </TabContent>

      <TabContent isActive={activeTab === "timeline"}>
        <TimelineTab events={timelineEvents} language={language} />
      </TabContent>

      <TabContent isActive={activeTab === "purchases"}>
        <PurchasesTab
          orders={orders}
          spendingTrend={spendingTrend}
          categoryData={categoryData}
          storeData={storeData}
          paymentData={paymentData}
          topProducts={topProducts}
          language={language}
        />
      </TabContent>

      <TabContent isActive={activeTab === "analytics"}>
        <AnalyticsTab
          customer={customer}
          spendingTrend={spendingTrend}
          orderItems={orderItems}
          daysSinceLastPurchase={daysSinceLastPurchase}
          avgNPS={avgNPS}
          language={language}
        />
      </TabContent>

      <TabContent isActive={activeTab === "communications"}>
        <CommunicationsTab
          messages={messages}
          preferences={preferences}
          language={language}
        />
      </TabContent>
    </div>
  );
}

export function Customer360View(props: Customer360ViewProps) {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <CustomerHeader customer={props.customer} language={props.language} />
        <div className="h-12 bg-slate-800/50 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-800/50 rounded-xl animate-pulse" />
      </div>
    }>
      <Customer360Inner {...props} />
    </Suspense>
  );
}
