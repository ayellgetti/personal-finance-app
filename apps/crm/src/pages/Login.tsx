import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Briefcase, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.12),transparent_45%)]"
      />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-[var(--shadow-glow)]">
            <Briefcase className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Sales CRM</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in with your staff account</p>
        </div>

        <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-[var(--shadow-elevated)] backdrop-blur-sm sm:p-8">
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
            <p className="text-center text-sm">
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </p>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Staff accounts are created by a CRM admin. There is no public sign-up.
          </p>
        </div>
      </div>
    </div>
  );
}
