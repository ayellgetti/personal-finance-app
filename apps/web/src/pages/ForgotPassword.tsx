import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Gem, Loader2 } from "lucide-react";
import { isOtpAutoVerifyEnabled } from "@/lib/auth/otp-auto-verify";
import { useAuth } from "@/lib/auth/store";
import {
  COUNTRY_DIAL_CODES,
  DEFAULT_COUNTRY_ISO,
  findCountryDial,
  toE164Mobile,
} from "@/lib/auth/country-dial-codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Step = "mobile" | "otp" | "password";

export default function ForgotPassword() {
  const {
    user,
    requestForgotPasswordOtp,
    resendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("mobile");
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY_ISO);
  const [mobileNo, setMobileNo] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const e164 = toE164Mobile(countryIso, mobileNo);
  const skipOtpScreen = isOtpAutoVerifyEnabled();

  const notifyOtp = (result: { otp?: number }) => {
    if (result.otp) {
      toast.message(`Dev OTP: ${result.otp}`);
      return;
    }
    toast.success("OTP sent to your registered email and mobile number");
  };

  const applyIssuedOtp = async (result: { otp?: number }) => {
    if (skipOtpScreen && result.otp) {
      const code = String(result.otp);
      setOtp(code);
      const verified = await verifyForgotPasswordOtp(e164, code);
      if (verified.ok === false) {
        toast.error(verified.error);
        setStep("otp");
        return false;
      }
      toast.success("OTP verified. Choose a new password.");
      setStep("password");
      return true;
    }

    notifyOtp(result);
    setStep("otp");
    return true;
  };

  const onRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await requestForgotPasswordOtp(e164);
    if (result.ok === false) {
      setBusy(false);
      toast.error(result.error);
      return;
    }
    await applyIssuedOtp(result);
    setBusy(false);
  };

  const onVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await verifyForgotPasswordOtp(e164, otp);
    setBusy(false);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    toast.success("OTP verified. Choose a new password.");
    setStep("password");
  };

  const onResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const result = await resetPassword(e164, otp, password);
    setBusy(false);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    toast.success("Password updated. Sign in with your new password.");
    navigate("/login", { replace: true });
  };

  const onResend = async () => {
    setBusy(true);
    const result = await resendForgotPasswordOtp(e164);
    setBusy(false);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    await applyIssuedOtp(result);
  };

  const subtitle =
    step === "otp"
      ? `Enter the OTP sent to ${e164}`
      : step === "password"
        ? "OTP verified. Choose a new password"
        : "Reset your password with a mobile OTP";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.12),transparent_45%)]"
      />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-[var(--shadow-glow)]">
            <Gem className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Freedom Planner</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-[var(--shadow-elevated)] backdrop-blur-sm sm:p-8">
          {step === "mobile" ? (
            <form onSubmit={onRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-mobile">Mobile number</Label>
                <div className="flex gap-2">
                  <Select value={countryIso} onValueChange={setCountryIso}>
                    <SelectTrigger className="w-[9.5rem] shrink-0 rounded-xl" aria-label="Country ISD code">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_DIAL_CODES.map((country) => (
                        <SelectItem key={country.iso} value={country.iso}>
                          {country.iso} {country.dial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="forgot-mobile"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    placeholder="9876543210"
                    className="rounded-xl"
                    autoComplete="tel"
                    inputMode="numeric"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {findCountryDial(countryIso).name} · SMS uses{" "}
                  {e164 || findCountryDial(countryIso).dial}
                </p>
              </div>
              <Button type="submit" className="mt-2 w-full rounded-xl" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </form>
          ) : step === "otp" ? (
            <form onSubmit={onVerifyOtp} className="space-y-5">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={busy || otp.length !== 6}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify OTP
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setStep("mobile");
                    setOtp("");
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  disabled={busy}
                  onClick={() => void onResend()}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-password">New password</Label>
                <Input
                  id="forgot-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="rounded-xl"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="forgot-password-confirm">Confirm password</Label>
                <Input
                  id="forgot-password-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="rounded-xl"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="mt-2 w-full rounded-xl" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep(skipOtpScreen ? "mobile" : "otp");
                  setPassword("");
                  setConfirmPassword("");
                }}
              >
                Back
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-sm">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
