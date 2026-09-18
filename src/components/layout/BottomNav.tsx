"use client";

import React from "react";
import { LayoutDashboard, ReceiptText, Tags, Settings, Plus } from "lucide-react";

export type NavTab = "dashboard" | "expenses" | "categories" | "settings";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
}

export function BottomNav({
  activeTab,
  onTabChange,
  onOpenAddExpense,
}: BottomNavProps) {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: ReceiptText },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-950/90 pb-safe backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {/* Left Tabs */}
        {tabs.slice(0, 2).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? "text-blue-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  isActive ? "bg-blue-500/15" : ""
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}

        {/* Center Floating Action Button (+) */}
        <div className="flex flex-col items-center justify-center px-1 -mt-6">
          <button
            onClick={onOpenAddExpense}
            className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 text-white shadow-xl shadow-blue-500/30 ring-4 ring-slate-950 hover:scale-105 active:scale-95 transition-all"
            aria-label="Add new expense"
          >
            <Plus className="h-7 w-7 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-medium text-slate-400 mt-1">Add</span>
        </div>

        {/* Right Tabs */}
        {tabs.slice(2, 4).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? "text-blue-400 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  isActive ? "bg-blue-500/15" : ""
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              </div>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
