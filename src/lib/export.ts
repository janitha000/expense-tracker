import { ExpenseWithCategory } from "@/lib/types";
import { format } from "date-fns";

/**
 * Escapes fields for CSV according to RFC 4180 standard.
 */
function escapeCSVField(field: string | number | Date | null | undefined): string {
  if (field === null || field === undefined) {
    return '""';
  }
  if (field instanceof Date) {
    return `"${field.toISOString()}"`;
  }
  const str = String(field);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Generates an Excel-ready CSV string (with UTF-8 BOM) for a list of expenses.
 */
export function generateExpensesCSV(
  expenses: ExpenseWithCategory[],
  title?: string
): string {
  const headers = [
    "Date",
    "Category",
    "Classification",
    "Amount (LKR)",
    "Note",
    "Recurring Series ID",
    "Created At",
  ];

  const rows = expenses.map((exp) => {
    const isOneTime = exp.parentType === "one_time";
    return [
      escapeCSVField(exp.date),
      escapeCSVField(exp.category?.name || "General"),
      escapeCSVField(isOneTime ? "One-Time" : "Normal"),
      escapeCSVField(exp.amount),
      escapeCSVField(exp.note || ""),
      escapeCSVField(exp.recurringGroupId || ""),
      escapeCSVField(exp.createdAt),
    ].join(",");
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens non-ASCII characters & currencies properly
  return "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
}

/**
 * Triggers a client-side file download.
 */
export function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string = "text/csv;charset=utf-8;"
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports expenses for a specific month (YYYY-MM).
 */
export function exportMonthlyExpenses(
  allExpenses: ExpenseWithCategory[],
  monthKey: string
): { count: number; total: number } {
  const monthlyExpenses = allExpenses
    .filter((e) => e.date.startsWith(monthKey))
    .sort((a, b) => b.date.localeCompare(a.date));

  const csv = generateExpensesCSV(monthlyExpenses, `Monthly Expenses - ${monthKey}`);
  triggerFileDownload(csv, `expenses-${monthKey}.csv`);

  const total = monthlyExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  return { count: monthlyExpenses.length, total };
}

/**
 * Exports expenses for a specific year (YYYY).
 */
export function exportYearlyExpenses(
  allExpenses: ExpenseWithCategory[],
  yearKey: string
): { count: number; total: number } {
  const yearlyExpenses = allExpenses
    .filter((e) => e.date.startsWith(yearKey))
    .sort((a, b) => b.date.localeCompare(a.date));

  const csv = generateExpensesCSV(yearlyExpenses, `Yearly Expenses - ${yearKey}`);
  triggerFileDownload(csv, `expenses-year-${yearKey}.csv`);

  const total = yearlyExpenses.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0
  );
  return { count: yearlyExpenses.length, total };
}

/**
 * Exports all expenses to JSON backup.
 */
export function exportAllExpensesJSON(
  allExpenses: ExpenseWithCategory[]
): { count: number } {
  const jsonContent = JSON.stringify(allExpenses, null, 2);
  const dateStr = format(new Date(), "yyyy-MM-dd");
  triggerFileDownload(
    jsonContent,
    `expenses-backup-${dateStr}.json`,
    "application/json;charset=utf-8;"
  );
  return { count: allExpenses.length };
}
