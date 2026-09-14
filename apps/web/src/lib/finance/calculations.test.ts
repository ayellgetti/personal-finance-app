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

describe("credit cards", () => {
  it("counts outstanding toward liabilities and utilization", () => {
    expect(totalLiabilities(sampleData)).toBe(
      sampleData.loans.reduce((sum, loan) => sum + loan.outstanding, 0) +
        sampleData.creditCards.reduce((sum, card) => sum + card.outstanding, 0),
    );
    expect(creditUtilization(sampleData)).toBe(15);
  });
});
