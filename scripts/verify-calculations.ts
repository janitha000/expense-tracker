import {
  computeKPISummary,
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeDailyBurnRate,
  groupExpensesByDate,
} from "../src/lib/calculations";
import { ExpenseWithCategory } from "../src/lib/types";

const mockCategory1 = {
  id: "cat-1",
  name: "Groceries",
  icon: "Utensils",
  color: "#10B981",
  isCustom: false,
  createdAt: new Date().toISOString(),
};

const mockCategory2 = {
  id: "cat-2",
  name: "Gadgets",
  icon: "Laptop",
  color: "#8B5CF6",
  isCustom: false,
  createdAt: new Date().toISOString(),
};

const mockCurrentExpenses: ExpenseWithCategory[] = [
  {
    id: "e1",
    amount: "100.00",
    date: "2026-09-01",
    categoryId: "cat-1",
    parentType: "normal",
    category: mockCategory1,
    createdAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "e2",
    amount: "200.00",
    date: "2026-09-05",
    categoryId: "cat-1",
    parentType: "normal",
    category: mockCategory1,
    createdAt: "2026-09-05T10:00:00Z",
  },
  {
    id: "e3",
    amount: "500.00",
    date: "2026-09-08",
    categoryId: "cat-2",
    parentType: "one_time", // One-time spike
    category: mockCategory2,
    createdAt: "2026-09-08T10:00:00Z",
  },
];

const mockPrevExpenses: ExpenseWithCategory[] = [
  {
    id: "e0",
    amount: "500.00",
    date: "2026-08-10",
    categoryId: "cat-1",
    parentType: "normal",
    category: mockCategory1,
    createdAt: "2026-08-10T10:00:00Z",
  },
];

console.log("--- RUNNING CALCULATION TESTS ---");

// Test 1: KPI Summary
const targetDate = new Date("2026-09-18T00:00:00Z");
const kpi = computeKPISummary(mockCurrentExpenses, mockPrevExpenses, targetDate, 2000);

console.log("KPI Summary:", kpi);
if (kpi.normalTotal !== 300) throw new Error(`Expected normalTotal 300, got ${kpi.normalTotal}`);
if (kpi.oneTimeTotal !== 500) throw new Error(`Expected oneTimeTotal 500, got ${kpi.oneTimeTotal}`);
if (kpi.currentTotal !== 800) throw new Error(`Expected currentTotal 800, got ${kpi.currentTotal}`);
if (kpi.normalBudgetPct !== 15.0) throw new Error(`Expected normalBudgetPct 15.0, got ${kpi.normalBudgetPct}`);
// (800 - 500) / 500 * 100 = 60.0% MoM increase
if (kpi.momChangePct !== 60.0) throw new Error(`Expected momChangePct 60.0, got ${kpi.momChangePct}`);
console.log("✅ Test 1: KPI calculation and normal vs one-time isolation passed!");

// Test 2: Category Breakdown filter
const breakdownAll = computeCategoryBreakdown(mockCurrentExpenses, "all");
const breakdownNormal = computeCategoryBreakdown(mockCurrentExpenses, "normal");
const breakdownOneTime = computeCategoryBreakdown(mockCurrentExpenses, "one_time");

console.log("Breakdown Normal:", breakdownNormal);
console.log("Breakdown One-Time:", breakdownOneTime);

if (breakdownNormal.length !== 1 || breakdownNormal[0].total !== 300) {
  throw new Error("Normal category breakdown failed");
}
if (breakdownOneTime.length !== 1 || breakdownOneTime[0].total !== 500) {
  throw new Error("One-time category breakdown failed");
}
console.log("✅ Test 2: Category breakdown filtering passed!");

// Test 3: Daily Burn Rate
const burn = computeDailyBurnRate(mockCurrentExpenses, targetDate, 2000);
const day8 = burn.find((b) => b.day === 8);
if (!day8) throw new Error("Day 8 not found in burn rate");
if (day8.cumulativeNormal !== 300) throw new Error(`Expected cumulativeNormal 300 on day 8, got ${day8.cumulativeNormal}`);
if (day8.cumulativeTotal !== 800) throw new Error(`Expected cumulativeTotal 800 on day 8, got ${day8.cumulativeTotal}`);
console.log("✅ Test 3: Daily cumulative burn rate calculation passed!");

// Test 4: Grouped chronological expenses
const grouped = groupExpensesByDate(mockCurrentExpenses);
if (grouped.length !== 3) throw new Error(`Expected 3 date groups, got ${grouped.length}`);
if (grouped[0].date !== "2026-09-08") throw new Error("Expected newest date first");
console.log("✅ Test 4: Grouping by date passed!");

console.log("\n🎉 ALL CALCULATION AND ISOLATION TESTS PASSED SUCCESSFULLY!");
