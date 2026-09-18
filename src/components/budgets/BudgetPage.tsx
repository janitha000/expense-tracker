"use client";

import React, { useState } from "react";
import {
  Category,
  CategoryBudget,
  CategoryBudgetProgress,
  BudgetStatus,
  ExpenseWithCategory,
} from "@/lib/types";
import { computeCategoryBudgetProgress } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Edit2,
  Sparkles,
  Calendar,
  X,
  Check,
} from "lucide-react";
import { format } from "date-fns";
import confetti from "canvas-confetti";

interface BudgetPageProps {
  categories: Category[];
  expenses: ExpenseWithCategory[];
  categoryBudgets: CategoryBudget[];
  currentDate: Date;
  baselineBudget: number;
  onUpdateCategoryBudget: (categoryId: string, newAmount: number) => Promise<void>;
}

export function BudgetPage({
  categories,
  expenses,
  categoryBudgets,
  currentDate,
  baselineBudget,
  onUpdateCategoryBudget,
}: BudgetPageProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | BudgetStatus>("all");
  const [editingCategory, setEditingCategory] = useState<CategoryBudgetProgress | null>(null);
  const [newBudgetInput, setNewBudgetInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const budgetProgress = computeCategoryBudgetProgress(
    categories,
    expenses,
    categoryBudgets,
    currentDate
  );

  const totalAllocatedBudget = budgetProgress.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spentTotal, 0);
  const totalRemaining = totalAllocatedBudget - totalSpent;
  const overallPercentage = totalAllocatedBudget > 0 ? (totalSpent / totalAllocatedBudget) * 100 : 0;

  const overSpentCount = budgetProgress.filter((b) => b.status === "over_spent").length;
  const cautionCount = budgetProgress.filter((b) => b.status === "caution").length;
  const onTrackCount = budgetProgress.filter((b) => b.status === "on_track").length;

  const filteredItems =
    statusFilter === "all"
      ? budgetProgress
      : budgetProgress.filter((b) => b.status === statusFilter);

  const handleOpenEdit = (item: CategoryBudgetProgress) => {
    setEditingCategory(item);
    setNewBudgetInput(item.budgetAmount.toString());
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const num = parseFloat(newBudgetInput);
    if (isNaN(num) || num <= 0) return;

    try {
      setIsSubmitting(true);
      await onUpdateCategoryBudget(editingCategory.categoryId, num);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      setEditingCategory(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 1. OVERALL BUDGET HEALTH BANNER */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Category Budgets</h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  ({format(currentDate, "MMMM yyyy")})
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track real-time spend pace, limits, and over/under allocations
              </p>
            </div>
          </div>

          {/* Overall Health Status Badge */}
          <div className="flex items-center gap-2">
            {overSpentCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4" />
                {overSpentCount} {overSpentCount === 1 ? "Category" : "Categories"} Over Spent
              </span>
            ) : cautionCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                {cautionCount} Approaching Limit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                All Budgets On Track
              </span>
            )}
          </div>
        </div>

        {/* Overview Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Budget
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              {formatCurrency(totalAllocatedBudget)}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Spent
            </span>
            <div className="text-lg sm:text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {formatCurrency(totalSpent)}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Remaining
            </span>
            <div
              className={`text-lg sm:text-xl font-black mt-0.5 ${
                totalRemaining >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {totalRemaining >= 0 ? formatCurrency(totalRemaining) : `-${formatCurrency(Math.abs(totalRemaining))}`}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Overall Used
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
              {overallPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-4">
          <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                overallPercentage > 100
                  ? "bg-gradient-to-r from-red-500 to-rose-600"
                  : overallPercentage > 80
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400"
              }`}
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
            <span>0%</span>
            <span>
              Expected month pace: ~{budgetProgress[0]?.expectedPacePercentage || 50}%
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* 2. FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter("all")}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
            statusFilter === "all"
              ? "bg-slate-800 dark:bg-slate-800 text-white shadow-sm"
              : "bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          All ({budgetProgress.length})
        </button>
        <button
          onClick={() => setStatusFilter("over_spent")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
            statusFilter === "over_spent"
              ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
              : "bg-white dark:bg-slate-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10"
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Over Spent ({overSpentCount})
        </button>
        <button
          onClick={() => setStatusFilter("caution")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
            statusFilter === "caution"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold"
              : "bg-white dark:bg-slate-900/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Caution ({cautionCount})
        </button>
        <button
          onClick={() => setStatusFilter("on_track")}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 ${
            statusFilter === "on_track"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white dark:bg-slate-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          On Track ({onTrackCount})
        </button>
      </div>

      {/* 3. CATEGORY BUDGET CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const isOver = item.status === "over_spent";
          const isCaution = item.status === "caution";
          const isOnTrack = item.status === "on_track";

          return (
            <div
              key={item.categoryId}
              className={`rounded-2xl border bg-white dark:bg-slate-900/80 p-5 shadow-md backdrop-blur-sm transition-all space-y-4 ${
                isOver
                  ? "border-rose-300 dark:border-rose-500/30"
                  : isCaution
                  ? "border-amber-300 dark:border-amber-500/30"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Top Row: Category Info + Status Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                    style={{ backgroundColor: item.category.color }}
                  >
                    <DynamicIcon name={item.category.icon} className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.category.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>Limit: {formatCurrency(item.budgetAmount)}</span>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded p-0.5 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        title="Edit category budget limit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isOver && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      Over Spent
                    </span>
                  )}
                  {isCaution && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Approaching
                    </span>
                  )}
                  {isOnTrack && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      On Track
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-slate-200">
                    {formatCurrency(item.spentTotal)}{" "}
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      ({item.percentageUsed}%)
                    </span>
                  </span>
                  <span
                    className={`font-semibold ${
                      isOver ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isOver
                      ? `Over by ${formatCurrency(Math.abs(item.remainingAmount))}`
                      : `${formatCurrency(item.remainingAmount)} left`}
                  </span>
                </div>

                {/* Bar */}
                <div className="relative h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOver
                        ? "bg-gradient-to-r from-red-500 to-rose-600"
                        : isCaution
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : "bg-gradient-to-r from-emerald-500 to-teal-400"
                    }`}
                    style={{ width: `${Math.min(item.percentageUsed, 100)}%` }}
                  />
                </div>
              </div>

              {/* Bottom Row: Normal vs One-Time Breakdown + Recommended Daily Pace */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 text-[11px] space-y-1.5 border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Normal base: {formatCurrency(item.normalSpent)}</span>
                  {item.oneTimeSpent > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      1-time: {formatCurrency(item.oneTimeSpent)}
                    </span>
                  )}
                </div>

                {!isOver && item.remainingAmount > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/50 pt-1 text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      Daily pace ({item.daysRemainingInMonth}d left):
                    </span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(item.dailyRecommendedRemaining)} / day
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. EDIT CATEGORY BUDGET MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: editingCategory.category.color }}
                >
                  <DynamicIcon
                    name={editingCategory.category.icon}
                    className="h-4.5 w-4.5"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Set Budget Limit
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingCategory.category.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Monthly Budget (Rs.)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="500"
                    placeholder="25000"
                    value={newBudgetInput}
                    onChange={(e) => setNewBudgetInput(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2.5 pl-11 pr-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Budget</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
