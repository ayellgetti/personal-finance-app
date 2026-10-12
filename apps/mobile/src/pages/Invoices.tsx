import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { FieldError, NativeSelect } from "@/components/forms/NativeSelect";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { LoadMore } from "@/components/LoadMore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { bottomSheetFillClass } from "@/components/ui/sheet-frame";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, humanize } from "@/lib/mobile/format";
import {
  createInvoice,
  fetchInvoice,
  listContacts,
  listInvoices,
  removeInvoice,
  updateInvoice,
} from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import {
  CRM_INVOICE_STATUSES,
  CRM_PERMISSIONS,
  type CreateInvoiceInput,
  type CrmInvoice,
  type CrmInvoiceStatus,
} from "@/types/crm";

type LineForm = { description: string; quantity: string; unitPrice: string };

type InvoiceForm = {
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

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function emptyForm(): InvoiceForm {
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
  return (
    <article className="crm-invoice-print space-y-3 rounded-2xl border bg-white p-4 text-black">
      <header>
        <p className="text-[11px] uppercase tracking-wider text-stone-500">Invoice</p>
        <h2 className="font-display text-lg font-bold">{invoice.number}</h2>
        <p className="text-sm capitalize">{humanize(invoice.status)}</p>
      </header>
      <p className="text-sm">
        <span className="block text-[11px] uppercase text-stone-500">Bill to</span>
        {invoice.billToName}
        <span className="block">{invoice.billToMobile}</span>
      </p>
      <p className="text-sm">
        Issued {formatDate(invoice.issuedAt)}
        {invoice.dueAt ? ` · Due ${formatDate(invoice.dueAt)}` : ""}
      </p>
      <ul className="space-y-2 text-sm">
        {(invoice.lines ?? []).map((line) => (
          <li key={line.id} className="flex justify-between gap-3 border-b pb-2">
            <span>
              {line.description}
              <span className="block text-xs text-stone-500">
                {line.quantity} × {money(line.unitPrice, invoice.currency)}
              </span>
            </span>
            <span>{money(line.amount, invoice.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-1 text-sm">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(invoice.subtotal, invoice.currency)}</span>
        </p>
        <p className="flex justify-between">
          <span>Tax ({invoice.taxPercent}%)</span>
          <span>{money(invoice.taxAmount, invoice.currency)}</span>
        </p>
        <p className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{money(invoice.total, invoice.currency)}</span>
        </p>
      </div>
      {invoice.notes ? <p className="text-sm">{invoice.notes}</p> : null}
    </article>
  );
}

function InvoiceFormSheet({
  open,
  onOpenChange,
  invoice,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  invoice: CrmInvoice | null;
  onSaved: () => void;
}) {
  const { permissions } = useMobile();
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const contacts = useResource(() => listContacts({ limit: 200 }), open && canReadContacts);
  const [form, setForm] = useState<InvoiceForm>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (!invoice) {
      setForm(emptyForm());
      return;
    }
    setForm({
      contactId: invoice.contactId,
      status: invoice.status,
      issuedAt: dateKey(invoice.issuedAt) || todayKey(),
      dueAt: dateKey(invoice.dueAt),
      taxPercent: String(invoice.taxPercent),
      notes: invoice.notes ?? "",
      lines: (invoice.lines?.length ? invoice.lines : [{ description: "", quantity: 1, unitPrice: 0 }]).map((line) => ({
        description: line.description,
        quantity: String(line.quantity),
        unitPrice: String(line.unitPrice),
      })),
    });
  }, [open, invoice]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const taxPercent = Number(form.taxPercent);
    const lines = form.lines.map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    }));
    if (!form.contactId) {
      setError("Choose a contact");
      return;
    }
    if (!Number.isFinite(taxPercent) || taxPercent < 0 || taxPercent > 100) {
      setError("Tax percent must be between 0 and 100");
      return;
    }
    if (lines.some((line) => !line.description || !(line.quantity > 0) || !(line.unitPrice >= 0))) {
      setError("Each line needs a description, quantity, and rate");
      return;
    }
    const input: CreateInvoiceInput = {
      contactId: form.contactId,
      status: form.status,
      issuedAt: dateInputToIso(form.issuedAt || todayKey()),
      dueAt: form.dueAt ? dateInputToIso(form.dueAt) : null,
      taxPercent,
      notes: form.notes.trim() || null,
      lines,
    };
    setBusy(true);
    try {
      if (invoice) await updateInvoice(invoice.id, input);
      else await createInvoice(input);
      toast.success(invoice ? "Invoice updated" : "Invoice stored");
      onOpenChange(false);
      onSaved();
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Unable to save invoice");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={invoice ? `Edit ${invoice.number}` : "New invoice"}
      description="The bill-to name, lines, and totals are stored so you can print this again."
      submitLabel={invoice ? "Save invoice" : "Store invoice"}
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="invoice-contact">Contact</Label>
        <NativeSelect
          id="invoice-contact"
          value={form.contactId}
          onChange={(next) => setForm((current) => ({ ...current, contactId: next }))}
        >
          <option value="">{contacts.status === "loading" ? "Loading contacts…" : "Select contact"}</option>
          {(contacts.data?.items ?? []).map((contact) => (
            <option key={contact.id} value={contact.id}>
              {contact.name} · {contact.mobile}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="invoice-status">Status</Label>
          <NativeSelect
            id="invoice-status"
            value={form.status}
            onChange={(next) => setForm((current) => ({ ...current, status: next as CrmInvoiceStatus }))}
          >
            {CRM_INVOICE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanize(status)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice-tax">Tax %</Label>
          <Input
            id="invoice-tax"
            inputMode="decimal"
            value={form.taxPercent}
            onChange={(event) => setForm((current) => ({ ...current, taxPercent: event.target.value }))}
            className="h-11 rounded-xl text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice-issued">Issued</Label>
          <Input
            id="invoice-issued"
            type="date"
            value={form.issuedAt}
            onChange={(event) => setForm((current) => ({ ...current, issuedAt: event.target.value }))}
            className="h-11 rounded-xl text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoice-due">Due</Label>
          <Input
            id="invoice-due"
            type="date"
            value={form.dueAt}
            onChange={(event) => setForm((current) => ({ ...current, dueAt: event.target.value }))}
            className="h-11 rounded-xl text-base"
          />
        </div>
      </div>
      {form.lines.map((line, index) => (
        <div key={index} className="space-y-2 rounded-2xl border p-3">
          <Label htmlFor={`invoice-line-${index}`}>Line {index + 1}</Label>
          <Input
            id={`invoice-line-${index}`}
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
            className="h-11 rounded-xl text-base"
          />
          <div className="grid grid-cols-2 gap-2">
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
              className="h-11 rounded-xl text-base"
            />
            <Input
              aria-label={`Line ${index + 1} rate`}
              inputMode="decimal"
              placeholder="Rate"
              value={line.unitPrice}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  lines: current.lines.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, unitPrice: event.target.value } : item,
                  ),
                }))
              }
              className="h-11 rounded-xl text-base"
            />
          </div>
          {form.lines.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  lines: current.lines.filter((_, itemIndex) => itemIndex !== index),
                }))
              }
            >
              Remove line
            </Button>
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl"
        onClick={() => setForm((current) => ({ ...current, lines: [...current.lines, { ...EMPTY_LINE }] }))}
      >
        Add line
      </Button>
      <div className="space-y-2">
        <Label htmlFor="invoice-notes">Notes</Label>
        <Textarea
          id="invoice-notes"
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          className="rounded-xl text-base"
          rows={3}
        />
      </div>
      <FieldError message={error ?? undefined} />
    </FormSheet>
  );
}

export default function Invoices() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.invoicesRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.invoicesCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.invoicesUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.invoicesDelete);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);
  const [editing, setEditing] = useState<CrmInvoice | null>(null);
  const [viewing, setViewing] = useState<CrmInvoice | null>(null);
  const [opening, setOpening] = useState(false);

  const load = useCallback((page: number) => listInvoices({ page, limit: 20 }), []);
  const list = usePagedList(load, "invoices", canRead);

  const openInvoice = async (invoice: CrmInvoice, mode: "view" | "edit") => {
    setOpening(true);
    try {
      const detail = invoice.lines ? invoice : await fetchInvoice(invoice.id);
      if (mode === "edit") setEditing(detail);
      else setViewing(detail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open invoice");
    } finally {
      setOpening(false);
    }
  };

  if (!canRead) return <ForbiddenState label="invoices" />;

  return (
    <div className="space-y-3">
      {canCreate ? (
        <Button type="button" className="h-11 w-full rounded-xl" onClick={() => setCreateOpen(true)}>
          New invoice
        </Button>
      ) : null}
      {list.status === "loading" || opening ? <LoadingState label="Loading invoices…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "forbidden" ? <ForbiddenState label="invoices" /> : null}
      {list.status === "ready" && list.items.length === 0 ? <EmptyState label="No invoices yet." /> : null}
      {list.status === "ready" && list.items.length > 0 ? (
        <div className="space-y-2">
          {list.items.map((invoice) => (
            <button
              key={invoice.id}
              type="button"
              onClick={() => void openInvoice(invoice, "view")}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-[var(--shadow-card)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{invoice.number}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {invoice.billToName} · {money(invoice.total, invoice.currency)}
                </span>
              </span>
              <Badge variant="secondary" className="shrink-0 rounded-lg text-[10px]">
                {humanize(invoice.status)}
              </Badge>
            </button>
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <InvoiceFormSheet
        open={createOpen || Boolean(editing)}
        onOpenChange={(next) => {
          if (next) return;
          setCreateOpen(false);
          setEditing(null);
        }}
        invoice={editing}
        onSaved={list.reload}
      />

      <Sheet open={Boolean(viewing)} onOpenChange={(next) => { if (!next) setViewing(null); }}>
        <SheetContent side="bottom" className={bottomSheetFillClass}>
          <div className="mx-auto flex min-h-0 w-full max-w-tablet flex-1 flex-col">
            <SheetHeader className="shrink-0 space-y-1 border-b px-4 pb-3 pr-16 pt-4 text-left">
              <SheetTitle className="font-display text-lg">{viewing?.number ?? "Invoice"}</SheetTitle>
              <SheetDescription>Stored copy. Print it now or open it again later.</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {viewing ? <InvoiceDocument invoice={viewing} /> : null}
            </div>
            <div className="flex gap-2 border-t px-4 py-3">
              {canUpdate && viewing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => {
                    const current = viewing;
                    setViewing(null);
                    setEditing(current);
                  }}
                >
                  Edit
                </Button>
              ) : null}
              <Button type="button" className="h-11 flex-1 rounded-xl" onClick={printStoredInvoice}>
                Print
              </Button>
              {canDelete && viewing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => {
                    const id = viewing.id;
                    void removeInvoice(id)
                      .then(() => {
                        toast.success("Invoice removed");
                        setViewing(null);
                        list.reload();
                      })
                      .catch((error: unknown) => {
                        toast.error(error instanceof Error ? error.message : "Unable to remove invoice");
                      });
                  }}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
