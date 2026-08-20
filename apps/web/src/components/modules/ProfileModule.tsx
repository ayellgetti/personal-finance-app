import { FormEvent, useState } from "react";
import { useAuth } from "@/lib/auth/store";
import { useFinance } from "@/lib/finance/store";
import { EmploymentType } from "@/types/finance";
import { Panel } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const EMPLOYMENT: EmploymentType[] = ["Salaried", "Business Owner", "Freelancer", "Retired"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function ProfileModule() {
  const { user, updateAccount } = useAuth();
  const { data, updateProfile } = useFinance();

  const [account, setAccount] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    confirmPassword: "",
  });

  const [profile, setProfile] = useState({
    name: data.profile.name,
    age: data.profile.age,
    retirementAge: data.profile.retirementAge,
    currency: data.profile.currency,
    inflationRate: data.profile.inflationRate,
    dependents: data.profile.dependents,
    employmentType: data.profile.employmentType,
  });

  if (!user) return null;

  const saveAccount = (e: FormEvent) => {
    e.preventDefault();
    if (account.password && account.password !== account.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const result = updateAccount({
      name: account.name,
      email: account.email,
      password: account.password || undefined,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAccount((a) => ({ ...a, password: "", confirmPassword: "" }));
    if (account.name.trim() && account.name.trim() !== data.profile.name) {
      updateProfile({ name: account.name.trim() });
      setProfile((p) => ({ ...p, name: account.name.trim() }));
    }
    toast.success("Account updated");
  };

  const saveFinanceProfile = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: profile.name.trim() || data.profile.name,
      age: Number(profile.age) || data.profile.age,
      retirementAge: Number(profile.retirementAge) || data.profile.retirementAge,
      currency: profile.currency.trim() || "₹",
      inflationRate: Number(profile.inflationRate) || 0,
      dependents: Number(profile.dependents) || 0,
      employmentType: profile.employmentType,
    });
    toast.success("Financial profile saved");
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <Panel>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Member since {new Date(user.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Account">
        <form onSubmit={saveAccount} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="account-name">Display name</Label>
            <Input
              id="account-name"
              className="rounded-xl"
              value={account.name}
              onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              className="rounded-xl"
              value={account.email}
              onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-password">New password</Label>
            <Input
              id="account-password"
              type="password"
              className="rounded-xl"
              value={account.password}
              onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
              placeholder="Leave blank to keep current"
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-confirm">Confirm password</Label>
            <Input
              id="account-confirm"
              type="password"
              className="rounded-xl"
              value={account.confirmPassword}
              onChange={(e) => setAccount((a) => ({ ...a, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              minLength={6}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-xl">Save account</Button>
          </div>
        </form>
      </Panel>

      <Panel title="Financial profile">
        <form onSubmit={saveFinanceProfile} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-name">Name used in plans</Label>
            <Input
              id="profile-name"
              className="rounded-xl"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-age">Age</Label>
            <Input
              id="profile-age"
              type="number"
              className="rounded-xl"
              value={profile.age}
              onChange={(e) => setProfile((p) => ({ ...p, age: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-retire">Retirement age</Label>
            <Input
              id="profile-retire"
              type="number"
              className="rounded-xl"
              value={profile.retirementAge}
              onChange={(e) => setProfile((p) => ({ ...p, retirementAge: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-currency">Currency</Label>
            <Input
              id="profile-currency"
              className="rounded-xl"
              value={profile.currency}
              onChange={(e) => setProfile((p) => ({ ...p, currency: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-inflation">Inflation rate (%)</Label>
            <Input
              id="profile-inflation"
              type="number"
              className="rounded-xl"
              value={profile.inflationRate}
              onChange={(e) => setProfile((p) => ({ ...p, inflationRate: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-dependents">Dependents</Label>
            <Input
              id="profile-dependents"
              type="number"
              className="rounded-xl"
              value={profile.dependents}
              onChange={(e) => setProfile((p) => ({ ...p, dependents: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Employment</Label>
            <Select
              value={profile.employmentType}
              onValueChange={(v) => setProfile((p) => ({ ...p, employmentType: v as EmploymentType }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-xl">Save financial profile</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
