import { ExpenseWithCategory } from "@/lib/types";

interface DailySummaryEmailProps {
  date: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "Friday, 18 September 2026"
  expenses: ExpenseWithCategory[];
  totalToday: number;
  normalToday: number;
  oneTimeToday: number;
  monthSpent: number;
  monthlyBudget: number;
  budgetStatus: "ok" | "warning" | "over_budget";
  percentUsed: number;
}

export function renderDailySummaryHtml({
  date,
  formattedDate,
  expenses,
  totalToday,
  normalToday,
  oneTimeToday,
  monthSpent,
  monthlyBudget,
  budgetStatus,
  percentUsed,
}: DailySummaryEmailProps): string {
  const currencyFormatter = (num: number) =>
    "Rs. " +
    num.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const statusColor =
    budgetStatus === "over_budget"
      ? "#ef4444"
      : budgetStatus === "warning"
      ? "#f59e0b"
      : "#10b981";

  const statusText =
    budgetStatus === "over_budget"
      ? "?? Over Budget"
      : budgetStatus === "warning"
      ? "?? Approaching Limit"
      : "?? On Track";

  const rowsHtml =
    expenses.length === 0
      ? `<tr><td colspan="4" style="padding: 24px; text-align: center; color: #64748b; font-size: 14px;">No expenses recorded today. Great job staying on track! ??</td></tr>`
      : expenses
          .map((e) => {
            const isOneTime = e.parentType === "one_time";
            const amt = Number(e.amount) || 0;
            return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #1e293b;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${e.category?.color || "#3b82f6"}; margin-right: 8px;"></span>
                ${e.category?.name || "General"}
              </td>
              <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">
                ${
                  isOneTime
                    ? '<span style="background-color: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">One-Time</span>'
                    : '<span style="background-color: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-weight: 500; font-size: 11px;">Normal</span>'
                }
              </td>
              <td style="padding: 12px 16px; font-size: 12px; color: #475569;">
                ${e.note || '<span style="color: #94a3b8; font-style: italic;">—</span>'}
              </td>
              <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: ${isOneTime ? "#b45309" : "#0f172a"}; text-align: right;">
                ${currencyFormatter(amt)}
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
  <title>Daily Expense Summary</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 24px; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Daily 9:00 PM Financial Digest</div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff;">${formattedDate}</h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">Summary of today's spending & month-to-date trajectory</p>
            </td>
          </tr>

          <!-- Summary Metric Cards -->
          <tr>
            <td style="padding: 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Total Spent Today</div>
                      <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 4px;">${currencyFormatter(totalToday)}</div>
                      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}</div>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center;">
                      <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Breakdown (Base / 1-Time)</div>
                      <div style="font-size: 14px; font-weight: 700; color: #2563eb; margin-top: 6px;">
                        ${currencyFormatter(normalToday)} <span style="font-size: 10px; color: #64748b; font-weight: 500;">normal</span>
                      </div>
                      <div style="font-size: 12px; font-weight: 600; color: #d97706; margin-top: 2px;">
                        +${currencyFormatter(oneTimeToday)} <span style="font-size: 10px; color: #64748b; font-weight: 500;">1-time</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Month to date progress box -->
              <div style="margin-top: 16px; background-color: #f1f5f9; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                  <span style="font-size: 12px; font-weight: 700; color: #1e293b;">Month-to-Date Budget Status</span>
                  <span style="font-size: 11px; font-weight: 700; color: ${statusColor};">${statusText} (${percentUsed.toFixed(1)}%)</span>
                </div>
                <div style="background-color: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                  <div style="background-color: ${statusColor}; height: 8px; width: ${Math.min(100, percentUsed)}%; border-radius: 4px;"></div>
                </div>
                <div style="font-size: 11px; color: #64748b;">
                  Spent so far: <strong style="color: #0f172a;">${currencyFormatter(monthSpent)}</strong> of <strong style="color: #0f172a;">${currencyFormatter(monthlyBudget)}</strong> baseline limit.
                </div>
              </div>

              <!-- Today's Transaction Table -->
              <div style="margin-top: 24px;">
                <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">Today's Itemized Transactions</h3>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                      <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Category</th>
                      <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Type</th>
                      <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-align: left; text-transform: uppercase;">Note</th>
                      <th style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-align: right; text-transform: uppercase;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                Sent automatically by your Personal Expense Tracker • Daily Digest at 9:00 PM
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

