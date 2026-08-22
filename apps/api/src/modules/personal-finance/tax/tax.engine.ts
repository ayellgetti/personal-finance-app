import { findTaxRegime, type TaxDeductionCode, type TaxRegime, type TaxSlab } from "./tax.catalog";

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
  otherDeductions?: number;
};

export type TaxSlabResult = {
  from: number;
  to: number | null;
  rate: number;
  taxableInSlab: number;
  tax: number;
};

export type TaxPlanResult = {
  countryCode: string;
  regimeCode: string;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  grossIncome: number;
  standardDeduction: number;
  chapterViaDeductions: number;
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate: number;
  taxAfterRebate: number;
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
    case "otherDeductions":
      return clampNonNegative(input.otherDeductions);
  }
}

function chapterViaDeductions(regime: TaxRegime, input: TaxPlanInput): number {
  const salary = clampNonNegative(input.grossSalary);
  return regime.deductions.reduce((total, deduction) => {
    let value = inputAmount(deduction.code, input);
    if (deduction.cap != null) {
      value = Math.min(value, deduction.cap);
    }
    if (deduction.salaryCapRate != null) {
      value = Math.min(value, salary * deduction.salaryCapRate);
    }
    return total + value;
  }, 0);
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
  const chapterViaDeductionsAmount = chapterViaDeductions(regime, input);
  const taxableIncome = roundMoney(Math.max(0, grossIncome - standardDeduction - chapterViaDeductionsAmount));
  const { tax: taxBeforeRebate, breakdown } = taxFromSlabs(taxableIncome, regime.slabs);
  const rebated = applyRebate(taxBeforeRebate, taxableIncome, regime);
  const cess = roundMoney(rebated.tax * regime.cessRate);
  const totalTax = roundMoney(rebated.tax + cess);
  const takeHomeAnnual = roundMoney(grossIncome - totalTax);

  return {
    countryCode: regime.countryCode,
    regimeCode: regime.code,
    financialYear: regime.financialYear,
    assessmentYear: regime.assessmentYear,
    currency: regime.currency,
    grossIncome,
    standardDeduction: roundMoney(standardDeduction),
    chapterViaDeductions: roundMoney(chapterViaDeductionsAmount),
    taxableIncome,
    taxBeforeRebate,
    rebate: rebated.rebate,
    taxAfterRebate: rebated.tax,
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
