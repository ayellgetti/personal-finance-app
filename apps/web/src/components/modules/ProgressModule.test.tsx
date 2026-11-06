/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { sampleData } from "@/lib/finance/sampleData";
import type { FinanceData } from "@/types/finance";

let data: FinanceData = sampleData;
const listCheckIns = vi.fn();
const saveCheckIn = vi.fn();
const toastSuccess = vi.fn();

vi.mock("@/lib/finance/store", () => ({ useFinance: () => ({ data }) }));
vi.mock("@/lib/finance/check-in-remote", () => ({
  listCheckIns: (...a: unknown[]) => listCheckIns(...a),
  saveCheckIn: (...a: unknown[]) => saveCheckIn(...a),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: (...a: unknown[]) => toastSuccess(...a) } }));
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return { ...actual, ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> };
});

const { ProgressModule } = await import("./ProgressModule");

describe("ProgressModule", () => {
  beforeEach(() => {
    data = sampleData;
    listCheckIns.mockReset().mockResolvedValue([]);
    saveCheckIn.mockReset().mockImplementation(async (input) => ({ id: "1", ...input }));
    toastSuccess.mockReset();
  });

  it("asks for income and expenses before offering a check-in", async () => {
    data = { ...sampleData, incomes: [], expenses: [] };
    render(<ProgressModule />);
    expect(await screen.findByText(/Add your income and expenses first/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save check-in" })).not.toBeInTheDocument();
  });

  it("saves this month's numbers", async () => {
    render(<ProgressModule />);
    fireEvent.click(await screen.findByRole("button", { name: "Save check-in" }));
    await waitFor(() => expect(saveCheckIn).toHaveBeenCalled());
    const sent = saveCheckIn.mock.calls[0]![0];
    expect(sent.month).toMatch(/^\d{4}-\d{2}$/);
    expect(sent.healthScore).toBeGreaterThanOrEqual(0);
    expect(sent.netWorth).toBe(sent.assets - sent.liabilities);
    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
  });

  it("shows milestones and the trend once there is history", async () => {
    listCheckIns.mockResolvedValue([
      { id: "a", month: "2026-09", netWorth: 150000, assets: 0, liabilities: 0, monthlyIncome: 1, monthlyExpense: 1, healthScore: 55 },
      { id: "b", month: "2026-10", netWorth: 200000, assets: 0, liabilities: 0, monthlyIncome: 1, monthlyExpense: 1, healthScore: 60 },
    ]);
    render(<ProgressModule />);
    expect((await screen.findAllByText(/Reached Sep/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Oct 2026$/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Record this month to keep your trend going/)).toBeInTheDocument();
  });
});
