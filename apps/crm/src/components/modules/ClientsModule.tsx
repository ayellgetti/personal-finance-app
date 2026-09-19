import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BookingsTab,
  EnquiriesTab,
  PaymentsTab,
} from "@/components/modules/ContactViewSheet";
import {
  ConfirmRemoveDialog,
  EditAction,
  Field,
  ModulePage,
  ModuleStatus,
  NativeSelect,
  RemoveAction,
  RowActions,
  SheetTabButton,
  SheetTabList,
  SideSheet,
  StatusBadge,
  ViewAction,
} from "@/components/modules/shared";
import { CLIENT_STATUS_LABELS, clientStatusOptions } from "@/lib/crm/display";
import { fetchContactDetail } from "@/lib/crm/remote";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CreateClientInput,
  type CrmClient,
  type CrmClientStatus,
  type CrmContact,
  type CrmContactDetail,
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
  const [viewing, setViewing] = useState<CrmClient | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
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
      crumb="Clients"
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
            Add client
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
            ))}
          </TableBody>
        </Table>
      </ModuleStatus>

      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit client" : "Add client"}
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
        title="Remove client"
        description="This commercial record will be hidden from the list."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeClient(removeId).finally(() => setRemoveId(null));
        }}
      />
    </ModulePage>
  );
}

type ClientViewTab = "booking" | "enquiries" | "payments";

function ClientViewSheet({
  client,
  contact,
  onClose,
  onOpenContact,
  onOpenPayments,
  onEdit,
}: {
  client: CrmClient | null;
  contact: CrmContact | null;
  onClose: () => void;
  onOpenContact: (contactId: string) => void;
  onOpenPayments: (clientId: string) => void;
  onEdit: (client: CrmClient) => void;
}) {
  const crm = useCrm();
  const [tab, setTab] = useState<ClientViewTab>("booking");
  const [detail, setDetail] = useState<CrmContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      setDetail(null);
      setError(null);
      setTab("booking");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTab("booking");
    void fetchContactDetail(client.contactId)
      .then((next) => {
        if (cancelled) return;
        setDetail(next);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setDetail(null);
        setError(caught instanceof Error ? caught.message : "Unable to load client");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client]);

  const bookings = detail?.bookings ?? [];
  const enquiries = (detail?.enquiries ?? []).filter(
    (enquiry) => !client?.convertedFromEnquiryId || enquiry.id === client.convertedFromEnquiryId,
  );
  const enquiryList = enquiries.length > 0 ? enquiries : (detail?.enquiries ?? []);
  const payments = (detail?.payments ?? []).filter(
    (payment) => payment.referenceType === "client" && payment.referenceId === client?.id,
  );

  return (
    <Sheet open={Boolean(client)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {client ? (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="truncate text-lg leading-snug">{client.billingName}</SheetTitle>
                  <SheetDescription className="text-sm">{contact?.name ?? "Client"}</SheetDescription>
                </div>
                <StatusBadge status={client.status} label={CLIENT_STATUS_LABELS[client.status]} />
              </div>
            </SheetHeader>
            <div className="flex-1 space-y-5 px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Contact</dt>
                  <dd className="mt-0.5 font-medium">{contact?.name ?? client.contactId}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Mobile</dt>
                  <dd className="mt-0.5 font-medium">{contact?.mobile ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">GSTIN</dt>
                  <dd className="mt-0.5 font-medium">{client.gstin ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 font-medium">{contact?.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Company</dt>
                  <dd className="mt-0.5 font-medium">{contact?.companyName ?? "—"}</dd>
                </div>
              </dl>

              <SheetTabList label="Client records">
                <SheetTabButton id="booking" selected={tab === "booking"} onSelect={setTab}>
                  Current booking{!loading ? ` (${bookings.length})` : ""}
                </SheetTabButton>
                <SheetTabButton id="enquiries" selected={tab === "enquiries"} onSelect={setTab}>
                  Enquiry{!loading ? ` (${enquiryList.length})` : ""}
                </SheetTabButton>
                <SheetTabButton id="payments" selected={tab === "payments"} onSelect={setTab}>
                  Payments{!loading ? ` (${payments.length})` : ""}
                </SheetTabButton>
              </SheetTabList>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : tab === "booking" ? (
                <BookingsTab bookings={bookings} enquiries={detail?.enquiries ?? []} />
              ) : tab === "enquiries" ? (
                <EnquiriesTab enquiries={enquiryList} />
              ) : (
                <PaymentsTab payments={payments} />
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onOpenContact(client.contactId)}>
                  Contact
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onOpenPayments(client.id)}>
                  Payments
                </Button>
                {crm.hasPermission(CRM_PERMISSIONS.clientsUpdate) ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onEdit(client)}>
                    Edit
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
