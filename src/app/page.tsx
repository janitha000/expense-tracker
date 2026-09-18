"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav, NavTab } from "@/components/layout/BottomNav";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { BudgetPage } from "@/components/budgets/BudgetPage";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { SettingsView } from "@/components/settings/SettingsView";
import { ExpenseModal } from "@/components/expenses/ExpenseModal";
import { PinLockScreen } from "@/components/auth/PinLockScreen";
import { useAuth } from "@/context/AuthContext";
import {
  Category,
  ExpenseWithCategory,
  CategoryBudget,
} from "@/lib/types";
import { ExpenseFormData, CategoryFormData, RecurringExpenseFormData } from "@/lib/validators";
import { DEFAULT_CATEGORIES, DEFAULT_BASELINE_BUDGET } from "@/lib/constants";
import { format, subMonths } from "date-fns";
import { Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function Home() {
  const { isLocked, isSettingUpPin, closePinSetup } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [allExpenses, setAllExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [baselineBudget, setBaselineBudget] = useState<number>(DEFAULT_BASELINE_BUDGET);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);

  // Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithCategory | null>(null);

  const monthKey = format(currentDate, "yyyy-MM");
  const prevMonthKey = format(subMonths(currentDate, 1), "yyyy-MM");

  // Load all initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Fetch categories
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData);
        }
      }

      // 2. Fetch all expenses (for 6-month historical stacked trends & active calculations)
      const expRes = await fetch("/api/expenses");
      if (expRes.ok) {
        const expData = await expRes.json();
        if (Array.isArray(expData)) {
          setAllExpenses(expData);
        }
      }

      // 3. Fetch monthly baseline budget
      const budgetRes = await fetch(`/api/budgets?month=${monthKey}`);
      if (budgetRes.ok) {
        const budgetData = await budgetRes.json();
        if (budgetData?.baselineAmount) {
          setBaselineBudget(Number(budgetData.baselineAmount));
        }
      }

      // 4. Fetch category budgets for the selected month
      const catBudgetsRes = await fetch(`/api/category-budgets?month=${monthKey}`);
      if (catBudgetsRes.ok) {
        const catBudgetData = await catBudgetsRes.json();
        if (Array.isArray(catBudgetData)) {
          setCategoryBudgets(catBudgetData);
        }
      }

      // 5. Fetch DB connection status
      const statusRes = await fetch("/api/status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsLiveDb(statusData.isConnected === true);
      }
    } catch (err) {
      console.error("Error loading application data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Expenses for the current selected month
  const currentMonthExpenses = allExpenses.filter((e) =>
    e.date.startsWith(monthKey)
  );

  // Expenses for the previous month (for MoM calculations)
  const previousMonthExpenses = allExpenses.filter((e) =>
    e.date.startsWith(prevMonthKey)
  );

  // Quick Action: Add / Update Expense
  const handleSaveExpense = async (
    data: ExpenseFormData,
    expenseId?: string
  ) => {
    if (expenseId) {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update expense");
      }
      const updated = await res.json();
      setAllExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? updated : e))
      );
    } else {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create expense");
      }
      const created = await res.json();
      setAllExpenses((prev) => [created, ...prev]);

      if (data.parentType === "normal") {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.9 } });
      }
    }
  };

  // Quick Action: Add Recurring Monthly Expenses Series
  const handleSaveRecurringExpense = async (data: RecurringExpenseFormData) => {
    const res = await fetch("/api/expenses/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create recurring expenses");
    }
    const createdList: ExpenseWithCategory[] = await res.json();
    setAllExpenses((prev) => [...createdList, ...prev]);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete expense");
    }
    setAllExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Create Category
  const handleCreateCategory = async (data: CategoryFormData) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create category");
    }
    const created = await res.json();
    setCategories((prev) => [...prev, created]);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete category");
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setAllExpenses((prev) => prev.filter((e) => e.categoryId !== id));
    setCategoryBudgets((prev) => prev.filter((cb) => cb.categoryId !== id));
  };

  // Update Baseline Monthly Budget
  const handleUpdateBudget = async (newBudget: number) => {
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: monthKey, baselineAmount: newBudget }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update budget");
    }
    setBaselineBudget(newBudget);
  };

  // Update Individual Category Budget
  const handleUpdateCategoryBudget = async (
    categoryId: string,
    newAmount: number
  ) => {
    const res = await fetch("/api/category-budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        month: monthKey,
        categoryId,
        budgetAmount: newAmount,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update category budget");
    }
    const updated = await res.json();
    setCategoryBudgets((prev) => {
      const exists = prev.some((cb) => cb.categoryId === categoryId);
      if (exists) {
        return prev.map((cb) => (cb.categoryId === categoryId ? updated : cb));
      }
      return [...prev, updated];
    });
  };

  // Reset & Re-seed Data
  const handleResetSeed = async () => {
    const res = await fetch("/api/seed", { method: "POST" });
    if (!res.ok) {
      throw new Error("Failed to seed database");
    }
    await loadData();
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEdit = (exp: ExpenseWithCategory) => {
    setEditingExpense(exp);
    setIsExpenseModalOpen(true);
  };

  // If locked, render PIN unlock overlay
  if (isLocked) {
    return <PinLockScreen mode="unlock" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 pb-16 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Navbar
        currentDate={currentDate}
        onMonthChange={setCurrentDate}
        onOpenAddExpense={handleOpenAdd}
        isLiveDb={isLiveDb}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
            <span className="text-sm font-medium">Loading your budget data...</span>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <AnalyticsDashboard
                currentMonthExpenses={currentMonthExpenses}
                previousMonthExpenses={previousMonthExpenses}
                allExpenses={allExpenses}
                currentDate={currentDate}
                baselineBudget={baselineBudget}
              />
            )}

            {activeTab === "expenses" && (
              <ExpenseList
                expenses={currentMonthExpenses}
                categories={categories}
                onEditExpense={handleOpenEdit}
                onDeleteExpense={handleDeleteExpense}
                onOpenAddExpense={handleOpenAdd}
              />
            )}

            {activeTab === "budgets" && (
              <BudgetPage
                categories={categories}
                expenses={currentMonthExpenses}
                categoryBudgets={categoryBudgets}
                currentDate={currentDate}
                baselineBudget={baselineBudget}
                onUpdateCategoryBudget={handleUpdateCategoryBudget}
              />
            )}

            {activeTab === "categories" && (
              <CategoryManager
                categories={categories}
                onCreateCategory={handleCreateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeTab === "settings" && (
              <SettingsView
                baselineBudget={baselineBudget}
                onUpdateBudget={handleUpdateBudget}
                onResetSeed={handleResetSeed}
                isLiveDb={isLiveDb}
                currentDate={currentDate}
              />
            )}
          </>
        )}
      </main>

      {/* Quick Add/Edit Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        categories={categories}
        editingExpense={editingExpense}
        onSave={handleSaveExpense}
        onSaveRecurring={handleSaveRecurringExpense}
        defaultDate={currentDate}
      />

      {/* PIN Setup Modal */}
      {isSettingUpPin && (
        <PinLockScreen mode="setup" onCloseSetup={closePinSetup} />
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddExpense={handleOpenAdd}
      />
    </div>
  );
}
