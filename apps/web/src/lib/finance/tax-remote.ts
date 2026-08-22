import { api, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth/store";

function requireAuth() {
  if (!getAccessToken()) {
    throw new Error("Not signed in");
  }
}

export type TaxSlab = { upTo: number | null; rate: number };

export type TaxDeductionCode =
  | "section80C"
  | "section80D"
  | "hraExemption"
  | "homeLoanInterest"
  | "nps80Ccd"
  | "employerNps80Ccd2"
  | "section80E"
  | "section80Eea"
  | "section80Gg"
  | "section80Tta"
  | "otherDeductions";

export type TaxDeductionGroup = "exemption" | "chapterVia";

export type TaxDeduction = {
  code: TaxDeductionCode;
  label: string;
  group: TaxDeductionGroup;
  cap?: number;
  salaryCapRate?: number;
  hint?: string;
};

export type TaxRegimeKind = "old" | "new" | "single";

export type TaxRegime = {
  code: string;
  countryCode: string;
  label: string;
  kind: TaxRegimeKind;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  standardDeduction: number;
  slabs: TaxSlab[];
  deductions: TaxDeduction[];
  notes: string[];
};

export type TaxCountry = {
  code: string;
  name: string;
  currency: string;
  regimes: TaxRegime[];
};

export type TaxDeductionAmounts = Partial<Record<TaxDeductionCode, number>>;

/** Typed as a full Record so a new code cannot be added without listing it here. */
const DEDUCTION_CODE_KEYS: Record<TaxDeductionCode, true> = {
  section80C: true,
  section80D: true,
  hraExemption: true,
  homeLoanInterest: true,
  nps80Ccd: true,
  employerNps80Ccd2: true,
  section80E: true,
  section80Eea: true,
  section80Gg: true,
  section80Tta: true,
  otherDeductions: true,
};

export const TAX_DEDUCTION_CODES = Object.keys(
  DEDUCTION_CODE_KEYS,
) as TaxDeductionCode[];

/** Keeps only the deduction sections of a saved scenario's input. */
export function taxDeductionAmountsOf(source: Record<string, unknown>): TaxDeductionAmounts {
  const amounts: TaxDeductionAmounts = {};
  for (const code of TAX_DEDUCTION_CODES) {
    const value = source[code];
    if (typeof value === "number") {
      amounts[code] = value;
    }
  }
  return amounts;
}

export type TaxPlanInput = TaxDeductionAmounts & {
  countryCode: string;
  regimeCode: string;
  grossSalary: number;
  otherIncome: number;
  title?: string;
};

export type TaxDeductionLine = {
  code: TaxDeductionCode;
  label: string;
  group: TaxDeductionGroup;
  entered: number;
  allowed: number;
  capped: boolean;
};

export type TaxPlanResult = {
  countryCode: string;
  regimeCode: string;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  grossIncome: number;
  standardDeduction: number;
  exemptions: number;
  grossTotalIncome: number;
  chapterViaDeductions: number;
  deductionLines: TaxDeductionLine[];
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate: number;
  taxAfterRebate: number;
  surcharge: number;
  cessRate: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  monthlyTax: number;
  takeHomeAnnual: number;
  takeHomeMonthly: number;
  slabs: Array<{ from: number; to: number | null; rate: number; taxableInSlab: number; tax: number }>;
  notes: string[];
};

export type TaxCompareInput = TaxDeductionAmounts & {
  countryCode: string;
  financialYear: string;
  grossSalary: number;
  otherIncome: number;
  planned?: TaxDeductionAmounts;
};

export type TaxComparisonColumnKey = "old" | "new" | "single" | "planner";

export type TaxComparisonColumn = {
  key: TaxComparisonColumnKey;
  label: string;
  regimeCode: string;
  regimeLabel: string;
  result: TaxPlanResult;
};

export type TaxComparisonRowKind =
  | "income"
  | "exemption"
  | "section"
  | "deduction"
  | "subtotal"
  | "tax"
  | "total";

export type TaxComparisonRow = {
  key: string;
  label: string;
  kind: TaxComparisonRowKind;
  values: Array<number | null>;
};

export type TaxComparison = {
  countryCode: string;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  columns: TaxComparisonColumn[];
  rows: TaxComparisonRow[];
  bestColumnKey: TaxComparisonColumnKey;
  bestTotalTax: number;
  notes: string[];
};

export type TaxScenario = {
  id: string;
  countryCode: string;
  regimeCode: string;
  financialYear: string;
  assessmentYear: string;
  title: string;
  input: TaxPlanInput;
  result: TaxPlanResult;
  createdAt: string;
};

export async function fetchTaxCatalog(): Promise<TaxCountry[]> {
  requireAuth();
  const result = await api<{ countries: TaxCountry[] }>("/api/tax/catalog");
  return result.countries;
}

export async function previewTaxPlan(input: TaxPlanInput): Promise<TaxPlanResult> {
  requireAuth();
  const result = await api<{ result: TaxPlanResult }>("/api/tax/preview", {
    method: "POST",
    body: input,
  });
  return result.result;
}

export async function compareTaxPlans(input: TaxCompareInput): Promise<TaxComparison> {
  requireAuth();
  const result = await api<{ comparison: TaxComparison }>("/api/tax/compare", {
    method: "POST",
    body: input,
  });
  return result.comparison;
}

export async function listTaxScenarios(): Promise<TaxScenario[]> {
  requireAuth();
  const result = await api<{ items: TaxScenario[] }>("/api/tax/scenarios?limit=50");
  return result.items;
}

export async function saveTaxScenario(input: TaxPlanInput): Promise<TaxScenario> {
  requireAuth();
  const result = await api<{ scenario: TaxScenario }>("/api/tax/scenarios", {
    method: "POST",
    body: input,
  });
  return result.scenario;
}

export async function removeTaxScenario(id: string): Promise<void> {
  requireAuth();
  await api("/api/tax/scenarios/remove", { method: "POST", body: { id } });
}

export function taxApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
}

export function currencySymbol(code: string): string {
  if (code === "USD") return "$";
  if (code === "GBP") return "£";
  return "₹";
}

export type TaxFinancialYear = {
  financialYear: string;
  assessmentYear: string;
  regimes: TaxRegime[];
};

/** Groups a country's regimes by financial year, newest first. */
export function taxFinancialYears(country: TaxCountry | undefined): TaxFinancialYear[] {
  if (!country) return [];

  const years = new Map<string, TaxFinancialYear>();
  for (const regime of country.regimes) {
    const existing = years.get(regime.financialYear);
    if (existing) {
      existing.regimes.push(regime);
      continue;
    }
    years.set(regime.financialYear, {
      financialYear: regime.financialYear,
      assessmentYear: regime.assessmentYear,
      regimes: [regime],
    });
  }

  return [...years.values()].sort((a, b) => b.financialYear.localeCompare(a.financialYear));
}

/**
 * Every section claimable in at least one regime of the year, so the form can
 * collect amounts before the user knows which regime wins.
 */
export function taxDeductionsForYear(year: TaxFinancialYear | undefined): TaxDeduction[] {
  if (!year) return [];

  const byCode = new Map<TaxDeductionCode, TaxDeduction>();
  for (const regime of year.regimes) {
    for (const deduction of regime.deductions) {
      if (!byCode.has(deduction.code)) {
        byCode.set(deduction.code, deduction);
      }
    }
  }

  const all = [...byCode.values()];
  return [
    ...all.filter((item) => item.group === "exemption"),
    ...all.filter((item) => item.group === "chapterVia"),
  ];
}

/** Regimes that allow a section, for showing where an amount actually counts. */
export function taxRegimesAllowing(
  year: TaxFinancialYear | undefined,
  code: TaxDeductionCode,
): TaxRegime[] {
  if (!year) return [];
  return year.regimes.filter((regime) =>
    regime.deductions.some((deduction) => deduction.code === code),
  );
}
