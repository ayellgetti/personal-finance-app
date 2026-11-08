import type { FinanceData, FreedomMode, InvestmentType } from "@/types/finance";
import { FREEDOM_EXPENSE_MULTIPLES } from "@/types/finance";
import {
  freedomTargets,
  fvLumpSum,
  fvSIP,
  pmtForFV,
  type FreedomInputs,
} from "./calculations";

/**
 * India-aware retirement model. Every number here is an editable assumption and the
 * defaults are rules of thumb that an adviser should confirm before launch.
 */
export interface RetirementAssumptions {
  /** Share of retirement spending that is healthcare. */
  healthShare: number;
  /** Annual inflation applied to that healthcare share; never lower than general inflation. */
  healthInflation: number;
  /** Annual rate an annuity pays on the NPS amount that must be annuitised. */
  annuityRate: number;
  /** Fallback annual returns (%) for EPF, PPF and NPS holdings that have no return entered. */
  epfReturn: number;
  ppfReturn: number;
  npsReturn: number;
  includeGratuity: boolean;
}

export const DEFAULT_RETIREMENT_ASSUMPTIONS: RetirementAssumptions = {
  healthShare: 15,
  healthInflation: 8,
  annuityRate: 6,
  epfReturn: 8.25,
  ppfReturn: 7.1,
  npsReturn: 9,
  includeGratuity: true,
};

/** NPS rules: at least 40% of the corpus must buy an annuity; up to 60% can be taken as a lump sum. */
export const NPS_ANNUITY_SHARE = 0.4;
/** Gratuity assumptions: basic pay as a share of salary, career start age, and the statutory payment cap. */
export const GRATUITY_BASIC_SHARE = 0.4;
export const CAREER_START_AGE = 22;
export const GRATUITY_MIN_YEARS = 5;
export const GRATUITY_CAP = 2_000_000;

export type SourceGroup = "EPF" | "PPF" | "NPS" | "Market investments" | "Fixed income" | "Gold and property" | "Other";

const GROUP_OF: Record<InvestmentType, SourceGroup> = {
  EPF: "EPF",
  PPF: "PPF",
  NPS: "NPS",
  "Mutual Funds": "Market investments",
  Stocks: "Market investments",
  Crypto: "Market investments",
  "Fixed Deposits": "Fixed income",
  Bonds: "Fixed income",
  Gold: "Gold and property",
  "Real Estate": "Gold and property",
  Other: "Other",
};

export interface SourceCorpus {
  group: SourceGroup;
  value: number;
}

export interface IndiaRetirementView {
  years: number;
  sources: SourceCorpus[];
  gratuity: number;
  /** Spendable lump sum at retirement: everything except the NPS amount locked into an annuity, plus gratuity. */
  countedCorpus: number;
  /** NPS amount that must buy an annuity. */
  npsAnnuityCorpus: number;
  /** Yearly pension that annuity pays at retirement. */
  annuityIncomePerYear: number;
  annualExpensesAtRetirement: number;
  /** Annual expenses at retirement with healthcare inflated faster, less the annuity pension. */
  adjustedAnnualNeed: number;
  genericTarget: number;
  indiaTarget: number;
  shortfall: number;
  requiredMonthlyInvestment: number;
  /** Extra corpus the faster healthcare inflation adds to the generic number. */
  healthcareExtra: number;
}

function returnFor(type: InvestmentType, own: number, a: RetirementAssumptions): number {
  if (own > 0) return own;
  if (type === "EPF") return a.epfReturn;
  if (type === "PPF") return a.ppfReturn;
  if (type === "NPS") return a.npsReturn;
  return own;
}

/** Gratuity at retirement for a salaried user; 0 for everyone else. Capped at the statutory limit. */
export function estimateGratuity(d: FinanceData, retirementAge: number, years: number): number {
  if (d.profile.employmentType !== "Salaried") return 0;
  const salaries = d.incomes.filter((i) => i.type === "Salary");
  const monthly = salaries.reduce((sum, i) => sum + i.monthlyAmount, 0);
  if (monthly <= 0) return 0;
  const growth = salaries.reduce((sum, i) => sum + i.growthRate * i.monthlyAmount, 0) / monthly;
  const serviceYears = Math.max(0, retirementAge - CAREER_START_AGE);
  if (serviceYears < GRATUITY_MIN_YEARS) return 0;
  const lastBasic = monthly * GRATUITY_BASIC_SHARE * Math.pow(1 + growth / 100, years);
  return Math.min(GRATUITY_CAP, (lastBasic * 15 * serviceYears) / 26);
}

export function indiaRetirementView(
  d: FinanceData,
  input: FreedomInputs,
  mode: FreedomMode,
  assumptions: RetirementAssumptions = DEFAULT_RETIREMENT_ASSUMPTIONS,
): IndiaRetirementView {
  const targets = freedomTargets(input);
  const years = targets.yearsToRetirement;
  const multiple = FREEDOM_EXPENSE_MULTIPLES[mode === "Coast FIRE" ? "FIRE" : mode];

  const byGroup = new Map<SourceGroup, number>();
  for (const inv of d.investments) {
    const rate = returnFor(inv.type, inv.expectedReturn, assumptions);
    const value = fvLumpSum(inv.currentValue, rate, years) + fvSIP(inv.monthlySip, rate, years);
    const group = GROUP_OF[inv.type];
    byGroup.set(group, (byGroup.get(group) ?? 0) + value);
  }
  const sources = [...byGroup.entries()].map(([group, value]) => ({ group, value })).sort((a, b) => b.value - a.value);

  const nps = byGroup.get("NPS") ?? 0;
  const npsAnnuityCorpus = nps * NPS_ANNUITY_SHARE;
  const annuityIncomePerYear = npsAnnuityCorpus * (assumptions.annuityRate / 100);
  const gratuity = assumptions.includeGratuity ? estimateGratuity(d, input.retirementAge, years) : 0;
  const total = sources.reduce((sum, s) => sum + s.value, 0);
  const countedCorpus = total - npsAnnuityCorpus + gratuity;

  const today = targets.annualExpensesToday;
  const health = (today * assumptions.healthShare) / 100;
  const rest = today - health;
  const annualExpensesAtRetirement = targets.annualExpensesAtRetirement;
  // Healthcare never inflates slower than everything else, whatever general inflation is set to.
  const healthInflation = Math.max(assumptions.healthInflation, input.inflationRate);
  const adjustedExpenses = fvLumpSum(rest, input.inflationRate, years) + fvLumpSum(health, healthInflation, years);
  const adjustedAnnualNeed = Math.max(0, adjustedExpenses - annuityIncomePerYear);
  const indiaTarget = adjustedAnnualNeed * multiple;
  const genericTarget = annualExpensesAtRetirement * multiple;
  const shortfall = Math.max(0, indiaTarget - countedCorpus);

  return {
    years,
    sources,
    gratuity,
    countedCorpus,
    npsAnnuityCorpus,
    annuityIncomePerYear,
    annualExpensesAtRetirement,
    adjustedAnnualNeed,
    genericTarget,
    indiaTarget,
    shortfall,
    requiredMonthlyInvestment: pmtForFV(shortfall, input.expectedReturn, years),
    healthcareExtra: (adjustedExpenses - annualExpensesAtRetirement) * multiple,
  };
}
