import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rs. 0.00";
  return (
    "Rs. " +
    num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    return `Rs. ${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(0)}k`;
  }
  return `Rs. ${amount.toFixed(0)}`;
}

export function getISTDate(): { dateStr: string; monthKey: string; formattedDate: string } {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return {
    dateStr,
    monthKey: dateStr.substring(0, 7),
    formattedDate,
  };
}
