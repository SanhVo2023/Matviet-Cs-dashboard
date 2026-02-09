"use client";

import { useState, useEffect } from "react";
import Sidebar, { MobileMenuButton } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto relative">
        {/* Mobile menu button */}
        <MobileMenuButton onClick={() => setSidebarOpen(true)} />

        {/* Content with responsive padding */}
        <div className="p-4 pt-16 lg:pt-4 lg:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
