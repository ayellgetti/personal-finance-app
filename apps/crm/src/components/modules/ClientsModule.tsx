import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientViewSheet } from "@/components/modules/ClientViewSheet";
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
import { bookingDatesForClient } from "@/lib/crm/booking";
import { CLIENT_STATUS_LABELS, clientStatusOptions, formatDateTime } from "@/lib/crm/display";
import { fetchContactDetail } from "@/lib/crm/remote";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CreateClientInput,
  type CrmCalendarEvent,
  type CrmClient,
  type CrmClientStatus,
} from "@/types/crm";

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
  createOnDate,
  onCreateOpened,
}: {
  onOpenContact: (contactId: string) => void;
  onOpenPayments: (clientId: string) => void;
  createOnDate?: string | null;
  onCreateOpened?: () => void;
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
  const [viewing, setViewing] = useState<CrmClient | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bookingsByContactId, setBookingsByContactId] = useState<Record<string, CrmCalendarEvent[]>>({});

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

  useEffect(() => {
    const missing = crm.clients.items.filter((client) => !client.startsAt || !client.endsAt);
    if (missing.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missing.map(async (client) => {
        const detail = await fetchContactDetail(client.contactId);
        return [client.contactId, detail.bookings] as const;
      }),
    )
      .then((rows) => {
        if (cancelled) return;
        setBookingsByContactId((current) => ({ ...current, ...Object.fromEntries(rows) }));
      })
      .catch(() => {
        // toast handled in store / request layer
      });
    return () => {
      cancelled = true;
    };
  }, [crm.clients.items]);

  const contactFor = (id: string) => crm.contacts.items.find((contact) => contact.id === id) ?? null;
  const contactName = (id: string) => contactFor(id)?.name ?? id;
  const viewingContact = viewing ? contactFor(viewing.contactId) : null;

  const clientContacts = crm.contacts.items.filter((contact) => contact.type === "client");

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, contactId: clientContacts[0]?.id ?? "" });
    setErrors({});
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!createOnDate) return;
    openCreate();
    onCreateOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOnDate]);

  const openEdit = (client: CrmClient) => {
    setEditing(client);
    setForm({
      contactId: client.contactId,
      billingName: client.billingName,
      status: client.status,
      gstin: client.gstin ?? "",
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
      if (editing) await crm.updateClient(editing.id, toInput(form));
      else await crm.createClient(toInput(form));
      setSheetOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModulePage
      crumb="Booked"
      toolbar={
        <form
          className="flex flex-1 flex-wrap items-end gap-3"
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
      }
      actions={
        crm.hasPermission(CRM_PERMISSIONS.clientsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add booking
          </Button>
        ) : null
      }
    >
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.clients.status}
        errorMessage={crm.clients.errorMessage}
        empty={crm.clients.items.length === 0}
        emptyLabel="No bookings yet"
        onRetry={reload}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Billing name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>End date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crm.clients.items.map((client) => {
              const dates = bookingDatesForClient(client, bookingsByContactId[client.contactId] ?? []);
              return (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    className="text-left underline-offset-2 hover:underline"
                    onClick={() => setViewing(client)}
                  >
                    {client.billingName}
                  </button>
                </TableCell>
                <TableCell>{contactName(client.contactId)}</TableCell>
                <TableCell>{formatDateTime(dates.startsAt)}</TableCell>
                <TableCell>{formatDateTime(dates.endsAt)}</TableCell>
                <TableCell>
                  <StatusBadge status={client.status} label={CLIENT_STATUS_LABELS[client.status]} />
                </TableCell>
                <TableCell className="text-muted-foreground">{client.gstin ?? "—"}</TableCell>
                <TableCell>
                  <RowActions>
                    <ViewAction onClick={() => setViewing(client)} />
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
                      <EditAction onClick={() => openEdit(client)} />
                    ) : null}
                    {crm.hasPermission(CRM_PERMISSIONS.clientsDelete) ? (
                      <RemoveAction onClick={() => setRemoveId(client.id)} />
                    ) : null}
                  </RowActions>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ModuleStatus>

      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit booking" : "Add booking"}
        onSubmit={onSubmit}
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            {editing ? "Save" : "Create"}
          </Button>
        }
      >
        {!editing ? (
          <Field id="client-contact" label="Contact" error={errors.contactId}>
            <NativeSelect
              id="client-contact"
              value={form.contactId}
              onChange={(value) => setForm((current) => ({ ...current, contactId: value }))}
            >
              <option value="">Select booked contact</option>
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
      </SideSheet>

      <ClientViewSheet
        client={viewing}
        contact={viewingContact}
        onClose={() => setViewing(null)}
        onOpenContact={(contactId) => {
          setViewing(null);
          onOpenContact(contactId);
        }}
        onOpenPayments={(clientId) => {
          setViewing(null);
          onOpenPayments(clientId);
        }}
        onEdit={(client) => {
          setViewing(null);
          openEdit(client);
        }}
      />

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove booking"
        description="This booked record will be hidden from the list."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeClient(removeId).finally(() => setRemoveId(null));
        }}
      />
    </ModulePage>
  );
}
