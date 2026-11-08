/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { sampleData } from "@/lib/finance/sampleData";
import { defaultFreedomInputs } from "@/lib/finance/calculations";
import type { FinanceData } from "@/types/finance";
import { IndiaRetirement } from "./IndiaRetirement";

const data: FinanceData = {
  ...sampleData,
  profile: { ...sampleData.profile, age: 30, retirementAge: 60, employmentType: "Salaried" },
  incomes: [{ id: "i", name: "Job", type: "Salary", monthlyAmount: 100_000, growthRate: 0, startDate: "2024-01-01" }],
  investments: [
    { id: "n", name: "NPS", type: "NPS", currentValue: 1_000_000, monthlySip: 5000, expectedReturn: 10, horizon: 30 },
    { id: "p", name: "PPF", type: "PPF", currentValue: 500_000, monthlySip: 0, expectedReturn: 7.1, horizon: 15 },
  ],
};
const input = { ...defaultFreedomInputs(data), monthlyExpenses: 50_000 };

describe("IndiaRetirement", () => {
  it("shows where retirement money sits and both numbers", () => {
    render(<IndiaRetirement data={data} input={input} mode="FIRE" />);
    expect(screen.getByText("NPS")).toBeInTheDocument();
    expect(screen.getByText("PPF")).toBeInTheDocument();
    expect(screen.getByText("Gratuity (estimate)")).toBeInTheDocument();
    expect(screen.getByText(/Locked in an NPS annuity/)).toBeInTheDocument();
    expect(screen.getByText("Standard number")).toBeInTheDocument();
    expect(screen.getByText("Indian-adjusted number")).toBeInTheDocument();
  });

  it("drops gratuity from the table when the switch is turned off", () => {
    render(<IndiaRetirement data={data} input={input} mode="FIRE" />);
    fireEvent.click(screen.getByLabelText("Count gratuity (salaried, 5+ years)"));
    expect(screen.queryByText("Gratuity (estimate)")).not.toBeInTheDocument();
  });

  it("asks for holdings when there is nothing to project", () => {
    const none: FinanceData = { ...data, investments: [], incomes: [] };
    render(<IndiaRetirement data={none} input={input} mode="FIRE" />);
    expect(screen.getByText(/Add your EPF, PPF, NPS/)).toBeInTheDocument();
  });
});
