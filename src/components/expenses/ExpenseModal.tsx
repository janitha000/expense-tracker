"use client";

import React, { useState, useEffect } from "react";
import { X, Check, AlertCircle, Sparkles, RefreshCw, Repeat, Calendar } from "lucide-react";
import { Category, ExpenseWithCategory, ParentType } from "@/lib/types";
import {
  expenseSchema,
  recurringExpenseSchema,
  ExpenseFormData,
  RecurringExpenseFormData,
} from "@/lib/validators";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { format, subDays, addMonths, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  editingExpense?: ExpenseWithCategory | null;
  onSave: (expenseData: ExpenseFormData, expenseId?: string) => Promise<void>;
  onSaveRecurring?: (recurringData: RecurringExpenseFormData) => Promise<void>;
  defaultDate?: Date;
}

export function ExpenseModal({
  isOpen,
  onClose,
  categories,
  editingExpense,
  onSave,
  onSaveRecurring,
  defaultDate = new Date(),
}: ExpenseModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(format(defaultDate, "yyyy-MM-dd"));
  const [categoryId, setCategoryId] = useState<string>("");
  const [parentType, setParentType] = useState<ParentType>("normal");
  const [note, setNote] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [instances, setInstances] = useState<number>(6);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingExpense) {
      setAmount(Number(editingExpense.amount).toString());
      setDate(editingExpense.date);
      setCategoryId(editingExpense.categoryId);
      setParentType(editingExpense.parentType);
      setNote(editingExpense.note || "");
      setIsRecurring(false);
    } else {
      setAmount("");
      setDate(format(defaultDate, "yyyy-MM-dd"));
      setCategoryId(categories[0]?.id || "");
      setParentType("normal");
      setNote("");
      setIsRecurring(false);
      setInstances(6);
    }
    setErrors({});
  }, [editingExpense, isOpen, categories, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isRecurring && !editingExpense) {
      const rawRecurringData = {
        amount: parseFloat(amount),
        startDate: date,
        instances: Number(instances),
        categoryId,
        parentType,
        note: note.trim() || null,
      };

      const result = recurringExpenseSchema.safeParse(rawRecurringData);
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
        if (onSaveRecurring) {
          await onSaveRecurring(result.data);
        } else {
          await onSave(
            {
              amount: result.data.amount,
              date: result.data.startDate,
              categoryId: result.data.categoryId,
              parentType: result.data.parentType,
              note: result.data.note,
            },
            undefined
          );
        }
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to save recurring expenses";
        setErrors({ form: message });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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

  // Compute projection info for recurring expenses
  const parsedStartDate = date ? parseISO(date) : new Date();
  const validDate = isNaN(parsedStartDate.getTime()) ? new Date() : parsedStartDate;
  const endDate = addMonths(validDate, Math.max(1, instances) - 1);
  const totalRecurringAmount = (parseFloat(amount) || 0) * (instances || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-950/40">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {editingExpense ? (
                "Edit Expense"
              ) : isRecurring ? (
                <>
                  <Repeat className="h-4 w-4 text-purple-500 animate-spin-slow" />
                  <span>Add Monthly Recurring Expense</span>
                </>
              ) : (
                "Add New Expense"
              )}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              {editingExpense
                ? "Update expense details"
                : isRecurring
                ? "Schedule recurring monthly commitments"
                : "Select category, classification, and amount"}
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
          {errors.form && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-500 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* STEP 1: CATEGORY SELECTOR */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              1. Select Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 rounded-xl p-2 text-left transition-all border ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-500/15 text-blue-900 dark:text-white shadow-sm ring-2 ring-blue-500/50"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.categoryId}</p>
            )}
          </div>

          {/* STEP 2: CLASSIFICATION */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Classification
              </label>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {parentType === "normal"
                  ? "Recurring / Living run-rate"
                  : "One-off / Discretionary spike"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1.5">
              <button
                type="button"
                onClick={() => setParentType("normal")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
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
                className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
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

          {/* STEP 3: AMOUNT */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              3. {isRecurring ? "Monthly Amount (Rs.)" : "Amount (Rs.)"}
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
                className={`w-full rounded-2xl border bg-slate-50 dark:bg-slate-950/70 py-3 pl-14 pr-4 text-2xl font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
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

          {/* STEP 4: SCHEDULE & RECURRING SETTINGS */}
          <div className="space-y-3">
            {/* Recurring Toggle (Only for new expenses) */}
            {!editingExpense && (
              <div className="flex items-center justify-between rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/10 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    <Repeat className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Repeat Monthly (Recurring)
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Auto-generate entries across future months (e.g. Rent, Subscriptions)
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            )}

            {/* Date Pickers */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  <span>{isRecurring ? "4. Start Date" : "4. Date"}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDateShortcut("today")}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateShortcut("yesterday")}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              {errors.date && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.date}</p>}
              {errors.startDate && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.startDate}</p>}
            </div>

            {/* Recurring Configuration Details */}
            {isRecurring && !editingExpense && (
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Recurring Duration (Number of Months)
                    </label>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {instances} {instances === 1 ? "Month" : "Months"}
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[3, 6, 12, 24].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setInstances(cnt)}
                        className={`rounded-xl py-1.5 px-2 text-[11px] font-bold border transition-all ${
                          instances === cnt
                            ? "border-purple-500 bg-purple-600 text-white shadow-sm"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {cnt === 12 ? "1 Year" : cnt === 24 ? "2 Years" : `${cnt} Mos`}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="36"
                    value={instances}
                    onChange={(e) => setInstances(Number(e.target.value))}
                    className="w-full accent-purple-600 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  {errors.instances && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.instances}</p>
                  )}
                </div>

                {/* Projection Summary Pill */}
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs space-y-1">
                  <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center justify-between">
                    <span>🗓️ Schedule Projection:</span>
                    <span>{instances} Entries</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 text-[11px]">
                    From <strong className="text-slate-900 dark:text-white">{format(validDate, "MMM yyyy")}</strong> to{" "}
                    <strong className="text-slate-900 dark:text-white">{format(endDate, "MMM yyyy")}</strong> (on the {format(validDate, "do")} of each month)
                  </div>
                  <div className="pt-1 text-slate-600 dark:text-slate-300 font-semibold flex items-center justify-between border-t border-purple-500/20 text-[11px]">
                    <span>Total Projected Outflow:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      {formatCurrency(totalRecurringAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: NOTES (OPTIONAL) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wider">
              5. Note (Optional)
            </label>
            <input
              type="text"
              placeholder={isRecurring ? "e.g. Internet fiber bill, Apartment rent..." : "e.g. Supermarket shopping, fuel refill..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 py-2 px-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-lg active:scale-98 transition-all disabled:opacity-50 ${
                isRecurring && !editingExpense
                  ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-purple-500/25 hover:from-purple-500 hover:to-blue-500"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 shadow-blue-500/25 hover:from-blue-500 hover:to-emerald-400"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>
                    {editingExpense
                      ? "Update Expense"
                      : isRecurring
                      ? `Save ${instances} Monthly Recurring Expenses`
                      : "Save Expense"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
