import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  EditAction,
  Field,
  ModulePage,
  ModuleStatus,
  RowActions,
  SideSheet,
  StatusBadge,
  ViewAction,
} from "@/components/modules/shared";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CrmPermission, type CrmRoleDetail } from "@/types/crm";

const BUILT_IN_SLUGS = new Set(["admin", "manager", "sales", "viewer"]);

const GROUP_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  contacts: "Contacts",
  enquiries: "Enquiries",
  followups: "Follow-ups",
  clients: "Booked",
  payments: "Payments",
  tasks: "Tasks",
  calendar: "Calendar",
  users: "Users",
  roles: "Roles",
};

type FormState = {
  name: string;
  permissionIds: string[];
};

const EMPTY: FormState = { name: "", permissionIds: [] };

function groupKey(code: string): string {
  return code.split(".")[1] ?? "other";
}

function groupLabel(code: string): string {
  const key = groupKey(code);
  return GROUP_LABELS[key] ?? key;
}

function groupedPermissions(items: CrmPermission[]) {
  const groups: { key: string; label: string; items: CrmPermission[] }[] = [];
  for (const permission of items) {
    const key = groupKey(permission.code);
    const existing = groups.find((group) => group.key === key);
    if (existing) {
      existing.items.push(permission);
    } else {
      groups.push({ key, label: groupLabel(permission.code), items: [permission] });
    }
  }
  return groups;
}

function permissionNames(
  role: CrmRoleDetail,
  catalog: CrmPermission[],
  limit = 4,
): string {
  const names = role.permissionIds
    .map((id) => catalog.find((permission) => permission.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  if (names.length <= limit) return names.join(", ") || "None";
  return `${names.slice(0, limit).join(", ")} +${names.length - limit}`;
}

export function RolesModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.rolesRead);
  const canEdit = crm.hasPermission(CRM_PERMISSIONS.rolesUpdate);
  const [view, setView] = useState<"table" | "card">("table");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmRoleDetail | null>(null);
  const [viewing, setViewing] = useState<CrmRoleDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadRoles();
    void crm.loadPermissionsCatalog();
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed]);

  const groups = useMemo(
    () => groupedPermissions(crm.permissionsCatalog.items),
    [crm.permissionsCatalog.items],
  );

  const viewingRole = viewing
    ? (crm.roles.items.find((role) => role.id === viewing.id) ?? viewing)
    : null;

  const togglePermission = (permissionId: string) => {
    setForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  };

  const toggleGroup = (items: CrmPermission[]) => {
    const ids = items.map((item) => item.id);
    const allOn = ids.every((id) => form.permissionIds.includes(id));
    setForm((current) => ({
      ...current,
      permissionIds: allOn
        ? current.permissionIds.filter((id) => !ids.includes(id))
        : [...new Set([...current.permissionIds, ...ids])],
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setSheetOpen(true);
  };

  const openEdit = (role: CrmRoleDetail) => {
    setViewing(null);
    setEditing(role);
    setForm({ name: role.name, permissionIds: role.permissionIds });
    setErrors({});
    setSheetOpen(true);
  };

  const validateForm = (): Record<string, string> => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (form.permissionIds.length === 0) next.permissionIds = "Select at least one permission";
    return next;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      if (editing) {
        await crm.updateRole(editing.id, {
          name: form.name.trim(),
          permissionIds: form.permissionIds,
        });
      } else {
        await crm.createRole({
          name: form.name.trim(),
          permissionIds: form.permissionIds,
        });
      }
      setSheetOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  const actionsFor = (role: CrmRoleDetail) => (
    <RowActions>
      <ViewAction onClick={() => setViewing(role)} />
      {canEdit ? <EditAction onClick={() => openEdit(role)} /> : null}
    </RowActions>
  );

  return (
    <ModulePage
      crumb="Roles"
      view={view}
      onViewChange={(next) => setView(next as "table" | "card")}
      actions={
        canEdit ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add role
          </Button>
        ) : null
      }
    >
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.roles.status}
        errorMessage={crm.roles.errorMessage}
        empty={crm.roles.items.length === 0}
        emptyLabel="No roles yet"
        onRetry={reload}
      >
        {view === "card" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {crm.roles.items.map((role) => (
              <Card key={role.id} className="rounded-2xl shadow-[var(--shadow-card)]">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <CardDescription className="font-mono">{role.slug}</CardDescription>
                  </div>
                  {actionsFor(role)}
                </CardHeader>
                <CardContent className="space-y-3">
                  {BUILT_IN_SLUGS.has(role.slug) ? <StatusBadge status="active" label="Built-in" /> : null}
                  <p className="text-sm text-muted-foreground">
                    {role.permissionIds.length} permission{role.permissionIds.length === 1 ? "" : "s"}
                  </p>
                  <p className="text-sm">{permissionNames(role, crm.permissionsCatalog.items)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crm.roles.items.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-wrap items-center gap-2">
                      {role.name}
                      {BUILT_IN_SLUGS.has(role.slug) ? <StatusBadge status="active" label="Built-in" /> : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{role.slug}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{role.permissionIds.length}</p>
                      <p className="text-xs text-muted-foreground">
                        {permissionNames(role, crm.permissionsCatalog.items)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{actionsFor(role)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ModuleStatus>

      <SideSheet
        open={Boolean(viewingRole)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        title={viewingRole?.name ?? "Role"}
        description={viewingRole ? `Slug ${viewingRole.slug}` : undefined}
        className="sm:max-w-xl"
        footer={
          canEdit && viewingRole ? (
            <Button type="button" className="rounded-xl" onClick={() => openEdit(viewingRole)}>
              Edit role
            </Button>
          ) : null
        }
      >
        {viewingRole ? (
          <RolePermissionList
            role={viewingRole}
            groups={groups}
            catalog={crm.permissionsCatalog.items}
          />
        ) : null}
      </SideSheet>

      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit role" : "Add role"}
        description={
          editing
            ? `Slug stays ${editing.slug}. Choose the permissions this role can use.`
            : "The slug is created from the name. Choose the permissions this role can use."
        }
        onSubmit={onSubmit}
        className="sm:max-w-xl"
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            {editing ? "Save" : "Create"}
          </Button>
        }
      >
        <Field id="role-name" label="Name" error={errors.name}>
          <Input
            id="role-name"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="rounded-xl"
          />
        </Field>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Permissions</p>
            <p className="text-xs text-muted-foreground">{form.permissionIds.length} selected</p>
          </div>
          {errors.permissionIds ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.permissionIds}
            </p>
          ) : null}
          {groups.map((group) => {
            const selectedCount = group.items.filter((item) => form.permissionIds.includes(item.id)).length;
            return (
              <div key={group.key} className="space-y-2 rounded-xl border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{group.label}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg px-2 text-xs"
                    onClick={() => toggleGroup(group.items)}
                  >
                    {selectedCount === group.items.length ? "Clear" : "Select all"}
                  </Button>
                </div>
                <div className="grid gap-3">
                  {group.items.map((permission) => (
                    <label key={permission.id} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={form.permissionIds.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                      />
                      <span>
                        <span className="font-medium">{permission.name}</span>
                        <span className="block text-xs text-muted-foreground">{permission.description}</span>
                        <span className="block font-mono text-[11px] text-muted-foreground">{permission.code}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SideSheet>
    </ModulePage>
  );
}

function RolePermissionList({
  role,
  groups,
  catalog,
}: {
  role: CrmRoleDetail;
  groups: { key: string; label: string; items: CrmPermission[] }[];
  catalog: CrmPermission[];
}) {
  const granted = new Set(role.permissionIds);
  const grantedGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => granted.has(item.id)),
    }))
    .filter((group) => group.items.length > 0);
  const unknownIds = role.permissionIds.filter((id) => !catalog.some((permission) => permission.id === id));

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {role.permissionIds.length} permission{role.permissionIds.length === 1 ? "" : "s"} granted
      </p>
      {grantedGroups.map((group) => (
        <div key={group.key} className="space-y-2">
          <p className="text-sm font-semibold">{group.label}</p>
          <ul className="space-y-2">
            {group.items.map((permission) => (
              <li key={permission.id} className="rounded-xl border p-3">
                <p className="text-sm font-medium">{permission.name}</p>
                <p className="text-xs text-muted-foreground">{permission.description}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{permission.code}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {unknownIds.length > 0 ? (
        <p className="text-xs text-muted-foreground">{unknownIds.length} permission ids are not in the catalog.</p>
      ) : null}
    </div>
  );
}
