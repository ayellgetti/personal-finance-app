/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FinanceData } from "@/types/finance";

const data: FinanceData = {
  profile: {
    name: "Test",
    age: 32,
    retirementAge: 60,
    currency: "₹",
    inflationRate: 6,
    emergencyFund: 0,
    dependents: 0,
    familyMembers: [],
    employmentType: "Salaried",
    monthlyEssentialExpenses: 80_000,
    liquidAssets: 0,
    emergencyMonthlyContribution: 0,
    dailyBudget: 0,
  },
  incomes: [
    {
      id: "inc-1",
      name: "Salary",
      type: "Salary",
      monthlyAmount: 80_000,
      growthRate: 0,
      startDate: "2024-01-01",
    },
  ],
  expenses: [
    {
      id: "exp-1",
      name: "Rent",
      category: "House Rent / EMI",
      amount: 50_000,
      recurring: true,
      date: "2024-01-01",
    },
  ],
  loans: [
    {
      id: "loan-1",
      name: "Personal loan",
      type: "Personal Loan",
      outstanding: 3_00_000,
      interestRate: 14,
      emi: 40_000,
      remainingTenure: 18,
      emiDay: 5,
      prepaymentAllowed: true,
    },
  ],
  creditCards: [],
  investments: [],
  insurances: [],
  goals: [],
  dailyExpenses: [],
};

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({ user: { isPaid: true } }),
}));

vi.mock("@/lib/finance/store", () => ({
  useFinance: () => ({ data, loading: false }),
}));

vi.mock("@/lib/finance/advisor-chat", async () => {
  const actual = await vi.importActual<typeof import("@/lib/finance/advisor-chat")>("@/lib/finance/advisor-chat");
  return {
    ...actual,
    listAdvisorChats: vi.fn().mockResolvedValue([
      {
        id: "chat-1",
        title: "How can I pay off my loans faster?",
        createdAt: "2026-09-19T00:00:00.000Z",
        updatedAt: "2026-09-19T00:00:00.000Z",
      },
    ]),
    getAdvisorChat: vi.fn(),
    removeAdvisorChat: vi.fn(),
    sendAdvisorChatMessage: vi.fn(),
  };
});

const { AdvisorChat } = await import("./AdvisorChat");

describe("AdvisorChat", () => {
  it("shows saved chats and personal starter questions on a new chat", async () => {
    render(<AdvisorChat />);
    expect(screen.getByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(await screen.findByText("How can I pay off my loans faster?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
    expect(screen.getByText(/Pick a question from the list/)).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: "Suggested questions" })).toBeInTheDocument();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(4);
    expect(screen.getAllByText(/surplus/).length).toBeGreaterThan(0);
  });
});
