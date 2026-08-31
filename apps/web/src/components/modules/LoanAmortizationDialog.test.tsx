/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CalculatorResult } from "@/lib/finance/calculator-remote";
import type { Loan } from "@/types/finance";
import { LoanAmortizationDialog } from "./LoanAmortizationDialog";

vi.mock("@/lib/finance/calculator-remote", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/finance/calculator-remote")
  >();
  return { ...actual, previewCalculator: vi.fn() };
});

const { previewCalculator } = await import("@/lib/finance/calculator-remote");

const loan: Loan = {
  id: "home-loan",
  name: "Home Loan",
  type: "Home Loan",
  outstanding: 6_790_000,
  interestRate: 7.35,
  emi: 62_367,
  remainingTenure: 180,
  emiDay: 10,
  prepaymentAllowed: true,
};

const loanResult: CalculatorResult = {
  type: "loan",
  values: {
    monthlyPayment: 62_367,
    totalInterest: 4_436_060,
    totalPayment: 11_226_060,
  },
  schedule: [
    {
      year: 1,
      principal: 254_000,
      interest: 494_404,
      totalPayment: 748_404,
      balance: 6_536_000,
      loanPaidToDatePct: 3.74,
    },
  ],
  monthlySchedule: [
    {
      year: 1,
      month: 1,
      principal: 20_776,
      interest: 41_591,
      payment: 62_367,
      balance: 6_769_224,
      loanPaidToDatePct: 0.31,
    },
  ],
  notes: ["This schedule assumes every EMI is paid on time."],
};

describe("LoanAmortizationDialog", () => {
  beforeEach(() => {
    vi.mocked(previewCalculator).mockResolvedValue(loanResult);
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  });

  it("requests the schedule from the saved loan only after it is opened", async () => {
    render(<LoanAmortizationDialog loan={loan} currency="₹" />);

    expect(previewCalculator).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /View amortization/ }));

    await waitFor(() =>
      expect(previewCalculator).toHaveBeenCalledWith({
        type: "loan",
        principal: 6_790_000,
        annualRatePct: 7.35,
        months: 180,
        monthlyPayment: 62_367,
      }),
    );
    expect(
      await screen.findByText("Home Loan amortization"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Amortization schedule")).toBeInTheDocument();
    expect(screen.getByText("₹62,367")).toBeInTheDocument();
  });

  it("shows the failure reason when the schedule cannot be built", async () => {
    vi.mocked(previewCalculator).mockRejectedValue(new Error("Session expired"));
    render(<LoanAmortizationDialog loan={loan} currency="₹" />);

    fireEvent.click(screen.getByRole("button", { name: /View amortization/ }));

    expect(await screen.findByText("Session expired")).toBeInTheDocument();
  });

  it("previews combined early-closure assumptions without updating the loan", async () => {
    render(<LoanAmortizationDialog loan={loan} currency="₹" />);

    fireEvent.click(screen.getByRole("button", { name: /View amortization/ }));
    fireEvent.change(await screen.findByLabelText("One-time prepayment"), {
      target: { value: "500000" },
    });
    fireEvent.change(screen.getByLabelText("New higher monthly EMI"), {
      target: { value: "75000" },
    });

    await waitFor(() =>
      expect(previewCalculator).toHaveBeenCalledWith({
        type: "loan",
        principal: 6_790_000,
        annualRatePct: 7.35,
        months: 180,
        monthlyPayment: 62_367,
        prepaymentAmount: 500_000,
        increasedMonthlyPayment: 75_000,
      }),
    );
    expect(
      screen.getByText(/This simulation does not change your saved loan/),
    ).toBeInTheDocument();
  });
});
