/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FinanceData } from "@/types/finance";

const data: FinanceData = {
  profile: {
    name: "Test",
    age: 32,
    retirementAge: 60,
    currency: "₹",
    inflationRate: 6,
    emergencyFund: 0,
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
      monthlyAmount: 1_00_000,
      growthRate: 8,
      startDate: "2024-01-01",
    },
  ],
  expenses: [
    {
      id: "exp-1",
      name: "Rent",
      category: "House Rent / EMI",
      amount: 80_000,
      recurring: true,
      date: "2024-01-01",
    },
  ],
  loans: [
    {
      id: "loan-1",
      name: "Home loan",
      type: "Home Loan",
      outstanding: 20_00_000,
      interestRate: 8.4,
      emi: 30_000,
      remainingTenure: 180,
      emiDay: 5,
      prepaymentAllowed: true,
    },
  ],
  creditCards: [],
  investments: [
    {
      id: "inv-1",
      name: "Nifty index",
      type: "Mutual Funds",
      currentValue: 4_00_000,
      monthlySip: 5_000,
      expectedReturn: 12,
      horizon: 15,
    },
  ],
  insurances: [],
  goals: [
    {
      id: "goal-1",
      name: "Emergency fund",
      type: "Emergency Fund",
      targetAmount: 6_00_000,
      targetDate: "2027-01-01",
      priority: "High",
      currentSaved: 0,
    },
  ],
  dailyExpenses: [],
};

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data, loading: false }),
}));

const { Dashboard } = await import("./Dashboard");

describe("Dashboard", () => {
  beforeEach(() => {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  });

  it("explains the net-worth path and health-score checks", () => {
    render(<Dashboard onNavigate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Projected net worth (Moderate)" })).toBeInTheDocument();
    expect(screen.getByText(/SIPs keep investing at your stated returns/)).toBeInTheDocument();
    expect(screen.getByText(/Monthly surplus is/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Financial health score" })).toBeInTheDocument();
    expect(screen.getByText(/A 0 means that check failed/)).toBeInTheDocument();
    expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
    expect(screen.getByText(/of recommended/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Debt paydown" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "This month" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Safety & freedom" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Focus next" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Goal progress" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "If markets vary" })).toBeInTheDocument();
    expect(screen.getByText("Take-home")).toBeInTheDocument();
    expect(screen.getByText(/Day 5/)).toBeInTheDocument();
    expect(screen.getByText("Conservative")).toBeInTheDocument();
    expect(screen.getByText("Aggressive")).toBeInTheDocument();
  });
});
