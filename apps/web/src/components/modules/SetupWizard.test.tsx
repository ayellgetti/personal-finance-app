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
    data.expenses = [];
  });

  it("blocks Next when the profile is incomplete", () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText("Retirement Age"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("heading", { name: "Your Profile" })).toBeInTheDocument();
    expect(toastError).toHaveBeenCalled();
  });

  it("needs only a dependents count, with names added later", async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText("Dependents"), { target: { value: "2" } });
    expect(screen.getByText(/add each dependent.s name and details later/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Profile saved"));
    expect(updateProfile).toHaveBeenCalledWith(expect.objectContaining({ dependents: 2, familyMembers: [] }));
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

  async function openFirstResult() {
    renderWizard();
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Profile saved"));
    fireEvent.click(screen.getByRole("button", { name: /4\. First result/ }));
  }

  it("asks for missing income and expenses instead of showing a first result", async () => {
    await openFirstResult();
    expect(await screen.findByText(/to see your first result/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /See my dashboard now/ })).not.toBeInTheDocument();
  });

  it("lets the user finish after the first three steps", async () => {
    data.incomes = [{ id: "i", name: "Job", type: "Salary", monthlyAmount: 100000, growthRate: 0, startDate: "2024-01-01" }];
    data.expenses = [{ id: "e", name: "Rent", category: "House Rent / EMI", amount: 40000, recurring: true, date: "2024-01-01" }];
    await openFirstResult();
    expect(await screen.findByText("Savings rate")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /See my dashboard now/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add more details/ })).toBeInTheDocument();
  });

  it("gives every profile input a programmatic label", () => {
    renderWizard();
    for (const label of ["Full Name", "Age", "Retirement Age", "Employment Type", "Dependents", "Inflation Rate (%)"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});
