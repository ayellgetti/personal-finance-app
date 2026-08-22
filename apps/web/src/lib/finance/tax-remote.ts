import { api, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth/store";

function requireAuth() {
  if (!getAccessToken()) {
    throw new Error("Not signed in");
  }
}

export type TaxSlab = { upTo: number | null; rate: number };

export type TaxRegime = {
  code: string;
  countryCode: string;
  label: string;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  standardDeduction: number;
  slabs: TaxSlab[];
  notes: string[];
};

export type TaxCountry = {
  code: string;
  name: string;
  currency: string;
  regimes: TaxRegime[];
};

export type TaxPlanInput = {
  countryCode: string;
  regimeCode: string;
  grossSalary: number;
  otherIncome: number;
  section80C?: number;
  section80D?: number;
  hraExemption?: number;
  homeLoanInterest?: number;
  nps80Ccd?: number;
  otherDeductions?: number;
  title?: string;
};

export type TaxPlanResult = {
  countryCode: string;
  regimeCode: string;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  grossIncome: number;
  standardDeduction: number;
  chapterViaDeductions: number;
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate: number;
  taxAfterRebate: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  monthlyTax: number;
  takeHomeAnnual: number;
  takeHomeMonthly: number;
  slabs: Array<{ from: number; to: number | null; rate: number; taxableInSlab: number; tax: number }>;
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
