import { describe, expect, it } from "vitest";
import {
  forecastNetWorth,
  goalProjectionSchedule,
  investmentProjectionSchedule,
  loanBalanceAfterMonths,
  loanPayoffMonths,
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
