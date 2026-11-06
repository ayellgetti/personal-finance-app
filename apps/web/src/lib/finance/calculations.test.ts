import { describe, expect, it } from "vitest";
import {
  forecastNetWorth,
  goalProjectionSchedule,
  investmentProjectionSchedule,
  loanBalanceAfterMonths,
  loanBalanceChartData,
  loanPayoffBars,
  loanPayoffMonths,
  loanRemainingMonths,
  formatMonthYear,
  formatTenureMonths,
  extraEmiInterestSaving,
  emiIncreaseInterestSaving,
  creditUtilization,
  totalLiabilities,
  incomeDistribution,
  expenseDistribution,
  cashflowShareLabel,
  coveragePercent,
  positionSnapshot,
  healthScore,
  dataReadiness,
  coachInsights,
  emergencyFund,
  generateRecommendations,
  keepOneEmergencyItem,
  dailySpentThisMonth,
  goalFixes,
  termCoverMultiple,
  analyzeInsurance,
  analyzeGoal,
  monthlySavings,
} from "./calculations";
import { sampleData } from "./sampleData";
import type { FinanceData, Loan } from "@/types/finance";

const housing: Loan = {
  id: "housing",
  name: "Housing",
  type: "Home Loan",
  outstanding: 6_800_000,
  interestRate: 7.35,
  emi: 62_000,
  remainingTenure: 183,
  emiDay: 10,
  prepaymentAllowed: true,
};

const personal: Loan = {
  id: "personal",
  name: "Personal",
  type: "Personal Loan",
  outstanding: 300_000,
  interestRate: 13,
  emi: 12_000,
  remainingTenure: 30,
  emiDay: 5,
  prepaymentAllowed: true,
};

function withLoans(loans: Loan[]): FinanceData {
  return { ...sampleData, loans };
}

describe("loanBalanceAfterMonths", () => {
  it("returns the full outstanding at month zero", () => {
    expect(loanBalanceAfterMonths(housing.outstanding, housing.interestRate, housing.emi, 0)).toBe(
      housing.outstanding,
    );
  });

  it("charges interest, so one EMI reduces principal by less than the EMI", () => {
    const after = loanBalanceAfterMonths(housing.outstanding, housing.interestRate, housing.emi, 1);
    expect(after).toBeLessThan(housing.outstanding);
    expect(housing.outstanding - after).toBeLessThan(housing.emi);
  });

  it("is zero once the payoff month is reached", () => {
    const months = loanPayoffMonths(personal.outstanding, personal.interestRate, personal.emi);
    expect(loanBalanceAfterMonths(personal.outstanding, personal.interestRate, personal.emi, months)).toBe(0);
  });

  it("subtracts EMIs linearly on an interest-free loan", () => {
    expect(loanBalanceAfterMonths(100_000, 0, 10_000, 4)).toBe(60_000);
  });
});

describe("loan payoff timeline", () => {
  const from = new Date(2026, 8, 1);

  it("labels the calendar month a loan reaches zero", () => {
    const months = loanRemainingMonths(personal);
    expect(months).toBe(loanPayoffMonths(personal.outstanding, personal.interestRate, personal.emi));
    expect(formatTenureMonths(months)).toMatch(/m$/);
    expect(formatMonthYear(from)).toBe("Sep 2026");
  });

  it("orders bars by the loan that ends first", () => {
    const bars = loanPayoffBars([housing, personal], from);
    expect(bars[0]?.name).toBe("Personal");
    expect(bars[1]?.name).toBe("Housing");
    expect(bars[0]?.endLabel).toMatch(/^\w{3} \d{4}$/);
    expect(bars[0]?.months).toBeLessThan(bars[1]?.months ?? 0);
  });

  it("drops outstanding to zero on the payoff month in the line chart", () => {
    const points = loanBalanceChartData([personal], from);
    const payoff = loanRemainingMonths(personal);
    expect(points[0]?.Personal).toBe(personal.outstanding);
    const last = points.find((point) => point.month === payoff);
    expect(last?.Personal).toBe(0);
    expect(last?.label).not.toBe("Now");
  });

  it("marks loans whose EMI never covers interest", () => {
    const stuck: Loan = { ...personal, id: "stuck", emi: 100, remainingTenure: 0 };
    const bars = loanPayoffBars([stuck], from);
    expect(bars[0]?.neverEnds).toBe(true);
    expect(bars[0]?.endLabel).toBe("Never");
  });
});

describe("loan prepayment what-ifs", () => {
  it("saves interest and months when one extra EMI is paid now", () => {
    const saving = extraEmiInterestSaving(personal);
    expect(saving).not.toBeNull();
    expect(saving?.extraNow).toBe(personal.emi);
    expect(saving?.interestSaved).toBeGreaterThan(0);
    expect(saving?.monthsSaved).toBeGreaterThan(0);
    expect(saving?.newMonths).toBeLessThan(saving?.originalMonths ?? 0);
  });

  it("saves more interest at a 10% EMI increase than at 5%", () => {
    const plusFive = emiIncreaseInterestSaving(personal, 5);
    const plusTen = emiIncreaseInterestSaving(personal, 10);
    expect(plusFive?.extraMonthly).toBeGreaterThan(0);
    expect(plusTen?.interestSaved).toBeGreaterThan(plusFive?.interestSaved ?? 0);
    expect(plusTen?.monthsSaved).toBeGreaterThanOrEqual(plusFive?.monthsSaved ?? 0);
  });

  it("does not invent savings on an interest-free extra EMI beyond time", () => {
    const zeroRate: Loan = { ...personal, interestRate: 0, outstanding: 120_000, emi: 10_000 };
    const saving = extraEmiInterestSaving(zeroRate);
    expect(saving?.interestSaved).toBe(0);
    expect(saving?.monthsSaved).toBe(1);
  });
});

describe("forecastNetWorth debt series", () => {
  it("declines every year until the last loan is closed", () => {
    const cardDebt = sampleData.creditCards.reduce((sum, card) => sum + card.outstanding, 0);
    const forecast = forecastNetWorth(withLoans([housing, personal]), "Moderate");
    for (let i = 1; i < forecast.length; i += 1) {
      expect(forecast[i].debt).toBeLessThanOrEqual(forecast[i - 1].debt);
    }
    expect(forecast[0].debt).toBe(housing.outstanding + personal.outstanding + cardDebt);
    expect(forecast[forecast.length - 1].debt).toBe(cardDebt);
  });

  it("never drops the whole balance in a single year step", () => {
    const forecast = forecastNetWorth(withLoans([housing]), "Moderate");
    const drops = forecast
      .slice(1)
      .map((point, i) => forecast[i].debt - point.debt)
      .filter((drop) => drop > 0);
    const largest = Math.max(...drops);
    expect(largest).toBeLessThan(housing.emi * 12 * 1.05);
  });
});

describe("projection schedules", () => {
  it("combines an investment's current value, SIPs, and estimated returns", () => {
    const schedule = investmentProjectionSchedule({
      id: "investment",
      name: "Index fund",
      type: "Mutual Funds",
      currentValue: 100_000,
      monthlySip: 10_000,
      expectedReturn: 12,
      horizon: 2,
    });

    expect(schedule).toHaveLength(3);
    expect(schedule[0]).toEqual({
      year: 0,
      contributed: 100_000,
      estimatedReturns: 0,
      projectedValue: 100_000,
    });
    expect(schedule[2].contributed).toBe(340_000);
    expect(schedule[2].projectedValue).toBeGreaterThan(340_000);
  });

  it("ends a goal schedule at its inflation-adjusted target", () => {
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 5);
    const schedule = goalProjectionSchedule(sampleData, {
      id: "goal",
      name: "Education",
      type: "Child Education",
      targetAmount: 2_000_000,
      targetDate: targetDate.toISOString(),
      priority: "High",
      currentSaved: 250_000,
    });
    const finalPoint = schedule.at(-1);

    expect(finalPoint?.target).toBeGreaterThan(2_000_000);
    expect(finalPoint?.projectedValue).toBeCloseTo(finalPoint?.target ?? 0, -1);
  });
});

describe("income and expense distribution", () => {
  it("splits income by source and expenses plus EMIs by share of the monthly total", () => {
    const data: FinanceData = {
      ...sampleData,
      incomes: [
        {
          id: "salary",
          name: "Take-home",
          type: "Salary",
          monthlyAmount: 1_50_000,
          growthRate: 8,
          startDate: "2024-01-01",
        },
        {
          id: "rent",
          name: "Flat rent",
          type: "Rental Income",
          monthlyAmount: 50_000,
          growthRate: 5,
          startDate: "2024-01-01",
        },
      ],
      expenses: [
        {
          id: "food",
          name: "Groceries",
          category: "Groceries",
          amount: 20_000,
          recurring: true,
          date: "2024-01-01",
        },
        {
          id: "trip",
          name: "Vacation",
          category: "Travel",
          amount: 80_000,
          recurring: false,
          date: "2024-06-01",
        },
      ],
      loans: [personal],
    };

    const income = incomeDistribution(data);
    expect(income.map((row) => row.name)).toEqual(["Take-home", "Flat rent"]);
    expect(income[0]?.percent).toBe(75);
    expect(income[1]?.percent).toBe(25);
    expect(cashflowShareLabel(income)).toBe("Take-home 75.0%, Flat rent 25.0%");

    const expenses = expenseDistribution(data);
    expect(expenses.map((row) => row.name)).toEqual(["Groceries", "Personal"]);
    expect(expenses[0]?.percent).toBe(62.5);
    expect(expenses[1]?.extra).toBe("Personal Loan EMI");
    expect(expenses.find((row) => row.name === "Vacation")).toBeUndefined();
  });

  it("reports how much of a target is already covered", () => {
    expect(coveragePercent(62_00_000, 7_27_50_000)).toBeCloseTo(8.522, 2);
    expect(coveragePercent(10, 0)).toBe(100);
    expect(coveragePercent(0, 0)).toBe(0);
    expect(positionSnapshot(sampleData).freedomCover).toBeGreaterThan(0);
    expect(positionSnapshot(sampleData).termCover.name).toBe("Term cover");
  });
});

describe("healthScore", () => {
  it("keeps each component on a 0-100 scale and explains the score", () => {
    const score = healthScore({
      ...sampleData,
      profile: { ...sampleData.profile, emergencyFund: 0 },
      incomes: [
        {
          id: "salary",
          name: "Salary",
          type: "Salary",
          monthlyAmount: 1_00_000,
          growthRate: 0,
          startDate: "2024-01-01",
        },
      ],
      expenses: [
        {
          id: "rent",
          name: "Rent",
          category: "House Rent / EMI",
          amount: 1_20_000,
          recurring: true,
          date: "2024-01-01",
        },
      ],
    });
    const savings = score.components.find((row) => row.label === "Savings Rate");
    expect(savings?.score).toBeGreaterThanOrEqual(0);
    expect(savings?.score).toBeLessThanOrEqual(100);
    expect(savings?.detail).toMatch(/% of income saved/);
    expect(score.total).toBeGreaterThanOrEqual(0);
    expect(score.total).toBeLessThanOrEqual(100);
  });
});

describe("credit cards", () => {
  it("counts outstanding toward liabilities and utilization", () => {
    expect(totalLiabilities(sampleData)).toBe(
      sampleData.loans.reduce((sum, loan) => sum + loan.outstanding, 0) +
        sampleData.creditCards.reduce((sum, card) => sum + card.outstanding, 0),
    );
    expect(creditUtilization(sampleData)).toBe(15);
  });
});

describe("empty-data gating", () => {
  const empty: FinanceData = {
    ...sampleData,
    incomes: [],
    expenses: [],
    loans: [],
    creditCards: [],
    investments: [],
    insurances: [],
    goals: [],
    profile: { ...sampleData.profile, emergencyFund: 0, liquidAssets: 0, monthlyEssentialExpenses: 0 },
  };

  it("reports what is missing before income and expenses exist", () => {
    const r = dataReadiness(empty);
    expect(r.ready).toBe(false);
    expect(r.missing).toEqual(["your monthly income", "your monthly expenses", "one saving or investment"]);
  });

  it("does not score the health check on no data", () => {
    const hs = healthScore(empty);
    expect(hs.ready).toBe(false);
    expect(hs.components.filter((c) => c.answered)).toHaveLength(0);
  });

  it("scores once data exists", () => {
    expect(dataReadiness(sampleData).ready).toBe(true);
    expect(healthScore(sampleData).ready).toBe(true);
  });

  it("returns one prompt instead of verdicts from the coach", () => {
    const insights = coachInsights(empty);
    expect(insights).toHaveLength(1);
    expect(insights[0]?.message).toMatch(/Add your monthly income/);
  });

  it("treats a zero emergency target as unset, not funded", () => {
    expect(emergencyFund(empty).progress).toBe(0);
  });
});

describe("recommendations", () => {
  it("returns none on empty data", () => {
    const empty: FinanceData = { ...sampleData, incomes: [], expenses: [], loans: [], investments: [], insurances: [] };
    expect(generateRecommendations(empty)).toEqual([]);
  });

  it("ranks High impact first and gives every tip a button", () => {
    const recs = generateRecommendations(sampleData);
    expect(recs.length).toBeGreaterThan(0);
    const rank = { High: 0, Medium: 1, Low: 2 };
    for (let i = 1; i < recs.length; i++) {
      expect(rank[recs[i]!.impact]).toBeGreaterThanOrEqual(rank[recs[i - 1]!.impact]);
    }
    expect(recs.every((r) => r.action)).toBe(true);
  });
});

describe("tip basis", () => {
  it("labels each rule-of-thumb input as an assumption and each saved figure as data", () => {
    const recs = generateRecommendations(sampleData);
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.basis?.some((b) => b.kind === "data")).toBe(true);
    }
    const emergency = recs.find((r) => r.title.startsWith("Top up your emergency"));
    if (emergency) expect(emergency.basis).toContainEqual({ kind: "assumption", label: "6-month target" });
  });
});

describe("keepOneEmergencyItem", () => {
  const item = (category: string, impact: "High" | "Medium" | "Low", name: string) => ({ category, impact, name });

  it("keeps only the highest-impact emergency item, in place", () => {
    const out = keepOneEmergencyItem([
      item("Emergency Fund", "Medium", "a"),
      item("Debt", "High", "b"),
      item("Safety", "High", "c"),
      item("Emergency Fund", "Low", "d"),
    ]);
    expect(out.map((i) => i.name)).toEqual(["b", "c"]);
  });

  it("leaves lists with a single emergency item alone", () => {
    const list = [item("Debt", "High", "b"), item("Emergency Fund", "Low", "a")];
    expect(keepOneEmergencyItem(list)).toBe(list);
  });
});

describe("goalFixes", () => {
  const inYears = (years: number) => new Date(Date.now() + years * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const base: FinanceData = {
    ...sampleData,
    incomes: [{ id: "i", name: "Job", type: "Salary", monthlyAmount: 100_000, growthRate: 0, startDate: "2024-01-01" }],
    expenses: [{ id: "e", name: "Rent", category: "House Rent / EMI", amount: 90_000, recurring: true, date: "2024-01-01" }],
    loans: [],
    creditCards: [],
    investments: [],
    insurances: [],
  };
  const goal = (targetAmount: number, years: number) => ({
    id: "g", name: "Car", type: "Dream Car" as const, targetAmount, targetDate: inYears(years), priority: "High" as const, currentSaved: 0,
  });

  it("returns null for the emergency fund and for goals that are on track", () => {
    const ef = base.goals.find((g) => g.type === "Emergency Fund")!;
    expect(goalFixes(base, ef)).toBeNull();
    const easy = goal(10_000, 10);
    expect(analyzeGoal(base, easy).status).toBe("On Track");
    expect(goalFixes(base, easy)).toBeNull();
  });

  it("offers more cash, a later date and a lower target for an off-track goal", () => {
    const hard = goal(3_000_000, 2);
    expect(analyzeGoal(base, hard).status).not.toBe("On Track");
    const fixes = goalFixes(base, hard)!;
    expect(fixes.monthlyAvailable).toBe(monthlySavings(base));
    expect(fixes.extraMonthlyNeeded).toBeCloseTo(fixes.monthlyNeeded - fixes.monthlyAvailable, 2);
    expect(fixes.extraMonthlyNeeded).toBeGreaterThan(0);
    expect(fixes.laterDate && fixes.laterDate.getTime()).toBeGreaterThan(new Date(hard.targetDate).getTime());
    expect(fixes.affordableTarget).toBeLessThan(hard.targetAmount);
    expect(fixes.affordableTarget).toBeGreaterThan(0);
  });

  it("has no later date when there is no surplus to save", () => {
    const broke: FinanceData = { ...base, expenses: [{ ...base.expenses[0]!, amount: 120_000 }] };
    const fixes = goalFixes(broke, goal(3_000_000, 2))!;
    expect(fixes.monthlyAvailable).toBe(0);
    expect(fixes.laterDate).toBeNull();
  });
});

describe("term cover target", () => {
  const person = (dependents: number, age: number, retirementAge = 60): FinanceData => ({
    ...sampleData,
    incomes: [{ id: "i", name: "Job", type: "Salary", monthlyAmount: 100_000, growthRate: 0, startDate: "2024-01-01" }],
    loans: [],
    creditCards: [],
    profile: { ...sampleData.profile, dependents, age, retirementAge },
  });

  it("asks for more years of income as dependents increase", () => {
    expect(termCoverMultiple(person(0, 30))).toBe(5);
    expect(termCoverMultiple(person(1, 30))).toBe(10);
    expect(termCoverMultiple(person(3, 30))).toBe(15);
  });

  it("never asks for more years of cover than remain before retirement", () => {
    expect(termCoverMultiple(person(3, 52, 60))).toBe(8);
    expect(termCoverMultiple(person(3, 61, 60))).toBe(0);
  });

  it("gives a single renter and a family of four different targets", () => {
    const single = analyzeInsurance(person(0, 30)).recommendedTermCover;
    const family = analyzeInsurance(person(3, 30)).recommendedTermCover;
    expect(single).toBe(6_000_000);
    expect(family).toBe(18_000_000);
  });
});

describe("dailySpentThisMonth", () => {
  it("reads a bare date as local time, so the 1st stays in its own month", () => {
    const now = new Date(2026, 11, 15);
    expect(dailySpentThisMonth([{ amount: 100, date: "2026-12-01" }], now)).toBe(100);
    expect(dailySpentThisMonth([{ amount: 100, date: "2026-11-30" }], now)).toBe(0);
  });

  it("still handles full ISO timestamps", () => {
    const now = new Date(2026, 11, 15);
    expect(dailySpentThisMonth([{ amount: 5, date: new Date(2026, 11, 10, 9).toISOString() }], now)).toBe(5);
  });
});
