import {
  computeKPISummary,
  computeCategoryBudgetProgress,
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeDailyBurnRate,
  groupExpensesByDate,
} from "../src/lib/calculations";
import { ExpenseWithCategory, Category, CategoryBudget } from "../src/lib/types";

const mockCategory1: Category = {
  id: "cat-1",
  name: "Groceries & Food",
  icon: "Utensils",
  color: "#10B981",
  isCustom: false,
  createdAt: new Date().toISOString(),
};

const mockCategory2: Category = {
  id: "cat-2",
  name: "Gadgets / Electronics",
  icon: "Laptop",
  color: "#8B5CF6",
  isCustom: false,
  createdAt: new Date().toISOString(),
};

const mockCurrentExpenses: ExpenseWithCategory[] = [
  {
    id: "e1",
    amount: "15000.00",
    date: "2026-09-01",
    categoryId: "cat-1",
    parentType: "normal",
    category: mockCategory1,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "e2",
    amount: "20000.00",
    date: "2026-09-05",
    categoryId: "cat-1",
    parentType: "normal",
    category: mockCategory1,
    createdAt: "2026-09-05T10:00:00Z",
  },
  {
    id: "e3",
    amount: "45000.00",
    date: "2026-09-08",
    categoryId: "cat-2",
    parentType: "one_time",
    category: mockCategory2,
    createdAt: "2026-09-08T10:00:00Z",
  },
];

const mockCategoryBudgets: CategoryBudget[] = [
  {
    id: "cb-1",
    month: "2026-09",
    categoryId: "cat-1",
    budgetAmount: "65000.00", // Spent: 35,000 / 65,000 (53.8%) -> On Track on Day 18
    createdAt: new Date().toISOString(),
  },
  {
    id: "cb-2",
    month: "2026-09",
    categoryId: "cat-2",
    budgetAmount: "30000.00", // Spent: 45,000 / 30,000 (150%) -> Over Spent
    createdAt: new Date().toISOString(),
  },
];

console.log("--- RUNNING UPDATED LKR & CATEGORY BUDGET TESTS ---");

const targetDate = new Date("2026-09-18T00:00:00Z");

// Test: Category Budget Progress
const budgetProgress = computeCategoryBudgetProgress(
  [mockCategory1, mockCategory2],
  mockCurrentExpenses,
  mockCategoryBudgets,
  targetDate
);

console.log("Category Budget Progress:", budgetProgress);

const cat2Progress = budgetProgress.find((b) => b.categoryId === "cat-2");
if (!cat2Progress || cat2Progress.status !== "over_spent") {
  throw new Error(`Expected cat-2 to be over_spent, got ${cat2Progress?.status}`);
}
if (cat2Progress.remainingAmount !== -15000) {
  throw new Error(`Expected remainingAmount -15000, got ${cat2Progress.remainingAmount}`);
}

const cat1Progress = budgetProgress.find((b) => b.categoryId === "cat-1");
if (!cat1Progress || cat1Progress.status !== "on_track") {
  throw new Error(`Expected cat-1 to be on_track, got ${cat1Progress?.status}`);
}
if (cat1Progress.remainingAmount !== 30000) {
  throw new Error(`Expected remainingAmount 30000, got ${cat1Progress.remainingAmount}`);
}

console.log("✅ Category Budget health status & remaining calculations passed!");
console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
