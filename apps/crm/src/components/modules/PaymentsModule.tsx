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
import {
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABELS,
  formatDateTime,
  formatMoney,
  isoToLocalInput,
  localInputToIso,
  paymentStatusOptions,
} from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CreatePaymentInput,
  type CrmPayment,
  type CrmPaymentStatus,
} from "@/types/crm";

type FormState = {
  clientId: string;
  amount: string;
  method: string;
  status: CrmPaymentStatus;
  paidAt: string;
  reference: string;
};

const EMPTY: FormState = {
  clientId: "",
  amount: "",
  method: "UPI",
  status: "pending",
  paidAt: "",
  reference: "",
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.clientId) errors.clientId = "Client is required";
  const amount = Number(form.amount);
  if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Amount must be greater than 0";
  }
  if (!form.method.trim()) errors.method = "Method is required";
  return errors;
}

function toInput(form: FormState): CreatePaymentInput {
  return {
    clientId: form.clientId,
    amount: Number(form.amount),
    method: form.method.trim(),
    status: form.status,
    paidAt: form.paidAt ? localInputToIso(form.paidAt) : null,
    reference: form.reference.trim() || null,
  };
}

export function PaymentsModule({
  clientId,
  onClearClientFilter,
}: {
  clientId?: string | null;
  onClearClientFilter?: () => void;
}) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.paymentsRead);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmPayment | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadPayments({
      clientId: clientId || undefined,
      status: statusFilter ? (statusFilter as CrmPaymentStatus) : undefined,
    });
    if (crm.hasPermission(CRM_PERMISSIONS.clientsRead)) void crm.loadClients({ limit: 100 });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, statusFilter, clientId]);

  const clientName = (id: string) => crm.clients.items.find((client) => client.id === id)?.billingName ?? id;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY, clientId: clientId || crm.clients.items[0]?.id || "" });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (payment: CrmPayment) => {
    setEditing(payment);
    setForm({
      clientId: payment.clientId,
      amount: String(payment.amount),
      method: payment.method,
      status: payment.status,
      paidAt: isoToLocalInput(payment.paidAt),
      reference: payment.reference ?? "",
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
      if (editing) await crm.updatePayment(editing.id, toInput(form));
      else await crm.createPayment(toInput(form));
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
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
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
              Clear client filter
            </Button>
          ) : null}
        </div>
        {crm.hasPermission(CRM_PERMISSIONS.paymentsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add payment
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.payments.status}
        errorMessage={crm.payments.errorMessage}
        empty={crm.payments.items.length === 0}
        emptyLabel="No payments yet"
        onRetry={reload}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Paid at</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crm.payments.items.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{clientName(payment.clientId)}</TableCell>
                <TableCell>{formatMoney(payment.amount, payment.currency)}</TableCell>
                <TableCell>{payment.method}</TableCell>
                <TableCell>{PAYMENT_STATUS_LABELS[payment.status]}</TableCell>
                <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                <TableCell>{payment.reference ?? "—"}</TableCell>
                <TableCell>
                  <RowActions>
                    {crm.hasPermission(CRM_PERMISSIONS.paymentsUpdate) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => openEdit(payment)}
                      >
                        Edit
                      </Button>
                    ) : null}
                    {crm.hasPermission(CRM_PERMISSIONS.paymentsDelete) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        onClick={() => setRemoveId(payment.id)}
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
              <DialogTitle>{editing ? "Edit payment" : "Add payment"}</DialogTitle>
            </DialogHeader>
            <Field id="payment-client" label="Client" error={errors.clientId}>
              <NativeSelect
                id="payment-client"
                value={form.clientId}
                onChange={(value) => setForm((current) => ({ ...current, clientId: value }))}
              >
                <option value="">Select client</option>
                {crm.clients.items.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.billingName}
                  </option>
                ))}
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
            <Field id="payment-method" label="Method" error={errors.method}>
              <NativeSelect
                id="payment-method"
                value={form.method}
                onChange={(value) => setForm((current) => ({ ...current, method: value }))}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
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
        title="Remove payment"
        description="This collection record will be hidden from the list."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removePayment(removeId).finally(() => setRemoveId(null));
        }}
      />
    </div>
  );
}
