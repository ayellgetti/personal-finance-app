/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type {
  TaxComparison,
  TaxCountry,
  TaxPlanResult,
} from "@/lib/finance/tax-remote";
import { TaxPlannerModule } from "./TaxPlannerModule";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/lib/finance/tax-remote", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/finance/tax-remote")>();
  return {
    ...actual,
    fetchTaxCatalog: vi.fn(),
    listTaxScenarios: vi.fn(),
    compareTaxPlans: vi.fn(),
    saveTaxScenario: vi.fn(),
    removeTaxScenario: vi.fn(),
  };
});

const { compareTaxPlans, fetchTaxCatalog, listTaxScenarios } = await import(
  "@/lib/finance/tax-remote"
);

const countries: TaxCountry[] = [
  {
    code: "IN",
    name: "India",
    currency: "INR",
    regimes: [
      {
        code: "in_new_fy2025_26",
        countryCode: "IN",
        label: "India — New regime (FY 2025-26)",
        kind: "new",
        financialYear: "2025-26",
        assessmentYear: "2026-27",
        currency: "INR",
        standardDeduction: 75_000,
        slabs: [{ upTo: null, rate: 0.3 }],
        deductions: [
          { code: "employerNps80Ccd2", label: "Employer NPS (80CCD(2))", group: "chapterVia" },
        ],
        notes: [],
      },
      {
        code: "in_old_fy2025_26",
        countryCode: "IN",
        label: "India — Old regime (FY 2025-26)",
        kind: "old",
        financialYear: "2025-26",
        assessmentYear: "2026-27",
        currency: "INR",
        standardDeduction: 50_000,
        slabs: [{ upTo: null, rate: 0.3 }],
        deductions: [
          { code: "hraExemption", label: "HRA exemption", group: "exemption" },
          { code: "section80C", label: "Section 80C / 80CCD(1)", group: "chapterVia", cap: 150_000 },
          { code: "employerNps80Ccd2", label: "Employer NPS (80CCD(2))", group: "chapterVia" },
        ],
        notes: [],
      },
    ],
  },
];

function result(overrides: Partial<TaxPlanResult> = {}): TaxPlanResult {
  return {
    countryCode: "IN",
    regimeCode: "in_old_fy2025_26",
    financialYear: "2025-26",
    assessmentYear: "2026-27",
    currency: "INR",
    grossIncome: 3_200_000,
    standardDeduction: 50_000,
    exemptions: 236_429,
    grossTotalIncome: 2_913_571,
    chapterViaDeductions: 150_000,
    deductionLines: [],
    taxableIncome: 2_763_571,
    taxBeforeRebate: 568_671,
    rebate: 0,
    taxAfterRebate: 568_671,
    surcharge: 0,
    cessRate: 0.04,
    cess: 22_747,
    totalTax: 591_418,
    effectiveRate: 18.5,
    monthlyTax: 49_285,
    takeHomeAnnual: 2_608_582,
    takeHomeMonthly: 217_382,
    slabs: [],
    notes: [],
    ...overrides,
  };
}

const comparison: TaxComparison = {
  countryCode: "IN",
  financialYear: "2025-26",
  assessmentYear: "2026-27",
  currency: "INR",
  columns: [
    {
      key: "old",
      label: "Old Regime",
      regimeCode: "in_old_fy2025_26",
      regimeLabel: "India — Old regime (FY 2025-26)",
      result: result(),
    },
    {
      key: "planner",
      label: "With Planner",
      regimeCode: "in_old_fy2025_26",
      regimeLabel: "India — Old regime (FY 2025-26)",
      result: result({ totalTax: 578_938 }),
    },
    {
      key: "new",
      label: "New Regime",
      regimeCode: "in_new_fy2025_26",
      regimeLabel: "India — New regime (FY 2025-26)",
      result: result({ regimeCode: "in_new_fy2025_26", totalTax: 535_704 }),
    },
  ],
  rows: [
    {
      key: "grossIncome",
      label: "Income From All Sources",
      kind: "income",
      values: [3_200_000, 3_200_000, 3_200_000],
    },
    {
      key: "hraExemption",
      label: "HRA Exempt Amount",
      kind: "exemption",
      values: [236_429, 236_429, null],
    },
    {
      key: "totalTax",
      label: "Total",
      kind: "total",
      values: [591_418, 578_938, 535_704],
    },
  ],
  bestColumnKey: "new",
  bestTotalTax: 535_704,
  notes: [],
};

describe("TaxPlannerModule", () => {
  beforeEach(() => {
    vi.mocked(fetchTaxCatalog).mockResolvedValue(countries);
    vi.mocked(listTaxScenarios).mockResolvedValue([]);
    vi.mocked(compareTaxPlans).mockResolvedValue(comparison);
  });

  it("renders the computation sheet with one column per regime", async () => {
    render(<TaxPlannerModule />);

    expect(await screen.findByRole("columnheader", { name: /Old Regime/ })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /With Planner/ })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: /New Regime/ })).toBeTruthy();
    expect(screen.getByText("Income From All Sources")).toBeTruthy();
    expect(screen.getByText("HRA Exempt Amount")).toBeTruthy();
  });

  it("marks a deduction the regime does not allow as not applicable", async () => {
    render(<TaxPlannerModule />);

    const row = (await screen.findByText("HRA Exempt Amount")).closest("tr");
    expect(row).toBeTruthy();
    const cells = [...(row?.querySelectorAll("td") ?? [])].map((cell) => cell.textContent);
    expect(cells[3]).toBe("--");
  });

  it("sends the planner amount separately from the actual amount", async () => {
    render(<TaxPlannerModule />);

    fireEvent.change(await screen.findByLabelText("Section 80C / 80CCD(1) actual"), {
      target: { value: "100000" },
    });
    fireEvent.change(screen.getByLabelText("Section 80C / 80CCD(1) with planner"), {
      target: { value: "150000" },
    });

    await waitFor(() => {
      expect(vi.mocked(compareTaxPlans).mock.lastCall?.[0]).toMatchObject({
        countryCode: "IN",
        financialYear: "2025-26",
        section80C: 100_000,
        planned: { section80C: 150_000 },
      });
    });
  });

  it("mirrors the actual amount in the planner column until it is changed", async () => {
    render(<TaxPlannerModule />);

    fireEvent.change(await screen.findByLabelText("Section 80C / 80CCD(1) actual"), {
      target: { value: "90000" },
    });

    const plannerInput = screen.getByLabelText<HTMLInputElement>(
      "Section 80C / 80CCD(1) with planner",
    );
    expect(plannerInput.value).toBe("90000");
  });

  it("fills the planner column up to each statutory cap", async () => {
    render(<TaxPlannerModule />);

    fireEvent.click(await screen.findByRole("button", { name: "Max out planner" }));

    await waitFor(() => {
      expect(vi.mocked(compareTaxPlans).mock.lastCall?.[0]).toMatchObject({
        planned: { section80C: 150_000 },
      });
    });
  });
});
