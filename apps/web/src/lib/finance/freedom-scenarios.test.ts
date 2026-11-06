import { describe, expect, it } from "vitest";
import { compareRows, toScenarioInput, type FreedomScenario } from "./freedom-scenarios";
import type { FreedomInputs, FreedomModeView } from "./calculations";

const input: FreedomInputs = { monthlyExpenses: 70000, currentAge: 32, retirementAge: 55, inflationRate: 6, coastAge: 45, expectedReturn: 11 };
const view: FreedomModeView = {
  mode: "FIRE", target: 90_000_000.4, targetAge: 55, yearsToTarget: 23,
  projectedCorpus: 40_000_000.6, shortfall: 49_999_999.8, requiredMonthlyInvestment: 61999.5, progressPct: 44.4,
};

describe("toScenarioInput", () => {
  it("trims the title, rounds money and keeps the inputs", () => {
    const out = toScenarioInput("  Retire at 55  ", "FIRE", input, view);
    expect(out.title).toBe("Retire at 55");
    expect(out.input).toEqual(input);
    expect(out.result.target).toBe(90_000_000);
    expect(out.result.requiredMonthlyInvestment).toBe(62000);
    expect(out.result.progressPct).toBe(44);
  });

  it("clamps progress into the range the API accepts", () => {
    expect(toScenarioInput("x", "FIRE", input, { ...view, progressPct: -5 }).result.progressPct).toBe(0);
  });
});

describe("compareRows", () => {
  const current = toScenarioInput("now", "FIRE", input, view);
  const saved: FreedomScenario[] = [
    { id: "1", ...toScenarioInput("Retire at 60", "Lean FIRE", { ...input, retirementAge: 60 }, { ...view, shortfall: 1000 }) },
  ];

  it("puts the current edit first and each saved what-if after it, in every row", () => {
    const rows = compareRows(current, saved);
    expect(rows.every((r) => r.values.length === 2)).toBe(true);
    expect(rows.find((r) => r.label === "Retirement age")?.values).toEqual([55, 60]);
    expect(rows.find((r) => r.label === "Path")?.values).toEqual(["FIRE", "Lean FIRE"]);
    expect(rows.find((r) => r.label === "Shortfall")?.values).toEqual([50_000_000, 1000]);
  });
});
