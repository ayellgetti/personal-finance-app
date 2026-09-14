/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { FinanceData } from "@/types/finance";

const updateProfile = vi.fn();

const data: FinanceData = {
  profile: {
    name: "Ada Lovelace",
    age: 36,
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

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: {
      name: "Ada Lovelace",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      dob: "1990-01-01",
      createdAt: "2024-01-01T00:00:00.000Z",
    },
    updateAccount: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const { ProfileModule } = await import("./ProfileModule");

describe("ProfileModule", () => {
  beforeEach(() => {
    updateProfile.mockReset();
  });

  it("saves familyMembers with the financial profile", () => {
    render(<ProfileModule />);
    fireEvent.click(screen.getByRole("button", { name: "Save financial profile" }));
    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        dependents: 0,
        familyMembers: [],
      }),
    );
  });

  it("does not save when dependent details are missing", () => {
    render(<ProfileModule />);
    fireEvent.change(screen.getByLabelText("Dependents"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Save financial profile" }));
    expect(updateProfile).not.toHaveBeenCalled();
    expect(screen.getByText("Dependent 1")).toBeInTheDocument();
  });
});
