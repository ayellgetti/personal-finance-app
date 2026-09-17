import { FormEvent, useState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/store";
import { Field, ModulePage } from "@/components/modules/shared";
import { useCrm } from "@/lib/crm/store";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function ProfileModule() {
  const { user, updateAccount, logout } = useAuth();
  const crm = useCrm();
  const navigate = useNavigate();

  const [account, setAccount] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [acctBusy, setAcctBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  if (!user) return null;

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    setAcctBusy(true);
    const result = await updateAccount({ firstName: account.firstName, lastName: account.lastName });
    setAcctBusy(false);
    if (result.ok === false) { toast.error(result.error); return; }
    toast.success("Account updated");
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!password.currentPassword || !password.newPassword) {
      toast.error("Enter your current and new password");
      return;
    }
    setPwBusy(true);
    const result = await updateAccount({
      currentPassword: password.currentPassword,
      newPassword: password.newPassword,
    });
    setPwBusy(false);
    if (result.ok === false) { toast.error(result.error); return; }
    setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast.success("Password updated");
  };

  const handleLogout = () => {
    void logout().then(() => {
      toast.success("Signed out");
      navigate("/login", { replace: true });
    });
  };

  const roles = crm.me?.roles ?? [];

  return (
    <ModulePage crumb="Profile">
      <div className="mx-auto grid max-w-3xl gap-6">

        {/* Identity card */}
        <Card className="overflow-hidden rounded-2xl shadow-[var(--shadow-card)]">
          <div className="h-20 bg-gradient-to-r from-primary/30 via-primary/20 to-transparent" />
          <CardContent className="-mt-10 pb-6 pt-0">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <Avatar className="h-20 w-20 border-4 border-background shadow-md">
                <AvatarFallback className="bg-primary/15 text-2xl font-bold text-primary">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <h2 className="font-display text-xl font-bold truncate">{user.name}</h2>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <Badge key={role.id} variant="secondary" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">
                      <UserRound className="mr-1 h-3 w-3" />
                      CRM User
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-xl"
                onClick={handleLogout}
              >
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account details */}
        <Card className="rounded-2xl shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
            <CardDescription>Update your display name</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveAccount} className="grid gap-4 sm:grid-cols-2">
              <Field id="profile-first-name" label="First name">
                <Input
                  id="profile-first-name"
                  className="rounded-xl"
                  value={account.firstName}
                  onChange={(e) => setAccount((a) => ({ ...a, firstName: e.target.value }))}
                  required
                />
              </Field>
              <Field id="profile-last-name" label="Last name">
                <Input
                  id="profile-last-name"
                  className="rounded-xl"
                  value={account.lastName}
                  onChange={(e) => setAccount((a) => ({ ...a, lastName: e.target.value }))}
                  required
                />
              </Field>
              <div className="sm:col-span-2">
                <Field id="profile-email" label="Email">
                  <Input
                    id="profile-email"
                    type="email"
                    className="rounded-xl"
                    value={user.email}
                    disabled
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" className="rounded-xl" disabled={acctBusy}>
                  Save account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change password */}
        <Card className="rounded-2xl shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Set a new password for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="profile-current-pw" label="Current password">
                  <Input
                    id="profile-current-pw"
                    type="password"
                    className="rounded-xl"
                    value={password.currentPassword}
                    onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                </Field>
              </div>
              <Field id="profile-new-pw" label="New password">
                <Input
                  id="profile-new-pw"
                  type="password"
                  className="rounded-xl"
                  value={password.newPassword}
                  onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
                  minLength={8}
                  required
                />
              </Field>
              <Field id="profile-confirm-pw" label="Confirm password">
                <Input
                  id="profile-confirm-pw"
                  type="password"
                  className="rounded-xl"
                  value={password.confirmPassword}
                  onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
                  minLength={8}
                  required
                />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit" className="rounded-xl" disabled={pwBusy}>
                  Update password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModulePage>
  );
}
