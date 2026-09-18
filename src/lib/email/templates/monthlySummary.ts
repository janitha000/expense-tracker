import { ExpenseWithCategory, CategoryBudgetProgress } from "@/lib/types";

interface MonthlySummaryEmailProps {
  monthKey: string; // YYYY-MM
  formattedMonth: string; // e.g. "September 2026"
  totalSpend: number;
  normalSpend: number;
  oneTimeSpend: number;
  baselineBudget: number;
  remainingBudget: number;
  percentageUsed: number;
  categoryBreakdowns: CategoryBudgetProgress[];
  topExpenses: ExpenseWithCategory[];
  previousMonthSpend?: number;
}

export function renderMonthlySummaryHtml({
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
}: MonthlySummaryEmailProps): string {
  const currencyFormatter = (num: number) =>
    "Rs. " +
    num.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const isUnderBudget = remainingBudget >= 0;
  const varianceAmount = Math.abs(remainingBudget);

  const momDiff =
    previousMonthSpend !== undefined && previousMonthSpend > 0
      ? ((totalSpend - previousMonthSpend) / previousMonthSpend) * 100
      : null;

  const categoryRows = categoryBreakdowns
    .map((cb) => {
      const pct = cb.percentageUsed;
      const statusColor =
        cb.status === "over_spent"
          ? "#ef4444"
          : cb.status === "caution"
          ? "#f59e0b"
          : "#10b981";

      return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1e293b;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${cb.category.color || "#3b82f6"}; margin-right: 8px;"></span>
          ${cb.category.name}
        </td>
        <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #0f172a;">
          ${currencyFormatter(cb.normalSpent)}
        </td>
        <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">
          ${currencyFormatter(cb.budgetAmount)}
        </td>
        <td style="padding: 12px 16px; text-align: right;">
          <span style="font-size: 11px; font-weight: 700; color: ${statusColor}; background-color: ${statusColor}15; padding: 3px 8px; border-radius: 6px;">
            ${pct.toFixed(1)}%
          </span>
        </td>
      </tr>`;
    })
    .join("");

  const topExpenseRows = topExpenses
    .map((e) => {
      const isOneTime = e.parentType === "one_time";
      return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #1e293b;">
          ${e.category?.name || "General"}
        </td>
        <td style="padding: 10px 14px; font-size: 12px; color: #64748b;">
          ${e.note || '<span style="color: #94a3b8; font-style: italic;">—</span>'}
          <span style="color: #94a3b8; font-size: 10px; margin-left: 6px;">(${e.date})</span>
        </td>
        <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: ${isOneTime ? "#b45309" : "#0f172a"}; text-align: right;">
          ${currencyFormatter(Number(e.amount) || 0)}
        </td>
      </tr>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Financial Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4338ca 0%, #1e1b4b 100%); padding: 36px 24px; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">End-of-Month Review</div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">${formattedMonth} Wrap-Up</h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #c7d2fe;">Comprehensive monthly spending & budget review</p>
            </td>
          </tr>

          <!-- Key Highlights -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Total Monthly Spend</div>
                      <div style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 4px;">${currencyFormatter(totalSpend)}</div>
                      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                        ${currencyFormatter(normalSpend)} base + ${currencyFormatter(oneTimeSpend)} 1-time
                      </div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <div style="background-color: ${isUnderBudget ? "#ecfdf5" : "#fff1f2"}; border: 1px solid ${isUnderBudget ? "#a7f3d0" : "#fecdd3"}; border-radius: 12px; padding: 16px; text-align: center;">
                      <div style="font-size: 11px; font-weight: 600; color: ${isUnderBudget ? "#065f46" : "#9f1239"}; text-transform: uppercase;">
                        ${isUnderBudget ? "Budget Surplus" : "Over Budget"}
                      </div>
                      <div style="font-size: 20px; font-weight: 800; color: ${isUnderBudget ? "#047857" : "#be123c"}; margin-top: 4px;">
                        ${currencyFormatter(varianceAmount)}
                      </div>
                      <div style="font-size: 11px; color: ${isUnderBudget ? "#065f46" : "#9f1239"}; margin-top: 4px;">
                        ${percentageUsed.toFixed(1)}% of ${currencyFormatter(baselineBudget)}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              ${
                momDiff !== null
                  ? `<div style="margin-top: 14px; text-align: center; font-size: 12px; color: #64748b;">
                      Month-over-Month: <strong style="color: ${momDiff > 0 ? "#dc2626" : "#16a34a"};">${momDiff > 0 ? "+" : ""}${momDiff.toFixed(1)}%</strong> compared to previous month (${currencyFormatter(previousMonthSpend!)}).
                    </div>`
                  : ""
              }

              <!-- Category Breakdown Table -->
              <div style="margin-top: 24px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Category-by-Category Performance</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                      <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Category</th>
                      <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Normal Spent</th>
                      <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Budget Limit</th>
                      <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase;">% Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${categoryRows}
                  </tbody>
                </table>
              </div>

              <!-- Top 5 Largest Expenses -->
              ${
                topExpenses.length > 0
                  ? `
              <div style="margin-top: 24px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Top Largest Expenses</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                      <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Category</th>
                      <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Description / Date</th>
                      <th style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topExpenseRows}
                  </tbody>
                </table>
              </div>`
                  : ""
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Sent automatically by your Personal Expense Tracker • End-of-Month Review
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

