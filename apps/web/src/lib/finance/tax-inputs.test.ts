import { describe, expect, it } from "vitest";
import { savedTaxInputs } from "./tax-inputs";
import { sampleData } from "./sampleData";
import type { FinanceData } from "@/types/finance";

describe("savedTaxInputs", () => {
  it("is empty when nothing is saved", () => {
    const empty: FinanceData = { ...sampleData, incomes: [], investments: [], insurances: [] };
    expect(savedTaxInputs(empty)).toEqual({ grossSalary: 0, otherIncome: 0, actual: {}, sources: [] });
  });

  it("annualises salary and maps premiums and contributions to deductions", () => {
    const data: FinanceData = {
      ...sampleData,
      incomes: [
        { id: "1", name: "Job", type: "Salary", monthlyAmount: 100_000, growthRate: 0, startDate: "2024-01-01" },
        { id: "2", name: "Rent", type: "Rental Income", monthlyAmount: 10_000, growthRate: 0, startDate: "2024-01-01" },
      ],
      investments: [
        { id: "a", name: "PPF", type: "PPF", currentValue: 0, monthlySip: 5_000, expectedReturn: 7, horizon: 10 },
        { id: "b", name: "NPS", type: "NPS", currentValue: 0, monthlySip: 4_000, expectedReturn: 9, horizon: 10 },
      ],
      insurances: [
        { id: "i", name: "Health", type: "Health Insurance", coverage: 1_000_000, annualPremium: 20_000, expiryDate: "2027-01-01" },
        { id: "t", name: "Term", type: "Term Insurance", coverage: 10_000_000, annualPremium: 12_000, expiryDate: "2040-01-01" },
      ],
    };
    const out = savedTaxInputs(data);
    expect(out.grossSalary).toBe(1_200_000);
    expect(out.otherIncome).toBe(120_000);
    expect(out.actual).toEqual({ section80C: 72_000, section80D: 20_000, nps80Ccd: 48_000 });
  });
});
