import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-background px-5 py-10 pb-safe pt-safe">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.18),transparent_55%)]"
      />

      <div className="relative mx-auto w-full max-w-md animate-fade-in">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-[var(--shadow-glow)]">
            <WalletCards className="h-7 w-7 text-primary-foreground" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Freedom Planner Mobile</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to your financial plan</p>
        </div>

        <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-[var(--shadow-elevated)] backdrop-blur-sm">
          <form onSubmit={onLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl text-base"
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
                className="h-12 rounded-xl text-base"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="mt-2 h-12 w-full rounded-xl text-base" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Sign in
            </Button>
            <p className="text-center text-sm">
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </p>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
