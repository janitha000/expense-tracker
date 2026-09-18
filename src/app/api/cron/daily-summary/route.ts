import { NextResponse } from "next/server";
import { dataLayer } from "@/db";
import { sendEmail } from "@/lib/email/resend";
import { renderDailySummaryHtml } from "@/lib/email/templates/dailySummary";
import { DEFAULT_BASELINE_BUDGET } from "@/lib/constants";
import { getISTDate } from "@/lib/utils";
import { format } from "date-fns";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const url = new URL(req.url);
      const queryKey = url.searchParams.get("key");
      if (queryKey !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const recipientEmail =
      process.env.NOTIFICATION_EMAIL || process.env.EMAIL_TO;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No NOTIFICATION_EMAIL configured in environment" },
        { status: 400 }
      );
    }

    const { dateStr: todayStr, monthKey, formattedDate } = getISTDate();

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

    const subject = `Daily Expense Summary - ${formattedDate} (Rs. ${totalToday.toLocaleString()})`;

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject,
      html,
    });

    return NextResponse.json({
      success: emailResult.success,
      recipient: recipientEmail,
      date: todayStr,
      totalToday,
      count: todayExpenses.length,
      emailResult,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : "Failed to run daily summary cron";
    console.error("Daily summary cron error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
