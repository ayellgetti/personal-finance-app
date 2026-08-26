import assert from "node:assert/strict";
import test from "node:test";
import { ChannelOtpMessenger } from "../modules/shared/otp/otp.messenger";
import { generateOtpBodySchema, OTP_TYPE, verifyOtpBodySchema } from "../modules/shared/otp/otp.request";
import { OtpService } from "../modules/shared/otp/otp.service";
import type { OtpModel } from "../models/shared/otp.model";
import type { UserService } from "../modules/shared/user/user.service";

test("registration OTP requires an email address", () => {
  const missing = generateOtpBodySchema.safeParse({
    mobileNo: "9876543210",
    type: OTP_TYPE.REGISTER,
  });
  assert.equal(missing.success, false);

  const complete = generateOtpBodySchema.safeParse({
    mobileNo: "9876543210",
    email: "ada@example.com",
    type: OTP_TYPE.REGISTER,
  });
  assert.equal(complete.success, true);
});

test("OTP verify does not require email for registration", () => {
  const parsed = verifyOtpBodySchema.safeParse({
    mobileNo: "9876543210",
    type: OTP_TYPE.REGISTER,
    no: 123456,
  });
  assert.equal(parsed.success, true);
});

test("OTP messenger treats email and SMS as delivered in development without providers", async () => {
  const messenger = new ChannelOtpMessenger(
    { host: undefined, port: 587, secure: false, user: undefined, pass: undefined, from: undefined },
    { accountSid: undefined, authToken: undefined, from: undefined, defaultCountryCode: "+91" },
    false,
  );

  const delivered = await messenger.deliver({
    mobileNo: "9876543210",
    email: "ada@example.com",
    code: 123456,
    type: OTP_TYPE.REGISTER,
    requireEmail: true,
  });

  assert.deepEqual(delivered, { email: true, sms: true });
});

test("OTP messenger sends SMS through Twilio and skips SMTP in development", async () => {
  const calls: string[] = [];
  const messenger = new ChannelOtpMessenger(
    { host: undefined, port: 587, secure: false, user: undefined, pass: undefined, from: undefined },
    {
      accountSid: "sid",
      authToken: "token",
      from: "+15551234567",
      defaultCountryCode: "+91",
    },
    false,
    (async (input, init) => {
      calls.push(String(input));
      assert.equal(init?.method, "POST");
      return new Response("{}", { status: 201 });
    }) as typeof fetch,
  );

  const delivered = await messenger.deliver({
    mobileNo: "9876543210",
    email: "ada@example.com",
    code: 123456,
    type: OTP_TYPE.REGISTER,
    requireEmail: true,
  });

  assert.equal(delivered.sms, true);
  assert.equal(delivered.email, true);
  assert.match(calls[0] ?? "", /Accounts\/sid\/Messages\.json/);
});

test("OTP stats reports unique signup attempts, generations, and registered users", async () => {
  const model = {
    countDistinctMobile: async (type: string) => {
      assert.equal(type, OTP_TYPE.REGISTER);
      return 4;
    },
    count: async (where: { type?: string }) => {
      assert.equal(where.type, OTP_TYPE.REGISTER);
      return 7;
    },
  };
  const users = {
    count: async () => 2,
  };

  const service = new OtpService(
    model as unknown as OtpModel,
    users as unknown as UserService,
  );

  assert.deepEqual(await service.stats(), {
    uniqueSignupAttempts: 4,
    otpGenerations: 7,
    registeredUsers: 2,
  });
});
