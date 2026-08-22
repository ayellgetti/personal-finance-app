import { findTaxRegime, type TaxRegime, type TaxSlab } from "./tax.catalog";

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

const IN_80C_CAP = 150_000;
const IN_80D_CAP = 25_000;
const IN_24B_CAP = 200_000;
const IN_80CCD_CAP = 50_000;

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

function indiaChapterVia(regime: TaxRegime, input: TaxPlanInput): number {
  if (!regime.code.startsWith("in_old_")) {
    return 0;
  }

  const section80C = Math.min(IN_80C_CAP, clampNonNegative(input.section80C));
  const section80D = Math.min(IN_80D_CAP, clampNonNegative(input.section80D));
  const hra = clampNonNegative(input.hraExemption);
  const homeLoan = Math.min(IN_24B_CAP, clampNonNegative(input.homeLoanInterest));
  const nps = Math.min(IN_80CCD_CAP, clampNonNegative(input.nps80Ccd));
  return section80C + section80D + hra + homeLoan + nps;
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
  const chapterViaDeductions =
    regime.countryCode === "IN"
      ? indiaChapterVia(regime, input)
      : clampNonNegative(input.otherDeductions);
  const taxableIncome = roundMoney(Math.max(0, grossIncome - standardDeduction - chapterViaDeductions));
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
    chapterViaDeductions: roundMoney(chapterViaDeductions),
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
