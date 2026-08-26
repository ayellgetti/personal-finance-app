import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Gem, Loader2 } from "lucide-react";
import { isOtpAutoVerifyEnabled } from "@/lib/auth/otp-auto-verify";
import { useAuth, type SignupDraft } from "@/lib/auth/store";
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

type Mode = "login" | "signup";
type SignupStep = "details" | "otp" | "password";

const emptyDraft: SignupDraft = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  mobileNo: "",
  email: "",
  password: "",
};

export default function Login() {
  const { user, login, requestSignupOtp, resendSignupOtp, verifySignupOtp, completeSignup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [signupStep, setSignupStep] = useState<SignupStep>("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [draft, setDraft] = useState<SignupDraft>(emptyDraft);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const switchMode = (next: Mode) => {
    setMode(next);
    setSignupStep("details");
    setOtp("");
    setConfirmPassword("");
    setDraft(emptyDraft);
  };

  const patchDraft = (patch: Partial<SignupDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const skipOtpScreen = isOtpAutoVerifyEnabled();

  const notifyOtp = (result: { otp?: number }) => {
    if (result.otp) {
      toast.message(`Dev OTP: ${result.otp}`);
      return;
    }
    toast.success("OTP sent to your email and mobile number");
  };

  const applyIssuedOtp = async (result: { otp?: number }) => {
    if (skipOtpScreen && result.otp) {
      const code = String(result.otp);
      setOtp(code);
      const verified = await verifySignupOtp(draft.mobileNo, code);
      if (verified.ok === false) {
        toast.error(verified.error);
        setSignupStep("otp");
        return false;
      }
      toast.success("OTP verified. Set a password to finish.");
      setSignupStep("password");
      return true;
    }

    notifyOtp(result);
    setSignupStep("otp");
    return true;
  };

  const sendOtp = async () => {
    const result = await requestSignupOtp(draft);
    if (result.ok === false) {
      toast.error(result.error);
      return false;
    }
    return applyIssuedOtp(result);
  };

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await login(email, password);
    setBusy(false);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    toast.success("Welcome back");
    navigate("/", { replace: true });
  };

  const onSignupDetails = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await sendOtp();
    setBusy(false);
  };

  const onVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = await verifySignupOtp(draft.mobileNo, otp);
    setBusy(false);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    toast.success("OTP verified. Set a password to finish.");
    setSignupStep("password");
  };

  const onCreateAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (draft.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (draft.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setBusy(true);
    const result = await completeSignup(draft, otp);
    setBusy(false);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    toast.success("Account created");
    navigate("/", { replace: true });
  };

  const onResend = async () => {
    setBusy(true);
    const result = await resendSignupOtp(draft.mobileNo, draft.email);
    setBusy(false);
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    await applyIssuedOtp(result);
  };

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
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to your wealth workspace"
              : signupStep === "otp"
                ? `Enter the OTP sent to ${draft.email} and ${draft.mobileNo}`
                : signupStep === "password"
                  ? "OTP verified. Choose a password for your account"
                : "Create your account to get started"}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-[var(--shadow-elevated)] backdrop-blur-sm sm:p-8">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                mode === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="rounded-xl"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="rounded-xl"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="mt-2 w-full rounded-xl" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          ) : signupStep === "details" ? (
            <form onSubmit={onSignupDetails} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={draft.firstName}
                    onChange={(e) => patchDraft({ firstName: e.target.value })}
                    className="rounded-xl"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={draft.lastName}
                    onChange={(e) => patchDraft({ lastName: e.target.value })}
                    className="rounded-xl"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={draft.dob}
                    onChange={(e) => patchDraft({ dob: e.target.value })}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={draft.gender} onValueChange={(value) => patchDraft({ gender: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobileNo">Mobile number</Label>
                <Input
                  id="mobileNo"
                  value={draft.mobileNo}
                  onChange={(e) => patchDraft({ mobileNo: e.target.value })}
                  placeholder="9876543210"
                  className="rounded-xl"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => patchDraft({ email: e.target.value })}
                  placeholder="you@example.com"
                  className="rounded-xl"
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" className="mt-2 w-full rounded-xl" disabled={busy || !draft.gender}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </form>
          ) : signupStep === "otp" ? (
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
                    setSignupStep("details");
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
            <form onSubmit={onCreateAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={draft.password}
                  onChange={(e) => patchDraft({ password: e.target.value })}
                  placeholder="At least 8 characters"
                  className="rounded-xl"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password-confirm">Confirm password</Label>
                <Input
                  id="signup-password-confirm"
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
                Create account
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSignupStep(skipOtpScreen ? "details" : "otp");
                  patchDraft({ password: "" });
                  setConfirmPassword("");
                }}
              >
                Back
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Accounts are created after email and SMS OTP verification.
          </p>
          <p className="mt-3 text-center text-sm">
            <Link to="/guide" className="font-medium text-primary hover:underline">
              See how it works with the Arjun Mehta sample
            </Link>
          </p>
          <p className="mt-2 text-center text-sm">
            <Link to="/why" className="font-medium text-muted-foreground hover:text-primary hover:underline">
              Problem, objective, and vision
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
