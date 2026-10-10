import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { FieldError } from "@/components/forms/NativeSelect";
import { FormSheet } from "@/components/forms/FormSheet";
import { FilterSortBar } from "@/components/FilterSortSheet";
import { ListRow } from "@/components/ListRow";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { matchesQuery } from "@/lib/mobile/format";
import { createRole, listPermissions, listRoles, updateRole } from "@/lib/mobile/remote";
import { compareNumber, compareText, type SortOrder } from "@/lib/mobile/sort";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { useResource } from "@/lib/mobile/use-resource";
import { validateRole } from "@/lib/mobile/validate";
import { CRM_PERMISSIONS, type CrmPermission, type CrmRoleDetail } from "@/types/crm";

const BUILT_IN_SLUGS = new Set(["admin", "manager", "sales", "viewer"]);
const EMPTY_ROLES: CrmRoleDetail[] = [];

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

function groupPermissions(items: CrmPermission[]): { key: string; label: string; items: CrmPermission[] }[] {
  const groups: { key: string; label: string; items: CrmPermission[] }[] = [];
  for (const permission of items) {
    const key = permission.code.split(".")[1] ?? "other";
    const existing = groups.find((group) => group.key === key);
    if (existing) existing.items.push(permission);
    else groups.push({ key, label: GROUP_LABELS[key] ?? key, items: [permission] });
  }
  return groups;
}

function RoleSheet({
  open,
  onOpenChange,
  role,
  catalog,
  readOnly,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  role: CrmRoleDetail | null;
  catalog: CrmPermission[];
  readOnly: boolean;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const groups = useMemo(() => groupPermissions(catalog), [catalog]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setName(role?.name ?? "");
    setPermissionIds(role?.permissionIds ?? []);
  }, [open, role]);

  const toggle = (id: string) =>
    setPermissionIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || readOnly) return;
    const nextErrors = validateRole({ name, permissionIds });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.name ?? "Check the role");
      return;
    }
    setBusy(true);
    try {
      if (role) await updateRole(role.id, { name: name.trim(), permissionIds });
      else await createRole({ name: name.trim(), permissionIds });
      toast.success(role ? "Role updated" : "Role created");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save role");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={role ? (readOnly ? role.name : "Edit role") : "New role"}
      description={
        role ? `Slug stays ${role.slug}. Choose the permissions this role can use.` : "The slug is created from the name."
      }
      submitLabel={readOnly ? "Close" : role ? "Save role" : "Create role"}
      busy={busy}
      onSubmit={(event) => {
        if (readOnly) {
          event.preventDefault();
          onOpenChange(false);
          return;
        }
        void onSubmit(event);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="role-name">Name</Label>
        <Input id="role-name" value={name} disabled={readOnly} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl text-base" />
        <FieldError message={errors.name} />
        <FieldError message={errors.permissionIds} />
      </div>
      {groups.map((group) => (
        <fieldset key={group.key} className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</legend>
          {group.items.map((permission) => (
            <label key={permission.id} className="flex min-h-11 items-start gap-3 rounded-xl border border-border px-3 py-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                disabled={readOnly}
                checked={permissionIds.includes(permission.id)}
                onChange={() => toggle(permission.id)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{permission.name}</span>
                <span className="block text-xs text-muted-foreground">{permission.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      ))}
    </FormSheet>
  );
}

export default function Roles() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.rolesRead);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.rolesUpdate);

  const [selected, setSelected] = useState<CrmRoleDetail | null>(null);
  const [createOpen, setCreateOpen] = useCreateIntent(canUpdate);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "permissions">("name");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [kind, setKind] = useState<"all" | "built-in" | "custom">("all");

  const loadAll = useCallback(async () => {
    const [roles, catalog] = await Promise.all([listRoles(), listPermissions()]);
    return { roles, catalog };
  }, []);
  const data = useResource(loadAll, canRead);
  const catalog = data.data?.catalog ?? [];
  const roles = data.data?.roles ?? EMPTY_ROLES;
  const shown = useMemo(() => {
    const filtered = roles.filter((role) => {
      if (kind === "built-in" && !BUILT_IN_SLUGS.has(role.slug)) return false;
      if (kind === "custom" && BUILT_IN_SLUGS.has(role.slug)) return false;
      return matchesQuery(query, role.name, role.slug);
    });
    return [...filtered].sort((left, right) =>
      sort === "permissions"
        ? compareNumber(left.permissionIds.length, right.permissionIds.length, order)
        : compareText(left.name, right.name, order),
    );
  }, [kind, order, query, roles, sort]);

  if (!canRead) return <ForbiddenState label="roles" />;

  return (
    <div className="space-y-3">
      <FilterSortBar
          query={query}
          onQuery={setQuery}
          searchPlaceholder="Search roles"
          searchLabel="Search roles"
          sort={sort}
          onSort={(next) => setSort(next as "name" | "permissions")}
          sortOptions={[
            { value: "name", label: "Name" },
            { value: "permissions", label: "Permissions" },
          ]}
          defaultSort="name"
          order={order}
          onOrder={setOrder}
          defaultOrder="asc"
          sections={[
            {
              id: "role-kind",
              kind: "single",
              label: "Kind",
              value: kind,
              neutral: "all",
              options: [
                { value: "all", label: "All" },
                { value: "built-in", label: "Built-in" },
                { value: "custom", label: "Custom" },
              ],
              onChange: (next) => setKind(next as "all" | "built-in" | "custom"),
            },
          ]}
          resultCount={shown.length}
          singular="role"
          plural="roles"
          onClear={() => setKind("all")}
          onAdd={canUpdate ? () => setCreateOpen(true) : undefined}
          addLabel="New role"
        />

      {data.status === "loading" ? <LoadingState label="Loading roles…" /> : null}
      {data.status === "error" ? <ErrorState message={data.errorMessage} onRetry={data.reload} /> : null}
      {data.status === "forbidden" ? <ForbiddenState label="roles" /> : null}
      {data.status === "ready" && shown.length === 0 ? (
        <EmptyState label={roles.length === 0 ? "No roles yet." : "No roles found."} />
      ) : null}
      {data.status === "ready" && shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((role) => (
            <ListRow
              key={role.id}
              title={role.name}
              detail={`${role.slug} · ${role.permissionIds.length} permission${role.permissionIds.length === 1 ? "" : "s"}`}
              badge={
                BUILT_IN_SLUGS.has(role.slug) ? (
                  <Badge variant="secondary" className="rounded-lg text-[10px]">
                    Built-in
                  </Badge>
                ) : undefined
              }
              onClick={() => setSelected(role)}
            />
          ))}
        </div>
      ) : null}

      <RoleSheet
        open={createOpen || Boolean(selected)}
        onOpenChange={(next) => {
          if (next) return;
          setCreateOpen(false);
          setSelected(null);
        }}
        role={selected}
        catalog={catalog}
        readOnly={!canUpdate}
        onSaved={data.reload}
      />
    </div>
  );
}
