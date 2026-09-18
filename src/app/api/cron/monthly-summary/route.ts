import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { sendEmail } from "@/lib/email/resend";
import { renderMonthlySummaryHtml } from "@/lib/email/templates/monthlySummary";
import { computeCategoryBudgetProgress } from "@/lib/calculations";
import { DEFAULT_BASELINE_BUDGET } from "@/lib/constants";
import { getISTDate } from "@/lib/utils";
import { format, subMonths, isLastDayOfMonth, parseISO } from "date-fns";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const queryKey = url.searchParams.get("key");
      if (queryKey !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const force = url.searchParams.get("force") === "true";
    const istInfo = getISTDate();
    const now = parseISO(istInfo.dateStr);

    if (!force && !isLastDayOfMonth(now)) {
      return NextResponse.json({
        skipped: true,
        message: "Not the last day of the month. Use ?force=true to trigger manually.",
      });
    }

    const recipientEmail =
      process.env.NOTIFICATION_EMAIL || process.env.EMAIL_TO;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No NOTIFICATION_EMAIL configured in environment" },
        { status: 400 }
      );
    }

    const requestedMonth = url.searchParams.get("month");
    const targetDate = requestedMonth ? parseISO(`${requestedMonth}-01`) : now;
    const monthKey = format(targetDate, "yyyy-MM");
    const formattedMonth = format(targetDate, "MMMM yyyy");
    const prevMonthKey = format(subMonths(targetDate, 1), "yyyy-MM");

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
      targetDate
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

    const subject = `Monthly Financial Wrap-Up - ${formattedMonth} (Rs. ${totalSpend.toLocaleString()})`;

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject,
      html,
    });

    return NextResponse.json({
      success: emailResult.success,
      recipient: recipientEmail,
      month: monthKey,
      totalSpend,
      normalSpend,
      oneTimeSpend,
      remainingBudget,
      emailResult,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to run monthly summary cron";
    console.error("Monthly summary cron error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
