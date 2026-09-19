import { describe, expect, it } from "vitest";
import { buildLocalAdvisorReport } from "./advisor";
import { buildReport, pdfSafe } from "./pdfReport";
import type { FinanceData } from "@/types/finance";

const sample: FinanceData = {
  profile: {
    name: "Asha",
    age: 34,
    retirementAge: 60,
    currency: "₹",
    inflationRate: 6,
    emergencyFund: 2_00_000,
    dependents: 1,
    familyMembers: [],
    employmentType: "Salaried",
    monthlyEssentialExpenses: 40_000,
    liquidAssets: 50_000,
    emergencyMonthlyContribution: 5_000,
    dailyBudget: 0,
  },
  incomes: [
    { id: "i1", name: "Salary", type: "Salary", monthlyAmount: 1_50_000, growthRate: 8, startDate: "2020-01-01" },
  ],
  expenses: [
    { id: "e1", name: "Rent", category: "House Rent / EMI", amount: 30_000, recurring: true, date: "2024-01-01" },
  ],
  loans: [
    {
      id: "l1",
      name: "Home",
      type: "Home Loan",
      outstanding: 20_00_000,
      interestRate: 8,
      emi: 20_000,
      remainingTenure: 120,
      emiDay: 1,
      prepaymentAllowed: true,
    },
  ],
  creditCards: [],
  investments: [
    {
      id: "v1",
      name: "Index",
      type: "Mutual Funds",
      currentValue: 5_00_000,
      monthlySip: 15_000,
      expectedReturn: 12,
      horizon: 20,
    },
  ],
  insurances: [],
  goals: [
    {
      id: "g1",
      name: "Emergency Fund",
      type: "Emergency Fund",
      targetAmount: 4_00_000,
      targetDate: "2027-01-01",
      priority: "High",
      currentSaved: 2_00_000,
    },
  ],
  dailyExpenses: [],
};

describe("pdfSafe", () => {
  it("converts rupee and dash characters jsPDF cannot encode", () => {
    expect(pdfSafe("Use ₹50,013 against the highest‑rate loan")).toBe(
      "Use Rs.50,013 against the highest-rate loan",
    );
  });
});

describe("buildReport", () => {
  it("keeps the summary on a single page", () => {
    const advice = buildLocalAdvisorReport(sample);
    const doc = buildReport(sample, { advice, source: "rules" });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});

