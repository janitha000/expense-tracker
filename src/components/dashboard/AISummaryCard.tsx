"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Sparkles,
  Bot,
  RefreshCw,
  Copy,
  Check,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  Zap,
} from "lucide-react";
import {
  AISummaryData,
  checkGeminiNanoAvailability,
  generateGeminiNanoSummary,
  generateSmartFinancialSummary,
  GeminiNanoAvailability,
} from "@/lib/ai/geminiNano";

interface AISummaryCardProps {
  summaryData: AISummaryData;
}

export function AISummaryCard({ summaryData }: AISummaryCardProps) {
  const [summary, setSummary] = useState<string>("");
  const [modelSource, setModelSource] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);
  const [nanoStatus, setNanoStatus] = useState<GeminiNanoAvailability>("unsupported");
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  const cacheKey = `budgetflow_ai_summary_${summaryData.monthKey}`;

  const FULL_SETUP_GUIDE = `How to enable Chrome Gemini Nano (On-Device AI):
1. Open a new tab and paste: chrome://flags/#prompt-api-for-gemini-nano
   -> Set to "Enabled"
2. Paste: chrome://flags/#optimization-guide-on-device-model
   -> Set to "Enabled BypassPrefRequirement"
3. Relaunch Chrome.
4. Open: chrome://components
   -> Find "Optimization Guide On Device Model" and click "Check for update"
5. Refresh BudgetFlow!`;

  // Check Nano capability and load cached summary on mount / month change
  useEffect(() => {
    // 1. Load cached summary if available
    const cached = localStorage.getItem(cacheKey);
    const cachedSource = localStorage.getItem(`${cacheKey}_source`);
    if (cached) {
      setSummary(cached);
      setModelSource(cachedSource || "Local AI");
    } else {
      setSummary("");
      setModelSource("");
    }

    // 2. Check Gemini Nano
    checkGeminiNanoAvailability().then((res) => {
      setNanoStatus(res.availability);
    });
  }, [cacheKey]);

  // Handle generation
  const handleGenerate = async (forceEngine?: "nano" | "smart") => {
    setIsGenerating(true);
    try {
      if (forceEngine !== "smart" && (nanoStatus === "readily" || nanoStatus === "after-download")) {
        try {
          const result = await generateGeminiNanoSummary(summaryData);
          startTransition(() => {
            setSummary(result);
            setModelSource("Gemini Nano (On-Device)");
          });
          localStorage.setItem(cacheKey, result);
          localStorage.setItem(`${cacheKey}_source`, "Gemini Nano (On-Device)");
          return;
        } catch (nanoErr) {
          console.warn("Gemini Nano failed, falling back to smart engine:", nanoErr);
        }
      }

      // Fallback smart analyst
      const fallbackResult = generateSmartFinancialSummary(summaryData);
      startTransition(() => {
        setSummary(fallbackResult);
        setModelSource("Smart Financial Analyst Engine");
      });
      localStorage.setItem(cacheKey, fallbackResult);
      localStorage.setItem(`${cacheKey}_source`, "Smart Financial Analyst Engine");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => {
      setCopiedStep((current) => (current === id ? null : current));
    }, 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 sm:p-5 shadow-sm transition-all space-y-3.5 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white shadow-sm shadow-purple-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Monthly AI Financial Summary
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Cpu className="h-2.5 w-2.5" />
                No API Key • 100% Private
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Executive takeaways, living vs passive income runway & recommendations for {summaryData.formattedMonth}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {summary && (
            <button
              onClick={handleCopy}
              className="flex h-8 px-2.5 items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all"
              title="Copy summary"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
            </button>
          )}

          {summary ? (
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="flex h-8 px-3 items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Analyzing..." : "Regenerate"}</span>
            </button>
          ) : (
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="flex h-8 px-3.5 items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <Zap className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Generating..." : "Generate AI Summary"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Gemini Nano Status & Chrome Flags Guide Toggle */}
      <div className="flex flex-wrap items-center justify-between text-[11px] rounded-xl bg-slate-50 dark:bg-slate-950/50 px-3 py-1.5 border border-slate-200/80 dark:border-slate-800/80 gap-2">
        <div className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-slate-500 dark:text-slate-400">Engine:</span>
          {nanoStatus === "readily" ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Gemini Nano (Ready on-device)
            </span>
          ) : nanoStatus === "after-download" ? (
            <span className="font-semibold text-amber-500 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Gemini Nano (Downloading model)
            </span>
          ) : (
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Chrome Prompt API (On-Device) / Smart Analyst Fallback
            </span>
          )}
        </div>

        <button
          onClick={() => setShowSetupGuide(!showSetupGuide)}
          className="text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-1 font-medium text-[10px]"
        >
          <Info className="h-3 w-3" />
          <span>Chrome Nano Setup</span>
          {showSetupGuide ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Expandable Setup Instructions for Chrome Prompt API with 1-Click Copy */}
      {showSetupGuide && (
        <div className="rounded-xl bg-purple-50/80 dark:bg-purple-950/25 border border-purple-200/90 dark:border-purple-800/50 p-3.5 text-xs space-y-3 text-slate-700 dark:text-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/70 dark:border-purple-800/40 pb-2">
            <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Enable Chrome Built-in Gemini Nano on your device</span>
            </div>

            <button
              type="button"
              onClick={() => handleCopyText(FULL_SETUP_GUIDE, "all-steps")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-100 dark:bg-purple-900/60 hover:bg-purple-200 dark:hover:bg-purple-800/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 shadow-sm transition-all self-start sm:self-auto active:scale-95"
            >
              {copiedStep === "all-steps" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied All Steps!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy All Steps</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
            Note: Chrome security prevents web pages from directly opening <code className="font-mono bg-purple-100/70 dark:bg-purple-900/40 px-1 py-0.5 rounded text-purple-800 dark:text-purple-300 text-[10px]">chrome://</code> URLs. Click <b>Copy</b> next to each flag and paste into your browser address bar.
          </div>

          <div className="space-y-2.5 text-[11px]">
            {/* Step 1 */}
            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold">1</span>
                  Enable Prompt API Flag:
                </span>
                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                  Set to: Enabled
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-md border border-slate-200 dark:border-slate-800">
                <code className="text-purple-700 dark:text-purple-300 font-mono text-[10px] sm:text-[11px] flex-1 break-all select-all">
                  chrome://flags/#prompt-api-for-gemini-nano
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyText("chrome://flags/#prompt-api-for-gemini-nano", "flag1")}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-200 transition-colors shrink-0 shadow-xs"
                >
                  {copiedStep === "flag1" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold">2</span>
                  Enable On-Device Model Flag:
                </span>
                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                  Set to: Enabled BypassPrefRequirement
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-md border border-slate-200 dark:border-slate-800">
                <code className="text-purple-700 dark:text-purple-300 font-mono text-[10px] sm:text-[11px] flex-1 break-all select-all">
                  chrome://flags/#optimization-guide-on-device-model
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyText("chrome://flags/#optimization-guide-on-device-model", "flag2")}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-200 transition-colors shrink-0 shadow-xs"
                >
                  {copiedStep === "flag2" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/80 border border-purple-100 dark:border-purple-900/50 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-[10px] font-bold">3</span>
                  Relaunch Chrome & Download Model:
                </span>
                <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60">
                  Click "Check for update"
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-md border border-slate-200 dark:border-slate-800">
                <code className="text-purple-700 dark:text-purple-300 font-mono text-[10px] sm:text-[11px] flex-1 break-all select-all">
                  chrome://components
                </code>
                <button
                  type="button"
                  onClick={() => handleCopyText("chrome://components", "components")}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-200 transition-colors shrink-0 shadow-xs"
                >
                  {copiedStep === "components" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                On the components page, find <b>Optimization Guide On Device Model</b> and click <b>Check for update</b>. When download finishes, refresh BudgetFlow!
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-purple-200/50 dark:border-purple-800/30">
            Fallback note: If Chrome Built-in AI is not enabled or supported on your current browser, BudgetFlow seamlessly runs our Smart Financial Analyst engine with zero configuration and zero API keys!
          </div>
        </div>
      )}

      {/* Body: Generating State, Summary Output, or Empty Callout */}
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
          <div className="relative">
            <div className="h-10 w-10 rounded-full border-2 border-purple-500/20 border-t-purple-600 animate-spin" />
            <Sparkles className="h-4 w-4 text-purple-600 absolute inset-0 m-auto" />
          </div>
          <div className="text-center">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Analyzing your spending patterns...
            </span>
            <span className="text-[11px] text-slate-400">
              Running on-device local model without sending data to external cloud servers
            </span>
          </div>
        </div>
      ) : summary ? (
        <div className="rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 p-3.5 sm:p-4 text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-2 whitespace-pre-line font-normal">
          {summary}

          {modelSource && (
            <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span>Source: {modelSource}</span>
              <span>100% On-Device &bull; No API Key</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 p-4 text-center space-y-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Generate an executive financial summary for {summaryData.formattedMonth}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Click <b>Generate AI Summary</b> above to get an instant on-device breakdown of budget pacing, passive income runway, and personalized recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
