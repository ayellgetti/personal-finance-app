/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { CalculatorResult } from "@/lib/finance/calculator-remote";
import { CalculatorsModule } from "./CalculatorsModule";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/lib/finance/calculator-remote", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/finance/calculator-remote")
  >();
  return {
    ...actual,
    listCalculatorScenarios: vi.fn(),
    previewCalculator: vi.fn(),
    saveCalculatorScenario: vi.fn(),
    updateCalculatorScenario: vi.fn(),
    removeCalculatorScenario: vi.fn(),
  };
});

const { listCalculatorScenarios, previewCalculator, saveCalculatorScenario } =
  await import("@/lib/finance/calculator-remote");

const previewResult: CalculatorResult = {
  type: "lumpsum",
  values: {
    investedAmount: 100_000,
    estimatedReturns: 210_585,
    futureValue: 310_585,
  },
  notes: ["This projection is an estimate, not a guarantee."],
};

describe("CalculatorsModule", () => {
  beforeEach(() => {
    vi.mocked(listCalculatorScenarios).mockResolvedValue([]);
    vi.mocked(previewCalculator).mockResolvedValue(previewResult);
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  });

  it("previews the selected calculator without saving it", async () => {
    render(<CalculatorsModule />);

    fireEvent.click(
      screen.getByRole("button", { name: /Recent saved calculations/ }),
    );
    await screen.findByText("No saved calculations");
    fireEvent.change(screen.getByLabelText("Investment amount"), {
      target: { value: "200000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() =>
      expect(previewCalculator).toHaveBeenCalledWith({
        type: "lumpsum",
        principal: 200_000,
        annualRatePct: 12,
        years: 10,
      }),
    );
    expect(await screen.findByText("Calculation preview")).toBeInTheDocument();
    expect(screen.getByText("₹3,10,585")).toBeInTheDocument();
  });

  it("accepts whole-number tenures and saves them", async () => {
    vi.mocked(saveCalculatorScenario).mockResolvedValue({
      id: "scenario-1",
      type: "emi",
      title: "House Loan",
      input: {
        type: "emi",
        principal: 2_700_000,
        annualRatePct: 9.5,
        months: 120,
      },
      result: { type: "emi", values: { monthlyPayment: 34_935 }, notes: [] },
      createdAt: "2026-08-31T00:00:00.000Z",
      updatedAt: "2026-08-31T00:00:00.000Z",
    });
    render(<CalculatorsModule initialType="emi" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Recent saved calculations/ }),
    );
    await screen.findByText("No saved calculations");

    const tenure = screen.getByLabelText("Tenure (months)");
    expect(tenure).toHaveAttribute("min", "1");
    expect(tenure).toHaveAttribute("step", "1");
    expect((tenure as HTMLInputElement).checkValidity()).toBe(true);

    fireEvent.change(tenure, { target: { value: "120" } });
    expect((tenure as HTMLInputElement).checkValidity()).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Save calculation/ }));
    await waitFor(() =>
      expect(saveCalculatorScenario).toHaveBeenCalledWith("", {
        type: "emi",
        principal: 100_000,
        annualRatePct: 12,
        months: 120,
      }),
    );
  });

  it("keeps EMI and Loan as separate calculator forms", async () => {
    const { rerender } = render(
      <CalculatorsModule key="emi" initialType="emi" />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Recent saved calculations/ }),
    );
    await screen.findByText("No saved calculations");

    expect(screen.getByLabelText("Tenure (months)")).toBeInTheDocument();

    rerender(<CalculatorsModule key="loan" initialType="loan" />);
    expect(screen.getByLabelText("Loan amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Interest rate")).toBeInTheDocument();
    expect(screen.getByLabelText("Loan tenure")).toBeInTheDocument();
    expect(screen.getByLabelText("Monthly EMI (optional)")).not.toHaveAttribute(
      "required",
    );
    expect(screen.queryByLabelText("Tenure (months)")).not.toBeInTheDocument();

    await waitFor(() =>
      expect(previewCalculator).toHaveBeenCalledWith({
        type: "loan",
        principal: 5_000_000,
        annualRatePct: 9,
        months: 240,
      }),
    );
  });

  it("sends a custom EMI for loan only when the user enters one", async () => {
    render(<CalculatorsModule initialType="loan" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Recent saved calculations/ }),
    );
    await screen.findByText("No saved calculations");

    fireEvent.change(screen.getByLabelText("Monthly EMI (optional)"), {
      target: { value: "45000" },
    });

    await waitFor(() =>
      expect(previewCalculator).toHaveBeenCalledWith({
        type: "loan",
        principal: 5_000_000,
        annualRatePct: 9,
        months: 240,
        monthlyPayment: 45_000,
      }),
    );
  });

  it("loads an existing loan directly into the amortization preview", async () => {
    render(
      <CalculatorsModule
        initialType="loan"
        loanPreset={{
          title: "Home Loan",
          principal: 6_790_000,
          annualRatePct: 7.35,
          months: 180,
          monthlyPayment: 62_367,
        }}
      />,
    );

    expect(screen.getByLabelText("Calculation name (optional)")).toHaveValue(
      "Home Loan",
    );
    expect(screen.getByLabelText("Loan amount")).toHaveValue(6_790_000);
    expect(screen.getByLabelText("Interest rate")).toHaveValue(7.35);
    expect(screen.getByLabelText("Loan tenure")).toHaveValue(15);
    expect(screen.getByLabelText("Monthly EMI (optional)")).toHaveValue(62_367);

    await waitFor(() =>
      expect(previewCalculator).toHaveBeenCalledWith({
        type: "loan",
        principal: 6_790_000,
        annualRatePct: 7.35,
        months: 180,
        monthlyPayment: 62_367,
      }),
    );
  });

  it("previews an INR currency conversion with a manual rate", async () => {
    render(<CalculatorsModule initialType="currency" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Recent saved calculations/ }),
    );
    await screen.findByText("No saved calculations");

    fireEvent.change(screen.getByLabelText("Amount in INR"), {
      target: { value: "250000" },
    });
    fireEvent.change(screen.getByLabelText("1 INR in USD"), {
      target: { value: "0.012" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() =>
      expect(previewCalculator).toHaveBeenCalledWith({
        type: "currency",
        amount: 250_000,
        exchangeRate: 0.012,
        targetCurrency: "USD",
      }),
    );
  });

  it("accepts periodic cash flows for IRR", async () => {
    render(<CalculatorsModule initialType="irr" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Recent saved calculations/ }),
    );
    await screen.findByText("No saved calculations");
    fireEvent.change(screen.getByLabelText("Periodic cash flows"), {
      target: { value: "-100000, 60000, 60000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preview" }));

    await waitFor(() =>
      expect(previewCalculator).toHaveBeenCalledWith({
        type: "irr",
        cashFlows: [-100_000, 60_000, 60_000],
      }),
    );
  });
});
