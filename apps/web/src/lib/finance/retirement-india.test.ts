import { describe, expect, it } from "vitest";
import { sampleData } from "./sampleData";
import {
  DEFAULT_RETIREMENT_ASSUMPTIONS,
  estimateGratuity,
  GRATUITY_CAP,
  indiaRetirementView,
} from "./retirement-india";
import { defaultFreedomInputs, fvLumpSum, fvSIP } from "./calculations";
import type { FinanceData } from "@/types/finance";

const base: FinanceData = {
  ...sampleData,
  profile: { ...sampleData.profile, age: 30, retirementAge: 60, inflationRate: 6, employmentType: "Salaried" },
  incomes: [{ id: "i", name: "Job", type: "Salary", monthlyAmount: 100_000, growthRate: 0, startDate: "2024-01-01" }],
  investments: [
    { id: "n", name: "NPS", type: "NPS", currentValue: 1_000_000, monthlySip: 0, expectedReturn: 10, horizon: 30 },
    { id: "e", name: "EPF", type: "EPF", currentValue: 500_000, monthlySip: 0, expectedReturn: 0, horizon: 30 },
  ],
};
const input = { ...defaultFreedomInputs(base), monthlyExpenses: 50_000 };

describe("estimateGratuity", () => {
  it("is zero for anyone who is not salaried", () => {
    expect(estimateGratuity({ ...base, profile: { ...base.profile, employmentType: "Freelancer" } }, 60, 30)).toBe(0);
  });

  it("follows the 15/26 formula on the basic pay and is capped", () => {
    // basic 40,000 x 15 / 26 x 38 years of service
    expect(estimateGratuity(base, 60, 0)).toBeCloseTo((40_000 * 15 * 38) / 26, 0);
    const rich = { ...base, incomes: [{ ...base.incomes[0]!, monthlyAmount: 10_000_000 }] };
    expect(estimateGratuity(rich, 60, 0)).toBe(GRATUITY_CAP);
  });

  it("is zero below five years of service", () => {
    expect(estimateGratuity(base, 26, 0)).toBe(0);
  });
});

describe("indiaRetirementView", () => {
  const view = indiaRetirementView(base, input, "FIRE");

  it("grows each holding to retirement and uses the default return when none is entered", () => {
    const nps = view.sources.find((s) => s.group === "NPS")!.value;
    const epf = view.sources.find((s) => s.group === "EPF")!.value;
    expect(nps).toBeCloseTo(fvLumpSum(1_000_000, 10, 30) + fvSIP(0, 10, 30), 0);
    expect(epf).toBeCloseTo(fvLumpSum(500_000, DEFAULT_RETIREMENT_ASSUMPTIONS.epfReturn, 30), 0);
  });

  it("keeps 40% of NPS out of the spendable corpus and turns it into pension", () => {
    const nps = view.sources.find((s) => s.group === "NPS")!.value;
    expect(view.npsAnnuityCorpus).toBeCloseTo(nps * 0.4, 0);
    expect(view.annuityIncomePerYear).toBeCloseTo(nps * 0.4 * 0.06, 0);
    const total = view.sources.reduce((s, x) => s + x.value, 0);
    expect(view.countedCorpus).toBeCloseTo(total - view.npsAnnuityCorpus + view.gratuity, 0);
  });

  it("raises the need when healthcare inflates faster, and lowers it by the pension", () => {
    const noAnnuity = indiaRetirementView(base, input, "FIRE", { ...DEFAULT_RETIREMENT_ASSUMPTIONS, annuityRate: 0 });
    expect(noAnnuity.healthcareExtra).toBeGreaterThan(0);
    expect(noAnnuity.indiaTarget).toBeGreaterThan(noAnnuity.genericTarget);
    expect(view.indiaTarget).toBeLessThan(noAnnuity.indiaTarget);
  });

  it("matches the generic target when healthcare inflates like everything else and there is no pension", () => {
    const same = indiaRetirementView(base, input, "FIRE", {
      ...DEFAULT_RETIREMENT_ASSUMPTIONS,
      healthInflation: input.inflationRate,
      annuityRate: 0,
    });
    expect(same.indiaTarget).toBeCloseTo(same.genericTarget, 0);
  });

  it("can leave gratuity out", () => {
    const without = indiaRetirementView(base, input, "FIRE", { ...DEFAULT_RETIREMENT_ASSUMPTIONS, includeGratuity: false });
    expect(without.gratuity).toBe(0);
    expect(view.gratuity).toBeGreaterThan(0);
  });

  it("never lets healthcare inflate slower than general inflation", () => {
    const high = { ...input, inflationRate: 12 };
    const out = indiaRetirementView(base, high, "FIRE", { ...DEFAULT_RETIREMENT_ASSUMPTIONS, annuityRate: 0 });
    expect(out.healthcareExtra).toBeGreaterThanOrEqual(0);
    expect(out.indiaTarget).toBeGreaterThanOrEqual(out.genericTarget - 1);
  });
});
