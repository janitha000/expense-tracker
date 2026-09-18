"use client";

import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { Category, ExpenseWithCategory, ParentType } from "@/lib/types";
import { expenseSchema, ExpenseFormData } from "@/lib/validators";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { format, subDays } from "date-fns";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  editingExpense?: ExpenseWithCategory | null;
  onSave: (expenseData: ExpenseFormData, expenseId?: string) => Promise<void>;
  defaultDate?: Date;
}

export function ExpenseModal({
  isOpen,
  onClose,
  categories,
  editingExpense,
  onSave,
  defaultDate = new Date(),
}: ExpenseModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(format(defaultDate, "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState<string>("");
  const [parentType, setParentType] = useState<ParentType>("normal");
  const [note, setNote] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setAmount(Number(editingExpense.amount).toString());
      setDate(editingExpense.date);
      setCategoryId(editingExpense.categoryId);
      setParentType(editingExpense.parentType);
      setNote(editingExpense.note || "");
    } else {
      setAmount("");
      setDate(format(defaultDate, "yyyy-MM-dd"));
      setCategoryId(categories[0]?.id || "");
      setParentType("normal");
      setNote("");
    }
    setErrors({});
  }, [editingExpense, isOpen, categories, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rawData = {
      amount: parseFloat(amount),
      date,
      categoryId,
      parentType,
      note: note.trim() || null,
    };

    const result = expenseSchema.safeParse(rawData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(result.data, editingExpense?.id);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save expense";
      setErrors({ form: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDateShortcut = (type: "today" | "yesterday") => {
    const d = type === "today" ? new Date() : subDays(new Date(), 1);
    setDate(format(d, "yyyy-MM-dd"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-950/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editingExpense
                ? "Update expense details"
                : "Record a normal daily or one-time expense in LKR"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errors.form && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Amount (Rs.)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-base font-bold text-blue-600 dark:text-blue-400">
                Rs.
              </div>
              <input
                type="number"
                step="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className={`w-full rounded-2xl border bg-slate-50 dark:bg-slate-950/70 py-3.5 pl-14 pr-4 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                  errors.amount
                    ? "border-red-500 focus:ring-red-500/30"
                    : "border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/30"
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.amount}</p>
            )}
          </div>

          {/* Parent Type Toggle: Normal vs One-Time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Expense Classification
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {parentType === "normal"
                  ? "Recurring / Baseline run-rate"
                  : "One-off / Discretionary spike"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1.5">
              <button
                type="button"
                onClick={() => setParentType("normal")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all ${
                  parentType === "normal"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex h-2 w-2 rounded-full bg-blue-300" />
                <span>Normal</span>
                <span className="text-[10px] opacity-75 font-normal">(Base)</span>
              </button>

              <button
                type="button"
                onClick={() => setParentType("one_time")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all ${
                  parentType === "one_time"
                    ? "bg-gradient-to-r from-amber-600 to-pink-600 text-white shadow-md shadow-amber-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>One-Time</span>
                <span className="text-[10px] opacity-75 font-normal">(Spike)</span>
              </button>
            </div>
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 rounded-xl p-2 text-left transition-all border ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-white shadow-sm ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.categoryId}</p>
            )}
          </div>

          {/* Date Picker + Quick Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Date
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDateShortcut("today")}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDateShortcut("yesterday")}
                  className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            {errors.date && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.date}</p>}
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Supermarket shopping, fuel refill..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 py-2.5 px-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-emerald-400 active:scale-98 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{editingExpense ? "Update Expense" : "Save Expense"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
