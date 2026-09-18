"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
  Sparkles,
  Database,
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

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
  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentDate, 1));
  };

  const isCurrentMonthNow =
    format(currentDate, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Mode */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Wallet className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                Budget<span className="text-blue-400">Flow</span>
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isLiveDb
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                }`}
                title={isLiveDb ? "Connected to Neon PostgreSQL" : "Local Demo Storage"}
              >
                <Database className="h-2.5 w-2.5" />
                {isLiveDb ? "Neon PG" : "Demo Store"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Normal vs. One-Time Expense Tracker
            </p>
          </div>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1 shadow-inner">
          <button
            onClick={handlePrevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="px-2 text-center min-w-[110px]">
            <div className="text-xs font-semibold text-slate-200">
              {format(currentDate, "MMMM yyyy")}
            </div>
            {isCurrentMonthNow && (
              <span className="text-[10px] font-medium text-blue-400 flex items-center justify-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> Current
              </span>
            )}
          </div>

          <button
            onClick={handleNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop Quick Add Action */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
}
