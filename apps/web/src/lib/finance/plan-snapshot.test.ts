import { describe, expect, it } from "vitest";
import { sampleData } from "./sampleData";
import { buildPlanSnapshot, shareUrl } from "./plan-snapshot";
import type { FinanceData } from "@/types/finance";

describe("buildPlanSnapshot", () => {
  it("is null until there is income and expenses to share", () => {
    expect(buildPlanSnapshot({ ...sampleData, incomes: [], expenses: [] })).toBeNull();
  });

  it("carries totals, score, goals and next steps", () => {
    const snap = buildPlanSnapshot(sampleData, new Date("2026-11-08T10:00:00Z"))!;
    expect(snap.generatedAt).toBe("2026-11-08T10:00:00.000Z");
    expect(snap.netWorth).toBe(snap.assets - snap.liabilities);
    expect(snap.healthScore.total).toBeGreaterThanOrEqual(0);
    expect(snap.goals.length).toBe(sampleData.goals.length);
    expect(snap.nextSteps.length).toBeLessThanOrEqual(5);
  });

  it("holds no personal fields or per-account detail", () => {
    const personal: FinanceData = {
      ...sampleData,
      profile: { ...sampleData.profile, name: "Zed Unique Person" },
      loans: sampleData.loans.map((l) => ({ ...l, name: "SECRET-BANK-LOAN" })),
      insurances: sampleData.insurances.map((i) => ({ ...i, name: "SECRET-POLICY" })),
      investments: sampleData.investments.map((i) => ({ ...i, name: "SECRET-FUND" })),
      incomes: sampleData.incomes.map((i) => ({ ...i, name: "SECRET-EMPLOYER" })),
    };
    const json = JSON.stringify(buildPlanSnapshot(personal));
    for (const secret of ["Zed Unique Person", "SECRET-BANK-LOAN", "SECRET-POLICY", "SECRET-FUND", "SECRET-EMPLOYER"]) {
      expect(json).not.toContain(secret);
    }
  });

  it("redacts account names that contain regex special characters", () => {
    const odd: FinanceData = {
      ...sampleData,
      loans: sampleData.loans.map((l) => ({ ...l, name: "Loan (A+B) [HDFC]*" })),
    };
    const json = JSON.stringify(buildPlanSnapshot(odd));
    expect(json).not.toContain("HDFC");
  });

  it("keeps free text inside the limits the API enforces", () => {
    const long: FinanceData = {
      ...sampleData,
      goals: [{ ...sampleData.goals[1]!, name: "x".repeat(500) }],
    };
    const snap = buildPlanSnapshot(long)!;
    expect(snap.goals[0]!.name.length).toBeLessThanOrEqual(80);
    expect(snap.nextSteps.every((s) => s.title.length <= 120 && s.detail.length <= 400)).toBe(true);
  });

  it("sends at most twenty goals", () => {
    const many: FinanceData = { ...sampleData, goals: Array.from({ length: 25 }, (_, i) => ({ ...sampleData.goals[1]!, id: String(i) })) };
    expect(buildPlanSnapshot(many)!.goals).toHaveLength(20);
  });
});

describe("shareUrl", () => {
  it("joins the origin and token without a double slash", () => {
    expect(shareUrl("abc", "https://app.example.com/")).toBe("https://app.example.com/shared/abc");
  });
});
