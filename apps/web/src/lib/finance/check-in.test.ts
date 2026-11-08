import { describe, expect, it } from "vitest";
import { sampleData } from "./sampleData";
import {
  buildCheckIn,
  checkInDue,
  milestones,
  monthKey,
  yearOverYear,
  type CheckIn,
} from "./check-in";
import type { FinanceData } from "@/types/finance";

const row = (month: string, netWorth: number, healthScore: number): CheckIn => ({
  id: month,
  month,
  netWorth,
  assets: 0,
  liabilities: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
  healthScore,
});

describe("buildCheckIn", () => {
  it("returns null until income and expenses exist", () => {
    const empty: FinanceData = { ...sampleData, incomes: [], expenses: [] };
    expect(buildCheckIn(empty)).toBeNull();
  });

  it("records the month and the five numbers", () => {
    const input = buildCheckIn(sampleData, new Date(2026, 10, 6));
    expect(input?.month).toBe("2026-11");
    expect(input?.healthScore).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(input?.netWorth)).toBe(true);
  });
});

describe("history helpers", () => {
  const history = [row("2026-02", 150_000, 55), row("2025-11", 40_000, 30), row("2026-11", 1_200_000, 78)];

  it("reports the first month each milestone was reached, regardless of order", () => {
    const result = Object.fromEntries(milestones(history).map((m) => [m.label, m.reachedIn]));
    expect(result["First ₹1 L net worth"]).toBe("2026-02");
    expect(result["₹10 L net worth"]).toBe("2026-11");
    expect(result["Health score 50 or more"]).toBe("2026-02");
    expect(result["Health score 75 or more"]).toBe("2026-11");
  });

  it("leaves unreached milestones as null", () => {
    expect(milestones([row("2026-11", 10, 10)]).every((m) => m.reachedIn === null)).toBe(true);
  });

  it("compares the latest month with the same month a year before", () => {
    const yoy = yearOverYear(history);
    expect(yoy?.netWorthChange).toBe(1_160_000);
    expect(yoy?.scoreChange).toBe(48);
  });

  it("has no year-over-year without the earlier month", () => {
    expect(yearOverYear([row("2026-11", 1, 1)])).toBeNull();
    expect(yearOverYear([])).toBeNull();
  });

  it("is due when the current month is missing", () => {
    expect(checkInDue(history, new Date(2026, 10, 20))).toBe(false);
    expect(checkInDue(history, new Date(2026, 11, 1))).toBe(true);
    expect(monthKey(new Date(2026, 0, 5))).toBe("2026-01");
  });
});
