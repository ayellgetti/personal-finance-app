import { FormEvent, useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/SectionCard";
import { FieldError } from "@/components/forms/NativeSelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/store";
import { useMobile } from "@/lib/mobile/store";
import { validatePasswordChange, validateProfileName } from "@/lib/mobile/validate";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

function NameForm({ firstName, lastName, onSaved }: { firstName: string; lastName: string; onSaved: () => void }) {
  const { updateAccount } = useAuth();
  const [first, setFirst] = useState(firstName);
  const [last, setLast] = useState(lastName);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFirst(firstName);
    setLast(lastName);
  }, [firstName, lastName]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateProfileName({ firstName: first, lastName: last });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setBusy(true);
    const result = await updateAccount({ firstName: first.trim(), lastName: last.trim() });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Name updated");
    onSaved();
  };

  const unchanged = first.trim() === firstName && last.trim() === lastName;

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-3" aria-label="Edit name">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="profile-first-name">First name</Label>
          <Input id="profile-first-name" value={first} onChange={(e) => setFirst(e.target.value)} className="h-11 rounded-xl text-base" />
          <FieldError message={errors.firstName} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="profile-last-name">Last name</Label>
          <Input id="profile-last-name" value={last} onChange={(e) => setLast(e.target.value)} className="h-11 rounded-xl text-base" />
          <FieldError message={errors.lastName} />
        </div>
      </div>
      <Button type="submit" className="h-11 w-full rounded-xl" disabled={busy || unchanged}>
        Save name
      </Button>
    </form>
  );
}

function PasswordForm() {
  const { updateAccount } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validatePasswordChange({ currentPassword, newPassword, confirmPassword });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setBusy(true);
    const result = await updateAccount({ currentPassword, newPassword });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Password changed. Sign in with the new password.");
  };

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-3" aria-label="Change password">
      <div className="space-y-1">
        <Label htmlFor="profile-current-password">Current password</Label>
        <Input
          id="profile-current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.currentPassword} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="profile-new-password">New password</Label>
        <Input
          id="profile-new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.newPassword} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="profile-confirm-password">Confirm new password</Label>
        <Input
          id="profile-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.confirmPassword} />
      </div>
      <p className="text-xs text-muted-foreground">Changing the password signs you out on every device.</p>
      <Button type="submit" variant="outline" className="h-11 w-full rounded-xl" disabled={busy}>
        Change password
      </Button>
    </form>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { me, permissions, reload } = useMobile();

  const firstName = me?.user.firstName ?? user?.firstName ?? "";
  const lastName = me?.user.lastName ?? user?.lastName ?? "";
  const displayName = `${firstName} ${lastName}`.trim() || (user?.name ?? "");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary font-display text-xl font-bold text-primary-foreground">
          {displayName.slice(0, 1).toUpperCase() || "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold">{displayName || "Your account"}</p>
          <p className="truncate text-sm text-muted-foreground">{me?.user.email ?? user?.email ?? ""}</p>
        </div>
      </div>

      <SectionCard eyebrow="Account" title="Details" tone="neutral">
        <dl className="divide-y divide-border">
          <Field label="Email" value={me?.user.email ?? user?.email ?? ""} />
          <Field label="Mobile" value={me?.user.mobileNo ?? user?.mobileNo ?? ""} />
        </dl>
      </SectionCard>

      <SectionCard eyebrow="Account" title="Your name" tone="neutral">
        <NameForm firstName={firstName} lastName={lastName} onSaved={reload} />
      </SectionCard>

      <SectionCard eyebrow="Security" title="Password" tone="neutral">
        <PasswordForm />
      </SectionCard>

      <SectionCard eyebrow="Access" title="Roles" tone="neutral">
        {me && me.roles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {me.roles.map((role) => (
              <Badge key={role.id} variant="secondary" className="rounded-lg">
                {role.name}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No roles assigned.</p>
        )}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            {permissions.length} permission{permissions.length === 1 ? "" : "s"} granted.
          </summary>
          {permissions.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {permissions.map((code) => (
                <li key={code} className="text-xs text-muted-foreground">
                  {code}
                </li>
              ))}
            </ul>
          ) : null}
        </details>
      </SectionCard>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-xl text-base"
        onClick={() => void logout()}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}
