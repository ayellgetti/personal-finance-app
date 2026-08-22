import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTaxComparison,
  type TaxComparison,
} from "../modules/personal-finance/tax/tax.compare";
import { computeTaxPlan } from "../modules/personal-finance/tax/tax.engine";
import { parseStatementText } from "../modules/personal-finance/statement/statement.parser";

function rowValues(comparison: TaxComparison, key: string): (number | null)[] {
  const row = comparison.rows.find((item) => item.key === key);
  assert.ok(row, `comparison is missing the "${key}" row`);
  return row.values;
}

function assertMoney(actual: (number | null)[], expected: (number | null)[]) {
  assert.equal(actual.length, expected.length, "column count mismatch");
  actual.forEach((value, index) => {
    const want = expected[index];
    if (value === null || want === null || want === undefined) {
      assert.equal(value, want);
      return;
    }
    assert.ok(
      Math.abs(value - want) < 0.01,
      `column ${index}: expected ${want}, got ${value}`,
    );
  });
}

test("India new regime FY 2025-26 zeros tax at 12 lakh taxable income", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_new_fy2025_26",
    grossSalary: 1_275_000,
    otherIncome: 0,
  });

  assert.equal(result.taxableIncome, 1_200_000);
  assert.equal(result.totalTax, 0);
  assert.equal(result.rebate, 60_000);
});

test("India new regime FY 2025-26 applies slabs and cess above rebate", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_new_fy2025_26",
    grossSalary: 1_500_000,
    otherIncome: 0,
  });

  assert.equal(result.standardDeduction, 75_000);
  assert.equal(result.taxableIncome, 1_425_000);
  assert.equal(result.taxBeforeRebate, 93_750);
  assert.equal(result.rebate, 0);
  assert.equal(result.cess, 3_750);
  assert.equal(result.totalTax, 97_500);
});

test("India old regime applies 80C and 87A rebate at 5 lakh taxable", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_old_fy2025_26",
    grossSalary: 700_000,
    otherIncome: 0,
    section80C: 150_000,
  });

  assert.equal(result.standardDeduction, 50_000);
  assert.equal(result.chapterViaDeductions, 150_000);
  assert.equal(result.taxableIncome, 500_000);
  assert.equal(result.totalTax, 0);
});

test("India new regime ignores 80C and applies employer NPS", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_new_fy2025_26",
    grossSalary: 1_275_000,
    otherIncome: 0,
    section80C: 150_000,
    employerNps80Ccd2: 80_000,
  });

  assert.equal(result.standardDeduction, 75_000);
  assert.equal(result.chapterViaDeductions, 80_000);
  assert.equal(result.taxableIncome, 1_120_000);
  assert.equal(result.totalTax, 0);
});

test("India new regime caps employer NPS at 14 percent of salary", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_new_fy2025_26",
    grossSalary: 1_000_000,
    otherIncome: 0,
    employerNps80Ccd2: 200_000,
  });

  assert.equal(result.chapterViaDeductions, 140_000);
  assert.equal(result.taxableIncome, 785_000);
});

test("US federal 2025 single uses USD brackets", () => {
  const result = computeTaxPlan({
    countryCode: "US",
    regimeCode: "us_federal_2025_single",
    grossSalary: 80_000,
    otherIncome: 0,
  });

  assert.equal(result.currency, "USD");
  assert.equal(result.standardDeduction, 15_000);
  assert.equal(result.taxableIncome, 65_000);
  assert.ok(result.totalTax > 0);
  assert.equal(result.cess, 0);
});

test("India old regime deducts HRA and 24b interest before gross total income", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_old_fy2025_26",
    grossSalary: 3_200_000,
    otherIncome: 0,
    hraExemption: 236_429,
    homeLoanInterest: 200_000,
    section80C: 150_000,
  });

  assert.equal(result.exemptions, 436_429);
  assert.equal(result.grossTotalIncome, 2_713_571);
  assert.equal(result.chapterViaDeductions, 150_000);
  assert.equal(result.taxableIncome, 2_563_571);
});

test("India old regime caps 80EEA, 80GG, and 80TTA but not 80E", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_old_fy2025_26",
    grossSalary: 2_000_000,
    otherIncome: 0,
    section80E: 90_000,
    section80Eea: 200_000,
    section80Gg: 100_000,
    section80Tta: 25_000,
  });

  const allowed = new Map(result.deductionLines.map((line) => [line.code, line.allowed]));
  assert.equal(allowed.get("section80E"), 90_000);
  assert.equal(allowed.get("section80Eea"), 150_000);
  assert.equal(allowed.get("section80Gg"), 60_000);
  assert.equal(allowed.get("section80Tta"), 10_000);
  assert.equal(result.chapterViaDeductions, 310_000);
  assert.equal(result.taxableIncome, 1_640_000);
});

test("India new regime offers no section beyond employer NPS", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_new_fy2025_26",
    grossSalary: 2_000_000,
    otherIncome: 0,
    section80E: 90_000,
    section80Gg: 100_000,
  });

  assert.deepEqual(
    result.deductionLines.map((line) => line.code),
    ["employerNps80Ccd2"],
  );
  assert.equal(result.chapterViaDeductions, 0);
});

test("India old regime adds 10 percent surcharge above 50 lakh", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_old_fy2025_26",
    grossSalary: 6_000_000,
    otherIncome: 0,
  });

  assert.equal(result.taxableIncome, 5_950_000);
  assert.equal(result.taxBeforeRebate, 1_597_500);
  assert.equal(result.surcharge, 159_750);
  assert.equal(result.cess, 70_290);
  assert.equal(result.totalTax, 1_827_540);
});

test("surcharge marginal relief caps the jump just above 50 lakh", () => {
  const result = computeTaxPlan({
    countryCode: "IN",
    regimeCode: "in_old_fy2025_26",
    grossSalary: 5_060_000,
    otherIncome: 0,
  });

  assert.equal(result.taxableIncome, 5_010_000);
  assert.equal(result.taxBeforeRebate, 1_315_500);
  // Without relief this would be 131,550.
  assert.equal(result.surcharge, 7_000);
  assert.equal(result.totalTax, 1_375_400);
});

test("comparison lays out old, planner, and new regimes as a computation sheet", () => {
  const comparison = buildTaxComparison({
    countryCode: "IN",
    financialYear: "2025-26",
    grossSalary: 3_200_000,
    otherIncome: 0,
    actual: {
      hraExemption: 236_429,
      homeLoanInterest: 200_000,
      section80C: 150_000,
      employerNps80Ccd2: 8_000,
      nps80Ccd: 10_000,
      section80D: 25_000,
    },
    planned: { nps80Ccd: 50_000 },
  });

  assert.deepEqual(
    comparison.columns.map((column) => column.key),
    ["old", "planner", "new"],
  );

  assertMoney(rowValues(comparison, "grossIncome"), [3_200_000, 3_200_000, 3_200_000]);
  assertMoney(rowValues(comparison, "hraExemption"), [236_429, 236_429, null]);
  assertMoney(rowValues(comparison, "standardDeduction"), [50_000, 50_000, 75_000]);
  assertMoney(rowValues(comparison, "homeLoanInterest"), [200_000, 200_000, null]);
  assertMoney(
    rowValues(comparison, "grossTotalIncome"),
    [2_713_571, 2_713_571, 3_125_000],
  );
  assertMoney(rowValues(comparison, "section80C"), [150_000, 150_000, null]);
  assertMoney(rowValues(comparison, "employerNps80Ccd2"), [8_000, 8_000, 8_000]);
  assertMoney(rowValues(comparison, "nps80Ccd"), [10_000, 50_000, null]);
  assertMoney(rowValues(comparison, "section80E"), [0, 0, null]);
  assertMoney(
    rowValues(comparison, "taxableIncome"),
    [2_520_571, 2_480_571, 3_117_000],
  );
  assertMoney(
    rowValues(comparison, "taxBeforeRebate"),
    [568_671.3, 556_671.3, 515_100],
  );
  assertMoney(rowValues(comparison, "surcharge"), [0, 0, 0]);
  assertMoney(rowValues(comparison, "cess"), [22_746.85, 22_266.85, 20_604]);
  assertMoney(
    rowValues(comparison, "totalTax"),
    [591_418.15, 578_938.15, 535_704],
  );

  assert.equal(comparison.bestColumnKey, "new");
  assert.equal(comparison.rows.find((row) => row.key === "cess")?.label, "Cess @ 4%");
});

test("comparison planner column keeps actual amounts for unplanned sections", () => {
  const comparison = buildTaxComparison({
    countryCode: "IN",
    financialYear: "2025-26",
    grossSalary: 1_800_000,
    otherIncome: 0,
    actual: { section80C: 150_000, section80D: 25_000 },
  });

  const old = comparison.columns.find((column) => column.key === "old");
  const planner = comparison.columns.find((column) => column.key === "planner");
  assert.ok(old && planner);
  assert.equal(planner.result.totalTax, old.result.totalTax);
  assert.equal(planner.regimeCode, old.regimeCode);
});

test("comparison for a single-regime country drops the old and new columns", () => {
  const comparison = buildTaxComparison({
    countryCode: "US",
    financialYear: "2025",
    grossSalary: 120_000,
    otherIncome: 0,
    actual: { otherDeductions: 5_000 },
    planned: { otherDeductions: 12_000 },
  });

  assert.deepEqual(
    comparison.columns.map((column) => column.key),
    ["single", "planner"],
  );
  assertMoney(rowValues(comparison, "otherDeductions"), [5_000, 12_000]);
  // No cess and no surcharge concept, so those rows stay out of the sheet.
  assert.equal(comparison.rows.some((row) => row.key === "cess"), false);
  assert.equal(comparison.rows.some((row) => row.key === "surcharge"), false);
});

test("bank CSV parser splits debit and credit columns", () => {
  const csv = [
    "Date,Narration,Withdrawal Amt,Deposit Amt,Closing Balance",
    "01/04/2025,UPI-SWIGGY*LUNCH,450.00,,125000.00",
    "02/04/2025,SALARY NEFT HDFC,,85000.00,210000.00",
  ].join("\n");

  const parsed = parseStatementText(csv);
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.summary.debitTotal, 450);
  assert.equal(parsed.summary.creditTotal, 85_000);
  assert.equal(parsed.lines[0]?.category, "food");
  assert.equal(parsed.lines[1]?.category, "salary");
});

test("phone statement CSV parser uses type and amount", () => {
  const csv = [
    "Date,Transaction details,Type,Amount",
    "21 Aug 2025,Paid to Blinkit,DEBIT,820",
    "21 Aug 2025,Received from Mom,CREDIT,5000",
  ].join("\n");

  const parsed = parseStatementText(csv);
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.summary.net, 4180);
  assert.equal(parsed.lines[0]?.category, "groceries");
});

test("bank CSV parser skips account preamble rows above the header", () => {
  const csv = [
    "HDFC Bank Ltd",
    "Account No: 5010 0123 4567,,,",
    "Statement from 01/04/2025 to 30/04/2025,,,",
    "",
    "Date,Narration,Withdrawal Amt,Deposit Amt,Closing Balance",
    "01/04/2025,UPI-BLINKIT GROCERY,\"1,250.00\",,\"1,23,750.00\"",
    "03/04/2025,SALARY CREDIT,,\"85,000.00\",\"2,08,750.00\"",
  ].join("\n");

  const parsed = parseStatementText(csv);
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.summary.debitTotal, 1250);
  assert.equal(parsed.summary.creditTotal, 85_000);
  assert.equal(parsed.lines[0]?.category, "groceries");
});

test("single amount column uses Dr and Cr suffixes for direction", () => {
  const csv = [
    "Txn Date,Description,Amount,Balance",
    "01-May-2025,ATM CASH WDL,Rs. 2000.00 Dr,50000.00",
    "02-May-2025,NEFT REFUND ONLINE,Rs. 1500.00 Cr,51500.00",
  ].join("\n");

  const parsed = parseStatementText(csv);
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.lines[0]?.direction, "debit");
  assert.equal(parsed.lines[0]?.amount, 2000);
  assert.equal(parsed.lines[0]?.category, "cash_atm");
  assert.equal(parsed.lines[1]?.direction, "credit");
  assert.equal(parsed.lines[1]?.amount, 1500);
  assert.equal(parsed.lines[0]?.postedOn?.toISOString(), "2025-05-01T00:00:00.000Z");
});

test("tab separated PDF table keeps empty debit and credit cells apart", () => {
  const tsv = [
    "Date\tNarration\tWithdrawal\tDeposit\tBalance",
    "05/04/2025\tUPI-ZOMATO ORDER\t320.00\t\t99,680.00",
    "06/04/2025\tIMPS FROM RAVI\t\t4,000.00\t1,03,680.00",
  ].join("\n");

  const parsed = parseStatementText(tsv);
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.lines[0]?.direction, "debit");
  assert.equal(parsed.lines[0]?.category, "food");
  assert.equal(parsed.lines[1]?.direction, "credit");
  assert.equal(parsed.summary.net, 3680);
});

test("headerless rows infer direction from the running balance", () => {
  const text = [
    "Statement of account for April 2025",
    "01/04/2025 OPENING BALANCE 100,000.00",
    "02/04/2025 UPI-SWIGGY LUNCH 450.00 99,550.00",
    "03/04/2025 SALARY NEFT 85,000.00 1,84,550.00",
    "Page 1 of 2",
  ].join("\n");

  const parsed = parseStatementText(text);
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.lines[0]?.direction, "debit");
  assert.equal(parsed.lines[0]?.amount, 450);
  assert.equal(parsed.lines[1]?.direction, "credit");
  assert.equal(parsed.lines[1]?.amount, 85_000);
  assert.equal(parsed.summary.debitTotal, 450);
});

test("SMS dump parser extracts credited and debited amounts", () => {
  const text =
    "22/08/2025 Rs.1,200 credited to a/c via UPI from RAVI. 22/08/2025 Rs.320 debited for UPI-SWIGGY.";
  const parsed = parseStatementText(text);
  assert.equal(parsed.lines.length, 2);
  assert.equal(parsed.summary.creditTotal, 1200);
  assert.equal(parsed.summary.debitTotal, 320);
});
