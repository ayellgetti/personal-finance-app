import { describe, expect, it } from "vitest";
import { forecastNetWorth, loanBalanceAfterMonths, loanPayoffMonths } from "./calculations";
import { sampleData } from "./sampleData";
import type { FinanceData, Loan } from "@/types/finance";

const housing: Loan = {
  id: "housing",
  name: "Housing",
  type: "Home",
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
  type: "Personal",
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
    const forecast = forecastNetWorth(withLoans([housing, personal]), "Moderate");
    for (let i = 1; i < forecast.length; i += 1) {
      expect(forecast[i].debt).toBeLessThanOrEqual(forecast[i - 1].debt);
    }
    expect(forecast[0].debt).toBe(housing.outstanding + personal.outstanding);
    expect(forecast[forecast.length - 1].debt).toBe(0);
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
