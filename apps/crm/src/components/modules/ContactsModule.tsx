import { FormEvent, useEffect, useState } from "react";
import { Mail, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmRemoveDialog,
  EditAction,
  Field,
  ModulePage,
  ModuleStatus,
  NativeSelect,
  RemoveAction,
  RowActions,
  SideSheet,
  StatusBadge,
  ViewAction,
} from "@/components/modules/shared";
import { ContactViewSheet } from "@/components/modules/ContactViewSheet";
import {
  CONTACT_TYPE_LABELS,
  EMAIL_PATTERN,
  MOBILE_PATTERN,
  contactTypeOptions,
} from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CreateContactInput, type CrmContact, type CrmContactType } from "@/types/crm";

type ViewMode = "table" | "card";

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

function ContactTable({
  items,
  highlightId,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onRemove,
}: {
  items: CrmContact[];
  highlightId?: string | null;
  canEdit: boolean;
  canDelete: boolean;
  onView: (c: CrmContact) => void;
  onEdit: (c: CrmContact) => void;
  onRemove: (id: string) => void;
}) {
  return (
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
        {items.map((contact) => (
          <TableRow
            key={contact.id}
            data-highlighted={highlightId === contact.id ? "true" : undefined}
            className="hover:bg-muted/40"
          >
            <TableCell className="font-medium">{contact.name}</TableCell>
            <TableCell className="text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {contact.mobile}
              </span>
            </TableCell>
            <TableCell>
              <StatusBadge status={contact.type} label={CONTACT_TYPE_LABELS[contact.type]} />
            </TableCell>
            <TableCell className="text-muted-foreground">{contact.email ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{contact.companyName ?? "—"}</TableCell>
            <TableCell>
              <RowActions>
                <ViewAction onClick={() => onView(contact)} />
                {canEdit ? <EditAction onClick={() => onEdit(contact)} /> : null}
                {canDelete ? <RemoveAction onClick={() => onRemove(contact.id)} /> : null}
              </RowActions>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ContactCards({
  items,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onRemove,
}: {
  items: CrmContact[];
  canEdit: boolean;
  canDelete: boolean;
  onView: (c: CrmContact) => void;
  onEdit: (c: CrmContact) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((contact) => (
        <Card key={contact.id} className="rounded-2xl shadow-[var(--shadow-card)] transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <CardTitle className="truncate text-base">{contact.name}</CardTitle>
                {contact.companyName ? (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {contact.companyName}
                  </p>
                ) : null}
              </div>
              <StatusBadge status={contact.type} label={CONTACT_TYPE_LABELS[contact.type]} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span>{contact.mobile}</span>
            </p>
            {contact.email ? (
              <p className="flex items-center gap-1.5 text-sm">
                <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{contact.email}</span>
              </p>
            ) : null}
            {contact.notes ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{contact.notes}</p>
            ) : null}
            <div className="flex justify-end gap-1 pt-1">
              <ViewAction onClick={() => onView(contact)} />
              {canEdit ? <EditAction onClick={() => onEdit(contact)} /> : null}
              {canDelete ? <RemoveAction onClick={() => onRemove(contact.id)} /> : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ContactsModule({ highlightId }: { highlightId?: string | null }) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.contactsRead);
  const [view, setView] = useState<ViewMode>("table");
  const [type, setType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmContact | null>(null);
  const [viewing, setViewing] = useState<CrmContact | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
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
    setSheetOpen(true);
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
    setSheetOpen(true);
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
      setSheetOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  const toolbar = (
    <form
      className="flex flex-1 flex-wrap items-end gap-3"
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
  );

  return (
    <ModulePage
      crumb="Contacts"
      view={view}
      onViewChange={(v) => setView(v as ViewMode)}
      toolbar={toolbar}
      actions={
        crm.hasPermission(CRM_PERMISSIONS.contactsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add contact
          </Button>
        ) : null
      }
    >
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.contacts.status}
        errorMessage={crm.contacts.errorMessage}
        empty={crm.contacts.items.length === 0}
        emptyLabel="No contacts yet"
        onRetry={reload}
      >
        {view === "card" ? (
          <ContactCards
            items={crm.contacts.items}
            canEdit={crm.hasPermission(CRM_PERMISSIONS.contactsUpdate)}
            canDelete={crm.hasPermission(CRM_PERMISSIONS.contactsDelete)}
            onView={setViewing}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        ) : (
          <ContactTable
            items={crm.contacts.items}
            highlightId={highlightId}
            canEdit={crm.hasPermission(CRM_PERMISSIONS.contactsUpdate)}
            canDelete={crm.hasPermission(CRM_PERMISSIONS.contactsDelete)}
            onView={setViewing}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        )}
      </ModuleStatus>

      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit contact" : "Add contact"}
        onSubmit={onSubmit}
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            {editing ? "Save" : "Create"}
          </Button>
        }
      >
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
      </SideSheet>

      <ContactViewSheet contact={viewing} onClose={() => setViewing(null)} />

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
    </ModulePage>
  );
}
