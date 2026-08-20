import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { getAccessToken, getRefreshToken } from "@/lib/auth/store";
import {
  emergencyFundRecommendations,
  financialFreedom,
  formatCurrency,
  generateRecommendations,
  healthScore,
  monthlySavings,
  prepaymentStrategy,
} from "@/lib/finance/calculations";
import { FinanceData } from "@/types/finance";

export type AdvisorCategory =
  | "Emergency Fund"
  | "Debt"
  | "Expenses"
  | "Savings"
  | "Investments"
  | "Insurance"
  | "Safety"
  | "Goals";

export type AdvisorReport = {
  executiveSummary: string;
  summaryReport: {
    headline: string;
    highlights: { label: string; detail: string }[];
  };
  riskWarnings: { severity: "high" | "medium" | "low"; title: string; detail: string }[];
  planOfAction: {
    priority: number;
    category: AdvisorCategory;
    impact: "High" | "Medium" | "Low";
    action: string;
    rationale: string;
    monthlyAmount: number | null;
  }[];
  immediateActions: {
    priority: number;
    action: string;
    rationale: string;
    monthlyAmount: number | null;
  }[];
  debtStrategy: {
    summary: string;
    steps: { order: number; loan: string; action: string; reason: string }[];
    expectedDebtFreeMonth: number;
  };
  investmentStrategy: {
    status: "continue" | "pause" | "resume" | "review";
    resumeTrigger: string;
    monthlyAmountWhenResumed: number | null;
    rationale: string;
  };
  emiTweaks: {
    loan: string;
    change: string;
    monthlyExtra: number;
    estimatedMonthsSaved: number | null;
    estimatedInterestSaved: number | null;
    caveat: string;
  }[];
  assumptions: string[];
  disclaimer: string;
};

export type AdvisorSource = "openai" | "cache" | "rules";

export type AdvisorResult = {
  advice: AdvisorReport;
  source: AdvisorSource;
  generatedAt?: string;
};

const CATEGORIES: AdvisorCategory[] = [
  "Emergency Fund",
  "Debt",
  "Expenses",
  "Savings",
  "Investments",
  "Insurance",
  "Safety",
  "Goals",
];

function asCategory(value: string): AdvisorCategory {
  return CATEGORIES.includes(value as AdvisorCategory) ? (value as AdvisorCategory) : "Goals";
}

export function buildLocalAdvisorReport(data: FinanceData): AdvisorReport {
  const recs = [...emergencyFundRecommendations(data), ...generateRecommendations(data)];
  const hs = healthScore(data);
  const fi = financialFreedom(data);
  const cur = data.profile.currency;
  const surplus = monthlySavings(data);
  const avalanche = prepaymentStrategy(data);
  const top = recs[0];

  const planOfAction = recs.slice(0, 12).map((rec, index) => ({
    priority: index + 1,
    category: asCategory(rec.category),
    impact: rec.impact,
    action: rec.title,
    rationale: rec.detail,
    monthlyAmount: null,
  }));

  return {
    executiveSummary: top
      ? `${top.title}. ${top.detail} Freedom target is around ${fi.fiDate.getFullYear()} (${fi.yearsRemaining} years).`
      : `Your numbers are in a stable range. Freedom target is around ${fi.fiDate.getFullYear()}.`,
    summaryReport: {
      headline: top?.title ?? "Stay the course",
      highlights: [
        ...hs.components.slice(0, 4).map((component) => ({
          label: component.label,
          detail: `${component.score}/100 · ${component.detail}`,
        })),
        {
          label: "Freedom",
          detail: `${fi.fiDate.getFullYear()} · ${fi.yearsRemaining}y remaining`,
        },
      ].slice(0, 6),
    },
    riskWarnings: recs
      .filter((rec) => rec.impact === "High")
      .slice(0, 5)
      .map((rec) => ({
        severity: "high" as const,
        title: rec.title,
        detail: rec.detail,
      })),
    planOfAction: planOfAction.length
      ? planOfAction
      : [
          {
            priority: 1,
            category: "Savings" as const,
            impact: "Low" as const,
            action: "Keep current contributions on track",
            rationale: "No high-priority rule fired from the local checklist.",
            monthlyAmount: surplus > 0 ? surplus : null,
          },
        ],
    immediateActions: planOfAction.slice(0, 6).map(({ priority, action, rationale, monthlyAmount }) => ({
      priority,
      action,
      rationale,
      monthlyAmount,
    })),
    debtStrategy: {
      summary: avalanche.length
        ? `Avalanche: prepay ${avalanche[0].name} first at ${avalanche[0].interestRate}%.`
        : "No active loans on file.",
      steps: avalanche.map((loan, index) => ({
        order: index + 1,
        loan: loan.name,
        action: index === 0 ? "Channel surplus here after minimum EMIs" : "Pay scheduled EMI only",
        reason: `${loan.interestRate}% interest · ${formatCurrency(loan.outstanding, cur, true)} outstanding`,
      })),
      expectedDebtFreeMonth: avalanche[0]?.remainingTenure ?? 0,
    },
    investmentStrategy: {
      status: recs.some((rec) => rec.category === "Emergency Fund" && rec.impact === "High") ? "pause" : "continue",
      resumeTrigger: "After the emergency fund is at target and the highest-rate loan is under control",
      monthlyAmountWhenResumed: data.investments.reduce((sum, item) => sum + item.monthlySip, 0) || null,
      rationale: "Local rules pause aggressive investing only while the emergency fund is critically low.",
    },
    emiTweaks: avalanche.slice(0, 1).map((loan) => ({
      loan: loan.name,
      change: surplus > 0 ? "Add available monthly surplus as a prepayment" : "Keep paying the scheduled EMI",
      monthlyExtra: Math.max(0, surplus),
      estimatedMonthsSaved: null,
      estimatedInterestSaved: null,
      caveat: "Confirm lender prepayment rules before sending extra amounts.",
    })),
    assumptions: [
      "Income, expenses, and EMIs stay at the current monthly levels.",
      "Local rule thresholds: 25% savings rate, 35% DTI, 6–12 month emergency fund.",
    ],
    disclaimer: "General guidance from the in-app rule engine, not personalised regulated advice. Consult a qualified adviser before acting.",
  };
}

export async function fetchAdvisorReport(
  data: FinanceData,
  refresh = false,
): Promise<AdvisorResult> {
  if (!getAccessToken() && !getRefreshToken()) {
    return { advice: buildLocalAdvisorReport(data), source: "rules" };
  }

  try {
    const path = refresh ? "/api/advisor/report?refresh=1" : "/api/advisor/report";
    const result = await api<{
      advice: AdvisorReport;
      source: "openai" | "cache";
      generatedAt?: string;
    }>(path, {
      method: "POST",
      signal: AbortSignal.timeout(110_000),
    });
    return {
      advice: result.advice,
      source: result.source,
      generatedAt: result.generatedAt,
    };
  } catch (error) {
    if (error instanceof ApiError && [502, 503, 504].includes(error.status)) {
      return { advice: buildLocalAdvisorReport(data), source: "rules" };
    }
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      return { advice: buildLocalAdvisorReport(data), source: "rules" };
    }
    throw error;
  }
}

const ADVISOR_QUERY_KEY = ["advisor-report"] as const;

export function useAdvisorReport(data: FinanceData, enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ADVISOR_QUERY_KEY,
    queryFn: () => fetchAdvisorReport(data, false),
    enabled,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const regenerate = useMutation({
    mutationFn: () => fetchAdvisorReport(data, true),
    onSuccess: (result) => {
      queryClient.setQueryData(ADVISOR_QUERY_KEY, result);
    },
  });

  return {
    ...query,
    regenerate: regenerate.mutateAsync,
    isRegenerating: regenerate.isPending,
  };
}
