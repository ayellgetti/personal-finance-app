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
  ConfirmRemoveDialog,
  Field,
  ModuleStatus,
  NativeSelect,
  RowActions,
} from "@/components/modules/shared";
import { CLIENT_STATUS_LABELS, clientStatusOptions } from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CreateClientInput, type CrmClient, type CrmClientStatus } from "@/types/crm";

type FormState = {
  contactId: string;
  billingName: string;
  status: CrmClientStatus;
  gstin: string;
};

const EMPTY: FormState = {
  contactId: "",
  billingName: "",
  status: "active",
  gstin: "",
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.contactId) errors.contactId = "Contact is required";
  if (!form.billingName.trim()) errors.billingName = "Billing name is required";
  return errors;
}

function toInput(form: FormState): CreateClientInput {
  return {
    contactId: form.contactId,
    billingName: form.billingName.trim(),
    status: form.status,
    gstin: form.gstin.trim() || null,
  };
}

export function ClientsModule({
  onOpenContact,
  onOpenPayments,
}: {
  onOpenContact: (contactId: string) => void;
  onOpenPayments: (clientId: string) => void;
}) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.clientsRead);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmClient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadClients({
      status: statusFilter ? (statusFilter as CrmClientStatus) : undefined,
      search: appliedSearch || undefined,
    });
    if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) void crm.loadContacts({ type: "client", limit: 100 });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, statusFilter, appliedSearch]);

  const contactName = (id: string) => crm.contacts.items.find((contact) => contact.id === id)?.name ?? id;

  const clientContacts = crm.contacts.items.filter((contact) => contact.type === "client");

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, contactId: clientContacts[0]?.id ?? "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (client: CrmClient) => {
    setEditing(client);
    setForm({
      contactId: client.contactId,
      billingName: client.billingName,
      status: client.status,
      gstin: client.gstin ?? "",
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
      if (editing) await crm.updateClient(editing.id, toInput(form));
      else await crm.createClient(toInput(form));
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
          <Field id="client-search" label="Search">
            <Input
              id="client-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Billing name or GSTIN"
              className="rounded-xl"
            />
          </Field>
          <Field id="client-status-filter" label="Status">
            <NativeSelect id="client-status-filter" aria-label="Status" value={statusFilter} onChange={setStatusFilter}>
              <option value="">All statuses</option>
              {clientStatusOptions()}
            </NativeSelect>
          </Field>
          <Button type="submit" variant="outline" className="rounded-xl">
            Search
          </Button>
        </form>
        {crm.hasPermission(CRM_PERMISSIONS.clientsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add client
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.clients.status}
        errorMessage={crm.clients.errorMessage}
        empty={crm.clients.items.length === 0}
        emptyLabel="No clients yet"
        onRetry={reload}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Billing name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crm.clients.items.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.billingName}</TableCell>
                <TableCell>{contactName(client.contactId)}</TableCell>
                <TableCell>{CLIENT_STATUS_LABELS[client.status]}</TableCell>
                <TableCell>{client.gstin ?? "—"}</TableCell>
                <TableCell>
                  <RowActions>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => onOpenContact(client.contactId)}
                    >
                      Contact
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => onOpenPayments(client.id)}
                    >
                      Payments
                    </Button>
                    {crm.hasPermission(CRM_PERMISSIONS.clientsUpdate) ? (
                      <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => openEdit(client)}>
                        Edit
                      </Button>
                    ) : null}
                    {crm.hasPermission(CRM_PERMISSIONS.clientsDelete) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        onClick={() => setRemoveId(client.id)}
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
              <DialogTitle>{editing ? "Edit client" : "Add client"}</DialogTitle>
            </DialogHeader>
            {!editing ? (
              <Field id="client-contact" label="Contact" error={errors.contactId}>
                <NativeSelect
                  id="client-contact"
                  value={form.contactId}
                  onChange={(value) => setForm((current) => ({ ...current, contactId: value }))}
                >
                  <option value="">Select client contact</option>
                  {clientContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : null}
            <Field id="client-billing" label="Billing name" error={errors.billingName}>
              <Input
                id="client-billing"
                value={form.billingName}
                onChange={(event) => setForm((current) => ({ ...current, billingName: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="client-status" label="Status">
              <NativeSelect
                id="client-status"
                value={form.status}
                onChange={(value) => setForm((current) => ({ ...current, status: value as CrmClientStatus }))}
              >
                {clientStatusOptions()}
              </NativeSelect>
            </Field>
            <Field id="client-gstin" label="GSTIN">
              <Input
                id="client-gstin"
                value={form.gstin}
                onChange={(event) => setForm((current) => ({ ...current, gstin: event.target.value }))}
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
        title="Remove client"
        description="This commercial record will be hidden from the list."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeClient(removeId).finally(() => setRemoveId(null));
        }}
      />
    </div>
  );
}
