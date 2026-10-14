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

  const now = new Date();
  const isCurrentActiveMonth = isSameMonth(targetDate, now);
  const daysInMonth = getDaysInMonth(targetDate);
  const currentDay = isCurrentActiveMonth ? getDate(now) : daysInMonth;

  // Previous month cutoff: consider expenses up to the current date (not end of month)
  const prevMonthDate = subMonths(targetDate, 1);
  const prevMonthKey = format(prevMonthDate, "yyyy-MM");
  const daysInPrevMonth = getDaysInMonth(prevMonthDate);
  const prevMonthCutoffDay = isCurrentActiveMonth
    ? Math.min(currentDay, daysInPrevMonth)
    : daysInPrevMonth;

  let prevMonthTotal = 0;
  for (const exp of previousMonthExpenses) {
    if (exp.date.startsWith(prevMonthKey)) {
      const day = parseInt(exp.date.substring(8, 10), 10);
      if (!isNaN(day) && day <= prevMonthCutoffDay) {
        prevMonthTotal += Number(exp.amount) || 0;
      }
    }
  }

  // Current month spend as of current date for apples-to-apples MoM calculation
  let currentTotalToDate = 0;
  for (const exp of currentMonthExpenses) {
    const day = parseInt(exp.date.substring(8, 10), 10);
    if (!isNaN(day) && (isCurrentActiveMonth ? day <= currentDay : true)) {
      currentTotalToDate += Number(exp.amount) || 0;
    }
  }
  const momBasisCurrent = isCurrentActiveMonth ? currentTotalToDate : currentTotal;

  const momChangePct =
    prevMonthTotal > 0
      ? Number((((momBasisCurrent - prevMonthTotal) / prevMonthTotal) * 100).toFixed(1))
      : null;

  const normalBudgetPct =
    baselineBudget > 0
      ? Number(((normalTotal / baselineBudget) * 100).toFixed(1))
      : 0;

  const totalBudgetPct =
    baselineBudget > 0
      ? Number(((currentTotal / baselineBudget) * 100).toFixed(1))
      : 0;

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
    // One-time expenses do not count towards the category budget:
    const remainingAmount = Number((budgetAmount - normalSpent).toFixed(2));
    const percentageUsed =
      budgetAmount > 0
        ? Number(((normalSpent / budgetAmount) * 100).toFixed(1))
        : 0;

    let status: BudgetStatus = "on_track";
    let statusLabel = "On Track";

    if (normalSpent > budgetAmount) {
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
 * Computes daily cumulative run rate comparison for the target month,
 * isolating normal living expenses and generating an intelligent run-rate projection.
 */
export function computeDailyBurnRate(
  currentMonthExpenses: ExpenseWithCategory[],
  previousMonthExpenses: ExpenseWithCategory[] = [],
  targetDate: Date = new Date(),
  baselineBudget: number = DEFAULT_BASELINE_BUDGET
): DailyBurnPoint[] {
  const daysInMonth = getDaysInMonth(targetDate);
  const monthKey = format(targetDate, "yyyy-MM");
  const now = new Date();
  const isCurrentActiveMonth = isSameMonth(targetDate, now);
  const maxDayToRender = isCurrentActiveMonth ? Math.min(getDate(now), daysInMonth) : daysInMonth;

  // Track daily normal expenses (One-time expenses are strictly ignored)
  const dailyNormalMap = new Map<number, number>();
  for (let d = 1; d <= daysInMonth; d++) {
    dailyNormalMap.set(d, 0);
  }

  for (const exp of currentMonthExpenses) {
    if (exp.date.startsWith(monthKey) && exp.parentType === "normal") {
      const dayNum = parseInt(exp.date.substring(8, 10), 10);
      if (dailyNormalMap.has(dayNum)) {
        dailyNormalMap.set(
          dayNum,
          (dailyNormalMap.get(dayNum) || 0) + (Number(exp.amount) || 0)
        );
      }
    }
  }

  // Previous month daily normal expenses (one-time expenses strictly ignored)
  const prevMonthDate = subMonths(targetDate, 1);
  const prevMonthKey = format(prevMonthDate, "yyyy-MM");
  const daysInPrevMonth = getDaysInMonth(prevMonthDate);

  const prevDailyNormalMap = new Map<number, number>();
  for (let d = 1; d <= daysInPrevMonth; d++) {
    prevDailyNormalMap.set(d, 0);
  }

  const hasPrevMonthData = previousMonthExpenses.some((e) =>
    e.date.startsWith(prevMonthKey)
  );

  for (const exp of previousMonthExpenses) {
    if (exp.date.startsWith(prevMonthKey) && exp.parentType === "normal") {
      const dayNum = parseInt(exp.date.substring(8, 10), 10);
      if (dayNum >= 1 && dayNum <= daysInPrevMonth) {
        prevDailyNormalMap.set(
          dayNum,
          (prevDailyNormalMap.get(dayNum) || 0) + (Number(exp.amount) || 0)
        );
      }
    }
  }

  // Calculate actual normal spend up to current day
  let totalNormalSoFar = 0;
  for (let day = 1; day <= maxDayToRender; day++) {
    totalNormalSoFar += dailyNormalMap.get(day) || 0;
  }

  // Isolate Day 1 (which typically includes major 1st-of-month lump sums like rent, bills, EMIs)
  const day1NormalSpend = dailyNormalMap.get(1) || 0;
  const remainingDiscretionaryDays = Math.max(1, daysInMonth - 1);
  const remainingBudgetForMonth = Math.max(0, baselineBudget - day1NormalSpend);
  const defaultRemainingDailyPace =
    remainingBudgetForMonth > 0
      ? remainingBudgetForMonth / remainingDiscretionaryDays
      : baselineBudget / daysInMonth;

  // Calculate empirical daily pace excluding Day 1 (from Day 2 onwards)
  let postDay1Spend = 0;
  for (let day = 2; day <= maxDayToRender; day++) {
    postDay1Spend += dailyNormalMap.get(day) || 0;
  }
  const elapsedPostDay1Days = Math.max(0, maxDayToRender - 1);

  let projectedDailyVelocity = defaultRemainingDailyPace;

  if (elapsedPostDay1Days > 0) {
    const empiricalPostDay1Rate = postDay1Spend / elapsedPostDay1Days;
    // Transition smoothly towards empirical post-Day 1 rate as more days elapse (100% confidence by Day 8)
    const confidenceWeight = Math.min(1, elapsedPostDay1Days / 7);
    projectedDailyVelocity =
      empiricalPostDay1Rate * confidenceWeight + defaultRemainingDailyPace * (1 - confidenceWeight);
  }

  const baseStartingAmount = Math.min(50000, baselineBudget * 0.5);
  const burnPoints: DailyBurnPoint[] = [];
  let runningNormal = 0;
  let runningPrevNormal = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dailyNormal = dailyNormalMap.get(day) || 0;
    const padDay = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `${monthKey}-${padDay}`;
    const targetBudgetPace =
      daysInMonth > 1
        ? Number(
            (
              baseStartingAmount +
              ((baselineBudget - baseStartingAmount) / (daysInMonth - 1)) * (day - 1)
            ).toFixed(2)
          )
        : baselineBudget;

    if (day <= daysInPrevMonth) {
      runningPrevNormal += prevDailyNormalMap.get(day) || 0;
    }

    const prevCumulativeNormal = hasPrevMonthData
      ? Number(runningPrevNormal.toFixed(2))
      : null;

    if (day < maxDayToRender) {
      runningNormal += dailyNormal;
      burnPoints.push({
        day,
        date: dateStr,
        dailyNormal: Number(dailyNormal.toFixed(2)),
        cumulativeNormal: Number(runningNormal.toFixed(2)),
        projectedNormal: null,
        targetBudgetPace,
        budgetLimit: baselineBudget,
        prevCumulativeNormal,
      });
    } else if (day === maxDayToRender) {
      runningNormal += dailyNormal;
      burnPoints.push({
        day,
        date: dateStr,
        dailyNormal: Number(dailyNormal.toFixed(2)),
        cumulativeNormal: Number(runningNormal.toFixed(2)),
        projectedNormal: Number(runningNormal.toFixed(2)), // Anchor point for projection
        targetBudgetPace,
        budgetLimit: baselineBudget,
        prevCumulativeNormal,
      });
    } else {
      // Future days: project forward based on blended progressive velocity
      const projected = Number(
        (totalNormalSoFar + projectedDailyVelocity * (day - maxDayToRender)).toFixed(2)
      );
      burnPoints.push({
        day,
        date: dateStr,
        dailyNormal: 0,
        cumulativeNormal: null,
        projectedNormal: projected,
        targetBudgetPace,
        budgetLimit: baselineBudget,
        prevCumulativeNormal,
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
