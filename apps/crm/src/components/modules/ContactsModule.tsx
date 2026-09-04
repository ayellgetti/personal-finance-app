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
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmRemoveDialog,
  Field,
  ModuleStatus,
  NativeSelect,
  RowActions,
} from "@/components/modules/shared";
import {
  CONTACT_TYPE_LABELS,
  EMAIL_PATTERN,
  MOBILE_PATTERN,
  contactTypeOptions,
} from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CreateContactInput, type CrmContact, type CrmContactType } from "@/types/crm";

type FormState = {
  name: string;
  mobile: string;
  type: CrmContactType;
  email: string;
  companyName: string;
  notes: string;
};

const EMPTY: FormState = {
  name: "",
  mobile: "",
  type: "lead",
  email: "",
  companyName: "",
  notes: "",
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.mobile.trim()) errors.mobile = "Mobile is required";
  else if (!MOBILE_PATTERN.test(form.mobile.trim())) errors.mobile = "Enter a valid mobile number";
  if (form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email";
  return errors;
}

function toInput(form: FormState): CreateContactInput {
  return {
    name: form.name.trim(),
    mobile: form.mobile.trim(),
    type: form.type,
    email: form.email.trim() || null,
    companyName: form.companyName.trim() || null,
    notes: form.notes.trim() || null,
  };
}

export function ContactsModule({ highlightId }: { highlightId?: string | null }) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.contactsRead);
  const [type, setType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmContact | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadContacts({
      type: type ? (type as CrmContactType) : undefined,
      search: appliedSearch || undefined,
    });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change
  }, [sessionReady, allowed, type, appliedSearch]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (contact: CrmContact) => {
    setEditing(contact);
    setForm({
      name: contact.name,
      mobile: contact.mobile,
      type: contact.type,
      email: contact.email ?? "",
      companyName: contact.companyName ?? "",
      notes: contact.notes ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      if (editing) await crm.updateContact(editing.id, toInput(form));
      else await crm.createContact(toInput(form));
      setDialogOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <form
          className="flex flex-1 flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setAppliedSearch(search.trim());
          }}
        >
          <Field id="contact-search" label="Search">
            <Input
              id="contact-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name or mobile"
              className="rounded-xl"
            />
          </Field>
          <Field id="contact-type-filter" label="Type">
            <NativeSelect id="contact-type-filter" aria-label="Type" value={type} onChange={setType}>
              <option value="">All types</option>
              {contactTypeOptions()}
            </NativeSelect>
          </Field>
          <Button type="submit" variant="outline" className="rounded-xl">
            Search
          </Button>
        </form>
        {crm.hasPermission(CRM_PERMISSIONS.contactsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add contact
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.contacts.status}
        errorMessage={crm.contacts.errorMessage}
        empty={crm.contacts.items.length === 0}
        emptyLabel="No contacts yet"
        onRetry={reload}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crm.contacts.items.map((contact) => (
              <TableRow key={contact.id} data-highlighted={highlightId === contact.id ? "true" : undefined}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.mobile}</TableCell>
                <TableCell>{CONTACT_TYPE_LABELS[contact.type]}</TableCell>
                <TableCell>{contact.email ?? "—"}</TableCell>
                <TableCell>{contact.companyName ?? "—"}</TableCell>
                <TableCell>
                  <RowActions>
                    {crm.hasPermission(CRM_PERMISSIONS.contactsUpdate) ? (
                      <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(contact)}>
                        Edit
                      </Button>
                    ) : null}
                    {crm.hasPermission(CRM_PERMISSIONS.contactsDelete) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        onClick={() => setRemoveId(contact.id)}
                      >
                        Remove
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
        <DialogContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit contact" : "Add contact"}</DialogTitle>
            </DialogHeader>
            <Field id="contact-name" label="Name" error={errors.name}>
              <Input
                id="contact-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="contact-mobile" label="Mobile" error={errors.mobile}>
              <Input
                id="contact-mobile"
                value={form.mobile}
                onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="contact-type" label="Type">
              <NativeSelect
                id="contact-type"
                value={form.type}
                onChange={(value) => setForm((current) => ({ ...current, type: value as CrmContactType }))}
              >
                {contactTypeOptions()}
              </NativeSelect>
            </Field>
            <Field id="contact-email" label="Email" error={errors.email}>
              <Input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="contact-company" label="Company">
              <Input
                id="contact-company"
                value={form.companyName}
                onChange={(event) => setForm((current) => ({ ...current, companyName: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="contact-notes" label="Notes">
              <Textarea
                id="contact-notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <DialogFooter>
              <Button type="submit" className="rounded-xl" disabled={busy}>
                {editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove contact"
        description="This contact will be hidden from lists. You can recreate it later if needed."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeContact(removeId).finally(() => setRemoveId(null));
        }}
      />
    </div>
  );
}
