import {
  findTaxFinancialYear,
  type TaxDeductionCode,
  type TaxRegime,
} from "./tax.catalog";
import { computeTaxPlan, type TaxPlanInput, type TaxPlanResult } from "./tax.engine";

export type TaxDeductionAmounts = Partial<Record<TaxDeductionCode, number>>;

export type TaxCompareInput = {
  countryCode: string;
  financialYear: string;
  grossSalary: number;
  otherIncome: number;
  actual: TaxDeductionAmounts;
  /** Sections left out here keep their actual amount. */
  planned?: TaxDeductionAmounts;
};

export type TaxComparisonColumnKey = "old" | "new" | "single" | "planner";

export type TaxComparisonColumn = {
  key: TaxComparisonColumnKey;
  label: string;
  regimeCode: string;
  regimeLabel: string;
  result: TaxPlanResult;
};

export type TaxComparisonRowKind =
  | "income"
  | "exemption"
  | "section"
  | "deduction"
  | "subtotal"
  | "tax"
  | "total";

export type TaxComparisonRow = {
  key: string;
  label: string;
  kind: TaxComparisonRowKind;
  /** Aligned with `columns`. `null` renders as not-applicable. */
  values: (number | null)[];
};

export type TaxComparison = {
  countryCode: string;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  columns: TaxComparisonColumn[];
  rows: TaxComparisonRow[];
  bestColumnKey: TaxComparisonColumnKey;
  bestTotalTax: number;
  notes: string[];
};

const DEDUCTION_ROW_LABELS: Record<TaxDeductionCode, string> = {
  hraExemption: "HRA Exempt Amount",
  homeLoanInterest: "Interest on Home Loan",
  section80C: "80C/80CCD(1)",
  employerNps80Ccd2: "80CCD(2)",
  nps80Ccd: "80CCD(1B)",
  section80D: "80D",
  section80E: "80E",
  section80Eea: "80EEA",
  section80Gg: "80GG",
  section80Tta: "80TTA",
  otherDeductions: "Other deductions",
};

const STANDARD_DEDUCTION_ROW = "standardDeduction";

/** Display order above "Gross Total Income", matching an ITR computation sheet. */
const EXEMPTION_ROW_ORDER: (TaxDeductionCode | typeof STANDARD_DEDUCTION_ROW)[] = [
  "hraExemption",
  STANDARD_DEDUCTION_ROW,
  "homeLoanInterest",
];

/** Display order under the Chapter VI-A heading. */
const CHAPTER_VIA_ROW_ORDER: TaxDeductionCode[] = [
  "section80C",
  "employerNps80Ccd2",
  "nps80Ccd",
  "section80D",
  "section80E",
  "section80Eea",
  "section80Gg",
  "section80Tta",
  "otherDeductions",
];

/** Catches any code missing from the order lists so no section is dropped. */
const UNORDERED_ROW_CODES: TaxDeductionCode[] = (
  Object.keys(DEDUCTION_ROW_LABELS) as TaxDeductionCode[]
).filter(
  (code) =>
    !EXEMPTION_ROW_ORDER.includes(code) && !CHAPTER_VIA_ROW_ORDER.includes(code),
);

function planInput(
  regime: TaxRegime,
  input: TaxCompareInput,
  amounts: TaxDeductionAmounts,
): TaxPlanInput {
  return {
    countryCode: regime.countryCode,
    regimeCode: regime.code,
    grossSalary: input.grossSalary,
    otherIncome: input.otherIncome,
    ...amounts,
  };
}

function deductionValue(result: TaxPlanResult, code: TaxDeductionCode): number | null {
  const line = result.deductionLines.find((item) => item.code === code);
  return line ? line.allowed : null;
}

type ColumnPlan = {
  key: TaxComparisonColumnKey;
  label: string;
  regime: TaxRegime;
  amounts: TaxDeductionAmounts;
};

function buildColumnPlans(input: TaxCompareInput, regimes: TaxRegime[]): ColumnPlan[] {
  const single = regimes.find((regime) => regime.kind === "single");
  const old = regimes.find((regime) => regime.kind === "old");
  const next = regimes.find((regime) => regime.kind === "new");

  // Deductions are what the planner column moves, so anchor it on the regime
  // that allows the most of them.
  const plannerRegime = old ?? single ?? next;
  const plans: ColumnPlan[] = [];

  if (single) {
    plans.push({
      key: "single",
      label: single.label,
      regime: single,
      amounts: input.actual,
    });
  }
  if (old) {
    plans.push({ key: "old", label: "Old Regime", regime: old, amounts: input.actual });
  }
  if (plannerRegime) {
    plans.push({
      key: "planner",
      label: "With Planner",
      regime: plannerRegime,
      amounts: { ...input.actual, ...input.planned },
    });
  }
  if (next) {
    plans.push({ key: "new", label: "New Regime", regime: next, amounts: input.actual });
  }

  return plans;
}

export function buildTaxComparison(input: TaxCompareInput): TaxComparison {
  const year = findTaxFinancialYear(input.countryCode, input.financialYear);
  if (!year) {
    throw new Error("Unknown tax country or financial year");
  }

  const plans = buildColumnPlans(input, year.regimes);
  const columns: TaxComparisonColumn[] = plans.map((plan) => ({
    key: plan.key,
    label: plan.label,
    regimeCode: plan.regime.code,
    regimeLabel: plan.regime.label,
    result: computeTaxPlan(planInput(plan.regime, input, plan.amounts)),
  }));

  const results = columns.map((column) => column.result);
  const rows: TaxComparisonRow[] = [];

  const push = (
    key: string,
    label: string,
    kind: TaxComparisonRowKind,
    pick: (result: TaxPlanResult) => number | null,
  ) => {
    const values = results.map(pick);
    // A row every column marks unavailable carries no information.
    if (values.every((value) => value === null)) {
      return;
    }
    rows.push({ key, label, kind, values });
  };

  push("grossIncome", "Income From All Sources", "income", (result) => result.grossIncome);

  for (const code of EXEMPTION_ROW_ORDER) {
    if (code === STANDARD_DEDUCTION_ROW) {
      push("standardDeduction", "Standard Deductions", "exemption", (result) =>
        result.standardDeduction,
      );
      continue;
    }
    push(code, DEDUCTION_ROW_LABELS[code], "exemption", (result) =>
      deductionValue(result, code),
    );
  }

  push("grossTotalIncome", "Gross Total Income", "subtotal", (result) => result.grossTotalIncome);

  rows.push({
    key: "chapterViaHeading",
    label: input.countryCode === "IN" ? "Deductions Chap VI-A" : "Deductions",
    kind: "section",
    values: results.map(() => null),
  });

  for (const code of [...CHAPTER_VIA_ROW_ORDER, ...UNORDERED_ROW_CODES]) {
    push(code, DEDUCTION_ROW_LABELS[code], "deduction", (result) =>
      deductionValue(result, code),
    );
  }

  push("taxableIncome", "Net Taxable Income", "subtotal", (result) => result.taxableIncome);
  push("taxBeforeRebate", "Tax on Above", "tax", (result) => result.taxBeforeRebate);

  if (results.some((result) => result.rebate > 0)) {
    push("rebate", "Rebate u/s 87A", "tax", (result) => result.rebate);
  }

  if (plans.some((plan) => plan.regime.surcharge != null)) {
    push("surcharge", "Surcharge", "tax", (result) => result.surcharge);
  }

  const cessRate = results.reduce((max, result) => Math.max(max, result.cessRate), 0);
  if (cessRate > 0) {
    push("cess", `Cess @ ${Number((cessRate * 100).toFixed(2))}%`, "tax", (result) =>
      result.cess,
    );
  }

  push("totalTax", "Total", "total", (result) => result.totalTax);

  const best = columns.reduce<TaxComparisonColumn | undefined>((lowest, column) => {
    if (!lowest || column.result.totalTax < lowest.result.totalTax) {
      return column;
    }
    return lowest;
  }, undefined);

  const notes = [...new Set(results.flatMap((result) => result.notes))];

  return {
    countryCode: input.countryCode,
    financialYear: year.financialYear,
    assessmentYear: year.assessmentYear,
    currency: results[0]?.currency ?? "INR",
    columns,
    rows,
    bestColumnKey: best?.key ?? "planner",
    bestTotalTax: best?.result.totalTax ?? 0,
    notes,
  };
}
