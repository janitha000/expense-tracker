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

  const endPoint = dailyBurn[dailyBurn.length - 1];
  const projectedFinish = endPoint?.projectedNormal ?? kpi.normalTotal;
  const isProjectedOver = projectedFinish > baselineBudget;
  const projectedDiff = Math.abs(projectedFinish - baselineBudget);

  const oneTimePercentage =
    kpi.currentTotal > 0
      ? ((kpi.oneTimeTotal / kpi.currentTotal) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-4 sm:space-y-6 pb-24">
      {/* 1. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Card 1: Total Spend */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 sm:p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Spend
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
            {formatCurrency(kpi.currentTotal)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            <span>Avg: {formatCurrency(kpi.dailyAverage)}/d</span>
            <span className="text-slate-400 dark:text-slate-500">D{kpi.currentDay}/{kpi.daysInMonth}</span>
          </div>
        </div>

        {/* Card 2: Normal vs Budget */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 sm:p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Normal Spend
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
            {formatCurrency(kpi.normalTotal)}
          </div>
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] mb-1">
              <span className={kpi.isOverBudget ? "text-red-500 dark:text-red-400 font-semibold" : "text-emerald-600 dark:text-emerald-400 font-medium"}>
                {kpi.normalBudgetPct}%
              </span>
              <span className="text-slate-400 truncate">Lim: {formatCompactCurrency(kpi.baselineBudget)}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

        {/* Card 3: One-Time Spikes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 sm:p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              1-Time Spikes
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-1.5 text-lg sm:text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400 truncate">
            {formatCurrency(kpi.oneTimeTotal)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
            <span>{oneTimePercentage}% of spend</span>
            <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[9px] text-amber-600 dark:text-amber-300">
              Spike
            </span>
          </div>
        </div>

        {/* Card 4: MoM Change */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 sm:p-4 shadow-sm transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              MoM Change
            </span>
            <div
              className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl ${
                kpi.momChangePct !== null && kpi.momChangePct > 0
                  ? "bg-rose-500/10 text-rose-500 dark:text-rose-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {kpi.momChangePct !== null && kpi.momChangePct > 0 ? (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </div>
          </div>

          <div className="mt-1.5 text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
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
              <span className="text-xs text-slate-400 font-normal">No prior data</span>
            )}
          </div>

          <div className="mt-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
            Prior: {formatCompactCurrency(kpi.prevMonthTotal)}
          </div>
        </div>
      </div>

      {/* 2. DAILY LIVING EXPENSES BURN RATE & PACED PROJECTION */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 sm:p-5 shadow-sm transition-colors space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              Daily Living Burn Rate & Forecast
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Actual living spend (one-time excluded) vs. Paced Forecast & Target Pace
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Actual Spend</span>
            </div>
            <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
              <div className="h-0.5 w-3 border-t-2 border-dashed border-purple-500" />
              <span>Forecast Pace</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <div className="h-0.5 w-2.5 border-t border-dotted border-slate-400 dark:border-slate-500" />
              <span>Target Pace</span>
            </div>
            <div
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                isProjectedOver
                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              }`}
            >
              Forecast: {formatCompactCurrency(projectedFinish)} (
              {isProjectedOver ? `+${formatCompactCurrency(projectedDiff)} over` : `-${formatCompactCurrency(projectedDiff)} under`}
              )
            </div>
          </div>
        </div>

        {/* Full-width Responsive Chart Container */}
        <div className="h-60 sm:h-64 w-full -mx-1 sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyBurn} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis
                dataKey="day"
                stroke={isDark ? "#64748b" : "#94a3b8"}
                tick={{ fontSize: 9 }}
                tickFormatter={(val) => `${val}`}
                interval="preserveStartEnd"
              />
              <YAxis
                width={48}
                stroke={isDark ? "#64748b" : "#94a3b8"}
                tick={{ fontSize: 9 }}
                tickFormatter={(val) => formatCompactCurrency(Number(val))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderColor: isDark ? "#334155" : "#e2e8f0",
                  borderRadius: "12px",
                  fontSize: "11px",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: any, name: any) => {
                  const num = Number(value);
                  if (isNaN(num) || value === null) return ["-", name];
                  const label =
                    name === "cumulativeNormal"
                      ? "Actual Spend (Normal)"
                      : name === "projectedNormal"
                      ? "Paced Forecast Trajectory"
                      : "Target Budget Pace";
                  return [formatCurrency(num), label];
                }}
                labelFormatter={(label) => `Day ${label} (${format(currentDate, "MMM yyyy")})`}
              />
              <ReferenceLine
                y={baselineBudget}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `Limit: ${formatCompactCurrency(baselineBudget)}`,
                  position: "insideTopRight",
                  fill: "#f43f5e",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              {/* Actual living spend area */}
              <Area
                type="monotone"
                dataKey="cumulativeNormal"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorNormal)"
                connectNulls={false}
              />
              {/* Intelligent Paced Forecast Line */}
              <Area
                type="monotone"
                dataKey="projectedNormal"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
                connectNulls={false}
              />
              {/* Target Budget Pace Benchmark */}
              <Area
                type="monotone"
                dataKey="targetBudgetPace"
                stroke={isDark ? "#64748b" : "#94a3b8"}
                strokeDasharray="2 2"
                strokeWidth={1.5}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. TWO COLUMN ROW: Category Donut & 6-Month Stacked Trend (Optimized Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Category Breakdown (Donut Chart) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 sm:p-5 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PieIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                Category Distribution
              </h3>

              {/* Toggle Segment */}
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setDonutFilter("all")}
                  className={`rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-medium transition-all ${
                    donutFilter === "all"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDonutFilter("normal")}
                  className={`rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-medium transition-all ${
                    donutFilter === "normal"
                      ? "bg-blue-600 text-white font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setDonutFilter("one_time")}
                  className={`rounded-lg px-2 py-0.5 text-[10px] sm:text-[11px] font-medium transition-all ${
                    donutFilter === "one_time"
                      ? "bg-amber-600 text-white font-semibold"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  1-Time
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Breakdown by category for {donutFilter === "all" ? "all" : donutFilter} spending
            </p>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              No expenses recorded in this view
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={70}
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
                        fontSize: "11px",
                        color: isDark ? "#f8fafc" : "#0f172a",
                      }}
                      formatter={(val: any) => [formatCurrency(Number(val)), "Spend"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend List */}
              <div className="flex-1 w-full space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate text-[11px] sm:text-xs">
                        {cat.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                        {formatCurrency(cat.total)}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 block font-normal">
                        {cat.percentage}% ({cat.count})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly Trend (Stacked Bar Chart: 6 Months - Maximized Width) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 sm:p-5 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                6-Month Trend (Stacked)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Normal base vs One-Time spikes
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <span className="h-2 w-2 rounded-sm bg-blue-500" /> Normal
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-sm bg-amber-500" /> 1-Time
              </span>
            </div>
          </div>

          <div className="h-52 sm:h-56 w-full -mx-1 sm:mx-0 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                <XAxis dataKey="label" stroke={isDark ? "#64748b" : "#94a3b8"} tick={{ fontSize: 10 }} />
                <YAxis
                  width={48}
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  tick={{ fontSize: 9 }}
                  tickFormatter={(val) => formatCompactCurrency(Number(val))}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#0f172a" : "#ffffff",
                    borderColor: isDark ? "#334155" : "#e2e8f0",
                    borderRadius: "12px",
                    fontSize: "11px",
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
