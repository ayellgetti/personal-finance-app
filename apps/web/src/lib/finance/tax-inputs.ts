import type { FinanceData } from "@/types/finance";
import type { TaxDeductionAmounts } from "./tax-remote";

export interface SavedTaxInputs {
  grossSalary: number;
  otherIncome: number;
  actual: TaxDeductionAmounts;
  /** Plain-language list of what was read from the user's saved data. */
  sources: string[];
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Annualised tax inputs derived from the saved income, insurance and investments. */
export function savedTaxInputs(data: FinanceData): SavedTaxInputs {
  const grossSalary = sum(data.incomes.filter((i) => i.type === "Salary").map((i) => i.monthlyAmount)) * 12;
  const otherIncome = sum(data.incomes.filter((i) => i.type !== "Salary").map((i) => i.monthlyAmount)) * 12;

  const retirementSavings =
    sum(data.investments.filter((i) => i.type === "EPF" || i.type === "PPF").map((i) => i.monthlySip)) * 12;
  const termPremium = sum(data.insurances.filter((i) => i.type === "Term Insurance").map((i) => i.annualPremium));
  const healthPremium = sum(data.insurances.filter((i) => i.type === "Health Insurance").map((i) => i.annualPremium));
  const nps = sum(data.investments.filter((i) => i.type === "NPS").map((i) => i.monthlySip)) * 12;

  const actual: TaxDeductionAmounts = {};
  const sources: string[] = [];
  if (grossSalary > 0 || otherIncome > 0) sources.push("income");
  if (retirementSavings + termPremium > 0) {
    actual.section80C = Math.round(retirementSavings + termPremium);
    sources.push("EPF/PPF and term premium");
  }
  if (healthPremium > 0) {
    actual.section80D = Math.round(healthPremium);
    sources.push("health premium");
  }
  if (nps > 0) {
    actual.nps80Ccd = Math.round(nps);
    sources.push("NPS");
  }
  return { grossSalary, otherIncome, actual, sources };
}
