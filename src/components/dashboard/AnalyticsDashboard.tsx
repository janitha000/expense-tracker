"use client";

import React, { useState } from "react";
import {
  ExpenseWithCategory,
  KPISummary,
  ParentType,
} from "@/lib/types";
import {
  computeKPISummary,
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeDailyBurnRate,
} from "@/lib/calculations";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { useTheme } from "@/context/ThemeContext";

interface AnalyticsDashboardProps {
  currentMonthExpenses: ExpenseWithCategory[];
  previousMonthExpenses: ExpenseWithCategory[];
  allExpenses: ExpenseWithCategory[];
  currentDate: Date;
  baselineBudget: number;
}

export function AnalyticsDashboard({
  currentMonthExpenses,
  previousMonthExpenses,
  allExpenses,
  currentDate,
  baselineBudget,
}: AnalyticsDashboardProps) {
  const [donutFilter, setDonutFilter] = useState<"all" | ParentType>("all");
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const kpi: KPISummary = computeKPISummary(
    currentMonthExpenses,
    previousMonthExpenses,
    currentDate,
    baselineBudget
  );

  const categoryData = computeCategoryBreakdown(currentMonthExpenses, donutFilter);
  const monthlyTrend = computeMonthlyTrend(allExpenses, currentDate, 6);
  const dailyBurn = computeDailyBurnRate(currentMonthExpenses, currentDate, baselineBudget);

  const oneTimePercentage =
    kpi.currentTotal > 0
      ? ((kpi.oneTimeTotal / kpi.currentTotal) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 pb-24">
      {/* 1. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Spend */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-4 shadow-md transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Spend
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(kpi.currentTotal)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Daily avg: {formatCurrency(kpi.dailyAverage)}</span>
            <span className="text-slate-400 dark:text-slate-500">Day {kpi.currentDay} of {kpi.daysInMonth}</span>
          </div>
        </div>

        {/* Card 2: Normal Expenses vs Baseline Budget */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-4 shadow-md transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Normal vs Budget
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-baseline gap-1.5">
            <span>{formatCurrency(kpi.normalTotal)}</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              / {formatCurrency(kpi.baselineBudget)}
            </span>
          </div>

          {/* Budget Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className={kpi.isOverBudget ? "text-red-500 dark:text-red-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-medium"}>
                {kpi.normalBudgetPct}% of baseline
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                {kpi.isOverBudget ? "Over budget" : "Within budget"}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  kpi.isOverBudget
                    ? "bg-gradient-to-r from-red-500 to-rose-600"
                    : kpi.normalBudgetPct > 85
                    ? "bg-gradient-to-r from-amber-500 to-orange-500"
                    : "bg-gradient-to-r from-emerald-500 to-teal-400"
                }`}
                style={{ width: `${Math.min(kpi.normalBudgetPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: One-Time Expenses */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-4 shadow-md transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              One-Time Spikes
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
            {formatCurrency(kpi.oneTimeTotal)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{oneTimePercentage}% of total spend</span>
            <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-300">
              Discretionary
            </span>
          </div>
        </div>

        {/* Card 4: Month-over-Month Change */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 p-4 shadow-md transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              MoM Change
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                kpi.momChangePct !== null && kpi.momChangePct > 0
                  ? "bg-rose-500/10 text-rose-500 dark:text-rose-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {kpi.momChangePct !== null && kpi.momChangePct > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          </div>

          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            {kpi.momChangePct !== null ? (
              <span
                className={
                  kpi.momChangePct > 0
                    ? "text-rose-500 dark:text-rose-400"
                    : kpi.momChangePct < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-700 dark:text-slate-200"
                }
              >
                {kpi.momChangePct > 0 ? `+${kpi.momChangePct}%` : `${kpi.momChangePct}%`}
              </span>
            ) : (
              <span className="text-sm text-slate-400 font-normal">No prior data</span>
            )}
          </div>

          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Prev month: {formatCurrency(kpi.prevMonthTotal)}
          </div>
        </div>
      </div>

      {/* 2. DAILY CUMULATIVE BURN RATE (Area Chart) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              Daily Cumulative Burn Rate
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Normal run-rate vs Total spend with ideal linear budget benchmark
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>Total (with 1-time)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <div className="h-0.5 w-3 border-t border-dashed border-slate-400 dark:border-slate-500" />
              <span>Ideal Pace</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyBurn} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis
                dataKey="day"
                stroke={isDark ? "#64748b" : "#94a3b8"}
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `D${val}`}
              />
              <YAxis
                stroke={isDark ? "#64748b" : "#94a3b8"}
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => formatCompactCurrency(Number(val))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any, name: any) => {
                  const num = Number(value) || 0;
                  const label =
                    name === "cumulativeTotal"
                      ? "Total Cumulative"
                      : name === "cumulativeNormal"
                      ? "Normal Cumulative"
                      : "Ideal Linear Pace";
                  return [formatCurrency(num), label];
                }}
                labelFormatter={(label) => `Day ${label} (${format(currentDate, "MMM yyyy")})`}
              />
              <Area
                type="monotone"
                dataKey="cumulativeTotal"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
              <Area
                type="monotone"
                dataKey="cumulativeNormal"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorNormal)"
              />
              <Area
                type="monotone"
                dataKey="idealBaseline"
                stroke={isDark ? "#64748b" : "#94a3b8"}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. TWO COLUMN ROW: Category Donut & 6-Month Stacked Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Donut Chart) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                Category Distribution
              </h3>

              {/* Toggle Segment */}
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setDonutFilter("all")}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
                    donutFilter === "all"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDonutFilter("normal")}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
                    donutFilter === "normal"
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setDonutFilter("one_time")}
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
                    donutFilter === "one_time"
                      ? "bg-amber-600 text-white font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  One-Time
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Breakdown by category for {donutFilter === "all" ? "all" : donutFilter} spending
            </p>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-xs text-slate-400">
              No expenses recorded in this view
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color || "#3B82F6"} stroke={isDark ? "#0f172a" : "#ffffff"} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#0f172a" : "#ffffff",
                        borderColor: isDark ? "#334155" : "#e2e8f0",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: isDark ? "#f8fafc" : "#0f172a",
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val)), "Spend"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend List */}
              <div className="flex-1 w-full space-y-2 max-h-52 overflow-y-auto pr-1">
                {categoryData.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between text-xs rounded-xl bg-slate-50 dark:bg-slate-950/40 p-2 border border-slate-200 dark:border-slate-800/60"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        <DynamicIcon name={cat.icon} className="h-3 w-3" />
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{cat.name}</span>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(cat.total)}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-normal">
                        {cat.percentage}% ({cat.count})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Trend (Stacked Bar Chart: 6 Months) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                6-Month Trend (Stacked)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Normal base vs One-Time spikes over time
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="h-2 w-2 rounded-sm bg-blue-500" /> Normal
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-sm bg-amber-500" /> One-Time
              </span>
            </div>
          </div>

          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                <XAxis dataKey="label" stroke={isDark ? "#64748b" : "#94a3b8"} tick={{ fontSize: 11 }} />
                <YAxis
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => formatCompactCurrency(Number(val))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                  formatter={(value: any, name: any) => {
                    const label = name === "normal" ? "Normal Base" : "One-Time Spike";
                    return [formatCurrency(Number(value)), label];
                  }}
                />
                <Bar dataKey="normal" stackId="spend" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="oneTime" stackId="spend" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
