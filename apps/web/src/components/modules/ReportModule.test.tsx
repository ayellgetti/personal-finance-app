/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FinanceData } from "@/types/finance";
import { buildLocalAdvisorReport } from "@/lib/finance/advisor";

const data: FinanceData = {
  profile: {
    name: "Test",
    age: 32,
    retirementAge: 60,
    currency: "₹",
    inflationRate: 6,
    emergencyFund: 1_20_000,
    dependents: 0,
    familyMembers: [],
    employmentType: "Salaried",
    monthlyEssentialExpenses: 0,
    liquidAssets: 0,
    emergencyMonthlyContribution: 0,
    dailyBudget: 0,
  },
  incomes: [
    {
      id: "inc-1",
      name: "Take-home",
      type: "Salary",
      monthlyAmount: 1_40_000,
      growthRate: 8,
      startDate: "2024-01-01",
    },
  ],
  expenses: [
    {
      id: "exp-1",
      name: "Groceries",
      category: "Groceries",
      amount: 12_000,
      recurring: true,
      date: "2024-01-01",
    },
  ],
  loans: [
    {
      id: "loan-1",
      name: "Home loan",
      type: "Home Loan",
      outstanding: 24_00_000,
      interestRate: 8.4,
      emi: 22_000,
      remainingTenure: 180,
      emiDay: 5,
      prepaymentAllowed: true,
    },
  ],
  creditCards: [
    {
      id: "card-1",
      name: "HDFC Millennia",
      network: "Visa",
      creditLimit: 2_00_000,
      outstanding: 18_000,
      interestRate: 36,
      dueDay: 12,
      minimumDue: 2_000,
    },
  ],
  investments: [
    {
      id: "inv-1",
      name: "Nifty index",
      type: "Mutual Funds",
      currentValue: 4_50_000,
      monthlySip: 10_000,
      expectedReturn: 12,
      horizon: 15,
    },
  ],
  insurances: [
    {
      id: "ins-1",
      name: "Term cover",
      type: "Term Insurance",
      coverage: 1_00_00_000,
      annualPremium: 12_000,
      expiryDate: "2035-01-01",
    },
  ],
  goals: [
    {
      id: "goal-1",
      name: "Emergency fund",
      type: "Emergency Fund",
      targetAmount: 6_00_000,
      targetDate: "2027-01-01",
      priority: "High",
      currentSaved: 1_20_000,
    },
  ],
  dailyExpenses: [],
};

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data, loading: false }),
}));

vi.mock("@/lib/finance/advisor", async () => {
  const actual = await vi.importActual<typeof import("@/lib/finance/advisor")>("@/lib/finance/advisor");
  return {
    ...actual,
    useAdvisorReport: () => ({
      data: { advice: actual.buildLocalAdvisorReport(data), source: "rules" as const },
      isLoading: false,
      canRefresh: true,
      isRegenerating: false,
      requestRefresh: vi.fn(),
      paywallOpen: false,
      setPaywallOpen: vi.fn(),
      quota: undefined,
    }),
  };
});

const { ReportModule } = await import("./ReportModule");

describe("ReportModule", () => {
  it("shows household, goals, and AI sections on one page", () => {
    render(<ReportModule />);

    expect(screen.getByRole("heading", { name: "Executive Summary Report" })).toBeInTheDocument();
    for (const title of [
      "Current Position",
      "Income",
      "Expenses",
      "Loans",
      "Credit Cards",
      "Investments",
      "Insurance",
      "Achievable Goals",
      "Goals At Risk",
      "AI Summary Report",
      "Plan of action",
      "Debt Payoff Sequence",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getByText("Take-home")).toBeInTheDocument();
    expect(screen.getByText("Nifty index")).toBeInTheDocument();
    expect(screen.getByText("Term cover")).toBeInTheDocument();
    expect(screen.getByText("HDFC Millennia")).toBeInTheDocument();
    expect(buildLocalAdvisorReport(data).summaryReport.headline).toBeTruthy();
  });
});
