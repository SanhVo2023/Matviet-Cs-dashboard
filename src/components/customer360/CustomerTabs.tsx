"use client";

import { useState } from "react";
import {
  User,
  Clock,
  ShoppingCart,
  BarChart3,
  MessageSquare,
} from "lucide-react";

export type TabId = "profile" | "timeline" | "purchases" | "analytics" | "communications";

interface Tab {
  id: TabId;
  label: string;
  labelVi: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "profile", label: "Profile", labelVi: "Hồ sơ", icon: User },
  { id: "timeline", label: "Timeline", labelVi: "Dòng thời gian", icon: Clock },
  { id: "purchases", label: "Purchases", labelVi: "Đơn hàng", icon: ShoppingCart },
  { id: "analytics", label: "Analytics", labelVi: "Phân tích", icon: BarChart3 },
  { id: "communications", label: "Communications", labelVi: "Tin nhắn", icon: MessageSquare },
];

interface CustomerTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  language?: "vi" | "en";
}

export function CustomerTabs({ activeTab, onTabChange, language = "vi" }: CustomerTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-200 whitespace-nowrap
              ${isActive
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span>{language === "vi" ? tab.labelVi : tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Tab content wrapper for consistent styling
interface TabContentProps {
  children: React.ReactNode;
  isActive: boolean;
}

export function TabContent({ children, isActive }: TabContentProps) {
  if (!isActive) return null;
  return <div className="mt-6 animate-in fade-in duration-200">{children}</div>;
}
