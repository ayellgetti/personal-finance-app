/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { CreditCard, FinanceData } from "@/types/finance";

const addItem = vi.fn();
const updateItem = vi.fn();
const removeItem = vi.fn();

const data: FinanceData = {
  profile: {
    name: "Test",
    age: 32,
    retirementAge: 60,
    currency: "₹",
    inflationRate: 6,
    emergencyFund: 0,
    dependents: 0,
    employmentType: "Salaried",
    monthlyEssentialExpenses: 0,
    liquidAssets: 0,
    emergencyMonthlyContribution: 0,
    dailyBudget: 0,
  },
  incomes: [],
  expenses: [],
  loans: [],
  creditCards: [],
  investments: [],
  insurances: [],
  goals: [],
  dailyExpenses: [],
};

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data, addItem, updateItem, removeItem, loading: false }),
  newId: () => "card-1",
}));

const { CreditCardModule } = await import("./CreditCardModule");

describe("CreditCardModule", () => {
  beforeEach(() => {
    addItem.mockClear();
    data.creditCards = [];
  });

  it("adds a card from the dialog", () => {
    render(<CreditCardModule />);

    expect(screen.getByText("Add your first credit card")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
    fireEvent.change(screen.getByLabelText("Card Name"), { target: { value: "HDFC Millennia" } });
    fireEvent.change(screen.getByLabelText("Credit Limit"), { target: { value: "200000" } });
    fireEvent.change(screen.getByLabelText("Outstanding"), { target: { value: "40000" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(addItem).toHaveBeenCalledWith(
      "creditCards",
      expect.objectContaining({
        id: "card-1",
        name: "HDFC Millennia",
        creditLimit: 200000,
        outstanding: 40000,
      } satisfies Partial<CreditCard>),
    );
  });
});
