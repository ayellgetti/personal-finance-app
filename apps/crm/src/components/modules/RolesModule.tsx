import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleStatus } from "@/components/modules/shared";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS } from "@/types/crm";

export function RolesModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.rolesRead);
  const canEdit = crm.hasPermission(CRM_PERMISSIONS.rolesUpdate);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = () => {
    void crm.loadRoles();
    void crm.loadPermissionsCatalog();
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed]);

  useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const role of crm.roles.items) {
      next[role.id] = role.permissionIds;
    }
    setDrafts(next);
  }, [crm.roles.items]);

  const toggle = (roleId: string, permissionId: string) => {
    if (!canEdit) return;
    setDrafts((current) => {
      const ids = current[roleId] ?? [];
      return {
        ...current,
        [roleId]: ids.includes(permissionId) ? ids.filter((id) => id !== permissionId) : [...ids, permissionId],
      };
    });
  };

  const save = async (roleId: string) => {
    setBusyId(roleId);
    try {
      await crm.updateRolePermissions(roleId, drafts[roleId] ?? []);
    } catch {
      // toast handled in store
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ModuleStatus
      sessionReady={sessionReady}
      allowed={allowed}
      status={crm.roles.status}
      errorMessage={crm.roles.errorMessage}
      empty={crm.roles.items.length === 0}
      emptyLabel="No roles yet"
      onRetry={reload}
    >
      <div className="grid gap-4">
        {crm.roles.items.map((role) => (
          <Card key={role.id} className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>{role.name}</CardTitle>
              <CardDescription>{role.slug}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {crm.permissionsCatalog.items.map((permission) => (
                  <label key={permission.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={(drafts[role.id] ?? []).includes(permission.id)}
                      onChange={() => toggle(role.id, permission.id)}
                    />
                    <span>
                      {permission.name}{" "}
                      <span className="text-muted-foreground">({permission.code})</span>
                    </span>
                  </label>
                ))}
              </div>
              {canEdit ? (
                <Button
                  type="button"
                  className="rounded-xl"
                  disabled={busyId === role.id}
                  onClick={() => void save(role.id)}
                >
                  Save permissions
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">You can view roles but cannot edit permissions.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ModuleStatus>
  );
}
