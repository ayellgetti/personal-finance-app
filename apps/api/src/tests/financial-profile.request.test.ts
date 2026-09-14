import assert from "node:assert/strict";
import test from "node:test";
import { upsertFinancialProfileBodySchema } from "../modules/personal-finance/financial-profile/financial-profile.request";

const validMember = {
  name: "Priya Mehta",
  relationship: "Spouse" as const,
  dob: "1994-03-12",
  gender: "female" as const,
  occupation: "Teacher",
};

const validProfile = {
  retirementAge: 60,
  dependents: 0,
  inflationRate: 6,
  employmentType: "Salaried" as const,
  currency: "₹",
  familyMembers: [],
};

test("financial profile accepts zero dependents with no family members", () => {
  const parsed = upsertFinancialProfileBodySchema.parse(validProfile);
  assert.equal(parsed.dependents, 0);
  assert.deepEqual(parsed.familyMembers, []);
});

test("financial profile requires family member details to match dependents", () => {
  const parsed = upsertFinancialProfileBodySchema.parse({
    ...validProfile,
    dependents: 1,
    familyMembers: [validMember],
  });
  assert.equal(parsed.familyMembers.length, 1);

  assert.equal(
    upsertFinancialProfileBodySchema.safeParse({
      ...validProfile,
      dependents: 2,
      familyMembers: [validMember],
    }).success,
    false,
  );
  assert.equal(
    upsertFinancialProfileBodySchema.safeParse({
      ...validProfile,
      dependents: 0,
      familyMembers: [validMember],
    }).success,
    false,
  );
});

test("financial profile rejects a future date of birth", () => {
  const result = upsertFinancialProfileBodySchema.safeParse({
    ...validProfile,
    dependents: 1,
    familyMembers: [{ ...validMember, dob: "2999-01-01" }],
  });
  assert.equal(result.success, false);
});
