import type { FinanceData } from "@/types/finance";
import {
  analyzeGoal,
  analyzeInsurance,
  dataReadiness,
  defaultFreedomInputs,
  emergencyFund,
  freedomModeView,
  generateRecommendations,
  healthScore,
  monthlyExpenses,
  monthlyIncome,
  netWorth,
  savingsRate,
  totalAssets,
  totalLiabilities,
} from "./calculations";

/**
 * What a share-link viewer sees. Totals, scores and plan items only: no name, email,
 * date of birth, employer, or individual loan, account or policy details.
 */
export interface PlanSnapshot {
  generatedAt: string;
  currency: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  monthlyIncome: number;
  monthlyBills: number;
  savingsRate: number;
  healthScore: { total: number; components: { label: string; score: number; answered: boolean }[] };
  emergency: { months: number; targetMonths: number };
  freedom: { mode: string; target: number; projectedCorpus: number; targetYear: number } | null;
  goals: { name: string; type: string; targetAmount: number; currentSaved: number; status: string }[];
  nextSteps: { title: string; detail: string }[];
  cover: { termCurrent: number; termRecommended: number; healthCurrent: number; healthRecommended: number };
}

export const SHARE_EXPIRY_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Tips are written for the owner and can quote account names ("Close <loan> first").
 * Replace every known loan, card, investment, policy, income and person name before sharing.
 */
function redactor(data: FinanceData): (text: string) => string {
  const entries: [string, string][] = [
    ...data.loans.map((l): [string, string] => [l.name, "your loan"]),
    ...data.creditCards.map((c): [string, string] => [c.name, "your card"]),
    ...data.investments.map((i): [string, string] => [i.name, "an investment"]),
    ...data.insurances.map((i): [string, string] => [i.name, "a policy"]),
    ...data.incomes.map((i): [string, string] => [i.name, "an income source"]),
    ...data.profile.familyMembers.map((m): [string, string] => [m.name, "a family member"]),
    [data.profile.name, "you"],
  ];
  const rules = entries
    .filter(([name]) => name && name.trim().length >= 3)
    .sort((a, b) => b[0].length - a[0].length)
    .map(([name, label]) => [new RegExp(escapeRegExp(name.trim()), "gi"), label] as const);
  return (text) => rules.reduce((out, [pattern, label]) => out.replace(pattern, label), text);
}

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);
const round = (value: number) => Math.round(value);

/** Null until income and expenses exist: there is nothing honest to share before that. */
export function buildPlanSnapshot(data: FinanceData, now = new Date()): PlanSnapshot | null {
  if (!dataReadiness(data).ready) return null;

  const hs = healthScore(data);
  const ef = emergencyFund(data);
  const ins = analyzeInsurance(data);
  const input = defaultFreedomInputs(data);
  const view = freedomModeView(data, input, "FIRE");
  const hasIncome = dataReadiness(data).hasIncome;
  const redact = redactor(data);

  return {
    generatedAt: now.toISOString(),
    currency: clip(data.profile.currency || "₹", 8),
    netWorth: round(netWorth(data)),
    assets: round(totalAssets(data)),
    liabilities: round(totalLiabilities(data)),
    monthlyIncome: round(monthlyIncome(data)),
    monthlyBills: round(monthlyExpenses(data)),
    savingsRate: round(savingsRate(data)),
    healthScore: {
      total: hs.total,
      components: hs.components.map((c) => ({ label: clip(c.label, 60), score: c.score, answered: c.answered })),
    },
    emergency: { months: Math.round(ef.coverageMonths * 10) / 10, targetMonths: ef.targetMonths },
    freedom:
      view.target > 0
        ? {
            mode: "FIRE",
            target: round(view.target),
            projectedCorpus: round(view.projectedCorpus),
            targetYear: now.getFullYear() + Math.ceil(view.yearsToTarget),
          }
        : null,
    goals: data.goals.slice(0, 20).map((goal) => {
      const analysis = analyzeGoal(data, goal);
      return {
        name: clip(goal.name || goal.type, 80),
        type: clip(goal.type, 40),
        targetAmount: round(analysis.goal.targetAmount),
        currentSaved: round(analysis.goal.currentSaved),
        status: analysis.status,
      };
    }),
    nextSteps: generateRecommendations(data)
      .slice(0, 5)
      .map((rec) => ({ title: clip(redact(rec.title), 120), detail: clip(redact(rec.detail), 400) })),
    cover: {
      termCurrent: round(ins.currentTermCover),
      termRecommended: hasIncome ? round(ins.recommendedTermCover) : 0,
      healthCurrent: round(ins.currentHealthCover),
      healthRecommended: round(ins.recommendedHealthCover),
    },
  };
}

export interface PlanShare {
  id: string;
  label: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  lastViewedAt?: string | null;
}

export interface SharedPlan {
  label: string;
  expiresAt: string;
  snapshot: PlanSnapshot;
}

/** The link a recipient opens. Built from the current origin so it works in every environment. */
export function shareUrl(token: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/shared/${token}`;
}
