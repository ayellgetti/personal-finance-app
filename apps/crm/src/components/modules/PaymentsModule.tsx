import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MonthCalendar, MonthNav } from "@/components/modules/MonthCalendar";
import { dayKey, monthRangeIso, type MonthChip } from "@/components/modules/month-calendar";
import {
  ConfirmRemoveDialog,
  EditAction,
  Field,
  MODULE_VIEWS,
  ModulePage,
  ModuleStatus,
  NativeSelect,
  RemoveAction,
  RowActions,
  SideSheet,
  StatusBadge,
} from "@/components/modules/shared";
import {
  PAYMENT_MODE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  formatDateTime,
  formatMoney,
  formatTime,
  isoToLocalInput,
  localInputToIso,
  paymentModeOptions,
  paymentStatusOptions,
  paymentTypeOptions,
} from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CreatePaymentInput,
  type CrmPayment,
  type CrmPaymentMode,
  type CrmPaymentReferenceType,
  type CrmPaymentStatus,
  type CrmPaymentType,
} from "@/types/crm";

type ViewMode = "table" | "card" | "calendar";

const VIEW_OPTIONS = [MODULE_VIEWS.table, MODULE_VIEWS.card, MODULE_VIEWS.calendar];
const CALENDAR_PAGE_LIMIT = 500;

type FormState = {
  referenceType: CrmPaymentReferenceType;
  clientId: string;
  vendorContactId: string;
  amount: string;
  type: CrmPaymentType;
  mode: CrmPaymentMode;
  status: CrmPaymentStatus;
  paidAt: string;
  reference: string;
};

const EMPTY: FormState = {
  referenceType: "client",
  clientId: "",
  vendorContactId: "",
  amount: "",
  type: "INCOME",
  mode: "UPI",
  status: "pending",
  paidAt: "",
  reference: "",
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.referenceType === "vendor") {
    if (!form.vendorContactId) errors.vendorContactId = "Vendor is required";
  } else if (!form.clientId) {
    errors.clientId = "Booked record is required";
  }
  const amount = Number(form.amount);
  if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Amount must be greater than 0";
  }
  return errors;
}

function toInput(form: FormState, enquiryId: string | null): CreatePaymentInput {
  const vendor = form.referenceType === "vendor";
  return {
    referenceType: form.referenceType,
    referenceId: vendor ? form.vendorContactId : form.clientId,
    enquiryId: vendor ? null : enquiryId,
    amount: Number(form.amount),
    type: form.type,
    mode: form.mode,
    status: form.status,
    paidAt: form.paidAt ? localInputToIso(form.paidAt) : null,
    reference: form.reference.trim() || null,
  };
}

export function PaymentsModule({
  clientId,
  onClearClientFilter,
  createOnDate,
  onCreateOpened,
}: {
  clientId?: string | null;
  onClearClientFilter?: () => void;
  createOnDate?: string | null;
  onCreateOpened?: () => void;
}) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.paymentsRead);
  const [view, setView] = useState<ViewMode>("table");
  const [cursor, setCursor] = useState(() => new Date());
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmPayment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const calendarRange = view === "calendar" ? monthRangeIso(cursor) : null;

  const reload = () => {
    void crm.loadPayments({
      referenceType: clientId ? "client" : undefined,
      referenceId: clientId || undefined,
      status: statusFilter ? (statusFilter as CrmPaymentStatus) : undefined,
      from: calendarRange?.from,
      to: calendarRange?.to,
      limit: calendarRange ? CALENDAR_PAGE_LIMIT : undefined,
    });
    if (crm.hasPermission(CRM_PERMISSIONS.clientsRead)) void crm.loadClients({ limit: 100 });
    if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) {
      void crm.loadContacts({ type: "vendor", limit: 100 });
    }
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, statusFilter, clientId, view, cursor]);

  const clientName = (id: string) =>
    crm.clients.items.find((client) => client.id === id)?.billingName ?? id;
  const vendorName = (id: string) =>
    crm.contacts.items.find((contact) => contact.id === id)?.name ?? id;
  const payeeName = (payment: CrmPayment) =>
    payment.referenceType === "vendor" ? vendorName(payment.referenceId) : clientName(payment.referenceId);

  const calendarByDay = useMemo(() => {
    const nameFor = (payment: CrmPayment) =>
      payment.referenceType === "vendor"
        ? (crm.contacts.items.find((contact) => contact.id === payment.referenceId)?.name ?? payment.referenceId)
        : (crm.clients.items.find((client) => client.id === payment.referenceId)?.billingName ?? payment.referenceId);
    const grouped = new Map<string, MonthChip[]>();
    const dated = crm.payments.items
      .filter((payment): payment is CrmPayment & { paidAt: string } => Boolean(payment.paidAt))
      .sort((left, right) => new Date(left.paidAt).getTime() - new Date(right.paidAt).getTime());
    for (const payment of dated) {
      const key = dayKey(new Date(payment.paidAt));
      const chips = grouped.get(key) ?? [];
      chips.push({
        id: payment.id,
        label: `${formatTime(payment.paidAt)} ${formatMoney(payment.amount, payment.currency)} ${nameFor(payment)}`,
        className:
          payment.type === "EXPENSE" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900",
      });
      grouped.set(key, chips);
    }
    return grouped;
  }, [crm.clients.items, crm.contacts.items, crm.payments.items]);

  const calendarMonthCount = useMemo(() => {
    let count = 0;
    for (const [key, chips] of calendarByDay) {
      const [year, month] = key.split("-");
      if (Number(year) === cursor.getFullYear() && Number(month) === cursor.getMonth() + 1) {
        count += chips.length;
      }
    }
    return count;
  }, [calendarByDay, cursor]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY,
      referenceType: "client",
      clientId: clientId || crm.clients.items[0]?.id || "",
      vendorContactId: crm.contacts.items.find((contact) => contact.type === "vendor")?.id || "",
    });
    setErrors({});
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!createOnDate) return;
    openCreate();
    onCreateOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOnDate]);

  const openEdit = (payment: CrmPayment) => {
    setEditing(payment);
    setForm({
      referenceType: payment.referenceType,
      clientId: payment.referenceType === "client" ? payment.referenceId : "",
      vendorContactId: payment.referenceType === "vendor" ? payment.referenceId : "",
      amount: String(payment.amount),
      type: payment.type,
      mode: payment.mode,
      status: payment.status,
      paidAt: isoToLocalInput(payment.paidAt),
      reference: payment.reference ?? "",
    });
    setErrors({});
    setSheetOpen(true);
  };

  const paymentActions = (payment: CrmPayment) => (
    <RowActions>
      {crm.hasPermission(CRM_PERMISSIONS.paymentsUpdate) ? (
        <EditAction onClick={() => openEdit(payment)} />
      ) : null}
      {crm.hasPermission(CRM_PERMISSIONS.paymentsDelete) ? (
        <RemoveAction onClick={() => setRemoveId(payment.id)} />
      ) : null}
    </RowActions>
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      const selectedClient = crm.clients.items.find((client) => client.id === form.clientId);
      const input = toInput(
        form,
        selectedClient?.convertedFromEnquiryId ?? editing?.enquiryId ?? null,
      );
      if (editing) await crm.updatePayment(editing.id, input);
      else await crm.createPayment(input);
      setSheetOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModulePage
      crumb="Payments"
      view={view}
      onViewChange={(next) => setView(next as ViewMode)}
      viewOptions={VIEW_OPTIONS}
      toolbar={
        <>
        {view === "calendar" ? <MonthNav cursor={cursor} onChange={setCursor} /> : null}
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <Field id="payment-status-filter" label="Status">
            <NativeSelect
              id="payment-status-filter"
              aria-label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <option value="">All statuses</option>
              {paymentStatusOptions()}
            </NativeSelect>
          </Field>
          {clientId ? (
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClearClientFilter}>
              Clear booked filter
            </Button>
          ) : null}
        </div>
        </>
      }
      actions={
        crm.hasPermission(CRM_PERMISSIONS.paymentsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add payment
          </Button>
        ) : null
      }
    >
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.payments.status}
        errorMessage={crm.payments.errorMessage}
        empty={view === "calendar" ? false : crm.payments.items.length === 0}
        emptyLabel="No payments yet"
        onRetry={reload}
      >
        {view === "calendar" ? (
          <>
            <MonthCalendar
              cursor={cursor}
              byDay={calendarByDay}
              onOpen={
                crm.hasPermission(CRM_PERMISSIONS.paymentsUpdate)
                  ? (id) => {
                      const payment = crm.payments.items.find((item) => item.id === id);
                      if (payment) openEdit(payment);
                    }
                  : undefined
              }
            />
            {calendarMonthCount === 0 ? (
              <p className="text-sm text-muted-foreground">No payments this month</p>
            ) : null}
          </>
        ) : null}
        {view === "card" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {crm.payments.items.map((payment) => (
              <Card key={payment.id} className="rounded-2xl shadow-[var(--shadow-card)]">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug">
                      {formatMoney(payment.amount, payment.currency)}
                    </CardTitle>
                    <CardDescription className="truncate">{payeeName(payment)}</CardDescription>
                  </div>
                  <StatusBadge status={payment.status} label={PAYMENT_STATUS_LABELS[payment.status]} />
                </CardHeader>
                <CardContent className="space-y-3">
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Type</dt>
                      <dd>
                        <StatusBadge status={payment.type} label={PAYMENT_TYPE_LABELS[payment.type]} />
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Mode</dt>
                      <dd className="text-right">{PAYMENT_MODE_LABELS[payment.mode]}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Paid at</dt>
                      <dd className="text-right">{formatDateTime(payment.paidAt)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Reference</dt>
                      <dd className="truncate text-right">{payment.reference ?? "—"}</dd>
                    </div>
                  </dl>
                  {paymentActions(payment)}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
        {view === "table" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid at</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crm.payments.items.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payeeName(payment)}</TableCell>
                  <TableCell>{formatMoney(payment.amount, payment.currency)}</TableCell>
                  <TableCell>
                    <StatusBadge status={payment.type} label={PAYMENT_TYPE_LABELS[payment.type]} />
                  </TableCell>
                  <TableCell>{PAYMENT_MODE_LABELS[payment.mode]}</TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} label={PAYMENT_STATUS_LABELS[payment.status]} />
                  </TableCell>
                  <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                  <TableCell>{payment.reference ?? "—"}</TableCell>
                  <TableCell>{paymentActions(payment)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </ModuleStatus>

      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit payment" : "Add payment"}
        onSubmit={onSubmit}
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            {editing ? "Save" : "Create"}
          </Button>
        }
      >
        <Field id="payment-payee-type" label="Type">
          <NativeSelect
            id="payment-payee-type"
            value={form.referenceType}
            onChange={(value) =>
              setForm((current) => ({ ...current, referenceType: value as CrmPaymentReferenceType }))
            }
          >
            <option value="client">Booked</option>
            <option value="vendor">Vendor</option>
          </NativeSelect>
        </Field>
        {form.referenceType === "vendor" ? (
          <Field id="payment-vendor" label="Vendor" error={errors.vendorContactId}>
            <NativeSelect
              id="payment-vendor"
              value={form.vendorContactId}
              onChange={(value) => setForm((current) => ({ ...current, vendorContactId: value }))}
            >
              <option value="">Select vendor</option>
              {crm.contacts.items
                .filter((contact) => contact.type === "vendor")
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
            </NativeSelect>
          </Field>
        ) : (
          <Field id="payment-client" label="Booked" error={errors.clientId}>
            <NativeSelect
              id="payment-client"
              value={form.clientId}
              onChange={(value) => setForm((current) => ({ ...current, clientId: value }))}
            >
              <option value="">Select booked record</option>
              {crm.clients.items.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.billingName}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
        <Field id="payment-type" label="Payment type">
          <NativeSelect
            id="payment-type"
            value={form.type}
            onChange={(value) => setForm((current) => ({ ...current, type: value as CrmPaymentType }))}
          >
            {paymentTypeOptions()}
          </NativeSelect>
        </Field>
        <Field id="payment-amount" label="Amount" error={errors.amount}>
          <Input
            id="payment-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            className="rounded-xl"
          />
        </Field>
        <Field id="payment-mode" label="Mode">
          <NativeSelect
            id="payment-mode"
            value={form.mode}
            onChange={(value) => setForm((current) => ({ ...current, mode: value as CrmPaymentMode }))}
          >
            {paymentModeOptions()}
          </NativeSelect>
        </Field>
        <Field id="payment-status" label="Status">
          <NativeSelect
            id="payment-status"
            value={form.status}
            onChange={(value) => setForm((current) => ({ ...current, status: value as CrmPaymentStatus }))}
          >
            {paymentStatusOptions()}
          </NativeSelect>
        </Field>
        <Field id="payment-paid-at" label="Paid at">
          <Input
            id="payment-paid-at"
            type="datetime-local"
            value={form.paidAt}
            onChange={(event) => setForm((current) => ({ ...current, paidAt: event.target.value }))}
            className="rounded-xl"
          />
        </Field>
        <Field id="payment-reference" label="Reference">
          <Input
            id="payment-reference"
            value={form.reference}
            onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
            className="rounded-xl"
          />
        </Field>
      </SideSheet>

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove payment"
        description="This collection record will be hidden from the list."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removePayment(removeId).finally(() => setRemoveId(null));
        }}
      />
    </ModulePage>
  );
}
