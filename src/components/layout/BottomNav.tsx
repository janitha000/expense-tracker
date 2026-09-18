"use client";

import React from "react";
import {
  LayoutDashboard,
  ReceiptText,
  Target,
  Tags,
  Settings,
  Plus,
} from "lucide-react";

export type NavTab = "dashboard" | "expenses" | "budgets" | "categories" | "settings";

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
  const leftTabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "expenses", label: "Expenses", icon: ReceiptText },
  ];

  const rightTabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "budgets", label: "Budgets", icon: Target },
    { id: "categories", label: "Categories", icon: Tags },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 pb-safe backdrop-blur-xl transition-colors">
      <div className="mx-auto flex max-w-lg items-center justify-between px-2 py-1.5 sm:px-4">
        {/* Left Tabs */}
        <div className="flex items-center justify-around flex-1">
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 transition-all ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                    isActive ? "bg-blue-500/15" : ""
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                </div>
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Floating Action Button (+) */}
        <div className="flex flex-col items-center justify-center px-1 -mt-5">
          <button
            onClick={onOpenAddExpense}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 text-white shadow-xl shadow-blue-500/30 ring-4 ring-white dark:ring-slate-950 hover:scale-105 active:scale-95 transition-all"
            aria-label="Add new expense"
          >
            <Plus className="h-6 w-6 stroke-[2.5]" />
          </button>
          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Add</span>
        </div>

        {/* Right Tabs */}
        <div className="flex items-center justify-around flex-1">
          {rightTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 transition-all ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                    isActive ? "bg-blue-500/15" : ""
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                </div>
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
