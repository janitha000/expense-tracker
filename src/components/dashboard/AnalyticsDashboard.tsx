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
import { AISummaryCard } from "@/components/dashboard/AISummaryCard";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  Coins,
  ShieldCheck,
  Layers,
  Save,
  Check,
  Loader2,
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
import { format, subMonths } from "date-fns";
import { useTheme } from "@/context/ThemeContext";

interface AnalyticsDashboardProps {
  currentMonthExpenses: ExpenseWithCategory[];
  previousMonthExpenses: ExpenseWithCategory[];
  allExpenses: ExpenseWithCategory[];
  currentDate: Date;
  baselineBudget: number;
  passiveIncome?: number;
  onUpdatePassiveIncome?: (amount: number) => Promise<void>;
}

export function AnalyticsDashboard({
  currentMonthExpenses,
  previousMonthExpenses,
  allExpenses,
  currentDate,
  baselineBudget,
  passiveIncome = 0,
  onUpdatePassiveIncome,
}: AnalyticsDashboardProps) {
  const [donutFilter, setDonutFilter] = useState<"all" | ParentType>("all");
  const [passiveInput, setPassiveInput] = useState<string>(
    passiveIncome > 0 ? String(passiveIncome) : ""
  );
  const [isSavingPassive, setIsSavingPassive] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  // Sync input when passiveIncome or month changes
  React.useEffect(() => {
    setPassiveInput(passiveIncome > 0 ? String(passiveIncome) : "");
    setSaveSuccess(false);
  }, [passiveIncome, currentDate]);

  const handleSavePassive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(passiveInput);
    const validAmount = isNaN(num) || num < 0 ? 0 : num;
    setIsSavingPassive(true);
    try {
      if (onUpdatePassiveIncome) {
        await onUpdatePassiveIncome(validAmount);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Error saving passive income:", err);
    } finally {
      setIsSavingPassive(false);
    }
  };

  const kpi: KPISummary = computeKPISummary(
    currentMonthExpenses,
    previousMonthExpenses,
    currentDate,
    baselineBudget
  );

  const categoryData = computeCategoryBreakdown(currentMonthExpenses, donutFilter);
  const monthlyTrend = computeMonthlyTrend(allExpenses, currentDate, 6);
  const dailyBurn = computeDailyBurnRate(
    currentMonthExpenses,
    previousMonthExpenses,
    currentDate,
    baselineBudget
  );

  const endPoint = dailyBurn[dailyBurn.length - 1];
  const projectedFinish = endPoint?.projectedNormal ?? kpi.normalTotal;
  const isProjectedOver = projectedFinish > baselineBudget;
  const projectedDiff = Math.abs(projectedFinish - baselineBudget);

  const oneTimePercentage =
    kpi.currentTotal > 0
      ? ((kpi.oneTimeTotal / kpi.currentTotal) * 100).toFixed(1)
      : "0";

  const currentPI = Number(passiveIncome) || 0;
  const normalExpenses = kpi.normalTotal;
  const totalExpenses = kpi.currentTotal;

  const diffNormal = currentPI - normalExpenses;
  const isNormalCovered = currentPI >= normalExpenses && currentPI > 0;
  const coveragePctNormal = normalExpenses > 0 ? Number(((currentPI / normalExpenses) * 100).toFixed(1)) : (currentPI > 0 ? 100 : 0);

  const diffTotal = currentPI - totalExpenses;
  const isTotalCovered = currentPI >= totalExpenses && currentPI > 0;
  const coveragePctTotal = totalExpenses > 0 ? Number(((currentPI / totalExpenses) * 100).toFixed(1)) : (currentPI > 0 ? 100 : 0);

  const passiveComparisonChartData = [
    {
      category: "Without Spikes (Living)",
      shortName: "Living Spend",
      expenses: normalExpenses,
      passiveIncome: currentPI,
      diff: diffNormal,
      isCovered: currentPI >= normalExpenses,
      coveragePct: coveragePctNormal,
    },
    {
      category: "With Spikes (Total)",
      shortName: "Total Spend",
      expenses: totalExpenses,
      passiveIncome: currentPI,
      diff: diffTotal,
      isCovered: currentPI >= totalExpenses,
      coveragePct: coveragePctTotal,
    },
  ];

  const aiSummaryData = {
    monthKey: format(currentDate, "yyyy-MM"),
    formattedMonth: format(currentDate, "MMMM yyyy"),
    currentTotal: kpi.currentTotal,
    normalTotal: kpi.normalTotal,
    oneTimeTotal: kpi.oneTimeTotal,
    baselineBudget: kpi.baselineBudget,
    dailyAverage: kpi.dailyAverage,
    currentDay: kpi.currentDay,
    daysInMonth: kpi.daysInMonth,
    momChangePct: kpi.momChangePct,
    prevMonthTotal: kpi.prevMonthTotal,
    passiveIncome: currentPI,
    topCategories: categoryData.map((c) => ({
      name: c.name,
      total: c.total,
      percentage: c.percentage,
    })),
    projectedFinish,
  };

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

          <div
            className="mt-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate"
            title={`Prior month normal spend up to Day ${kpi.currentDay}: ${formatCurrency(kpi.prevMonthTotal)} (one-time spikes excluded)`}
          >
            Prior{kpi.currentDay < kpi.daysInMonth ? ` (D${kpi.currentDay})` : ""}: {formatCompactCurrency(kpi.prevMonthTotal)}
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
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
              <div className="h-0.5 w-3 border-t-2 border-dashed border-slate-500 dark:border-slate-400" />
              <span>Prev Month</span>
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
                  const label =
                    name === "cumulativeNormal"
                      ? "Actual Spend (Normal)"
                      : name === "projectedNormal"
                      ? "Paced Forecast Trajectory"
                      : name === "prevCumulativeNormal"
                      ? `Prev Month (${format(subMonths(currentDate, 1), "MMM")})`
                      : "Target Budget Pace";
                  if (isNaN(num) || value === null) return ["-", label];
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
              {/* Previous month reference line (normal living spend only) */}
              <Area
                type="monotone"
                dataKey="prevCumulativeNormal"
                stroke={isDark ? "#94a3b8" : "#64748b"}
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="none"
                connectNulls={true}
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

      {/* 4. PASSIVE INCOME VS EXPENSES */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-3.5 sm:p-5 shadow-sm transition-colors space-y-4">
        {/* Header with Title and Manual Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              Passive Income vs. Actual Expenses
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Check whether your passive income covers living needs and total spending for {format(currentDate, "MMMM yyyy")}
            </p>
          </div>

          {/* Manual Input for This Month's Passive Income */}
          <form onSubmit={handleSavePassive} className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="hidden sm:inline text-[11px] text-slate-400 font-normal">Monthly Passive Income:</span>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs font-semibold text-slate-400 select-none">
                  Rs.
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={passiveInput}
                  onChange={(e) => setPassiveInput(e.target.value)}
                  className="h-8 w-28 sm:w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-8 pr-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                  aria-label="Passive income for current month"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSavingPassive}
              className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center gap-1 shrink-0 disabled:opacity-50"
              title="Save passive income for this month"
            >
              {isSavingPassive ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* 2 Category Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Category 1: Without One-Time Spikes (Core Living Spend) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span>Living Spend (Without Spikes)</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  currentPI === 0
                    ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    : isNormalCovered
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                }`}
              >
                {currentPI === 0
                  ? "No Income Set"
                  : isNormalCovered
                  ? `Surplus: +${formatCompactCurrency(diffNormal)}`
                  : `Deficit: -${formatCompactCurrency(Math.abs(diffNormal))}`}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Actual Normal Spend</span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrency(normalExpenses)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Passive Income</span>
                <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(currentPI)}
                </span>
              </div>
            </div>

            {/* Coverage Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span>Coverage</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {coveragePctNormal}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isNormalCovered
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : coveragePctNormal >= 75
                      ? "bg-gradient-to-r from-amber-500 to-orange-400"
                      : "bg-gradient-to-r from-rose-500 to-red-500"
                  }`}
                  style={{ width: `${Math.min(coveragePctNormal, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Category 2: With One-Time Spikes (Total Spend) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3 sm:p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Layers className="h-4 w-4 text-amber-500" />
                <span>Total Spend (With Spikes)</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  currentPI === 0
                    ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    : isTotalCovered
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                }`}
              >
                {currentPI === 0
                  ? "No Income Set"
                  : isTotalCovered
                  ? `Surplus: +${formatCompactCurrency(diffTotal)}`
                  : `Deficit: -${formatCompactCurrency(Math.abs(diffTotal))}`}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Total Spend (inc. Spikes)</span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Passive Income</span>
                <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(currentPI)}
                </span>
              </div>
            </div>

            {/* Coverage Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                <span>Coverage</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {coveragePctTotal}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isTotalCovered
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : coveragePctTotal >= 75
                      ? "bg-gradient-to-r from-amber-500 to-orange-400"
                      : "bg-gradient-to-r from-rose-500 to-red-500"
                  }`}
                  style={{ width: `${Math.min(coveragePctTotal, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grouped Comparison Chart */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Coverage Comparison Bar Chart
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                <span className="h-2 w-2 rounded-sm bg-blue-500" /> Expenses
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Passive Income
              </span>
            </div>
          </div>

          <div className="h-56 sm:h-60 w-full -mx-1 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={passiveComparisonChartData}
                margin={{ top: 16, right: 12, left: -20, bottom: 4 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke={isDark ? "#64748b" : "#94a3b8"}
                  tick={{ fontSize: 10, fontWeight: 500 }}
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
                    const label = name === "expenses" ? "Actual Expenses" : "Passive Income";
                    return [formatCurrency(num), label];
                  }}
                />
                <Bar
                  dataKey="expenses"
                  name="expenses"
                  fill="#3b82f6"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={44}
                />
                <Bar
                  dataKey="passiveIncome"
                  name="passiveIncome"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={44}
                />
                {currentPI > 0 && (
                  <ReferenceLine
                    y={currentPI}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Target: ${formatCompactCurrency(currentPI)}`,
                      position: "insideTopRight",
                      fill: "#10b981",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. MONTHLY AI FINANCIAL SUMMARY (CHROME GEMINI NANO ON-DEVICE) */}
      <AISummaryCard summaryData={aiSummaryData} />
    </div>
  );
}
