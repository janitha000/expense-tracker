import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { sendEmail } from "@/lib/email/resend";
import { renderDailySummaryHtml } from "@/lib/email/templates/dailySummary";
import { renderMonthlySummaryHtml } from "@/lib/email/templates/monthlySummary";
import { computeCategoryBudgetProgress } from "@/lib/calculations";
import { DEFAULT_BASELINE_BUDGET } from "@/lib/constants";
import { getISTDate } from "@/lib/utils";
import { format, subMonths, parseISO } from "date-fns";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type = "daily", email } = body;

    const recipient =
      email || process.env.NOTIFICATION_EMAIL || process.env.EMAIL_TO;
    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }

    const { dateStr: todayStr, monthKey, formattedDate } = getISTDate();
    const now = parseISO(todayStr);
    const formattedMonth = format(now, "MMMM yyyy");

    if (type === "daily") {
      const allExpenses = await dataLayer.getExpenses({ month: monthKey });
      const todayExpenses = allExpenses.filter((e) => e.date === todayStr);

      const totalToday = todayExpenses.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0
      );
      const normalToday = todayExpenses
        .filter((e) => e.parentType === "normal")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const oneTimeToday = todayExpenses
        .filter((e) => e.parentType === "one_time")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const budgetObj = await dataLayer.getBudget(monthKey);
      const baselineBudget = budgetObj
        ? Number(budgetObj.baselineAmount)
        : DEFAULT_BASELINE_BUDGET;

      const monthNormalSpent = allExpenses
        .filter((e) => e.parentType === "normal")
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const percentUsed =
        baselineBudget > 0 ? (monthNormalSpent / baselineBudget) * 100 : 0;

      const budgetStatus: "ok" | "warning" | "over_budget" =
        monthNormalSpent > baselineBudget
          ? "over_budget"
          : percentUsed >= 80
          ? "warning"
          : "ok";

      const html = renderDailySummaryHtml({
        date: todayStr,
        formattedDate,
        expenses: todayExpenses,
        totalToday,
        normalToday,
        oneTimeToday,
        monthSpent: monthNormalSpent,
        monthlyBudget: baselineBudget,
        budgetStatus,
        percentUsed,
      });

      const subject = `[Test] Daily Expense Summary - ${formattedDate}`;

      const res = await sendEmail({
        to: recipient,
        subject,
        html,
      });

      return NextResponse.json({
        success: res.success,
        type: "daily",
        recipient,
        emailResult: res,
      });
    } else {
      const prevMonthKey = format(subMonths(now, 1), "yyyy-MM");
      const categories = await dataLayer.getCategories();
      const allExpenses = await dataLayer.getExpenses();
      const currentMonthExpenses = allExpenses.filter((e) =>
        e.date.startsWith(monthKey)
      );
      const prevMonthExpenses = allExpenses.filter((e) =>
        e.date.startsWith(prevMonthKey)
      );
      const categoryBudgets = await dataLayer.getCategoryBudgets(monthKey);
      const budgetObj = await dataLayer.getBudget(monthKey);
      const baselineBudget = budgetObj
        ? Number(budgetObj.baselineAmount)
        : DEFAULT_BASELINE_BUDGET;

      let normalSpend = 0;
      let oneTimeSpend = 0;
      for (const exp of currentMonthExpenses) {
        const amt = Number(exp.amount) || 0;
        if (exp.parentType === "one_time") {
          oneTimeSpend += amt;
        } else {
          normalSpend += amt;
        }
      }
      const totalSpend = normalSpend + oneTimeSpend;
      const remainingBudget = baselineBudget - normalSpend;
      const percentageUsed =
        baselineBudget > 0 ? (normalSpend / baselineBudget) * 100 : 0;

      const previousMonthSpend = prevMonthExpenses.reduce(
        (sum, e) => sum + (Number(e.amount) || 0),
        0
      );

      const categoryBreakdowns = computeCategoryBudgetProgress(
        categories,
        currentMonthExpenses,
        categoryBudgets,
        now
      );

      const topExpenses = [...currentMonthExpenses]
        .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
        .slice(0, 5);

      const html = renderMonthlySummaryHtml({
        monthKey,
        formattedMonth,
        totalSpend,
        normalSpend,
        oneTimeSpend,
        baselineBudget,
        remainingBudget,
        percentageUsed,
        categoryBreakdowns,
        topExpenses,
        previousMonthSpend,
      });

      const subject = `[Test] Monthly Financial Wrap-Up - ${formattedMonth}`;

      const res = await sendEmail({
        to: recipient,
        subject,
        html,
      });

      return NextResponse.json({
        success: res.success,
        type: "monthly",
        recipient,
        emailResult: res,
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send test email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
