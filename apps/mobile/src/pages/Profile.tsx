import { LogOut } from "lucide-react";
import { SectionCard } from "@/components/SectionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/store";
import { useMobile } from "@/lib/mobile/store";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium">{value || "—"}</dd>
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { me, permissions } = useMobile();

  const displayName = me ? `${me.user.firstName} ${me.user.lastName}`.trim() : (user?.name ?? "");

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
        <p className="mt-3 text-xs text-muted-foreground">
          {permissions.length} permission{permissions.length === 1 ? "" : "s"} granted.
        </p>
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
