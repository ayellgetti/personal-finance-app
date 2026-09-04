import { FormEvent, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  FOLLOW_UP_STATUS_LABELS,
  followUpStatusOptions,
  formatDateTime,
  isoToLocalInput,
  localInputToIso,
} from "@/lib/crm/display";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CreateFollowUpInput,
  type CrmFollowUp,
  type CrmFollowUpStatus,
} from "@/types/crm";

type FormState = {
  contactId: string;
  enquiryId: string;
  dueAt: string;
  status: CrmFollowUpStatus;
  notes: string;
};

const EMPTY: FormState = {
  contactId: "",
  enquiryId: "",
  dueAt: "",
  status: "pending",
  notes: "",
};

function isOverdue(item: CrmFollowUp): boolean {
  return item.status === "pending" && new Date(item.dueAt).getTime() < Date.now();
}

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.contactId) errors.contactId = "Contact is required";
  if (!form.dueAt) errors.dueAt = "Due date is required";
  return errors;
}

function toInput(form: FormState): CreateFollowUpInput {
  return {
    contactId: form.contactId,
    enquiryId: form.enquiryId || null,
    dueAt: localInputToIso(form.dueAt),
    status: form.status,
    notes: form.notes.trim() || null,
  };
}

export function FollowUpsModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.followUpsRead);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmFollowUp | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadFollowUps({ status: statusFilter ? (statusFilter as CrmFollowUpStatus) : undefined });
    if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) void crm.loadContacts({ limit: 100 });
    if (crm.hasPermission(CRM_PERMISSIONS.enquiriesRead)) void crm.loadEnquiries({ limit: 100 });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, statusFilter]);

  const contactName = (id: string) => crm.contacts.items.find((contact) => contact.id === id)?.name ?? id;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, contactId: crm.contacts.items[0]?.id ?? "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (item: CrmFollowUp) => {
    setEditing(item);
    setForm({
      contactId: item.contactId,
      enquiryId: item.enquiryId ?? "",
      dueAt: isoToLocalInput(item.dueAt),
      status: item.status,
      notes: item.notes ?? "",
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
      if (editing) await crm.updateFollowUp(editing.id, toInput(form));
      else await crm.createFollowUp(toInput(form));
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
        <Field id="followup-status-filter" label="Status">
          <NativeSelect
            id="followup-status-filter"
            aria-label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <option value="">All statuses</option>
            {followUpStatusOptions()}
          </NativeSelect>
        </Field>
        {crm.hasPermission(CRM_PERMISSIONS.followUpsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add follow-up
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.followUps.status}
        errorMessage={crm.followUps.errorMessage}
        empty={crm.followUps.items.length === 0}
        emptyLabel="No follow-ups yet"
        onRetry={reload}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Due</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crm.followUps.items.map((item) => {
              const overdue = isOverdue(item);
              return (
                <TableRow
                  key={item.id}
                  className={cn(overdue && "bg-destructive/10")}
                  data-overdue={overdue ? "true" : undefined}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {formatDateTime(item.dueAt)}
                      {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>{contactName(item.contactId)}</TableCell>
                  <TableCell>{FOLLOW_UP_STATUS_LABELS[item.status]}</TableCell>
                  <TableCell>{item.notes ?? "—"}</TableCell>
                  <TableCell>
                    <RowActions>
                      {crm.hasPermission(CRM_PERMISSIONS.followUpsUpdate) ? (
                        <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(item)}>
                          Edit
                        </Button>
                      ) : null}
                      {crm.hasPermission(CRM_PERMISSIONS.followUpsDelete) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="rounded-xl"
                          onClick={() => setRemoveId(item.id)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </RowActions>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ModuleStatus>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit follow-up" : "Add follow-up"}</DialogTitle>
            </DialogHeader>
            <Field id="followup-contact" label="Contact" error={errors.contactId}>
              <NativeSelect
                id="followup-contact"
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
            <Field id="followup-enquiry" label="Enquiry">
              <NativeSelect
                id="followup-enquiry"
                value={form.enquiryId}
                onChange={(value) => setForm((current) => ({ ...current, enquiryId: value }))}
              >
                <option value="">None</option>
                {crm.enquiries.items.map((enquiry) => (
                  <option key={enquiry.id} value={enquiry.id}>
                    {enquiry.title}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="followup-due" label="Due" error={errors.dueAt}>
              <Input
                id="followup-due"
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="followup-status" label="Status">
              <NativeSelect
                id="followup-status"
                value={form.status}
                onChange={(value) => setForm((current) => ({ ...current, status: value as CrmFollowUpStatus }))}
              >
                {followUpStatusOptions()}
              </NativeSelect>
            </Field>
            <Field id="followup-notes" label="Notes">
              <Textarea
                id="followup-notes"
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
        title="Remove follow-up"
        description="This follow-up will be hidden from the list."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeFollowUp(removeId).finally(() => setRemoveId(null));
        }}
      />
    </div>
  );
}
