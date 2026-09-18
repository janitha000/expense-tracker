"use client";

import React, { useState } from "react";
import {
  Category,
  ExpenseWithCategory,
  ParentType,
  DayGroupedExpenses,
} from "@/lib/types";
import { groupExpensesByDate } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  Sparkles,
  Calendar,
  AlertTriangle,
  Layers,
  Repeat,
} from "lucide-react";

interface ExpenseListProps {
  expenses: ExpenseWithCategory[];
  categories: Category[];
  onEditExpense: (expense: ExpenseWithCategory) => void;
  onDeleteExpense: (id: string) => Promise<void>;
  onDeleteRecurring?: (groupId: string, fromDate?: string) => Promise<void>;
  onOpenAddExpense: () => void;
}

export function ExpenseList({
  expenses,
  categories,
  onEditExpense,
  onDeleteExpense,
  onDeleteRecurring,
  onOpenAddExpense,
}: ExpenseListProps) {
  const [parentTypeFilter, setParentTypeFilter] = useState<"all" | ParentType>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [recurringDeleteTarget, setRecurringDeleteTarget] = useState<ExpenseWithCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter expenses
  const filtered = expenses.filter((exp) => {
    if (parentTypeFilter !== "all" && exp.parentType !== parentTypeFilter) {
      return false;
    }
    if (selectedCategoryId !== "all" && exp.categoryId !== selectedCategoryId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = exp.note?.toLowerCase().includes(q);
      const matchCat = exp.category?.name.toLowerCase().includes(q);
      const matchAmt = exp.amount.toString().includes(q);
      if (!matchNote && !matchCat && !matchAmt) return false;
    }
    return true;
  });

  const groupedDays: DayGroupedExpenses[] = groupExpensesByDate(filtered);

  const totalFilteredAmount = filtered.reduce(
    (acc, e) => acc + (Number(e.amount) || 0),
    0
  );

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await onDeleteExpense(id);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteRecurring = async (groupId: string, fromDate?: string) => {
    try {
      setIsDeleting(true);
      if (onDeleteRecurring) {
        await onDeleteRecurring(groupId, fromDate);
      } else if (recurringDeleteTarget) {
        await onDeleteExpense(recurringDeleteTarget.id);
      }
      setRecurringDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-3.5 shadow-md backdrop-blur-md space-y-3 transition-colors">
        {/* Search Bar */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search notes, categories, or amounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Parent Type Filter Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800/80">
            <button
              onClick={() => setParentTypeFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                parentTypeFilter === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setParentTypeFilter("normal")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                parentTypeFilter === "normal"
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-blue-300" />
              Normal
            </button>
            <button
              onClick={() => setParentTypeFilter("one_time")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                parentTypeFilter === "one_time"
                  ? "bg-amber-600 text-white shadow-sm font-semibold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-200" />
              One-Time
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filtered.length}</strong>{" "}
            {filtered.length === 1 ? "expense" : "expenses"}
          </span>
          <span>
            Total:{" "}
            <strong className="text-blue-600 dark:text-blue-400 font-semibold text-xs">
              {formatCurrency(totalFilteredAmount)}
            </strong>
          </span>
        </div>
      </div>

      {/* Empty State */}
      {groupedDays.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-10 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No expenses recorded</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {searchQuery || parentTypeFilter !== "all" || selectedCategoryId !== "all"
              ? "Try adjusting your filters or search query"
              : "No expenses recorded for this month yet. Tap + to add one."}
          </p>
          <button
            onClick={onOpenAddExpense}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/20"
          >
            Add an Expense
          </button>
        </div>
      )}

      {/* Grouped Chronological List */}
      <div className="space-y-4">
        {groupedDays.map((group) => (
          <div
            key={group.date}
            className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 shadow-md overflow-hidden transition-colors"
          >
            {/* Day Header Banner */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {group.isToday
                    ? "Today"
                    : group.isYesterday
                    ? "Yesterday"
                    : group.dayName}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  ({group.formattedDate})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {group.oneTimeTotal > 0 && (
                  <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    +{formatCurrency(group.oneTimeTotal)} 1-time
                  </span>
                )}
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(group.total)}
                </span>
              </div>
            </div>

            {/* Expenses in this day */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {group.expenses.map((exp) => {
                const isOneTime = exp.parentType === "one_time";
                return (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Left Icon & Category Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ backgroundColor: exp.category?.color || "#64748B" }}
                      >
                        <DynamicIcon
                          name={exp.category?.icon || "CreditCard"}
                          className="h-5 w-5"
                        />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {exp.category?.name || "General"}
                          </h4>
                          {isOneTime ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                              <Sparkles className="h-2.5 w-2.5" />
                              One-Time
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:text-slate-300">
                              Normal
                            </span>
                          )}
                          {exp.recurringGroupId && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                              <Repeat className="h-2.5 w-2.5" />
                              Recurring
                            </span>
                          )}
                        </div>
                        {exp.note && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {exp.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold ${
                            isOneTime ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {formatCurrency(exp.amount)}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                          title="Edit expense"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (exp.recurringGroupId) {
                              setRecurringDeleteTarget(exp);
                            } else {
                              setDeleteConfirmId(exp.id);
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Standard Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500 dark:text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Expense?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Expense Delete Confirmation Modal */}
      {recurringDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/20 dark:border-purple-500/30 bg-white dark:bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Recurring Expense
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  &ldquo;{recurringDeleteTarget.category?.name || "Expense"}&rdquo; on{" "}
                  <strong>{recurringDeleteTarget.date}</strong> ({formatCurrency(recurringDeleteTarget.amount)}) is part of a recurring series.
                </p>
              </div>
            </div>

            {/* Scope Selection Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(recurringDeleteTarget.id)}
                className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Delete this entry only
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Only remove the expense on {recurringDeleteTarget.date}
                  </div>
                </div>
                <span className="text-xs text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400 font-semibold">
                  Delete &rarr;
                </span>
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  recurringDeleteTarget.recurringGroupId &&
                  handleDeleteRecurring(
                    recurringDeleteTarget.recurringGroupId,
                    recurringDeleteTarget.date
                  )
                }
                className="w-full text-left rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-3 hover:bg-amber-500/15 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Delete this & all future entries
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Keep past records, stop recurrence from {recurringDeleteTarget.date} onwards
                  </div>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 font-semibold">
                  Delete &rarr;
                </span>
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() =>
                  recurringDeleteTarget.recurringGroupId &&
                  handleDeleteRecurring(recurringDeleteTarget.recurringGroupId)
                }
                className="w-full text-left rounded-xl border border-red-500/30 bg-red-500/5 dark:bg-red-500/10 p-3 hover:bg-red-500/15 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-red-600 dark:text-red-400">
                    Delete entire series
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Erase all past and future instances in this recurring group
                  </div>
                </div>
                <span className="text-xs text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 font-semibold">
                  Delete All &rarr;
                </span>
              </button>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRecurringDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
