import { api, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth/store";

export const CALCULATOR_TYPES = [
  "lumpsum",
  "sip",
  "step_up_sip",
  "emi",
  "loan",
  "future",
  "depreciation",
  "currency",
  "number_words",
  "bond_yield",
  "stock",
  "irr",
] as const;

export type CalculatorType = (typeof CALCULATOR_TYPES)[number];
export type DepreciationMethod = "straight_line" | "written_down_value";

type GrowthInput = {
  annualRatePct: number;
  years: number;
};

export type CalculatorInput =
  | (GrowthInput & { type: "lumpsum"; principal: number })
  | (GrowthInput & { type: "sip"; monthlyContribution: number })
  | (GrowthInput & {
      type: "step_up_sip";
      monthlyContribution: number;
      annualStepUpPct: number;
    })
  | { type: "emi"; principal: number; annualRatePct: number; months: number }
  | {
      type: "loan";
      principal: number;
      annualRatePct: number;
      months: number;
      monthlyPayment?: number;
      prepaymentAmount?: number;
      increasedMonthlyPayment?: number;
    }
  | (GrowthInput & { type: "future"; targetAmount: number })
  | {
      type: "depreciation";
      method: DepreciationMethod;
      cost: number;
      salvageValue: number;
      usefulLifeYears: number;
      ratePct?: number;
    }
  | {
      type: "currency";
      amount: number;
      exchangeRate: number;
      targetCurrency: string;
    }
  | { type: "number_words"; number: number }
  | {
      type: "bond_yield";
      faceValue: number;
      marketPrice: number;
      annualCouponRatePct: number;
      yearsToMaturity: number;
      paymentsPerYear: 1 | 2 | 4;
    }
  | {
      type: "stock";
      buyPrice: number;
      sellPrice: number;
      quantity: number;
      dividends: number;
      fees: number;
    }
  | { type: "irr"; cashFlows: number[] };

export type CalculatorResult = {
  type: CalculatorType;
  values: Record<string, number>;
  schedule?: Array<Record<string, number>>;
  monthlySchedule?: Array<Record<string, number>>;
  textValues?: Record<string, string>;
  notes: string[];
};

export type CalculatorScenario = {
  id: string;
  type: CalculatorType;
  title: string;
  input: CalculatorInput;
  result: CalculatorResult;
  createdAt: string;
  updatedAt: string;
};

function requireAuth() {
  if (!getAccessToken()) {
    throw new Error("Not signed in");
  }
}

export async function previewCalculator(
  input: CalculatorInput,
): Promise<CalculatorResult> {
  requireAuth();
  const response = await api<{ result: CalculatorResult }>(
    "/api/calculators/preview",
    { method: "POST", body: input },
  );
  return response.result;
}

export async function listCalculatorScenarios(): Promise<CalculatorScenario[]> {
  requireAuth();
  const response = await api<{ items: CalculatorScenario[] }>(
    "/api/calculators?limit=50",
  );
  return response.items;
}

export async function saveCalculatorScenario(
  title: string,
  input: CalculatorInput,
): Promise<CalculatorScenario> {
  requireAuth();
  const response = await api<{ scenario: CalculatorScenario }>(
    "/api/calculators",
    { method: "POST", body: { ...input, title: title.trim() || undefined } },
  );
  return response.scenario;
}

export async function updateCalculatorScenario(
  id: string,
  title: string,
  input: CalculatorInput,
): Promise<CalculatorScenario> {
  requireAuth();
  const response = await api<{ scenario: CalculatorScenario }>(
    `/api/calculators/${id}`,
    { method: "PATCH", body: { ...input, title: title.trim() || undefined } },
  );
  return response.scenario;
}

export async function removeCalculatorScenario(id: string): Promise<void> {
  requireAuth();
  await api("/api/calculators/remove", {
    method: "POST",
    body: { id },
  });
}

export function calculatorApiError(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return "Calculator request failed";
}
