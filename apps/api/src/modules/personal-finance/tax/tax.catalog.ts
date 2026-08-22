export type TaxCountryCode = "IN" | "US" | "GB";

export type TaxSlab = {
  upTo: number | null;
  rate: number;
};

export type TaxDeductionCode =
  | "section80C"
  | "section80D"
  | "hraExemption"
  | "homeLoanInterest"
  | "nps80Ccd"
  | "employerNps80Ccd2"
  | "section80E"
  | "section80Eea"
  | "section80Gg"
  | "section80Tta"
  | "otherDeductions";

/**
 * "exemption" reduces income before gross total income (HRA, house-property
 * interest). "chapterVia" reduces gross total income (80C onwards).
 */
export type TaxDeductionGroup = "exemption" | "chapterVia";

export type TaxDeduction = {
  code: TaxDeductionCode;
  label: string;
  group: TaxDeductionGroup;
  cap?: number;
  salaryCapRate?: number;
  hint?: string;
};

/** "single" countries have no old/new split to compare. */
export type TaxRegimeKind = "old" | "new" | "single";

export type TaxSurchargeTier = {
  above: number;
  rate: number;
};

export type TaxRegime = {
  code: string;
  countryCode: TaxCountryCode;
  label: string;
  kind: TaxRegimeKind;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  standardDeduction: number;
  slabs: TaxSlab[];
  cessRate: number;
  deductions: TaxDeduction[];
  rebate?: {
    maxTaxableIncome: number;
    maxRebate: number;
    marginalRelief?: boolean;
  };
  surcharge?: {
    tiers: TaxSurchargeTier[];
    marginalRelief?: boolean;
  };
  notes: string[];
};

export type TaxCountry = {
  code: TaxCountryCode;
  name: string;
  currency: string;
  regimes: TaxRegime[];
};

/** Typed as a full Record so a new code cannot be added without listing it here. */
const DEDUCTION_CODE_KEYS: Record<TaxDeductionCode, true> = {
  section80C: true,
  section80D: true,
  hraExemption: true,
  homeLoanInterest: true,
  nps80Ccd: true,
  employerNps80Ccd2: true,
  section80E: true,
  section80Eea: true,
  section80Gg: true,
  section80Tta: true,
  otherDeductions: true,
};

export const TAX_DEDUCTION_CODES = Object.keys(
  DEDUCTION_CODE_KEYS,
) as TaxDeductionCode[];

const IN_NEW_DEDUCTIONS: TaxDeduction[] = [
  {
    code: "employerNps80Ccd2",
    label: "Employer NPS (80CCD(2))",
    group: "chapterVia",
    salaryCapRate: 0.14,
    hint: "Allowed in the new regime. This estimate caps it at 14% of salary.",
  },
];

const IN_OLD_DEDUCTIONS: TaxDeduction[] = [
  {
    code: "hraExemption",
    label: "HRA exemption",
    group: "exemption",
    hint: "Enter the computed HRA exemption, not the full HRA received.",
  },
  {
    code: "homeLoanInterest",
    label: "Home-loan interest (24b)",
    group: "exemption",
    cap: 200_000,
    hint: "Self-occupied interest. Cap ₹2 lakh.",
  },
  {
    code: "section80C",
    label: "Section 80C / 80CCD(1)",
    group: "chapterVia",
    cap: 150_000,
    hint: "EPF, ELSS, life insurance, PPF. Cap ₹1.5 lakh.",
  },
  {
    code: "employerNps80Ccd2",
    label: "Employer NPS (80CCD(2))",
    group: "chapterVia",
    salaryCapRate: 0.14,
    hint: "Employer contribution. This estimate caps it at 14% of salary.",
  },
  {
    code: "nps80Ccd",
    label: "NPS 80CCD(1B)",
    group: "chapterVia",
    cap: 50_000,
    hint: "Additional employee NPS. Cap ₹50,000.",
  },
  {
    code: "section80D",
    label: "Section 80D",
    group: "chapterVia",
    cap: 25_000,
    hint: "Health insurance. Cap ₹25,000 for self (non-senior).",
  },
  {
    code: "section80E",
    label: "Section 80E",
    group: "chapterVia",
    hint: "Education-loan interest. No monetary cap, available for up to 8 years.",
  },
  {
    code: "section80Eea",
    label: "Section 80EEA",
    group: "chapterVia",
    cap: 150_000,
    hint: "Extra affordable-housing loan interest beyond 24(b). Cap ₹1.5 lakh.",
  },
  {
    code: "section80Gg",
    label: "Section 80GG",
    group: "chapterVia",
    cap: 60_000,
    hint: "Rent paid when you receive no HRA. This estimate caps it at ₹60,000.",
  },
  {
    code: "section80Tta",
    label: "Section 80TTA",
    group: "chapterVia",
    cap: 10_000,
    hint: "Savings-account interest. Cap ₹10,000 for non-seniors.",
  },
];

const GENERIC_DEDUCTIONS: TaxDeduction[] = [
  {
    code: "otherDeductions",
    label: "Other deductions",
    group: "chapterVia",
    hint: "Itemized or extra deductions beyond the standard deduction.",
  },
];

/** Surcharge on income tax for individuals, applied on total income thresholds. */
const IN_OLD_SURCHARGE: TaxSurchargeTier[] = [
  { above: 5_000_000, rate: 0.1 },
  { above: 10_000_000, rate: 0.15 },
  { above: 20_000_000, rate: 0.25 },
  { above: 50_000_000, rate: 0.37 },
];

/** Section 115BAC caps the top surcharge rate at 25%. */
const IN_NEW_SURCHARGE: TaxSurchargeTier[] = [
  { above: 5_000_000, rate: 0.1 },
  { above: 10_000_000, rate: 0.15 },
  { above: 20_000_000, rate: 0.25 },
];

const IN_NEW_FY_2025_26: TaxRegime = {
  code: "in_new_fy2025_26",
  countryCode: "IN",
  label: "India — New regime (FY 2025-26)",
  kind: "new",
  financialYear: "2025-26",
  assessmentYear: "2026-27",
  currency: "INR",
  standardDeduction: 75_000,
  slabs: [
    { upTo: 400_000, rate: 0 },
    { upTo: 800_000, rate: 0.05 },
    { upTo: 1_200_000, rate: 0.1 },
    { upTo: 1_600_000, rate: 0.15 },
    { upTo: 2_000_000, rate: 0.2 },
    { upTo: 2_400_000, rate: 0.25 },
    { upTo: null, rate: 0.3 },
  ],
  cessRate: 0.04,
  deductions: IN_NEW_DEDUCTIONS,
  rebate: { maxTaxableIncome: 1_200_000, maxRebate: 60_000, marginalRelief: true },
  surcharge: { tiers: IN_NEW_SURCHARGE, marginalRelief: true },
  notes: [
    "Salaried standard deduction of ₹75,000 is applied automatically.",
    "Section 87A rebate zeros tax when taxable income is at or below ₹12 lakh; marginal relief applies just above that.",
    "80C, 80D, HRA, and 80CCD(1B) are not available. Employer NPS under 80CCD(2) is allowed.",
  ],
};

const IN_OLD_FY_2025_26: TaxRegime = {
  code: "in_old_fy2025_26",
  countryCode: "IN",
  label: "India — Old regime (FY 2025-26)",
  kind: "old",
  financialYear: "2025-26",
  assessmentYear: "2026-27",
  currency: "INR",
  standardDeduction: 50_000,
  slabs: [
    { upTo: 250_000, rate: 0 },
    { upTo: 500_000, rate: 0.05 },
    { upTo: 1_000_000, rate: 0.2 },
    { upTo: null, rate: 0.3 },
  ],
  cessRate: 0.04,
  deductions: IN_OLD_DEDUCTIONS,
  rebate: { maxTaxableIncome: 500_000, maxRebate: 12_500 },
  surcharge: { tiers: IN_OLD_SURCHARGE, marginalRelief: true },
  notes: [
    "Standard deduction of ₹50,000 for salaried income.",
    "80C (₹1.5L), 80D, HRA exemption, self-occupied home-loan interest (₹2L), and NPS can be entered.",
    "Section 87A rebate of up to ₹12,500 if taxable income is ₹5 lakh or less.",
  ],
};

const IN_OLD_FY_2024_25: TaxRegime = {
  code: "in_old_fy2024_25",
  countryCode: "IN",
  label: "India — Old regime (FY 2024-25)",
  kind: "old",
  financialYear: "2024-25",
  assessmentYear: "2025-26",
  currency: "INR",
  standardDeduction: 50_000,
  slabs: [
    { upTo: 250_000, rate: 0 },
    { upTo: 500_000, rate: 0.05 },
    { upTo: 1_000_000, rate: 0.2 },
    { upTo: null, rate: 0.3 },
  ],
  cessRate: 0.04,
  deductions: IN_OLD_DEDUCTIONS,
  rebate: { maxTaxableIncome: 500_000, maxRebate: 12_500 },
  surcharge: { tiers: IN_OLD_SURCHARGE, marginalRelief: true },
  notes: [
    "Standard deduction of ₹50,000 for salaried income.",
    "Same Chapter VI-A deductions as FY 2025-26 old regime.",
    "Section 87A rebate of up to ₹12,500 if taxable income is ₹5 lakh or less.",
  ],
};

const IN_NEW_FY_2024_25: TaxRegime = {
  code: "in_new_fy2024_25",
  countryCode: "IN",
  label: "India — New regime (FY 2024-25)",
  kind: "new",
  financialYear: "2024-25",
  assessmentYear: "2025-26",
  currency: "INR",
  standardDeduction: 75_000,
  slabs: [
    { upTo: 300_000, rate: 0 },
    { upTo: 700_000, rate: 0.05 },
    { upTo: 1_000_000, rate: 0.1 },
    { upTo: 1_200_000, rate: 0.15 },
    { upTo: 1_500_000, rate: 0.2 },
    { upTo: null, rate: 0.3 },
  ],
  cessRate: 0.04,
  deductions: IN_NEW_DEDUCTIONS,
  rebate: { maxTaxableIncome: 700_000, maxRebate: 25_000, marginalRelief: true },
  surcharge: { tiers: IN_NEW_SURCHARGE, marginalRelief: true },
  notes: [
    "FY 2024-25 new-regime slabs with rebate up to ₹7 lakh taxable income.",
    "80C-style Chapter VI-A deductions are not available. Employer NPS under 80CCD(2) is allowed.",
  ],
};

const US_FEDERAL_2025_SINGLE: TaxRegime = {
  code: "us_federal_2025_single",
  countryCode: "US",
  label: "United States — Federal 2025 (single)",
  kind: "single",
  financialYear: "2025",
  assessmentYear: "2025",
  currency: "USD",
  standardDeduction: 15_000,
  slabs: [
    { upTo: 11_925, rate: 0.1 },
    { upTo: 48_475, rate: 0.12 },
    { upTo: 103_350, rate: 0.22 },
    { upTo: 197_300, rate: 0.24 },
    { upTo: 250_525, rate: 0.32 },
    { upTo: 626_350, rate: 0.35 },
    { upTo: null, rate: 0.37 },
  ],
  cessRate: 0,
  deductions: GENERIC_DEDUCTIONS,
  notes: [
    "Federal income tax only. State tax, FICA, and credits are not modelled.",
    "Uses the 2025 single filer brackets and a simplified standard deduction.",
  ],
};

const GB_ENGLAND_2025_26: TaxRegime = {
  code: "gb_england_fy2025_26",
  countryCode: "GB",
  label: "United Kingdom — England/NI (FY 2025-26)",
  kind: "single",
  financialYear: "2025-26",
  assessmentYear: "2025-26",
  currency: "GBP",
  standardDeduction: 12_570,
  slabs: [
    { upTo: 12_570, rate: 0 },
    { upTo: 50_270, rate: 0.2 },
    { upTo: 125_140, rate: 0.4 },
    { upTo: null, rate: 0.45 },
  ],
  cessRate: 0,
  deductions: GENERIC_DEDUCTIONS,
  notes: [
    "Personal allowance of £12,570 is modelled as a 0% first slab.",
    "Personal-allowance taper above £100,000 and National Insurance are not modelled.",
  ],
};

export const TAX_COUNTRIES: TaxCountry[] = [
  {
    code: "IN",
    name: "India",
    currency: "INR",
    regimes: [
      IN_NEW_FY_2025_26,
      IN_OLD_FY_2025_26,
      IN_NEW_FY_2024_25,
      IN_OLD_FY_2024_25,
    ],
  },
  {
    code: "US",
    name: "United States",
    currency: "USD",
    regimes: [US_FEDERAL_2025_SINGLE],
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    regimes: [GB_ENGLAND_2025_26],
  },
];

export function listTaxCatalog(): TaxCountry[] {
  return TAX_COUNTRIES;
}

export function findTaxRegime(countryCode: string, regimeCode: string): TaxRegime | undefined {
  const country = TAX_COUNTRIES.find((item) => item.code === countryCode);
  return country?.regimes.find((item) => item.code === regimeCode);
}

export type TaxFinancialYear = {
  financialYear: string;
  assessmentYear: string;
  regimes: TaxRegime[];
};

/** Groups a country's regimes by financial year, newest first. */
export function listTaxFinancialYears(countryCode: string): TaxFinancialYear[] {
  const country = TAX_COUNTRIES.find((item) => item.code === countryCode);
  if (!country) {
    return [];
  }

  const years = new Map<string, TaxFinancialYear>();
  for (const regime of country.regimes) {
    const existing = years.get(regime.financialYear);
    if (existing) {
      existing.regimes.push(regime);
      continue;
    }
    years.set(regime.financialYear, {
      financialYear: regime.financialYear,
      assessmentYear: regime.assessmentYear,
      regimes: [regime],
    });
  }

  return [...years.values()].sort((a, b) =>
    b.financialYear.localeCompare(a.financialYear),
  );
}

export function findTaxFinancialYear(
  countryCode: string,
  financialYear: string,
): TaxFinancialYear | undefined {
  return listTaxFinancialYears(countryCode).find(
    (item) => item.financialYear === financialYear,
  );
}
