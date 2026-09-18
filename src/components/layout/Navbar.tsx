"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
  Sparkles,
  Database,
  Lock,
  Sun,
  Moon,
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

interface NavbarProps {
  currentDate: Date;
  onMonthChange: (newDate: Date) => void;
  onOpenAddExpense: () => void;
  isLiveDb: boolean;
}

export function Navbar({
  currentDate,
  onMonthChange,
  onOpenAddExpense,
  isLiveDb,
}: NavbarProps) {
  const { isPinEnabled, lockNow } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentDate, 1));
  };

  const isCurrentMonthNow =
    format(currentDate, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg transition-colors">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2.5 sm:px-6">
        {/* Brand (Hidden on Mobile for clean uncluttered header, visible on Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 shadow-md shadow-blue-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-white dark:bg-slate-950">
              <Wallet className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Budget<span className="text-blue-500 dark:text-blue-400">Flow</span>
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                  isLiveDb
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                }`}
              >
                <Database className="h-2 w-2" />
                {isLiveDb ? "Neon" : "Demo"}
              </span>
            </div>
          </div>
        </div>

        {/* Month Selector Controls (Full prominent width on mobile) */}
        <div className="flex flex-1 md:flex-initial items-center justify-between md:justify-center gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-1 shadow-sm max-w-xs sm:max-w-none">
          <button
            onClick={handlePrevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>

          <div className="px-3 text-center flex-1 sm:min-w-[130px]">
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {format(currentDate, "MMMM yyyy")}
            </div>
            {isCurrentMonthNow && (
              <span className="text-[9px] sm:text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Current Month
              </span>
            )}
          </div>

          <button
            onClick={handleNextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Actions: Theme Toggle, Lock & Desktop Quick Add */}
        <div className="flex items-center gap-1.5 pl-2">
          {/* Dark / Light Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shadow-sm"
            title={resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500 transition-transform rotate-0 hover:-rotate-12" />
            )}
          </button>

          {isPinEnabled && (
            <button
              onClick={lockNow}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shadow-sm"
              title="Lock App Now"
              aria-label="Lock App Now"
            >
              <Lock className="h-4 w-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center pl-1">
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
