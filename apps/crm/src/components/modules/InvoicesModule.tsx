import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { formatMoney } from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import {
  createInvoice,
  fetchInvoice,
  listInvoices,
  removeInvoice,
  updateInvoice,
  type ListInvoicesQuery,
} from "@/lib/crm/remote";
import {
  CRM_INVOICE_STATUSES,
  CRM_PERMISSIONS,
  type CreateInvoiceInput,
  type CrmInvoice,
  type CrmInvoiceStatus,
} from "@/types/crm";

type LineForm = { description: string; quantity: string; unitPrice: string };

type FormState = {
  contactId: string;
  status: CrmInvoiceStatus;
  issuedAt: string;
  dueAt: string;
  taxPercent: string;
  notes: string;
  lines: LineForm[];
};

const EMPTY_LINE: LineForm = { description: "", quantity: "1", unitPrice: "" };

function todayKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function dateKey(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dateInputToIso(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12, 0, 0, 0).toISOString();
}

function formatWhen(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function emptyForm(): FormState {
  return {
    contactId: "",
    status: "draft",
    issuedAt: todayKey(),
    dueAt: "",
    taxPercent: "0",
    notes: "",
    lines: [{ ...EMPTY_LINE }],
  };
}

function printStoredInvoice() {
  document.body.classList.add("printing-invoice");
  const cleanup = () => {
    document.body.classList.remove("printing-invoice");
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
  window.setTimeout(cleanup, 1500);
}

function InvoiceDocument({ invoice }: { invoice: CrmInvoice }) {
  const lines = invoice.lines ?? [];
  return (
    <article className="crm-invoice-print space-y-4 rounded-xl border bg-white p-4 text-black">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500">Invoice</p>
          <h2 className="font-display text-xl font-bold">{invoice.number}</h2>
        </div>
        <p className="text-sm capitalize">{invoice.status}</p>
      </header>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <p>
          <span className="block text-xs uppercase text-stone-500">Bill to</span>
          {invoice.billToName}
          <span className="block">{invoice.billToMobile}</span>
        </p>
        <p>
          <span className="block text-xs uppercase text-stone-500">Issued</span>
          {formatWhen(invoice.issuedAt)}
          <span className="mt-2 block text-xs uppercase text-stone-500">Due</span>
          {formatWhen(invoice.dueAt)}
        </p>
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b">
              <td className="py-2">{line.description}</td>
              <td className="py-2 text-right">{line.quantity}</td>
              <td className="py-2 text-right">{formatMoney(line.unitPrice, invoice.currency)}</td>
              <td className="py-2 text-right">{formatMoney(line.amount, invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto w-56 space-y-1 text-sm">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(invoice.subtotal, invoice.currency)}</span>
        </p>
        <p className="flex justify-between">
          <span>Tax ({invoice.taxPercent}%)</span>
          <span>{formatMoney(invoice.taxAmount, invoice.currency)}</span>
        </p>
        <p className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatMoney(invoice.total, invoice.currency)}</span>
        </p>
      </div>
      {invoice.notes ? <p className="text-sm text-stone-700">{invoice.notes}</p> : null}
    </article>
  );
}

export function InvoicesModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.invoicesRead);
  const canCreate = crm.hasPermission(CRM_PERMISSIONS.invoicesCreate);
  const canEdit = crm.hasPermission(CRM_PERMISSIONS.invoicesUpdate);
  const canDelete = crm.hasPermission(CRM_PERMISSIONS.invoicesDelete);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [items, setItems] = useState<CrmInvoice[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<CrmInvoice | null>(null);
  const [viewing, setViewing] = useState<CrmInvoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = () => {
    if (!allowed) return;
    setStatus("loading");
    setErrorMessage(null);
    const query: ListInvoicesQuery = {
      search: appliedSearch || undefined,
      status: statusFilter ? (statusFilter as CrmInvoiceStatus) : undefined,
    };
    void listInvoices(query)
      .then((result) => {
        setItems(result.items);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load invoices");
      });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters change
  }, [sessionReady, allowed, appliedSearch, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setSheetOpen(true);
    if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) void crm.loadContacts({ limit: 200 });
  };

  const fillForm = (invoice: CrmInvoice) => {
    setForm({
      contactId: invoice.contactId,
      status: invoice.status,
      issuedAt: dateKey(invoice.issuedAt),
      dueAt: dateKey(invoice.dueAt),
      taxPercent: String(invoice.taxPercent),
      notes: invoice.notes ?? "",
      lines: (invoice.lines ?? [{ description: "", quantity: 1, unitPrice: 0 }]).map((line) => ({
        description: line.description,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
      })),
    });
  };

  const openEdit = async (invoice: CrmInvoice) => {
    setFormError(null);
    try {
      const detail = invoice.lines ? invoice : await fetchInvoice(invoice.id);
      setEditing(detail);
      fillForm(detail);
      setSheetOpen(true);
      if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) void crm.loadContacts({ limit: 200 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open invoice");
    }
  };

  const openView = async (invoice: CrmInvoice) => {
    try {
      setViewing(invoice.lines ? invoice : await fetchInvoice(invoice.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open invoice");
    }
  };

  const toInput = (): CreateInvoiceInput | null => {
    if (!form.contactId) {
      setFormError("Choose a contact");
      return null;
    }
    const taxPercent = Number(form.taxPercent);
    if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      setFormError("Tax percent must be between 0 and 100");
      return null;
    }
    const lines = form.lines.map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
    if (lines.length === 0 || lines.some((line) => !line.description || !(line.quantity > 0) || !(line.unitPrice >= 0))) {
      setFormError("Each line needs a description, quantity, and rate");
      return null;
    }
    setFormError(null);
    return {
      contactId: form.contactId,
      status: form.status,
      issuedAt: dateInputToIso(form.issuedAt || todayKey()),
      dueAt: form.dueAt ? dateInputToIso(form.dueAt) : null,
      taxPercent,
      notes: form.notes.trim() || null,
      lines,
    };
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const input = toInput();
    if (!input || busy) return;
    setBusy(true);
    try {
      if (editing) await updateInvoice(editing.id, input);
      else await createInvoice(input);
      toast.success(editing ? "Invoice updated" : "Invoice stored");
      setSheetOpen(false);
      reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save invoice");
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
      <Field id="invoice-search" label="Search">
        <Input
          id="invoice-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Number, name, or mobile"
          className="rounded-xl"
        />
      </Field>
      <Field id="invoice-status-filter" label="Status">
        <NativeSelect id="invoice-status-filter" aria-label="Status" value={statusFilter} onChange={setStatusFilter}>
          <option value="">All statuses</option>
          {CRM_INVOICE_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Button type="submit" variant="outline" className="rounded-xl">
        Search
      </Button>
    </form>
  );

  return (
    <ModulePage
      crumb="Invoices"
      toolbar={toolbar}
      actions={
        canCreate ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            New invoice
          </Button>
        ) : null
      }
    >
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={status === "idle" ? "loading" : status}
        errorMessage={errorMessage}
        empty={items.length === 0}
        emptyLabel="No invoices yet"
        onRetry={reload}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Bill to</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.number}</TableCell>
                <TableCell>
                  <span className="block">{invoice.billToName}</span>
                  <span className="text-xs text-muted-foreground">{invoice.billToMobile}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} label={invoice.status} />
                </TableCell>
                <TableCell>{formatWhen(invoice.issuedAt)}</TableCell>
                <TableCell className="text-right">{formatMoney(invoice.total, invoice.currency)}</TableCell>
                <TableCell>
                  <RowActions>
                    <ViewAction onClick={() => void openView(invoice)} />
                    {canEdit ? <EditAction onClick={() => void openEdit(invoice)} /> : null}
                    {canDelete ? <RemoveAction onClick={() => setRemoveId(invoice.id)} /> : null}
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
        title={editing ? `Edit ${editing.number}` : "New invoice"}
        description="Stored invoices keep the bill-to name, lines, and totals for a later print."
        onSubmit={onSubmit}
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            {editing ? "Save" : "Store invoice"}
          </Button>
        }
      >
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <Field id="invoice-contact" label="Contact">
          <NativeSelect
            id="invoice-contact"
            value={form.contactId}
            onChange={(value) => setForm((current) => ({ ...current, contactId: value }))}
          >
            <option value="">Select contact</option>
            {crm.contacts.items.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name} · {contact.mobile}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="invoice-status" label="Status">
            <NativeSelect
              id="invoice-status"
              value={form.status}
              onChange={(value) => setForm((current) => ({ ...current, status: value as CrmInvoiceStatus }))}
            >
              {CRM_INVOICE_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="invoice-tax" label="Tax %">
            <Input
              id="invoice-tax"
              inputMode="decimal"
              value={form.taxPercent}
              onChange={(event) => setForm((current) => ({ ...current, taxPercent: event.target.value }))}
              className="rounded-xl"
            />
          </Field>
          <Field id="invoice-issued" label="Issued">
            <Input
              id="invoice-issued"
              type="date"
              value={form.issuedAt}
              onChange={(event) => setForm((current) => ({ ...current, issuedAt: event.target.value }))}
              className="rounded-xl"
            />
          </Field>
          <Field id="invoice-due" label="Due">
            <Input
              id="invoice-due"
              type="date"
              value={form.dueAt}
              onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
              className="rounded-xl"
            />
          </Field>
        </div>
        <div className="space-y-3">
          {form.lines.map((line, index) => (
            <div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_5rem_7rem_auto]">
              <Input
                aria-label={`Line ${index + 1} description`}
                value={line.description}
                placeholder="Description"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lines: current.lines.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, description: event.target.value } : item,
                    ),
                  }))
                }
                className="rounded-xl"
              />
              <Input
                aria-label={`Line ${index + 1} quantity`}
                inputMode="decimal"
                value={line.quantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lines: current.lines.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, quantity: event.target.value } : item,
                    ),
                  }))
                }
                className="rounded-xl"
              />
              <Input
                aria-label={`Line ${index + 1} rate`}
                inputMode="decimal"
                value={line.unitPrice}
                placeholder="Rate"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lines: current.lines.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, unitPrice: event.target.value } : item,
                    ),
                  }))
                }
                className="rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                disabled={form.lines.length === 1}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    lines: current.lines.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setForm((current) => ({ ...current, lines: [...current.lines, { ...EMPTY_LINE }] }))}
          >
            Add line
          </Button>
        </div>
        <Field id="invoice-notes" label="Notes">
          <Textarea
            id="invoice-notes"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            className="rounded-xl"
          />
        </Field>
      </SideSheet>

      <SideSheet
        open={Boolean(viewing)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
        title={viewing?.number ?? "Invoice"}
        description="This copy is stored and can be printed again."
        footer={
          <Button type="button" className="rounded-xl print:hidden" onClick={printStoredInvoice}>
            Print
          </Button>
        }
      >
        {viewing ? <InvoiceDocument invoice={viewing} /> : null}
      </SideSheet>

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove invoice"
        description="The stored invoice will be hidden. Its number is not reused."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void removeInvoice(removeId)
            .then(() => {
              toast.success("Invoice removed");
              reload();
            })
            .catch((error: unknown) => {
              toast.error(error instanceof Error ? error.message : "Unable to remove invoice");
            })
            .finally(() => setRemoveId(null));
        }}
      />
    </ModulePage>
  );
}
