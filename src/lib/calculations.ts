import {
  format,
  parseISO,
  isToday,
  isYesterday,
  getDaysInMonth,
  subMonths,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  getDate,
} from "date-fns";
import {
  ExpenseWithCategory,
  ParentType,
  KPISummary,
  CategoryDonutPoint,
  MonthlyTrendPoint,
  DailyBurnPoint,
  DayGroupedExpenses,
} from "./types";
import { DEFAULT_BASELINE_BUDGET } from "./constants";

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

  // Sort descending by total amount
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

  // Map daily amounts
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

    // Ideal linear budget run-rate
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
      // Future days in current month - project ideal baseline
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
  // Sort descending by date, then by createdAt
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
