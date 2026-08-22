export type TaxCountryCode = "IN" | "US" | "GB";

export type TaxSlab = {
  upTo: number | null;
  rate: number;
};

export type TaxRegime = {
  code: string;
  countryCode: TaxCountryCode;
  label: string;
  financialYear: string;
  assessmentYear: string;
  currency: string;
  standardDeduction: number;
  slabs: TaxSlab[];
  cessRate: number;
  rebate?: {
    maxTaxableIncome: number;
    maxRebate: number;
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

const IN_NEW_FY_2025_26: TaxRegime = {
  code: "in_new_fy2025_26",
  countryCode: "IN",
  label: "India — New regime (FY 2025-26)",
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
  rebate: { maxTaxableIncome: 1_200_000, maxRebate: 60_000, marginalRelief: true },
  notes: [
    "Salaried standard deduction of ₹75,000 is applied automatically.",
    "Section 87A rebate zeros tax when taxable income is at or below ₹12 lakh; marginal relief applies just above that.",
    "Chapter VI-A deductions such as 80C are not available in the new regime.",
  ],
};

const IN_OLD_FY_2025_26: TaxRegime = {
  code: "in_old_fy2025_26",
  countryCode: "IN",
  label: "India — Old regime (FY 2025-26)",
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
  rebate: { maxTaxableIncome: 500_000, maxRebate: 12_500 },
  notes: [
    "Standard deduction of ₹50,000 for salaried income.",
    "80C (₹1.5L), 80D, HRA exemption, and self-occupied home-loan interest (₹2L) can be entered.",
    "Section 87A rebate of up to ₹12,500 if taxable income is ₹5 lakh or less.",
  ],
};

const IN_NEW_FY_2024_25: TaxRegime = {
  code: "in_new_fy2024_25",
  countryCode: "IN",
  label: "India — New regime (FY 2024-25)",
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
  rebate: { maxTaxableIncome: 700_000, maxRebate: 25_000, marginalRelief: true },
  notes: [
    "FY 2024-25 new-regime slabs with rebate up to ₹7 lakh taxable income.",
  ],
};

const US_FEDERAL_2025_SINGLE: TaxRegime = {
  code: "us_federal_2025_single",
  countryCode: "US",
  label: "United States — Federal 2025 (single)",
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
  notes: [
    "Federal income tax only. State tax, FICA, and credits are not modelled.",
    "Uses the 2025 single filer brackets and a simplified standard deduction.",
  ],
};

const GB_ENGLAND_2025_26: TaxRegime = {
  code: "gb_england_fy2025_26",
  countryCode: "GB",
  label: "United Kingdom — England/NI (FY 2025-26)",
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
    regimes: [IN_NEW_FY_2025_26, IN_OLD_FY_2025_26, IN_NEW_FY_2024_25],
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
