import { formatCurrency, formatCompactCurrency } from "@/lib/utils";

export type GeminiNanoAvailability = "readily" | "after-download" | "no" | "unsupported";

export interface AISummaryData {
  monthKey: string;
  formattedMonth: string;
  currentTotal: number;
  normalTotal: number;
  oneTimeTotal: number;
  baselineBudget: number;
  dailyAverage: number;
  currentDay: number;
  daysInMonth: number;
  momChangePct: number | null;
  prevMonthTotal: number;
  passiveIncome: number;
  topCategories: { name: string; total: number; percentage: number }[];
  projectedFinish: number;
}

// Check Chrome Built-in AI (Prompt API / Gemini Nano) capabilities
export async function checkGeminiNanoAvailability(): Promise<{
  availability: GeminiNanoAvailability;
  message: string;
}> {
  if (typeof window === "undefined") {
    return { availability: "unsupported", message: "SSR environment" };
  }

  const aiObj = (window as unknown as { ai?: { languageModel?: { capabilities: () => Promise<{ available: string }> }; assistant?: { capabilities: () => Promise<{ available: string }> } } }).ai;

  if (!aiObj) {
    return {
      availability: "unsupported",
      message: "Chrome Prompt API (window.ai) is not detected in this browser.",
    };
  }

  try {
    const model = aiObj.languageModel || aiObj.assistant;
    if (!model || typeof model.capabilities !== "function") {
      return {
        availability: "unsupported",
        message: "Prompt API capabilities not found.",
      };
    }

    const caps = await model.capabilities();
    if (caps.available === "readily") {
      return {
        availability: "readily",
        message: "Gemini Nano on-device AI is ready and loaded.",
      };
    } else if (caps.available === "after-download") {
      return {
        availability: "after-download",
        message: "Gemini Nano model download is pending or in progress.",
      };
    } else {
      return {
        availability: "no",
        message: "Gemini Nano is not currently enabled for this device.",
      };
    }
  } catch (err) {
    return {
      availability: "no",
      message: err instanceof Error ? err.message : "Error checking AI capabilities.",
    };
  }
}

// Generate prompt string from monthly budget metrics
export function buildFinancialAnalysisPrompt(data: AISummaryData): { systemPrompt: string; userPrompt: string } {
  const normalCoverage =
    data.normalTotal > 0
      ? ((data.passiveIncome / data.normalTotal) * 100).toFixed(1)
      : "100";
  const normalDiff = data.passiveIncome - data.normalTotal;

  const topCatsText =
    data.topCategories.length > 0
      ? data.topCategories
          .slice(0, 3)
          .map((c) => `${c.name} (${formatCompactCurrency(c.total)}, ${c.percentage}%)`)
          .join(", ")
      : "None recorded";

  const momText =
    data.momChangePct !== null
      ? `${data.momChangePct > 0 ? `+${data.momChangePct}%` : `${data.momChangePct}%`} vs same period prior month`
      : "No prior month baseline";

  const systemPrompt = `You are a personal financial advisor. Write a concise, actionable monthly budget summary under 160 words with bold highlights and clean bullet points. Never make up numbers.`;

  const userPrompt = `Financial wrap-up for ${data.formattedMonth}:
- Living (Normal) Spend: ${formatCurrency(data.normalTotal)}
- 1-Time Irregular Spikes: ${formatCurrency(data.oneTimeTotal)}
- Total Spend to date: ${formatCurrency(data.currentTotal)} (Day ${data.currentDay}/${data.daysInMonth}, Avg: ${formatCurrency(data.dailyAverage)}/day)
- Baseline Budget Limit: ${formatCurrency(data.baselineBudget)} (Forecast finish: ${formatCurrency(data.projectedFinish)})
- MoM Living Spend Change: ${momText}
- Passive Income: ${formatCurrency(data.passiveIncome)} (Covers ${normalCoverage}% of living expenses, Net: ${normalDiff >= 0 ? `+${formatCurrency(normalDiff)} surplus` : `-${formatCurrency(Math.abs(normalDiff))} deficit`})
- Top 3 Spending Categories: ${topCatsText}

Provide:
1. 🎯 **Budget Health & Velocity**: Status vs budget limit & forecast pacing.
2. ⚡ **Passive Income Runway**: Core living expenses coverage.
3. 💡 **Actionable Advice**: 2 short tips based on spikes or categories.`;

  return { systemPrompt, userPrompt };
}

// Run Prompt on Chrome Gemini Nano on-device LLM
export async function generateGeminiNanoSummary(data: AISummaryData): Promise<string> {
  const aiObj = (window as unknown as { ai?: { languageModel?: { create: (opts: { systemPrompt?: string }) => Promise<{ prompt: (p: string) => Promise<string>; destroy?: () => void }> }; assistant?: { create: (opts: { systemPrompt?: string }) => Promise<{ prompt: (p: string) => Promise<string>; destroy?: () => void }> } } }).ai;

  if (!aiObj) {
    throw new Error("window.ai is not available");
  }

  const modelApi = aiObj.languageModel || aiObj.assistant;
  if (!modelApi || typeof modelApi.create !== "function") {
    throw new Error("Prompt API create function not available");
  }

  const { systemPrompt, userPrompt } = buildFinancialAnalysisPrompt(data);

  const session = await modelApi.create({
    systemPrompt,
  });

  try {
    const response = await session.prompt(userPrompt);
    return response.trim();
  } finally {
    if (session && typeof session.destroy === "function") {
      session.destroy();
    }
  }
}

// Fallback intelligent heuristic narrative generator (when Chrome Gemini Nano is not enabled)
export function generateSmartFinancialSummary(data: AISummaryData): string {
  const isOverBudget = data.normalTotal > data.baselineBudget;
  const isProjectedOver = data.projectedFinish > data.baselineBudget;
  const projectedDiff = Math.abs(data.projectedFinish - data.baselineBudget);

  const normalCoverage =
    data.normalTotal > 0
      ? Number(((data.passiveIncome / data.normalTotal) * 100).toFixed(1))
      : 100;
  const normalDiff = data.passiveIncome - data.normalTotal;

  const topCategory = data.topCategories[0]?.name || "discretionary spending";

  const budgetHealthText = isOverBudget
    ? `Spending has exceeded your ${formatCompactCurrency(data.baselineBudget)} limit by **${formatCurrency(data.normalTotal - data.baselineBudget)}**.`
    : isProjectedOver
    ? `You are pacing ahead of budget, projected to finish at **${formatCompactCurrency(data.projectedFinish)}** (+${formatCompactCurrency(projectedDiff)} over limit).`
    : `Excellent pacing! You are on track to finish at **${formatCompactCurrency(data.projectedFinish)}**, well within your ${formatCompactCurrency(data.baselineBudget)} budget limit.`;

  const momText =
    data.momChangePct !== null
      ? data.momChangePct > 0
        ? `Living expenses increased by **+${data.momChangePct}%** compared to the same day last month.`
        : `Living expenses decreased by **${data.momChangePct}%** compared to last month — great cost control!`
      : `First tracked month of normal living baseline.`;

  const passiveIncomeText =
    data.passiveIncome > 0
      ? normalDiff >= 0
        ? `Your passive income of **${formatCurrency(data.passiveIncome)}** fully funds 100% of your living expenses with a **+${formatCurrency(normalDiff)} surplus** (${normalCoverage}% coverage).`
        : `Your passive income covers **${normalCoverage}%** of living expenses with a **${formatCurrency(Math.abs(normalDiff))}** shortfall.`
      : `No passive income recorded yet for this month. Set your passive income to track your coverage ratio.`;

  const spikeText =
    data.oneTimeTotal > 0
      ? `One-time irregular spikes accounted for **${formatCurrency(data.oneTimeTotal)}** (${((data.oneTimeTotal / (data.currentTotal || 1)) * 100).toFixed(0)}% of total spend).`
      : `No one-time irregular spikes recorded — living expenses remained steady.`;

  return `### 🎯 Budget Health & Trajectory
${budgetHealthText} Daily spend is currently averaging **${formatCurrency(data.dailyAverage)}/day** through Day ${data.currentDay} of ${data.daysInMonth}. ${momText}

### ⚡ Passive Income & Core Living Coverage
${passiveIncomeText} ${spikeText}

### 💡 Key Takeaways & Recommendations
- **Watch ${topCategory}**: Keep an eye on top categories to prevent discretionary drift before month end.
- **Runway Strategy**: ${normalDiff >= 0 ? "Reinvest your passive income surplus to accelerate compound growth." : "Aim to trim non-essential living expenses to close the passive income gap."}`;
}
