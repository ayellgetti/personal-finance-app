/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { FinanceData } from "@/types/finance";

const updateProfile = vi.fn();

const data: FinanceData = {
  profile: {
    name: "Test",
    age: 20,
    retirementAge: 40,
    currency: "₹",
    inflationRate: 10,
    emergencyFund: 0,
    dependents: 0,
    employmentType: "Salaried",
    monthlyEssentialExpenses: 0,
    liquidAssets: 0,
    emergencyMonthlyContribution: 0,
    dailyBudget: 0,
  },
  incomes: [],
  expenses: [
    { id: "e-1", name: "Living costs", category: "Rent", amount: 50_000, recurring: true, date: "2024-01-01" },
  ],
  loans: [],
  creditCards: [],
  investments: [],
  insurances: [],
  goals: [],
  dailyExpenses: [],
};

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data, updateProfile, loading: false }),
}));

const { FreedomCalculator } = await import("./FreedomCalculator");

describe("FreedomCalculator", () => {
  beforeEach(() => {
    updateProfile.mockClear();
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  });

  it("offers every FIRE variant on the top toggle, with FIRE selected by default", () => {
    render(<FreedomCalculator />);

    expect(screen.getByRole("button", { name: /Lean FIRE/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /^FIRE/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Coast FIRE/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Fat FIRE/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("prefills monthly expense from the entered expenses", () => {
    render(<FreedomCalculator />);

    expect(screen.getByLabelText("Monthly Expense")).toHaveValue(50_000);
    expect(screen.getByText("₹6.00 L")).toBeInTheDocument();
  });

  it("switches the headline target when another variant is selected", () => {
    render(<FreedomCalculator />);

    expect(screen.getByText("Your FIRE Number")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Lean FIRE/ }));

    expect(screen.getByText("Your Lean FIRE Number")).toBeInTheDocument();
    expect(screen.getByText("Corpus vs Lean FIRE Target")).toBeInTheDocument();
  });

  it("measures Coast FIRE at the coast age instead of the retirement age", () => {
    render(<FreedomCalculator />);

    fireEvent.click(screen.getByRole("button", { name: /Coast FIRE/ }));

    expect(screen.getByText(/at age 25 · 5 years to go/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Desired Coast FIRE Age"), {
      target: { value: "22" },
    });

    expect(screen.getByText(/at age 22 · 2 years to go/)).toBeInTheDocument();
  });

  it("recalculates without saving when the monthly expense is changed", () => {
    render(<FreedomCalculator />);

    fireEvent.change(screen.getByLabelText("Monthly Expense"), {
      target: { value: "100000" },
    });

    expect(screen.getByText("₹12.00 L")).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("saves retirement age and inflation to the profile", () => {
    render(<FreedomCalculator />);

    fireEvent.change(screen.getByLabelText("Retirement Age"), { target: { value: "45" } });
    expect(updateProfile).toHaveBeenCalledWith({ retirementAge: 45 });

    fireEvent.change(screen.getByLabelText("Assumed Inflation Rate (%)"), { target: { value: "7" } });
    expect(updateProfile).toHaveBeenCalledWith({ inflationRate: 7 });
  });
});
