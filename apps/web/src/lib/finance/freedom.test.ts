import { describe, expect, it } from "vitest";
import type { FinanceData } from "@/types/finance";
import { freedomModeView, freedomTargets, type FreedomInputs } from "./calculations";

const input: FreedomInputs = {
  monthlyExpenses: 50_000,
  currentAge: 20,
  retirementAge: 40,
  inflationRate: 10,
  coastAge: 22,
  expectedReturn: 10,
};

const emptyProfile: FinanceData["profile"] = {
  name: "Test",
  age: 20,
  retirementAge: 40,
  currency: "₹",
  inflationRate: 10,
  emergencyFund: 0,
  dependents: 0,
  employmentType: "Salaried",
  monthlyEssentialExpenses: 0,
  liquidAssets: 0,
  emergencyMonthlyContribution: 0,
  dailyBudget: 0,
};

const data: FinanceData = {
  profile: emptyProfile,
  incomes: [],
  expenses: [],
  loans: [],
  creditCards: [],
  investments: [],
  insurances: [],
  goals: [],
  dailyExpenses: [],
};

describe("freedomTargets", () => {
  it("inflates today's expenses to the retirement age", () => {
    const result = freedomTargets(input);

    expect(result.yearsToRetirement).toBe(20);
    expect(result.annualExpensesToday).toBe(600_000);
    expect(result.annualExpensesAtRetirement).toBeCloseTo(4_036_500, -1);
  });

  it("applies 15x, 25x and 50x multiples of the inflated expense", () => {
    const { targets } = freedomTargets(input);

    expect(targets["Lean FIRE"]).toBeCloseTo(60_547_500, -1);
    expect(targets.FIRE).toBeCloseTo(100_912_500, -1);
    expect(targets["Fat FIRE"]).toBeCloseTo(201_825_000, -1);
  });

  it("discounts the FIRE number back to the coast age", () => {
    const { targets } = freedomTargets(input);

    expect(targets["Coast FIRE"]).toBeCloseTo(18_150_000, -1);
  });

  it("clamps a coast age outside the current and retirement ages", () => {
    const tooEarly = freedomTargets({ ...input, coastAge: 5 });
    const tooLate = freedomTargets({ ...input, coastAge: 99 });

    expect(tooEarly.coastAge).toBe(input.currentAge);
    expect(tooLate.coastAge).toBe(input.retirementAge);
    expect(tooLate.targets["Coast FIRE"]).toBeCloseTo(tooLate.targets.FIRE, -1);
  });
});

describe("freedomModeView", () => {
  it("measures Coast FIRE at the coast age, not the retirement age", () => {
    const view = freedomModeView(data, input, "Coast FIRE");

    expect(view.targetAge).toBe(22);
    expect(view.yearsToTarget).toBe(2);
  });

  it("measures the other modes at the retirement age", () => {
    const view = freedomModeView(data, input, "Lean FIRE");

    expect(view.targetAge).toBe(40);
    expect(view.yearsToTarget).toBe(20);
  });

  it("reports the full target as a shortfall when nothing is invested", () => {
    const view = freedomModeView(data, input, "FIRE");

    expect(view.projectedCorpus).toBe(0);
    expect(view.shortfall).toBeCloseTo(100_912_500, -1);
    expect(view.requiredMonthlyInvestment).toBeGreaterThan(0);
    expect(view.progressPct).toBe(0);
  });

  it("counts an existing portfolio toward the target", () => {
    const invested: FinanceData = {
      ...data,
      investments: [
        {
          id: "inv-1",
          name: "Index Fund",
          type: "Mutual Funds",
          currentValue: 10_000_000,
          monthlySip: 50_000,
          expectedReturn: 12,
          horizon: 20,
        },
      ],
    };

    const view = freedomModeView(invested, input, "Lean FIRE");

    expect(view.projectedCorpus).toBeGreaterThan(0);
    expect(view.progressPct).toBeGreaterThan(0);
    expect(view.shortfall).toBeLessThan(freedomTargets(input).targets["Lean FIRE"]);
  });
});
