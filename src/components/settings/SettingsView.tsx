"use client";

import React, { useState } from "react";
import {
  Settings,
  Database,
  RefreshCw,
  Sliders,
  Check,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  Zap,
  Lock,
  KeyRound,
  Sun,
  Moon,
  Laptop,
  Mail,
  Send,
  Calendar,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useTheme, Theme } from "@/context/ThemeContext";

interface SettingsViewProps {
  baselineBudget: number;
  onUpdateBudget: (newBudget: number) => Promise<void>;
  onResetSeed: () => Promise<void>;
  isLiveDb: boolean;
  currentDate: Date;
}

export function SettingsView({
  baselineBudget,
  onUpdateBudget,
  onResetSeed,
  isLiveDb,
  currentDate,
}: SettingsViewProps) {
  const { hasPinSet, isPinEnabled, enablePin, disablePin, openPinSetup } = useAuth();
  const { theme, setTheme } = useTheme();
  const [budgetInput, setBudgetInput] = useState<string>(baselineBudget.toString());
  const [recipientEmail, setRecipientEmail] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("expense_notification_email") || "";
    }
    return "";
  });
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);
  const [isResettingSeed, setIsResettingSeed] = useState(false);
  const [isSendingTestDaily, setIsSendingTestDaily] = useState(false);
  const [isSendingTestMonthly, setIsSendingTestMonthly] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveEmail = (val: string) => {
    setRecipientEmail(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("expense_notification_email", val);
    }
  };

  const handleSendTestEmail = async (type: "daily" | "monthly") => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid recipient email address first.",
      });
      return;
    }

    try {
      if (type === "daily") setIsSendingTestDaily(true);
      else setIsSendingTestMonthly(true);

      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, email: recipientEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to send test ${type} email`);
      }

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
      setStatusMessage({
        type: "success",
        text: `Test ${type === "daily" ? "Daily (9 PM)" : "Monthly"} summary dispatched to ${recipientEmail}! ${
          data.emailResult?.mocked ? "(Logged to server console in dev mode)" : ""
        }`,
      });
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send email";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsSendingTestDaily(false);
      setIsSendingTestMonthly(false);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(budgetInput);
    if (isNaN(num) || num <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid positive budget amount in LKR." });
      return;
    }

    try {
      setIsUpdatingBudget(true);
      await onUpdateBudget(num);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      setStatusMessage({
        type: "success",
        text: `Baseline budget updated to ${formatCurrency(num)}!`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update budget";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  const handleCleanReset = async () => {
    if (!confirm("Are you sure you want to clear all recorded expenses and reset to a clean state?")) {
      return;
    }

    try {
      setIsResettingSeed(true);
      await onResetSeed();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setStatusMessage({
        type: "success",
        text: "Database cleaned! 0 expenses recorded.",
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset database";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsResettingSeed(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          Budget & Preferences
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Configure monthly baseline budget (LKR), appearance theme, PIN security, and database sync
        </p>
      </div>

      {statusMessage && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. Theme Selection Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
            <Sun className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Appearance & Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose your preferred interface theme
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-semibold border transition-all ${
              theme === "light"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sun className="h-4 w-4 text-amber-500" />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-semibold border transition-all ${
              theme === "dark"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Moon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 text-xs font-semibold border transition-all ${
              theme === "system"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 shadow-sm"
                : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Laptop className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 2. Security & PIN Lock Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                PIN Authentication Lock
                {isPinEnabled ? (
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Disabled
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Protect your personal expense details with a 4-digit security PIN
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {hasPinSet
              ? isPinEnabled
                ? "App is protected. Prompt required on launch or manual lock."
                : "PIN is set but currently disabled."
              : "No PIN configured yet."}
          </div>

          <div className="flex items-center gap-2">
            {hasPinSet ? (
              <>
                <button
                  type="button"
                  onClick={openPinSetup}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  <span>Change PIN</span>
                </button>

                {isPinEnabled ? (
                  <button
                    type="button"
                    onClick={disablePin}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    Disable PIN
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={enablePin}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20"
                  >
                    Enable PIN
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={openPinSetup}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Set 4-Digit PIN</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Monthly Baseline Budget Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Baseline Monthly Budget ({format(currentDate, "MMMM yyyy")})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Used to compute run-rate percentages and over/under budget trajectory
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveBudget} className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-bold">
              Rs.
            </span>
            <input
              type="number"
              step="5000"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 py-2.5 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isUpdatingBudget}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {isUpdatingBudget ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>Save</span>
          </button>
        </form>
      </div>

      {/* 4. Automated Email Reports (9:00 PM) Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Automated 9:00 PM Email Reports
                <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                  Scheduled
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily spending digests and end-of-month budget wrap-ups delivered automatically at 9:00 PM
              </p>
            </div>
          </div>
        </div>

        {/* Recipient Email Input */}
        <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Recipient Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              type="email"
              placeholder="e.g. yourname@gmail.com"
              value={recipientEmail}
              onChange={(e) => handleSaveEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Auto-saved in local preferences. For cloud cron runs, set <code className="text-purple-600 dark:text-purple-400 font-mono">NOTIFICATION_EMAIL</code> & <code className="text-purple-600 dark:text-purple-400 font-mono">RESEND_API_KEY</code> on Vercel.
          </p>
        </div>

        {/* Schedule Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                🌙 Daily Digest (9:00 PM)
              </span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                Daily
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Itemized today&apos;s expenses, base vs one-time breakdown, and month-to-date budget pacing.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSendTestEmail("daily")}
                disabled={isSendingTestDaily || !recipientEmail}
                className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 px-2.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSendingTestDaily ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                ) : (
                  <Send className="h-3 w-3 text-purple-500" />
                )}
                <span>{isSendingTestDaily ? "Sending..." : "Send Test Daily Email"}</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                🗓️ Month-End Wrap-Up (9:00 PM)
              </span>
              <span className="text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                Monthly
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Complete monthly spending review, category allocations, budget surplus/deficit, and top expenses.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSendTestEmail("monthly")}
                disabled={isSendingTestMonthly || !recipientEmail}
                className="w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 px-2.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isSendingTestMonthly ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                ) : (
                  <Send className="h-3 w-3 text-indigo-500" />
                )}
                <span>{isSendingTestMonthly ? "Sending..." : "Send Test Monthly Email"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Database Connection & Deployment */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isLiveDb
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            }`}
          >
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Database Provider
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isLiveDb
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                }`}
              >
                {isLiveDb ? "Connected (Neon PostgreSQL)" : "Local Demo Storage Mode"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isLiveDb
                ? "Drizzle ORM is connected live to Neon Serverless PostgreSQL."
                : "Using in-memory store. Supply DATABASE_URL in .env.local or Vercel to connect Neon Postgres."}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-950/70 p-3 text-xs text-slate-700 dark:text-slate-300 font-mono space-y-1">
          <div className="text-slate-500 text-[10px] uppercase font-bold">PostgreSQL Configuration</div>
          <div className="truncate text-slate-500 dark:text-slate-400">
            DATABASE_URL: {isLiveDb ? "postgresql://****:****@****.neon.tech/neondb" : "Not configured (fallback active)"}
          </div>
        </div>
      </div>

      {/* 5. Reset & Clean Expenses Action */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 dark:text-rose-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clear All Expenses</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wipe all expense entries and reset to 0 expenses cleanly
              </p>
            </div>
          </div>

          <button
            onClick={handleCleanReset}
            disabled={isResettingSeed}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-red-600 dark:text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResettingSeed ? "animate-spin" : ""}`} />
            <span>Clear Expenses</span>
          </button>
        </div>
      </div>

      {/* 6. PWA Readiness Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Progressive Web App (PWA)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configured with offline caching, manifest, and home screen installation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span>Offline Fallback Ready</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 p-2.5 text-slate-700 dark:text-slate-300">
            <Zap className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <span>Vercel Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
