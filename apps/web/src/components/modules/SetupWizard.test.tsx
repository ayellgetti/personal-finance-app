/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { FinanceData } from "@/types/finance";

const addItem = vi.fn();
const updateItem = vi.fn();
const removeItem = vi.fn();
const updateProfile = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();

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
  goals: [{
    id: "emergency-1",
    name: "Emergency Fund",
    type: "Emergency Fund",
    targetAmount: 0,
    currentSaved: 0,
    targetDate: "2027-01-01",
    priority: "High",
  }],
  dailyExpenses: [],
};

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data, addItem, updateItem, removeItem, updateProfile, loading: false }),
  newId: () => "new-1",
}));

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({ user: { name: "Ada Lovelace", dob: "1990-01-01" } }),
}));

vi.mock("sonner", () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: (...args: unknown[]) => toastSuccess(...args) },
}));

const { SetupWizard } = await import("./SetupWizard");

function renderWizard() {
  return render(
    <MemoryRouter>
      <SetupWizard onDone={vi.fn()} />
    </MemoryRouter>,
  );
}

describe("SetupWizard", () => {
  beforeEach(() => {
    addItem.mockReset();
    updateItem.mockReset();
    removeItem.mockReset();
    updateProfile.mockReset();
    toastError.mockReset();
    toastSuccess.mockReset();
    addItem.mockResolvedValue("income-1");
    updateItem.mockResolvedValue(true);
    data.profile.dependents = 0;
    data.profile.familyMembers = [];
    data.incomes = [];
  });

  it("blocks Next when the profile is incomplete", () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText("Retirement Age"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Your Profile" })).toBeInTheDocument();
    expect(toastError).toHaveBeenCalled();
  });

  it("renders family member forms when dependents is increased", () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText("Dependents"), { target: { value: "2" } });
    expect(screen.getByText("Dependent 1")).toBeInTheDocument();
    expect(screen.getByText("Dependent 2")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Name")).toHaveLength(2);
  });

  it("blocks Next on an unsaved complete income and resets tiles after Save", async () => {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Profile saved"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("What income do you want to add?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Salary" }));
    fireEvent.change(screen.getByLabelText("Monthly amount"), { target: { value: "150000" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(toastError).toHaveBeenCalledWith("Save this item before continuing");
    expect(addItem).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));
    await waitFor(() => expect(addItem).toHaveBeenCalled());
    expect(screen.queryByLabelText("Monthly amount")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salary" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Business" }));
    expect(screen.getByLabelText("Monthly amount")).toBeInTheDocument();
  });
});
