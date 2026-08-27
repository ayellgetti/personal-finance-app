import assert from "node:assert/strict";
import test from "node:test";
import { registerBodySchema } from "../modules/shared/auth/auth.request";

const validRegister = {
  firstName: "Ada",
  lastName: "Lovelace",
  dob: "1990-05-01",
  gender: "female",
  countryCode: "+91",
  mobileNo: "+919876543210",
  email: "ada@example.com",
  password: "password1",
  no: 123456,
};

test("register accepts an ISD country code", () => {
  const parsed = registerBodySchema.parse(validRegister);
  assert.equal(parsed.countryCode, "+91");
});

test("register rejects a missing or invalid country code", () => {
  assert.equal(registerBodySchema.safeParse({ ...validRegister, countryCode: undefined }).success, false);
  assert.equal(registerBodySchema.safeParse({ ...validRegister, countryCode: "IN" }).success, false);
  assert.equal(registerBodySchema.safeParse({ ...validRegister, countryCode: "91" }).success, false);
});
