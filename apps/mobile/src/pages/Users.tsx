import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { FieldError, NativeSelect } from "@/components/forms/NativeSelect";
import { FormSheet } from "@/components/forms/FormSheet";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { FilterSortBar } from "@/components/FilterSortSheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRY_DIAL_CODES } from "@/lib/auth/country-dial-codes";
import { createCrmUser, listCrmUsers, listRoles, updateCrmUser } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { compareText, type SortOrder } from "@/lib/mobile/sort";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import { validateStaffUser } from "@/lib/mobile/validate";
import { CRM_PERMISSIONS, type CrmRoleDetail, type CrmStaffUser } from "@/types/crm";

type StaffForm = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  countryCode: string;
  mobileNo: string;
  email: string;
  password: string;
  roleIds: string[];
};

const EMPTY_FORM: StaffForm = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  countryCode: "+91",
  mobileNo: "",
  email: "",
  password: "",
  roleIds: [],
};

const DIAL_CODES = [...new Set(COUNTRY_DIAL_CODES.map((entry) => entry.dial))];

function formFromUser(user: CrmStaffUser): StaffForm {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    dob: user.dob ? user.dob.slice(0, 10) : "",
    gender: user.gender,
    countryCode: user.countryCode || "+91",
    mobileNo: user.mobileNo,
    email: user.email,
    password: "",
    roleIds: user.roleIds,
  };
}

function StaffSheet({
  open,
  onOpenChange,
  user,
  roles,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  user: CrmStaffUser | null;
  roles: CrmRoleDetail[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(user ? formFromUser(user) : EMPTY_FORM);
  }, [open, user]);

  const set = <K extends keyof StaffForm>(key: K, value: StaffForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleRole = (id: string) =>
    set("roleIds", form.roleIds.includes(id) ? form.roleIds.filter((roleId) => roleId !== id) : [...form.roleIds, id]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateStaffUser({ ...form, editing: Boolean(user) });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(Object.values(nextErrors)[0] ?? "Check the staff details");
      return;
    }
    const profile = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      dob: form.dob,
      gender: form.gender.trim(),
      countryCode: form.countryCode.trim(),
      mobileNo: form.mobileNo.trim(),
      email: form.email.trim(),
      roleIds: form.roleIds,
    };
    setBusy(true);
    try {
      if (user) await updateCrmUser(user.id, profile);
      else await createCrmUser({ ...profile, password: form.password });
      toast.success(user ? "Staff updated" : "Staff created");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save staff");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={user ? "Edit staff" : "New staff"}
      description={user ? "Update profile and roles. Passwords are changed by the user." : "Create a CRM login."}
      submitLabel={user ? "Save staff" : "Create staff"}
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="staff-first">First name</Label>
          <Input id="staff-first" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="h-11 rounded-xl text-base" />
          <FieldError message={errors.firstName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff-last">Last name</Label>
          <Input id="staff-last" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="h-11 rounded-xl text-base" />
          <FieldError message={errors.lastName} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="staff-dob">Date of birth</Label>
          <Input id="staff-dob" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} className="h-11 rounded-xl text-base" />
          <FieldError message={errors.dob} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff-gender">Gender</Label>
          <NativeSelect id="staff-gender" value={form.gender} onChange={(next) => set("gender", next)}>
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </NativeSelect>
          <FieldError message={errors.gender} />
        </div>
      </div>
      <div className="grid grid-cols-[6rem_1fr] gap-3">
        <div className="space-y-2">
          <Label htmlFor="staff-code">Code</Label>
          <NativeSelect id="staff-code" value={form.countryCode} onChange={(next) => set("countryCode", next)}>
            {DIAL_CODES.map((dial) => (
              <option key={dial} value={dial}>
                {dial}
              </option>
            ))}
          </NativeSelect>
          <FieldError message={errors.countryCode} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="staff-mobile">Mobile</Label>
          <Input id="staff-mobile" inputMode="tel" value={form.mobileNo} onChange={(e) => set("mobileNo", e.target.value)} className="h-11 rounded-xl text-base" />
          <FieldError message={errors.mobileNo} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-email">Email</Label>
        <Input id="staff-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-11 rounded-xl text-base" />
        <FieldError message={errors.email} />
      </div>
      {user ? null : (
        <div className="space-y-2">
          <Label htmlFor="staff-password">Password</Label>
          <Input
            id="staff-password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            className="h-11 rounded-xl text-base"
          />
          <FieldError message={errors.password} />
        </div>
      )}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Roles</legend>
        {roles.map((role) => (
          <label key={role.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3">
            <input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} className="h-4 w-4" />
            <span className="text-sm">{role.name}</span>
          </label>
        ))}
        <FieldError message={errors.roleIds} />
      </fieldset>
    </FormSheet>
  );
}

export default function Users() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.usersRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.usersCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.usersUpdate);
  const canReadRoles = permissions.includes(CRM_PERMISSIONS.rolesRead);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "email">("name");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [roleId, setRoleId] = useState("");
  const [editing, setEditing] = useState<CrmStaffUser | null>(null);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);
  const search = useDebounced(query, 300);

  const load = useCallback((page: number) => listCrmUsers({ page, limit: 20, search: search || undefined }), [search]);
  const list = usePagedList(load, search, canRead);
  const roles = useResource(listRoles, canRead && (canReadRoles || canCreate || canUpdate));
  const roleItems = useMemo(() => roles.data ?? [], [roles.data]);
  const roleName = (id: string) => roleItems.find((role) => role.id === id)?.name;
  const shown = useMemo(() => {
    const filtered = list.items.filter((user) => !roleId || user.roleIds.includes(roleId));
    return [...filtered].sort((left, right) => {
      const leftName = `${left.firstName} ${left.lastName}`.trim();
      const rightName = `${right.firstName} ${right.lastName}`.trim();
      return sort === "email" ? compareText(left.email, right.email, order) : compareText(leftName, rightName, order);
    });
  }, [list.items, order, roleId, sort]);

  if (!canRead) return <ForbiddenState label="users" />;

  return (
    <div className="space-y-3">
      <FilterSortBar
          query={query}
          onQuery={setQuery}
          searchPlaceholder="Search staff"
          searchLabel="Search staff"
          sort={sort}
          onSort={(next) => setSort(next as "name" | "email")}
          sortOptions={[
            { value: "name", label: "Name" },
            { value: "email", label: "Email" },
          ]}
          defaultSort="name"
          order={order}
          onOrder={setOrder}
          defaultOrder="asc"
          sections={
            roleItems.length > 0
              ? [
                  {
                    id: "staff-role",
                    kind: "single",
                    label: "Role",
                    value: roleId,
                    neutral: "",
                    options: [
                      { value: "", label: "All roles" },
                      ...roleItems.map((role) => ({ value: role.id, label: role.name })),
                    ],
                    onChange: setRoleId,
                  },
                ]
              : []
          }
          resultCount={shown.length}
          singular="person"
          plural="staff"
          onClear={() => setRoleId("")}
          onAdd={canCreate ? () => setCreateOpen(true) : undefined}
          addLabel="New staff"
        />

      {list.status === "loading" ? <LoadingState label="Loading staff…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "forbidden" ? <ForbiddenState label="users" /> : null}
      {list.status === "ready" && shown.length === 0 ? <EmptyState label="No staff found." /> : null}
      {list.status === "ready" && shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((user) => (
            <ListRow
              key={user.id}
              title={`${user.firstName} ${user.lastName}`.trim() || user.email}
              detail={[user.email, `${user.countryCode} ${user.mobileNo}`.trim()].filter(Boolean).join(" · ")}
              badge={
                <span className="flex flex-wrap justify-end gap-1">
                  {user.roleIds.map((id) => (
                    <Badge key={id} variant="secondary" className="rounded-lg text-[10px]">
                      {roleName(id) ?? "Role"}
                    </Badge>
                  ))}
                </span>
              }
              onClick={canUpdate ? () => setEditing(user) : undefined}
            />
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <StaffSheet
        open={createOpen || Boolean(editing)}
        onOpenChange={(next) => {
          if (next) return;
          setCreateOpen(false);
          setEditing(null);
        }}
        user={editing}
        roles={roleItems}
        onSaved={list.reload}
      />
    </div>
  );
}
