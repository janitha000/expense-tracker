import {
  format,
  parseISO,
  isToday,
  isYesterday,
  getDaysInMonth,
  subMonths,
  isSameMonth,
  getDate,
} from "date-fns";
import {
  Category,
  CategoryBudget,
  CategoryBudgetProgress,
  BudgetStatus,
  ExpenseWithCategory,
  ParentType,
  KPISummary,
  CategoryDonutPoint,
  MonthlyTrendPoint,
  DailyBurnPoint,
  DayGroupedExpenses,
} from "./types";
import { DEFAULT_BASELINE_BUDGET, DEFAULT_CATEGORY_BUDGET_MAP } from "./constants";

/**
 * Calculates KPI metrics isolating Normal vs. One-Time spending and MoM changes.
 */
export function computeKPISummary(
  currentMonthExpenses: ExpenseWithCategory[],
  previousMonthExpenses: ExpenseWithCategory[],
  targetDate: Date = new Date(),
  baselineBudget: number = DEFAULT_BASELINE_BUDGET
): KPISummary {
  let normalTotal = 0;
  let oneTimeTotal = 0;

  for (const exp of currentMonthExpenses) {
    const amt = Number(exp.amount) || 0;
    if (exp.parentType === "one_time") {
      oneTimeTotal += amt;
    } else {
      normalTotal += amt;
    }
  }

  const currentTotal = normalTotal + oneTimeTotal;

  let prevMonthTotal = 0;
  for (const exp of previousMonthExpenses) {
    prevMonthTotal += Number(exp.amount) || 0;
  }

  const momChangePct =
    prevMonthTotal > 0
      ? Number((((currentTotal - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1))
      : null;

  const normalBudgetPct =
    baselineBudget > 0
      ? Number(((normalTotal / baselineBudget) * 100).toFixed(1))
      : 0;

  const totalBudgetPct =
    baselineBudget > 0
      ? Number(((currentTotal / baselineBudget) * 100).toFixed(1))
      : 0;

  const now = new Date();
  const isCurrentActiveMonth = isSameMonth(targetDate, now);
  const daysInMonth = getDaysInMonth(targetDate);
  const currentDay = isCurrentActiveMonth ? getDate(now) : daysInMonth;

  const dailyAverage =
    currentDay > 0 ? Number((currentTotal / currentDay).toFixed(2)) : 0;

  return {
    currentTotal: Number(currentTotal.toFixed(2)),
    normalTotal: Number(normalTotal.toFixed(2)),
    oneTimeTotal: Number(oneTimeTotal.toFixed(2)),
    baselineBudget,
    normalBudgetPct,
    totalBudgetPct,
    momChangePct,
    prevMonthTotal: Number(prevMonthTotal.toFixed(2)),
    dailyAverage,
    isOverBudget: normalTotal > baselineBudget,
    daysInMonth,
    currentDay,
  };
}

/**
 * Evaluates budget progress and health status for each category.
 */
export function computeCategoryBudgetProgress(
  categories: Category[],
  currentMonthExpenses: ExpenseWithCategory[],
  categoryBudgets: CategoryBudget[],
  targetDate: Date = new Date()
): CategoryBudgetProgress[] {
  const now = new Date();
  const isCurrentActiveMonth = isSameMonth(targetDate, now);
  const daysInMonth = getDaysInMonth(targetDate);
  const currentDay = isCurrentActiveMonth ? getDate(now) : daysInMonth;
  const expectedPacePercentage = Number(((currentDay / daysInMonth) * 100).toFixed(1));
  const daysRemainingInMonth = Math.max(1, daysInMonth - currentDay + 1);

  const budgetMap = new Map<string, number>();
  for (const cb of categoryBudgets) {
    budgetMap.set(cb.categoryId, Number(cb.budgetAmount) || 0);
  }

  const progressList: CategoryBudgetProgress[] = [];

  for (const cat of categories) {
    const budgetAmount =
      budgetMap.get(cat.id) ?? (DEFAULT_CATEGORY_BUDGET_MAP[cat.name] || 25000);

    const catExpenses = currentMonthExpenses.filter(
      (e) => e.categoryId === cat.id || e.category?.id === cat.id
    );

    let normalSpent = 0;
    let oneTimeSpent = 0;

    for (const exp of catExpenses) {
      const amt = Number(exp.amount) || 0;
      if (exp.parentType === "one_time") {
        oneTimeSpent += amt;
      } else {
        normalSpent += amt;
      }
    }

    const spentTotal = normalSpent + oneTimeSpent;
    const remainingAmount = Number((budgetAmount - spentTotal).toFixed(2));
    const percentageUsed =
      budgetAmount > 0
        ? Number(((spentTotal / budgetAmount) * 100).toFixed(1))
        : 0;

    let status: BudgetStatus = "on_track";
    let statusLabel = "On Track";

    if (spentTotal > budgetAmount) {
      status = "over_spent";
      statusLabel = "Over Spent";
    } else if (
      percentageUsed >= 85 ||
      (percentageUsed > expectedPacePercentage + 15 && percentageUsed > 40)
    ) {
      status = "caution";
      statusLabel = "Caution";
    } else {
      status = "on_track";
      statusLabel = "On Track";
    }

    const dailyRecommendedRemaining =
      remainingAmount > 0
        ? Number((remainingAmount / daysRemainingInMonth).toFixed(2))
        : 0;

    progressList.push({
      categoryId: cat.id,
      category: cat,
      budgetAmount,
      spentTotal: Number(spentTotal.toFixed(2)),
      normalSpent: Number(normalSpent.toFixed(2)),
      oneTimeSpent: Number(oneTimeSpent.toFixed(2)),
      remainingAmount,
      percentageUsed,
      expectedPacePercentage,
      status,
      statusLabel,
      dailyRecommendedRemaining,
      daysRemainingInMonth,
    });
  }

  // Sort: Over Spent first, then Caution, then On Track, then highest percentageUsed
  const statusOrder: Record<BudgetStatus, number> = {
    over_spent: 0,
    caution: 1,
    on_track: 2,
  };

  return progressList.sort((a, b) => {
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.percentageUsed - a.percentageUsed;
  });
}

/**
 * Aggregates expenses by category with optional parent_type filter.
 */
export function computeCategoryBreakdown(
  expenses: ExpenseWithCategory[],
  filterType: "all" | ParentType = "all"
): CategoryDonutPoint[] {
  const filtered =
    filterType === "all"
      ? expenses
      : expenses.filter((e) => e.parentType === filterType);

  const categoryMap = new Map<
    string,
    { id: string; name: string; icon: string; color: string; total: number; count: number }
  >();

  let overallTotal = 0;

  for (const exp of filtered) {
    const amt = Number(exp.amount) || 0;
    overallTotal += amt;
    const cat = exp.category;
    const catId = cat ? cat.id : exp.categoryId;
    const catName = cat ? cat.name : "Uncategorized";
    const catIcon = cat ? cat.icon : "CreditCard";
    const catColor = cat ? cat.color : "#64748B";

    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        id: catId,
        name: catName,
        icon: catIcon,
        color: catColor,
        total: 0,
        count: 0,
      });
    }

    const item = categoryMap.get(catId)!;
    item.total += amt;
    item.count += 1;
  }

  const result: CategoryDonutPoint[] = [];

  for (const item of categoryMap.values()) {
    const percentage =
      overallTotal > 0
        ? Number(((item.total / overallTotal) * 100).toFixed(1))
        : 0;

    result.push({
      id: item.id,
      name: item.name,
      icon: item.icon,
      color: item.color,
      total: Number(item.total.toFixed(2)),
      count: item.count,
      percentage,
    });
  }

  return result.sort((a, b) => b.total - a.total);
}

/**
 * Computes 6-month historical stacked bar chart points (Normal base + One-Time top).
 */
export function computeMonthlyTrend(
  allExpenses: ExpenseWithCategory[],
  targetDate: Date = new Date(),
  monthsCount: number = 6
): MonthlyTrendPoint[] {
  const trendPoints: MonthlyTrendPoint[] = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const monthDate = subMonths(targetDate, i);
    const monthKey = format(monthDate, "yyyy-MM");
    const label = format(monthDate, "MMM");

    let normal = 0;
    let oneTime = 0;

    for (const exp of allExpenses) {
      if (exp.date.startsWith(monthKey)) {
        const amt = Number(exp.amount) || 0;
        if (exp.parentType === "one_time") {
          oneTime += amt;
        } else {
          normal += amt;
        }
      }
    }

    trendPoints.push({
      month: monthKey,
      label,
      normal: Number(normal.toFixed(2)),
      oneTime: Number(oneTime.toFixed(2)),
      total: Number((normal + oneTime).toFixed(2)),
    });
  }

  return trendPoints;
}

/**
 * Computes daily cumulative run rate comparison for the target month.
 */
export function computeDailyBurnRate(
  currentMonthExpenses: ExpenseWithCategory[],
  targetDate: Date = new Date(),
  baselineBudget: number = DEFAULT_BASELINE_BUDGET
): DailyBurnPoint[] {
  const daysInMonth = getDaysInMonth(targetDate);
  const monthKey = format(targetDate, "yyyy-MM");
  const now = new Date();
  const isCurrentActiveMonth = isSameMonth(targetDate, now);
  const maxDayToRender = isCurrentActiveMonth ? getDate(now) : daysInMonth;

  const dailyMap = new Map<number, { normal: number; oneTime: number }>();
  for (let d = 1; d <= daysInMonth; d++) {
    dailyMap.set(d, { normal: 0, oneTime: 0 });
  }

  for (const exp of currentMonthExpenses) {
    if (exp.date.startsWith(monthKey)) {
      const dayNum = parseInt(exp.date.substring(8, 10), 10);
      if (dailyMap.has(dayNum)) {
        const entry = dailyMap.get(dayNum)!;
        const amt = Number(exp.amount) || 0;
        if (exp.parentType === "one_time") {
          entry.oneTime += amt;
        } else {
          entry.normal += amt;
        }
      }
    }
  }

  const burnPoints: DailyBurnPoint[] = [];
  let runningNormal = 0;
  let runningTotal = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const entry = dailyMap.get(day)!;
    const dailyNormal = entry.normal;
    const dailyOneTime = entry.oneTime;
    const dailyTotal = dailyNormal + dailyOneTime;

    const idealBaseline = Number(((baselineBudget / daysInMonth) * day).toFixed(2));
    const padDay = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${monthKey}-${padDay}`;

    if (day <= maxDayToRender) {
      runningNormal += dailyNormal;
      runningTotal += dailyTotal;

      burnPoints.push({
        day,
        date: dateStr,
        dailyNormal: Number(dailyNormal.toFixed(2)),
        dailyOneTime: Number(dailyOneTime.toFixed(2)),
        dailyTotal: Number(dailyTotal.toFixed(2)),
        cumulativeNormal: Number(runningNormal.toFixed(2)),
        cumulativeTotal: Number(runningTotal.toFixed(2)),
        idealBaseline,
      });
    } else {
      burnPoints.push({
        day,
        date: dateStr,
        dailyNormal: 0,
        dailyOneTime: 0,
        dailyTotal: 0,
        cumulativeNormal: Number(runningNormal.toFixed(2)),
        cumulativeTotal: Number(runningTotal.toFixed(2)),
        idealBaseline,
      });
    }
  }

  return burnPoints;
}

/**
 * Groups expenses chronologically by date descending with daily subtotals.
 */
export function groupExpensesByDate(
  expenses: ExpenseWithCategory[]
): DayGroupedExpenses[] {
  const sorted = [...expenses].sort((a, b) => {
    if (b.date !== a.date) {
      return b.date.localeCompare(a.date);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const groupMap = new Map<string, ExpenseWithCategory[]>();

  for (const exp of sorted) {
    if (!groupMap.has(exp.date)) {
      groupMap.set(exp.date, []);
    }
    groupMap.get(exp.date)!.push(exp);
  }

  const result: DayGroupedExpenses[] = [];

  for (const [dateStr, expList] of groupMap.entries()) {
    let total = 0;
    let normalTotal = 0;
    let oneTimeTotal = 0;

    for (const exp of expList) {
      const amt = Number(exp.amount) || 0;
      total += amt;
      if (exp.parentType === "one_time") {
        oneTimeTotal += amt;
      } else {
        normalTotal += amt;
      }
    }

    let parsedDate: Date;
    try {
      parsedDate = parseISO(dateStr);
    } catch {
      parsedDate = new Date();
    }

    result.push({
      date: dateStr,
      formattedDate: format(parsedDate, "MMM d, yyyy"),
      dayName: format(parsedDate, "EEEE"),
      isToday: isToday(parsedDate),
      isYesterday: isYesterday(parsedDate),
      total: Number(total.toFixed(2)),
      normalTotal: Number(normalTotal.toFixed(2)),
      oneTimeTotal: Number(oneTimeTotal.toFixed(2)),
      expenses: expList,
    });
  }

  return result;
}
