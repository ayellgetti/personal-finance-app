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
import { ENQUIRY_STATUS_LABELS, enquiryStatusOptions } from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CreateEnquiryInput,
  type CrmEnquiry,
  type CrmEnquiryStatus,
} from "@/types/crm";

type FormState = {
  contactId: string;
  title: string;
  source: string;
  status: CrmEnquiryStatus;
  expectedValue: string;
  notes: string;
};

const EMPTY: FormState = {
  contactId: "",
  title: "",
  source: "",
  status: "new",
  expectedValue: "",
  notes: "",
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.contactId) errors.contactId = "Contact is required";
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.source.trim()) errors.source = "Source is required";
  if (form.expectedValue.trim()) {
    const amount = Number(form.expectedValue);
    if (!Number.isFinite(amount) || amount < 0) errors.expectedValue = "Enter a valid amount";
  }
  return errors;
}

function toInput(form: FormState): CreateEnquiryInput {
  return {
    contactId: form.contactId,
    title: form.title.trim(),
    source: form.source.trim(),
    status: form.status,
    expectedValue: form.expectedValue.trim() ? Number(form.expectedValue) : null,
    notes: form.notes.trim() || null,
  };
}

export function EnquiriesModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.enquiriesRead);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmEnquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadEnquiries({ status: statusFilter ? (statusFilter as CrmEnquiryStatus) : undefined });
    if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) void crm.loadContacts({ limit: 100 });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, statusFilter]);

  const contactName = (contactId: string) =>
    crm.contacts.items.find((contact) => contact.id === contactId)?.name ?? contactId;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, contactId: crm.contacts.items[0]?.id ?? "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (enquiry: CrmEnquiry) => {
    setEditing(enquiry);
    setForm({
      contactId: enquiry.contactId,
      title: enquiry.title,
      source: enquiry.source,
      status: enquiry.status,
      expectedValue: enquiry.expectedValue == null ? "" : String(enquiry.expectedValue),
      notes: enquiry.notes ?? "",
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
      if (editing) await crm.updateEnquiry(editing.id, toInput(form));
      else await crm.createEnquiry(toInput(form));
      setDialogOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Field id="enquiry-status-filter" label="Status">
          <NativeSelect
            id="enquiry-status-filter"
            aria-label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <option value="">All statuses</option>
            {enquiryStatusOptions()}
          </NativeSelect>
        </Field>
        {crm.hasPermission(CRM_PERMISSIONS.enquiriesCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add enquiry
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.enquiries.status}
        errorMessage={crm.enquiries.errorMessage}
        empty={crm.enquiries.items.length === 0}
        emptyLabel="No enquiries yet"
        onRetry={reload}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expected</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crm.enquiries.items.map((enquiry) => (
              <TableRow key={enquiry.id}>
                <TableCell className="font-medium">{enquiry.title}</TableCell>
                <TableCell>{contactName(enquiry.contactId)}</TableCell>
                <TableCell>{enquiry.source}</TableCell>
                <TableCell>{ENQUIRY_STATUS_LABELS[enquiry.status]}</TableCell>
                <TableCell>{enquiry.expectedValue ?? "—"}</TableCell>
                <TableCell>
                  <RowActions>
                    {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "won" ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => void crm.convertEnquiry(enquiry.id)}
                      >
                        Convert
                      </Button>
                    ) : null}
                    {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                      <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(enquiry)}>
                        Edit
                      </Button>
                    ) : null}
                    {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        onClick={() => setRemoveId(enquiry.id)}
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
              <DialogTitle>{editing ? "Edit enquiry" : "Add enquiry"}</DialogTitle>
            </DialogHeader>
            <Field id="enquiry-contact" label="Contact" error={errors.contactId}>
              <NativeSelect
                id="enquiry-contact"
                value={form.contactId}
                onChange={(value) => setForm((current) => ({ ...current, contactId: value }))}
              >
                <option value="">Select contact</option>
                {crm.contacts.items.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="enquiry-title" label="Title" error={errors.title}>
              <Input
                id="enquiry-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="enquiry-source" label="Source" error={errors.source}>
              <Input
                id="enquiry-source"
                value={form.source}
                onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="enquiry-status" label="Status">
              <NativeSelect
                id="enquiry-status"
                value={form.status}
                onChange={(value) => setForm((current) => ({ ...current, status: value as CrmEnquiryStatus }))}
              >
                {enquiryStatusOptions()}
              </NativeSelect>
            </Field>
            <Field id="enquiry-value" label="Expected value" error={errors.expectedValue}>
              <Input
                id="enquiry-value"
                type="number"
                min="0"
                step="0.01"
                value={form.expectedValue}
                onChange={(event) => setForm((current) => ({ ...current, expectedValue: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="enquiry-notes" label="Notes">
              <Textarea
                id="enquiry-notes"
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
        title="Remove enquiry"
        description="This enquiry will be hidden from the pipeline."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeEnquiry(removeId).finally(() => setRemoveId(null));
        }}
      />
    </div>
  );
}
