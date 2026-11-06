/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { dailySpentThisMonth } from "@/lib/finance/calculations";

const data = {
  profile: { currency: "₹" },
  expenses: [{ id: "e", name: "Rent", category: "House Rent / EMI", amount: 40000, recurring: true, date: "2024-01-01" }],
  loans: [],
  dailyExpenses: [{ id: "d", amount: 500, category: "Food", notes: "", date: new Date().toISOString() }],
};

vi.mock("@/lib/finance/store", () => ({ useFinance: () => ({ data }), newId: () => "x" }));
vi.mock("./ExpenseModule", () => ({ ExpenseModule: () => <p>bills panel</p> }));
vi.mock("./DailyExpenseModule", () => ({ DailyExpenseModule: () => <p>daily panel</p> }));
vi.mock("./StatementAnalyzerModule", () => ({ StatementAnalyzerModule: () => <p>import panel</p> }));

const { ExpenseHub } = await import("./ExpenseHub");

describe("dailySpentThisMonth", () => {
  it("counts only entries from the current month", () => {
    const now = new Date(2026, 10, 15);
    expect(
      dailySpentThisMonth(
        [
          { amount: 100, date: new Date(2026, 10, 2).toISOString() },
          { amount: 50, date: new Date(2026, 9, 28).toISOString() },
        ],
        now,
      ),
    ).toBe(100);
  });
});

describe("ExpenseHub", () => {
  it("shows one total and switches between the three tabs", () => {
    render(<ExpenseHub />);
    expect(screen.getByText("Spending this month")).toBeInTheDocument();
    expect(screen.getByText("₹40,500")).toBeInTheDocument();
    expect(screen.getByText("bills panel")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Daily log" }));
    expect(screen.getByText("daily panel")).toBeInTheDocument();
  });

  it("opens on the requested tab", () => {
    render(<ExpenseHub initialTab="import" />);
    expect(screen.getByText("import panel")).toBeInTheDocument();
    expect(screen.getByText(/not added to the totals above/)).toBeInTheDocument();
  });
});
