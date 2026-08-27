/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { isOtpAutoVerifyEnabled, parseOtpAutoVerifyFlag } from "./otp-auto-verify";

describe("OTP auto-verify flag", () => {
  it("treats true/1/yes as enabled", () => {
    expect(parseOtpAutoVerifyFlag("true")).toBe(true);
    expect(parseOtpAutoVerifyFlag("1")).toBe(true);
    expect(parseOtpAutoVerifyFlag("YES")).toBe(true);
    expect(parseOtpAutoVerifyFlag(true)).toBe(true);
    expect(parseOtpAutoVerifyFlag("false")).toBe(false);
  });

  it("reads runtime config from window even when Vite env is unset", () => {
    window.__APP_CONFIG__ = { OTP_AUTO_VERIFY: true };
    expect(isOtpAutoVerifyEnabled()).toBe(true);
  });
});
