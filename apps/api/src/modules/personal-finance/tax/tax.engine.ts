import {
  findTaxRegime,
  type TaxDeductionCode,
  type TaxDeductionGroup,
  type TaxRegime,
  type TaxSlab,
  type TaxSurchargeTier,
} from "./tax.catalog";

export type TaxPlanInput = {
  countryCode: string;
  regimeCode: string;
  grossSalary: number;
  otherIncome: number;
  section80C?: number;
  section80D?: number;
  hraExemption?: number;
  homeLoanInterest?: number;
  nps80Ccd?: number;
  employerNps80Ccd2?: number;
  section80E?: number;
  section80Eea?: number;
  section80Gg?: number;
  section80Tta?: number;
  otherDeductions?: number;
};

export type TaxSlabResult = {
  from: number;
  to: number | null;
  rate: number;
  taxableInSlab: number;
  tax: number;
};

export type TaxDeductionLine = {
  code: TaxDeductionCode;
  label: string;
  group: TaxDeductionGroup;
  entered: number;
  allowed: number;
  capped: boolean;
};

export type TaxPlanResult = {
  countryCode: string;
  regimeCode: string;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  grossIncome: number;
  standardDeduction: number;
  exemptions: number;
  grossTotalIncome: number;
  chapterViaDeductions: number;
  deductionLines: TaxDeductionLine[];
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate: number;
  taxAfterRebate: number;
  surcharge: number;
  cessRate: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  monthlyTax: number;
  takeHomeAnnual: number;
  takeHomeMonthly: number;
  slabs: TaxSlabResult[];
  notes: string[];
};

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampNonNegative(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

function taxFromSlabs(taxable: number, slabs: TaxSlab[]): { tax: number; breakdown: TaxSlabResult[] } {
  let remaining = Math.max(0, taxable);
  let previousCap = 0;
  let tax = 0;
  const breakdown: TaxSlabResult[] = [];

  for (const slab of slabs) {
    const cap = slab.upTo;
    const width = cap == null ? remaining : Math.max(0, cap - previousCap);
    const taxableInSlab = Math.min(remaining, width);
    const slabTax = taxableInSlab * slab.rate;
    tax += slabTax;
    breakdown.push({
      from: previousCap,
      to: cap,
      rate: slab.rate,
      taxableInSlab: roundMoney(taxableInSlab),
      tax: roundMoney(slabTax),
    });
    remaining -= taxableInSlab;
    if (cap != null) {
      previousCap = cap;
    }
    if (remaining <= 0) {
      break;
    }
  }

  return { tax: roundMoney(tax), breakdown };
}

function applyRebate(tax: number, taxable: number, regime: TaxRegime): { tax: number; rebate: number } {
  const rule = regime.rebate;
  if (!rule) {
    return { tax, rebate: 0 };
  }

  if (taxable <= rule.maxTaxableIncome) {
    const rebate = Math.min(tax, rule.maxRebate);
    return { tax: roundMoney(tax - rebate), rebate: roundMoney(rebate) };
  }

  if (rule.marginalRelief) {
    const excess = taxable - rule.maxTaxableIncome;
    if (tax > excess) {
      const rebate = roundMoney(tax - excess);
      return { tax: roundMoney(excess), rebate };
    }
  }

  return { tax, rebate: 0 };
}

function inputAmount(code: TaxDeductionCode, input: TaxPlanInput): number {
  switch (code) {
    case "section80C":
      return clampNonNegative(input.section80C);
    case "section80D":
      return clampNonNegative(input.section80D);
    case "hraExemption":
      return clampNonNegative(input.hraExemption);
    case "homeLoanInterest":
      return clampNonNegative(input.homeLoanInterest);
    case "nps80Ccd":
      return clampNonNegative(input.nps80Ccd);
    case "employerNps80Ccd2":
      return clampNonNegative(input.employerNps80Ccd2);
    case "section80E":
      return clampNonNegative(input.section80E);
    case "section80Eea":
      return clampNonNegative(input.section80Eea);
    case "section80Gg":
      return clampNonNegative(input.section80Gg);
    case "section80Tta":
      return clampNonNegative(input.section80Tta);
    case "otherDeductions":
      return clampNonNegative(input.otherDeductions);
  }
}

/** Deductions the regime does not list are silently unavailable, not zero. */
function deductionLines(regime: TaxRegime, input: TaxPlanInput): TaxDeductionLine[] {
  const salary = clampNonNegative(input.grossSalary);
  return regime.deductions.map((deduction) => {
    const entered = inputAmount(deduction.code, input);
    let allowed = entered;
    if (deduction.cap != null) {
      allowed = Math.min(allowed, deduction.cap);
    }
    if (deduction.salaryCapRate != null) {
      allowed = Math.min(allowed, salary * deduction.salaryCapRate);
    }
    return {
      code: deduction.code,
      label: deduction.label,
      group: deduction.group,
      entered: roundMoney(entered),
      allowed: roundMoney(allowed),
      capped: allowed < entered,
    };
  });
}

function sumGroup(lines: TaxDeductionLine[], group: TaxDeductionGroup): number {
  return lines.reduce(
    (total, line) => (line.group === group ? total + line.allowed : total),
    0,
  );
}

function surchargeRateAt(taxable: number, tiers: TaxSurchargeTier[]): { rate: number; threshold: number } {
  let rate = 0;
  let threshold = 0;
  for (const tier of tiers) {
    if (taxable > tier.above) {
      rate = tier.rate;
      threshold = tier.above;
    }
  }
  return { rate, threshold };
}

/**
 * Marginal relief caps surcharge so that crossing a threshold never costs more
 * in extra tax than the income earned above it.
 */
function applySurcharge(tax: number, taxable: number, regime: TaxRegime): number {
  const rule = regime.surcharge;
  if (!rule || tax <= 0) {
    return 0;
  }

  const { rate, threshold } = surchargeRateAt(taxable, rule.tiers);
  if (rate === 0) {
    return 0;
  }

  let surcharge = tax * rate;
  if (rule.marginalRelief) {
    const taxAtThreshold = taxFromSlabs(threshold, regime.slabs).tax;
    const previousRate = surchargeRateAt(threshold, rule.tiers).rate;
    const ceiling =
      taxAtThreshold + taxAtThreshold * previousRate + (taxable - threshold);
    if (tax + surcharge > ceiling) {
      surcharge = Math.max(0, ceiling - tax);
    }
  }

  return roundMoney(surcharge);
}

export function computeTaxPlan(input: TaxPlanInput): TaxPlanResult {
  const regime = findTaxRegime(input.countryCode, input.regimeCode);
  if (!regime) {
    throw new Error("Unknown tax country or regime");
  }

  const grossSalary = clampNonNegative(input.grossSalary);
  const otherIncome = clampNonNegative(input.otherIncome);
  const grossIncome = roundMoney(grossSalary + otherIncome);
  const standardDeduction = Math.min(regime.standardDeduction, grossSalary);
  const lines = deductionLines(regime, input);
  const exemptions = sumGroup(lines, "exemption");
  const chapterViaDeductionsAmount = sumGroup(lines, "chapterVia");
  const grossTotalIncome = roundMoney(
    Math.max(0, grossIncome - standardDeduction - exemptions),
  );
  const taxableIncome = roundMoney(
    Math.max(0, grossTotalIncome - chapterViaDeductionsAmount),
  );
  const { tax: taxBeforeRebate, breakdown } = taxFromSlabs(taxableIncome, regime.slabs);
  const rebated = applyRebate(taxBeforeRebate, taxableIncome, regime);
  const surcharge = applySurcharge(rebated.tax, taxableIncome, regime);
  const cess = roundMoney((rebated.tax + surcharge) * regime.cessRate);
  const totalTax = roundMoney(rebated.tax + surcharge + cess);
  const takeHomeAnnual = roundMoney(grossIncome - totalTax);

  return {
    countryCode: regime.countryCode,
    regimeCode: regime.code,
    financialYear: regime.financialYear,
    assessmentYear: regime.assessmentYear,
    currency: regime.currency,
    grossIncome,
    standardDeduction: roundMoney(standardDeduction),
    exemptions: roundMoney(exemptions),
    grossTotalIncome,
    chapterViaDeductions: roundMoney(chapterViaDeductionsAmount),
    deductionLines: lines,
    taxableIncome,
    taxBeforeRebate,
    rebate: rebated.rebate,
    taxAfterRebate: rebated.tax,
    surcharge,
    cessRate: regime.cessRate,
    cess,
    totalTax,
    effectiveRate: grossIncome > 0 ? roundMoney((totalTax / grossIncome) * 100) : 0,
    monthlyTax: roundMoney(totalTax / 12),
    takeHomeAnnual,
    takeHomeMonthly: roundMoney(takeHomeAnnual / 12),
    slabs: breakdown,
    notes: regime.notes,
  };
}
