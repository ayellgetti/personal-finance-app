import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, type SignupDraft } from "@/lib/auth/store";

const INITIAL: SignupDraft = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "other",
  countryIso: "IN",
  mobileNo: "",
  email: "",
  password: "",
};

export default function Signup() {
  const { user, requestSignupOtp, completeSignup } = useAuth();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(INITIAL);
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    if (!sent) {
      const result = await requestSignupOtp(draft);
      setBusy(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSent(true);
      if (result.otp) setOtp(String(result.otp));
      toast.success("Verification code sent");
      return;
    }
    const result = await completeSignup(draft, otp);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Account created");
    navigate("/", { replace: true });
  };

  const field = (key: keyof SignupDraft, label: string, type = "text") => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type={type}
        value={draft[key]}
        onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
        required
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-5 py-10 pb-safe pt-safe">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center">
          <WalletCards className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-2xl font-bold">Create your Freedom Planner</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your financial records remain tied to your account.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-5">
          {!sent ? (
            <>
              <div className="grid grid-cols-2 gap-3">{field("firstName", "First name")}{field("lastName", "Last name")}</div>
              {field("dob", "Date of birth", "date")}
              {field("gender", "Gender")}
              {field("mobileNo", "Mobile number", "tel")}
              {field("email", "Email", "email")}
              {field("password", "Password", "password")}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp">6-digit verification code</Label>
              <Input id="otp" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} required />
            </div>
          )}
          <Button type="submit" className="h-12 w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {sent ? "Verify and create account" : "Send verification code"}
          </Button>
          <p className="text-center text-sm"><Link to="/login" className="font-medium text-primary">Already have an account? Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
