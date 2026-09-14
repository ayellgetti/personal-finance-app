import { describe, expect, it } from "vitest";
import {
  isEntityDraftEmpty,
  resizeFamilyMembers,
  validateEntityDraft,
  validateSetupProfile,
} from "./setup-validation";

describe("resizeFamilyMembers", () => {
  it("grows and shrinks the list from the dependents count", () => {
    const grown = resizeFamilyMembers([], 2);
    expect(grown).toHaveLength(2);
    expect(grown[0]?.name).toBe("");
    expect(resizeFamilyMembers(grown, 1)).toHaveLength(1);
    expect(resizeFamilyMembers(grown, 0)).toEqual([]);
  });
});

describe("validateSetupProfile", () => {
  const base = {
    retirementAge: 60,
    inflationRate: 6,
    dependents: 0,
    employmentType: "Salaried" as const,
    familyMembers: [],
  };

  it("accepts a profile with no dependents", () => {
    expect(validateSetupProfile(base).ok).toBe(true);
  });

  it("requires one complete family member per dependent", () => {
    const incomplete = validateSetupProfile({
      ...base,
      dependents: 1,
      familyMembers: [{ name: "", relationship: "", dob: "", gender: "", occupation: "" }],
    });
    expect(incomplete.ok).toBe(false);

    const complete = validateSetupProfile({
      ...base,
      dependents: 1,
      familyMembers: [{
        name: "Priya",
        relationship: "Spouse",
        dob: "1994-03-12",
        gender: "female",
        occupation: "Teacher",
      }],
    });
    expect(complete.ok).toBe(true);
  });

  it("rejects a future date of birth", () => {
    const result = validateSetupProfile({
      ...base,
      dependents: 1,
      familyMembers: [{
        name: "Priya",
        relationship: "Spouse",
        dob: "2999-01-01",
        gender: "female",
        occupation: "Teacher",
      }],
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateEntityDraft", () => {
  it("treats an untouched income picker as empty", () => {
    expect(isEntityDraftEmpty("incomes", { name: "", type: "", monthlyAmount: 0, growthRate: 0, startDate: "2026-01-01" })).toBe(true);
    expect(validateEntityDraft("incomes", { name: "", type: "", monthlyAmount: 0, growthRate: 0, startDate: "2026-01-01" }).status).toBe("empty");
  });

  it("treats a selected income type without an amount as incomplete", () => {
    expect(isEntityDraftEmpty("incomes", { name: "", type: "Salary", monthlyAmount: 0, growthRate: 0, startDate: "2026-01-01" })).toBe(false);
    expect(validateEntityDraft("incomes", { name: "Salary", type: "Salary", monthlyAmount: 0, growthRate: 8, startDate: "2026-01-01" }).status).toBe("incomplete");
  });

  it("requires a positive monthly amount once the form is started", () => {
    const result = validateEntityDraft("incomes", {
      name: "Salary",
      type: "Salary",
      monthlyAmount: 0,
      growthRate: 8,
      startDate: "2026-01-01",
    });
    expect(result.status).toBe("incomplete");
    expect(result.errors.monthlyAmount).toBeTruthy();
  });

  it("accepts a complete income", () => {
    const result = validateEntityDraft("incomes", {
      name: "Salary",
      type: "Salary",
      monthlyAmount: 150000,
      growthRate: 8,
      startDate: "2026-01-01",
    });
    expect(result.status).toBe("complete");
  });
});
