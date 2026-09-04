import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Field,
  ModuleStatus,
  NativeSelect,
  RowActions,
} from "@/components/modules/shared";
import { EMAIL_PATTERN, MOBILE_PATTERN } from "@/lib/crm/display";
import { COUNTRY_DIAL_CODES, DEFAULT_COUNTRY_ISO, dialForIso, toE164Mobile } from "@/lib/auth/country-dial-codes";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CreateCrmUserInput, type CrmStaffUser } from "@/types/crm";

type FormState = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  countryIso: string;
  mobileNo: string;
  email: string;
  password: string;
  roleIds: string[];
};

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  countryIso: DEFAULT_COUNTRY_ISO,
  mobileNo: "",
  email: "",
  password: "",
  roleIds: [],
};

function validate(form: FormState, isCreate: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required";
  if (!form.lastName.trim()) errors.lastName = "Last name is required";
  if (!form.dob) errors.dob = "Date of birth is required";
  if (!form.gender) errors.gender = "Gender is required";
  const mobile = toE164Mobile(form.countryIso, form.mobileNo);
  if (!form.mobileNo.trim()) errors.mobileNo = "Mobile is required";
  else if (!MOBILE_PATTERN.test(mobile)) errors.mobileNo = "Enter a valid mobile number";
  if (!form.email.trim() || !EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email";
  if (isCreate && form.password.length < 8) errors.password = "Password must be at least 8 characters";
  if (form.roleIds.length === 0) errors.roleIds = "Select at least one role";
  return errors;
}

function toCreateInput(form: FormState): CreateCrmUserInput {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    dob: form.dob,
    gender: form.gender,
    countryCode: dialForIso(form.countryIso),
    mobileNo: toE164Mobile(form.countryIso, form.mobileNo),
    email: form.email.trim(),
    password: form.password,
    roleIds: form.roleIds,
  };
}

export function UsersModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.usersRead);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmStaffUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadUsers();
    if (crm.hasPermission(CRM_PERMISSIONS.rolesRead)) void crm.loadRoles();
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed]);

  const roleNames = (roleIds: string[]) =>
    roleIds
      .map((id) => crm.roles.items.find((role) => role.id === id)?.name ?? id)
      .join(", ");

  const toggleRole = (roleId: string) => {
    setForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((id) => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (user: CrmStaffUser) => {
    setEditing(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      dob: user.dob.slice(0, 10),
      gender: user.gender,
      countryIso: DEFAULT_COUNTRY_ISO,
      mobileNo: user.mobileNo,
      email: user.email,
      password: "",
      roleIds: user.roleIds,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form, !editing);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      if (editing) {
        await crm.updateUser(editing.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          dob: form.dob,
          gender: form.gender,
          countryCode: dialForIso(form.countryIso),
          mobileNo: toE164Mobile(form.countryIso, form.mobileNo),
          email: form.email.trim(),
          roleIds: form.roleIds,
        });
      } else {
        await crm.createUser(toCreateInput(form));
      }
      setDialogOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {crm.hasPermission(CRM_PERMISSIONS.usersCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add user
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.users.status}
        errorMessage={crm.users.errorMessage}
        empty={crm.users.items.length === 0}
        emptyLabel="No users yet"
        onRetry={reload}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crm.users.items.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.mobileNo}</TableCell>
                <TableCell>{roleNames(user.roleIds) || "—"}</TableCell>
                <TableCell>
                  <RowActions>
                    {crm.hasPermission(CRM_PERMISSIONS.usersUpdate) ? (
                      <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(user)}>
                        Edit roles
                      </Button>
                    ) : null}
                  </RowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ModuleStatus>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="user-first-name" label="First name" error={errors.firstName}>
                <Input
                  id="user-first-name"
                  value={form.firstName}
                  onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                  className="rounded-xl"
                />
              </Field>
              <Field id="user-last-name" label="Last name" error={errors.lastName}>
                <Input
                  id="user-last-name"
                  value={form.lastName}
                  onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                  className="rounded-xl"
                />
              </Field>
            </div>
            <Field id="user-dob" label="Date of birth" error={errors.dob}>
              <Input
                id="user-dob"
                type="date"
                value={form.dob}
                onChange={(event) => setForm((current) => ({ ...current, dob: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="user-gender" label="Gender" error={errors.gender}>
              <NativeSelect
                id="user-gender"
                value={form.gender}
                onChange={(value) => setForm((current) => ({ ...current, gender: value }))}
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </NativeSelect>
            </Field>
            <Field id="user-mobile" label="Mobile" error={errors.mobileNo}>
              <div className="flex gap-2">
                <NativeSelect
                  aria-label="Country code"
                  value={form.countryIso}
                  onChange={(value) => setForm((current) => ({ ...current, countryIso: value }))}
                  className="w-36"
                >
                  {COUNTRY_DIAL_CODES.map((country) => (
                    <option key={country.iso} value={country.iso}>
                      {country.iso} {country.dial}
                    </option>
                  ))}
                </NativeSelect>
                <Input
                  id="user-mobile"
                  value={form.mobileNo}
                  onChange={(event) => setForm((current) => ({ ...current, mobileNo: event.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </Field>
            <Field id="user-email" label="Email" error={errors.email}>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            {!editing ? (
              <Field id="user-password" label="Password" error={errors.password}>
                <Input
                  id="user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="rounded-xl"
                />
              </Field>
            ) : null}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Roles</legend>
              {crm.roles.items.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.roleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  {role.name}
                </label>
              ))}
              {errors.roleIds ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.roleIds}
                </p>
              ) : null}
            </fieldset>
            <DialogFooter>
              <Button type="submit" className="rounded-xl" disabled={busy}>
                {editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
