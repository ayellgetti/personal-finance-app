/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { sampleData } from "@/lib/finance/sampleData";
import type { FinanceData } from "@/types/finance";

const data: FinanceData = {
  ...sampleData,
  incomes: [],
  loans: [{ id: "l", name: "Car loan", type: "Home Loan", outstanding: 500_000, interestRate: 9, emi: 12_000, remainingTenure: 48, emiDay: 5, prepaymentAllowed: true }],
  creditCards: [],
  insurances: [{ id: "t", name: "Term", type: "Term Insurance", coverage: 1_000_000, annualPremium: 5000, expiryDate: "2045-01-01" }],
};

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data, addItem: vi.fn(), updateItem: vi.fn(), removeItem: vi.fn() }),
  newId: () => "x",
}));

const { InsuranceModule } = await import("./InsuranceModule");

describe("InsuranceModule with no income", () => {
  it("shows an empty term bar next to 'Needs income to calculate', not progress against loans alone", () => {
    render(<InsuranceModule />);
    expect(screen.getByText("Needs income to calculate")).toBeInTheDocument();
    const bars = screen.getAllByRole("progressbar");
    expect(bars[0]).toHaveAttribute("aria-valuenow", "0");
  });
});
