/** When true, signup uses the OTP from a non-production generate/resend response
 *  and skips the OTP entry screen (verify + jump to password). */
export function isOtpAutoVerifyEnabled(): boolean {
  return import.meta.env.VITE_OTP_AUTO_VERIFY === "true";
}
