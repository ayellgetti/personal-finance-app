import assert from "node:assert/strict";
import test from "node:test";
import { registerBodySchema } from "../modules/shared/auth/auth.request";

const validRegister = {
  firstName: "Ada",
  lastName: "Lovelace",
  dob: "1990-05-01",
  gender: "female",
  countryCode: "in",
  mobileNo: "+919876543210",
  email: "ada@example.com",
  password: "password1",
  no: 123456,
};

test("register accepts a two-letter country code and stores it uppercase", () => {
  const parsed = registerBodySchema.parse(validRegister);
  assert.equal(parsed.countryCode, "IN");
});

test("register rejects a missing or invalid country code", () => {
  assert.equal(registerBodySchema.safeParse({ ...validRegister, countryCode: undefined }).success, false);
  assert.equal(registerBodySchema.safeParse({ ...validRegister, countryCode: "IND" }).success, false);
});
