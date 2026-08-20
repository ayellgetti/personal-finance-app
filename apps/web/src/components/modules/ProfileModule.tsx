import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/store";
import { useFinance } from "@/lib/finance/store";
import { EmploymentType } from "@/types/finance";
import { ageFromDob } from "@/lib/finance/profile";
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
  const { data, loading, updateProfile } = useFinance();

  const [account, setAccount] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [profile, setProfile] = useState({
    retirementAge: data.profile.retirementAge,
    inflationRate: data.profile.inflationRate,
    dependents: data.profile.dependents,
    employmentType: data.profile.employmentType,
  });

  useEffect(() => {
    if (loading) return;
    setProfile({
      retirementAge: data.profile.retirementAge,
      inflationRate: data.profile.inflationRate,
      dependents: data.profile.dependents,
      employmentType: data.profile.employmentType,
    });
  }, [
    loading,
    data.profile.retirementAge,
    data.profile.inflationRate,
    data.profile.dependents,
    data.profile.employmentType,
  ]);

  if (!user) return null;

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    const result = await updateAccount({
      firstName: account.firstName,
      lastName: account.lastName,
    });
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    toast.success("Account updated");
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.password !== password.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!password.currentPassword || !password.password) {
      toast.error("Enter your current and new password");
      return;
    }
    const result = await updateAccount({
      currentPassword: password.currentPassword,
      newPassword: password.password,
    });
    if (result.ok === false) {
      toast.error(result.error);
      return;
    }
    setPassword({ currentPassword: "", password: "", confirmPassword: "" });
    toast.success("Password updated");
  };

  const saveFinanceProfile = (e: FormEvent) => {
    e.preventDefault();
    updateProfile({
      retirementAge: Number(profile.retirementAge) || data.profile.retirementAge,
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
            <Label htmlFor="account-first-name">First name</Label>
            <Input
              id="account-first-name"
              className="rounded-xl"
              value={account.firstName}
              onChange={(e) => setAccount((a) => ({ ...a, firstName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-last-name">Last name</Label>
            <Input
              id="account-last-name"
              className="rounded-xl"
              value={account.lastName}
              onChange={(e) => setAccount((a) => ({ ...a, lastName: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              className="rounded-xl"
              value={user.email}
              disabled
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-xl">Save account</Button>
          </div>
        </form>
      </Panel>

      <Panel title="Change password">
        <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="account-current-password">Current password</Label>
            <Input
              id="account-current-password"
              type="password"
              className="rounded-xl"
              value={password.currentPassword}
              onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-password">New password</Label>
            <Input
              id="account-password"
              type="password"
              className="rounded-xl"
              value={password.password}
              onChange={(e) => setPassword((p) => ({ ...p, password: e.target.value }))}
              minLength={8}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-confirm">Confirm password</Label>
            <Input
              id="account-confirm"
              type="password"
              className="rounded-xl"
              value={password.confirmPassword}
              onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
              minLength={8}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-xl">Update password</Button>
          </div>
        </form>
      </Panel>

      <Panel title="Financial profile">
        <form onSubmit={saveFinanceProfile} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profile-age">Age</Label>
            <Input id="profile-age" type="number" className="rounded-xl" value={ageFromDob(user.dob)} disabled />
            <p className="text-xs text-muted-foreground">Calculated from your date of birth.</p>
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
          <div className="space-y-2 sm:col-span-2">
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
            <Button type="submit" className="rounded-xl" disabled={loading}>Save financial profile</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
