export type ParentType = "normal" | "one_time";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom: boolean;
  createdAt: string | Date;
}

export interface Expense {
  id: string;
  amount: number | string;
  date: string; // YYYY-MM-DD
  categoryId: string;
  parentType: ParentType;
  note?: string | null;
  recurringGroupId?: string | null;
  createdAt: string | Date;
}

export interface ExpenseWithCategory extends Expense {
  category: Category;
}

export interface RecurringExpenseFormData {
  amount: number;
  startDate: string; // YYYY-MM-DD
  instances: number; // Number of months (1 to 60)
  categoryId: string;
  parentType: ParentType;
  note?: string | null;
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM
  baselineAmount: number | string;
  createdAt: string | Date;
}

export interface CategoryBudget {
  id: string;
  month: string; // YYYY-MM
  categoryId: string;
  budgetAmount: number | string;
  createdAt: string | Date;
}

export type BudgetStatus = "on_track" | "caution" | "over_spent";

export interface CategoryBudgetProgress {
  categoryId: string;
  category: Category;
  budgetAmount: number;
  spentTotal: number;
  normalSpent: number;
  oneTimeSpent: number;
  remainingAmount: number;
  percentageUsed: number;
  expectedPacePercentage: number;
  status: BudgetStatus;
  statusLabel: string;
  dailyRecommendedRemaining: number;
  daysRemainingInMonth: number;
}

export interface KPISummary {
  currentTotal: number;
  normalTotal: number;
  oneTimeTotal: number;
  baselineBudget: number;
  normalBudgetPct: number;
  totalBudgetPct: number;
  momChangePct: number | null;
  prevMonthTotal: number;
  dailyAverage: number;
  isOverBudget: boolean;
  daysInMonth: number;
  currentDay: number;
}

export interface CategoryDonutPoint {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyTrendPoint {
  month: string; // YYYY-MM
  label: string; // e.g. "Sep"
  normal: number;
  oneTime: number;
  total: number;
}

export interface DailyBurnPoint {
  day: number;
  date: string;
  dailyNormal: number;
  cumulativeNormal: number | null;
  projectedNormal: number | null;
  targetBudgetPace: number;
  budgetLimit: number;
}

export interface DayGroupedExpenses {
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "Sep 18, 2026"
  dayName: string; // e.g. "Friday"
  isToday: boolean;
  isYesterday: boolean;
  total: number;
  normalTotal: number;
  oneTimeTotal: number;
  expenses: ExpenseWithCategory[];
}
