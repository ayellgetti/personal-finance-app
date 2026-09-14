/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FinanceData, Loan } from "@/types/finance";

const personal: Loan = {
  id: "personal",
  name: "Personal Loan",
  type: "Personal Loan",
  outstanding: 220_000,
  interestRate: 13.5,
  emi: 11_200,
  remainingTenure: 22,
  emiDay: 5,
  prepaymentAllowed: true,
};

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
  incomes: [],
  expenses: [],
  loans: [personal],
  creditCards: [],
  investments: [],
  insurances: [],
  goals: [],
  dailyExpenses: [],
};

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({
    data,
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    loading: false,
  }),
  newId: () => "loan-1",
}));

const { LoanModule } = await import("./LoanModule");

describe("LoanModule", () => {
  it("shows a payoff timeline when loans exist", () => {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);

    render(<LoanModule />);

    expect(screen.getByText("When loans end")).toBeInTheDocument();
    expect(screen.getByText("Outstanding until close")).toBeInTheDocument();
    expect(screen.getByText("Loan Portfolio")).toBeInTheDocument();
    expect(screen.getByText("What extra payments save on Personal Loan")).toBeInTheDocument();
    expect(screen.getByText(/Pay one extra EMI of/)).toBeInTheDocument();
    expect(screen.getByText(/Raise EMI by 5%/)).toBeInTheDocument();
    expect(screen.getByText(/Raise EMI by 10%/)).toBeInTheDocument();
  });
});
