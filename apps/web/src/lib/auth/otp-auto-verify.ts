export function parseOtpAutoVerifyFlag(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  const raw = value.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function runtimeFlag(): unknown {
  if (typeof window === "undefined") return undefined;
  return window.__APP_CONFIG__?.OTP_AUTO_VERIFY;
}

/** Signup and forgot-password skip the OTP screen when generate/resend includes `otp`. */
export function isOtpAutoVerifyEnabled(): boolean {
  return parseOtpAutoVerifyFlag(runtimeFlag()) || parseOtpAutoVerifyFlag(import.meta.env.VITE_OTP_AUTO_VERIFY);
}
