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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";
import { format } from "date-fns";

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
  const [budgetInput, setBudgetInput] = useState<string>(baselineBudget.toString());
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);
  const [isResettingSeed, setIsResettingSeed] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(budgetInput);
    if (isNaN(num) || num <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid positive budget amount." });
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

  const handleSeedReset = async () => {
    if (!confirm("Reset database with fresh 6-month seed data and standard categories?")) {
      return;
    }

    try {
      setIsResettingSeed(true);
      await onResetSeed();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
      setStatusMessage({
        type: "success",
        text: "Database reloaded with full 6 months of sample expense data!",
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to seed database";
      setStatusMessage({ type: "error", text: msg });
    } finally {
      setIsResettingSeed(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-400" />
          Budget & Preferences
        </h2>
        <p className="text-xs text-slate-400">
          Configure monthly baseline budget, database synchronization, and PWA options
        </p>
      </div>

      {statusMessage && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {statusMessage.type === "success" ? (
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 1. Monthly Baseline Budget Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Baseline Monthly Budget ({format(currentDate, "MMMM yyyy")})
              </h3>
              <p className="text-xs text-slate-400">
                Used to compute run-rate percentages and over/under budget trajectory
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveBudget} className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm font-bold">
              $
            </span>
            <input
              type="number"
              step="50"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-2.5 pl-8 pr-4 text-sm font-bold text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* 2. Database Connection & Deployment */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              isLiveDb ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
            }`}
          >
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Database Provider
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isLiveDb
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                }`}
              >
                {isLiveDb ? "Connected (Neon PostgreSQL)" : "Local Demo Storage Mode"}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {isLiveDb
                ? "Drizzle ORM is connected live to Neon Serverless PostgreSQL."
                : "Using in-memory store. Supply DATABASE_URL in .env.local or Vercel to connect Neon Postgres."}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-950/70 p-3 text-xs text-slate-300 font-mono space-y-1">
          <div className="text-slate-500 text-[10px] uppercase font-bold">PostgreSQL Configuration</div>
          <div className="truncate text-slate-400">
            DATABASE_URL: {isLiveDb ? "postgresql://****:****@****.neon.tech/neondb" : "Not configured (fallback active)"}
          </div>
        </div>
      </div>

      {/* 3. Sample Data Seed Action */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Reset & Seed Sample Data</h3>
              <p className="text-xs text-slate-400">
                Populate 6 months of realistic Normal vs One-Time expense data
              </p>
            </div>
          </div>

          <button
            onClick={handleSeedReset}
            disabled={isResettingSeed}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResettingSeed ? "animate-spin" : ""}`} />
            <span>Reload Data</span>
          </button>
        </div>
      </div>

      {/* 4. PWA Readiness Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Progressive Web App (PWA)</h3>
            <p className="text-xs text-slate-400">
              Configured with offline caching, manifest, and home screen installation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-2.5 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Offline Fallback Ready</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 p-2.5 text-slate-300">
            <Zap className="h-4 w-4 text-blue-400" />
            <span>Vercel Optimized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
