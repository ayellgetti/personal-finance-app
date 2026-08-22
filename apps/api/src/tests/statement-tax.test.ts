import assert from "node:assert/strict";
import test from "node:test";
import { computeTaxPlan } from "../modules/personal-finance/tax/tax.engine";
import { parseStatementText } from "../modules/personal-finance/statement/statement.parser";

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
