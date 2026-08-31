import assert from "node:assert/strict";
import test from "node:test";
import { computeCalculator } from "../modules/personal-finance/calculator/calculator.engine";
import { calculatorInputSchema } from "../modules/personal-finance/calculator/calculator.request";

function closeTo(actual: number, expected: number, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `expected ${expected}, got ${actual}`,
  );
}

test("lumpsum compounds principal annually", () => {
  const result = computeCalculator({
    type: "lumpsum",
    principal: 100_000,
    annualRatePct: 10,
    years: 2,
  });

  assert.equal(result.values.futureValue, 121_000);
  assert.equal(result.values.estimatedReturns, 21_000);
  assert.deepEqual(
    result.schedule?.map((row) => row.futureValue),
    [110_000, 121_000],
  );
});

test("SIP uses an annuity due with monthly deposits", () => {
  const result = computeCalculator({
    type: "sip",
    monthlyContribution: 10_000,
    annualRatePct: 12,
    years: 1,
  });

  assert.equal(result.values.investedAmount, 120_000);
  closeTo(result.values.futureValue ?? 0, 128_093.28);
  assert.equal(result.schedule?.length, 1);
  closeTo(result.schedule?.[0]?.futureValue ?? 0, 128_093.28);
});

test("step-up SIP increases the contribution after each 12 months", () => {
  const result = computeCalculator({
    type: "step_up_sip",
    monthlyContribution: 10_000,
    annualRatePct: 0,
    annualStepUpPct: 10,
    years: 2,
  });

  assert.equal(result.values.investedAmount, 252_000);
  assert.equal(result.values.futureValue, 252_000);
  assert.equal(result.values.finalMonthlyContribution, 11_000);
  assert.equal(result.schedule?.length, 2);
});

test("EMI remains separate from loan payoff", () => {
  const emi = computeCalculator({
    type: "emi",
    principal: 100_000,
    annualRatePct: 12,
    months: 12,
  });
  const loan = computeCalculator({
    type: "loan",
    principal: 100_000,
    annualRatePct: 12,
    months: 12,
    monthlyPayment: 10_000,
  });

  closeTo(emi.values.monthlyPayment ?? 0, 8_884.88);
  assert.equal(emi.values.months, 12);
  assert.equal(emi.schedule?.length, 1);
  assert.equal(loan.values.payoffMonths, 11);
  assert.ok((loan.values.totalInterest ?? 0) > 0);
});

test("loan computes EMI from tenure when monthly payment is omitted", () => {
  const result = computeCalculator({
    type: "loan",
    principal: 100_000,
    annualRatePct: 12,
    months: 12,
  });

  closeTo(result.values.monthlyPayment ?? 0, 8_884.88);
  closeTo(result.values.scheduledMonthlyPayment ?? 0, 8_884.88);
  assert.equal(result.values.payoffMonths, 12);
  assert.equal(result.schedule?.length, 1);
  assert.equal(result.monthlySchedule?.length, 12);
  assert.equal(
    calculatorInputSchema.safeParse({
      type: "loan",
      principal: 100_000,
      annualRatePct: 12,
      months: 12,
    }).success,
    true,
  );
});

test("loan payoff rejects a payment that does not cover monthly interest", () => {
  assert.throws(
    () =>
      computeCalculator({
        type: "loan",
        principal: 100_000,
        annualRatePct: 12,
        months: 12,
        monthlyPayment: 1_000,
      }),
    /greater than the monthly interest/,
  );
});

test("loan prepayment reduces tenure and interest from the current plan", () => {
  const result = computeCalculator({
    type: "loan",
    principal: 1_000_000,
    annualRatePct: 9,
    months: 120,
    prepaymentAmount: 200_000,
  });

  assert.equal(result.values.prepaymentAmount, 200_000);
  assert.ok((result.values.payoffMonths ?? 0) < 120);
  assert.ok((result.values.monthsSaved ?? 0) > 0);
  assert.ok((result.values.interestSaved ?? 0) > 0);
  assert.ok(
    (result.values.totalInterest ?? 0) <
      (result.values.baselineTotalInterest ?? 0),
  );
});

test("loan supports a higher EMI and immediate prepayment together", () => {
  const result = computeCalculator({
    type: "loan",
    principal: 1_000_000,
    annualRatePct: 9,
    months: 120,
    monthlyPayment: 12_668,
    prepaymentAmount: 100_000,
    increasedMonthlyPayment: 18_000,
  });

  assert.equal(result.values.baselineMonthlyPayment, 12_668);
  assert.equal(result.values.monthlyPayment, 18_000);
  assert.equal(result.values.paymentIncrease, 5_332);
  assert.ok((result.values.payoffMonths ?? 0) < 120);
  assert.ok((result.values.interestSaved ?? 0) > 0);
  assert.ok(
    result.notes.some((note) => note.includes("higher EMI starts")),
  );
});

test("loan rejects invalid early-closure assumptions", () => {
  assert.throws(
    () =>
      computeCalculator({
        type: "loan",
        principal: 100_000,
        annualRatePct: 12,
        months: 12,
        monthlyPayment: 10_000,
        increasedMonthlyPayment: 9_000,
      }),
    /greater than the current EMI/,
  );
  assert.equal(
    calculatorInputSchema.safeParse({
      type: "loan",
      principal: 100_000,
      annualRatePct: 12,
      months: 12,
      prepaymentAmount: 100_001,
    }).success,
    false,
  );
});

test("future target computes the required annuity-due SIP", () => {
  const result = computeCalculator({
    type: "future",
    targetAmount: 128_093.28,
    annualRatePct: 12,
    years: 1,
  });

  closeTo(result.values.requiredMonthlySip ?? 0, 10_000);
  assert.ok(result.notes.some((note) => note.includes("not a guarantee")));
  assert.equal(result.schedule?.length, 1);
});

test("straight-line depreciation reaches salvage value", () => {
  const result = computeCalculator({
    type: "depreciation",
    method: "straight_line",
    cost: 100_000,
    salvageValue: 10_000,
    usefulLifeYears: 3,
  });

  assert.equal(result.values.totalDepreciation, 90_000);
  assert.equal(result.values.bookValue, 10_000);
  assert.deepEqual(
    result.schedule?.map((row) => row.depreciation),
    [30_000, 30_000, 30_000],
  );
});

test("written-down value depreciation applies the rate to opening book value", () => {
  const result = computeCalculator({
    type: "depreciation",
    method: "written_down_value",
    cost: 100_000,
    salvageValue: 0,
    usefulLifeYears: 2,
    ratePct: 20,
  });

  assert.deepEqual(
    result.schedule?.map((row) => row.closingBookValue),
    [80_000, 64_000],
  );
  assert.equal(result.values.totalDepreciation, 36_000);
});

test("currency conversion uses the manually supplied INR exchange rate", () => {
  const result = computeCalculator({
    type: "currency",
    amount: 100_000,
    exchangeRate: 0.012,
    targetCurrency: "USD",
  });

  assert.equal(result.values.convertedAmount, 1_200);
  assert.equal(result.textValues?.conversion, "USD 1,200");
});

test("number to words uses Indian lakh and crore units", () => {
  const result = computeCalculator({
    type: "number_words",
    number: 12_345_678,
  });

  assert.equal(
    result.textValues?.words,
    "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight",
  );
});

test("bond yield equals coupon rate when price equals face value", () => {
  const result = computeCalculator({
    type: "bond_yield",
    faceValue: 1_000,
    marketPrice: 1_000,
    annualCouponRatePct: 8,
    yearsToMaturity: 5,
    paymentsPerYear: 2,
  });

  closeTo(result.values.currentYieldPct ?? 0, 8);
  closeTo(result.values.yieldToMaturityPct ?? 0, 8);
  assert.equal(result.schedule?.length, 5);
});

test("stock calculator includes dividends and fees in net return", () => {
  const result = computeCalculator({
    type: "stock",
    buyPrice: 100,
    sellPrice: 125,
    quantity: 100,
    dividends: 500,
    fees: 100,
  });

  assert.equal(result.values.purchaseCost, 10_000);
  assert.equal(result.values.netProfit, 2_900);
  assert.equal(result.values.returnPct, 29);
});

test("IRR resolves equal-period cash flows and returns a timeline", () => {
  const result = computeCalculator({
    type: "irr",
    cashFlows: [-100, 60, 60],
  });

  closeTo(result.values.irrPct ?? 0, 13.066, 0.01);
  assert.equal(result.schedule?.length, 3);
});

test("request validation discriminates calculator inputs and enforces WDV rate", () => {
  assert.equal(
    calculatorInputSchema.safeParse({
      type: "emi",
      principal: 100_000,
      annualRatePct: 10,
      months: 12,
    }).success,
    true,
  );
  assert.equal(
    calculatorInputSchema.safeParse({
      type: "depreciation",
      method: "written_down_value",
      cost: 100_000,
      salvageValue: 10_000,
      usefulLifeYears: 5,
    }).success,
    false,
  );
  assert.equal(
    calculatorInputSchema.safeParse({
      type: "unknown",
      principal: 100_000,
    }).success,
    false,
  );
  assert.equal(
    calculatorInputSchema.safeParse({
      type: "irr",
      cashFlows: [100, 20],
    }).success,
    false,
  );
});
