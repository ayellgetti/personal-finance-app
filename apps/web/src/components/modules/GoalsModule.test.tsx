/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { sampleData } from "@/lib/finance/sampleData";
import type { FinanceData } from "@/types/finance";

const soon = new Date(Date.now() + 2 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const data: FinanceData = {
  ...sampleData,
  incomes: [{ id: "i", name: "Job", type: "Salary", monthlyAmount: 100_000, growthRate: 0, startDate: "2024-01-01" }],
  expenses: [{ id: "e", name: "Rent", category: "House Rent / EMI", amount: 90_000, recurring: true, date: "2024-01-01" }],
  loans: [],
  creditCards: [],
  investments: [],
  insurances: [],
  goals: [
    { id: "g1", name: "Big car", type: "Dream Car", targetAmount: 3_000_000, targetDate: soon, priority: "High", currentSaved: 0 },
    { id: "g2", name: "Small trip", type: "International Vacation", targetAmount: 10_000, targetDate: soon, priority: "Low", currentSaved: 0 },
  ],
};

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data, addItem: vi.fn(), updateItem: vi.fn(), removeItem: vi.fn(), updateProfile: vi.fn() }),
  newId: () => "x",
}));
vi.mock("./EmergencyFundModule", () => ({ EmergencyFundModule: () => <p>emergency card</p> }));

const { GoalsModule } = await import("./GoalsModule");

describe("GoalsModule", () => {
  it("shows ways to fix an off-track goal and nothing for one that is on track", () => {
    render(<GoalsModule />);
    expect(screen.getAllByText("How to get this back on track")).toHaveLength(1);
    expect(screen.getByText(/more\./)).toBeInTheDocument();
    expect(screen.getByText(/Or lower the target to about/)).toBeInTheDocument();
    expect(screen.getByText(/Assumes an 11% annual return/)).toBeInTheDocument();
  });
});
