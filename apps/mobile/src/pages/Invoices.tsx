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
import { useAuth } from "@/lib/auth/store";
import { humanize } from "@/lib/mobile/format";
import {
  createInvoice,
  fetchInvoice,
  listClients,
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
  type CrmContact,
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

function formatLongDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatIssuerPhone(countryCode: string | undefined, mobileNo: string): string {
  const mobile = mobileNo.trim();
  if (!mobile) return "";
  if (mobile.startsWith("+")) return mobile;
  const code = countryCode?.trim();
  if (!code) return mobile;
  const codeDigits = code.replace(/\D/g, "");
  const mobileDigits = mobile.replace(/\D/g, "");
  if (codeDigits && mobileDigits.startsWith(codeDigits)) return mobile;
  return `${code} ${mobile}`;
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function lineCopy(description: string): { title: string; detail: string | null } {
  const [title, ...rest] = description.split(/\r?\n/);
  const detail = rest.join(" ").trim();
  return { title: (title ?? description).trim() || description, detail: detail || null };
}

function DaisyMark() {
  const petals = Array.from({ length: 12 }, (_, index) => index);
  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14 shrink-0" aria-hidden="true">
      {petals.map((index) => (
        <ellipse
          key={index}
          cx="40"
          cy="16"
          rx="8"
          ry="15.5"
          fill="#c9a6de"
          transform={`rotate(${index * 30} 40 40)`}
        />
      ))}
      <circle cx="40" cy="40" r="11.5" fill="#7b3f9e" />
      <circle cx="35.5" cy="36" r="1.25" fill="#54286f" />
      <circle cx="43.5" cy="35.2" r="1.1" fill="#54286f" />
      <circle cx="39.5" cy="43.2" r="1.2" fill="#54286f" />
      <circle cx="33.8" cy="42" r="1" fill="#54286f" />
      <circle cx="45.8" cy="41.5" r="1.05" fill="#54286f" />
    </svg>
  );
}

function InvoiceDocument({
  invoice,
  contact,
  issuer,
  taxId,
}: {
  invoice: CrmInvoice;
  contact: CrmContact | null;
  issuer: { name: string; email: string; phone: string };
  taxId: string | null;
}) {
  const [given, ...familyParts] = issuer.name.trim().split(/\s+/);
  const family = familyParts.join(" ");
  const subtitle = contact?.companyName?.trim() || "";
  const taxLabel = `Tax ${invoice.taxPercent}%${taxId ? ` (${taxId})` : ""}:`;
  return (
    <article className="crm-invoice-print min-w-[40rem] bg-white px-5 py-6 text-neutral-900">
      <header className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <DaisyMark />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-3xl font-normal tracking-tight text-[#a56fbe]">{given || issuer.name}</p>
            {family ? <p className="mt-1 truncate text-sm text-[#8a8a8a]">{family}</p> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <h2 className="text-4xl font-normal leading-none tracking-[0.06em] text-neutral-900">INVOICE</h2>
          {subtitle ? <p className="mt-1 text-sm text-neutral-800">{subtitle}</p> : null}
          <div className="mt-3 space-y-0.5 text-sm leading-snug text-neutral-800">
            <p className="font-semibold">{issuer.name}</p>
            {issuer.email ? <p>{issuer.email}</p> : null}
            {issuer.phone ? <p>{issuer.phone}</p> : null}
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-6 border-t border-neutral-300 pt-4">
        <div className="text-sm leading-snug">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-neutral-800">BILL TO</p>
          <p className="mt-2 font-semibold">{invoice.billToName}</p>
          {contact?.email ? <p className="mt-3">{contact.email}</p> : null}
          <p className={contact?.email ? undefined : "mt-3"}>{invoice.billToMobile}</p>
        </div>
        <div>
          <dl className="grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-1 whitespace-nowrap text-right text-sm">
            <dt>Invoice Number:</dt>
            <dd>{invoice.number}</dd>
            <dt>Invoice Date:</dt>
            <dd>{formatLongDate(invoice.issuedAt)}</dd>
            <dt>Payment Due:</dt>
            <dd>{formatLongDate(invoice.dueAt)}</dd>
          </dl>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3 whitespace-nowrap bg-[#f0f0f0] px-3 py-2 text-sm">
            <span className="text-right">Amount Due ({invoice.currency}):</span>
            <span className="font-bold tabular-nums">{money(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#7b3f9e] text-left text-white">
            <th className="bg-[#7b3f9e] px-3 py-2.5 font-semibold">Services</th>
            <th className="w-24 bg-[#7b3f9e] px-3 py-2.5 text-right font-semibold">Quantity</th>
            <th className="w-28 bg-[#7b3f9e] px-3 py-2.5 text-right font-semibold">Rate</th>
            <th className="w-32 bg-[#7b3f9e] px-3 py-2.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.lines ?? []).map((line) => {
            const copy = lineCopy(line.description);
            return (
              <tr key={line.id}>
                <td className="px-3 py-4 align-top">
                  <p className="font-semibold">{copy.title}</p>
                  {copy.detail ? <p className="text-neutral-500">{copy.detail}</p> : null}
                </td>
                <td className="px-3 py-4 text-right align-top tabular-nums">{formatQuantity(line.quantity)}</td>
                <td className="px-3 py-4 text-right align-top tabular-nums">{money(line.unitPrice, invoice.currency)}</td>
                <td className="px-3 py-4 text-right align-top tabular-nums">{money(line.amount, invoice.currency)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="ml-auto mt-2 w-full max-w-sm border-t border-neutral-300 pt-3 text-sm">
        <div className="grid grid-cols-[1fr_8.5rem] gap-y-1 text-right">
          <span>Subtotal:</span>
          <span className="tabular-nums">{money(invoice.subtotal, invoice.currency)}</span>
          <span>{taxLabel}</span>
          <span className="tabular-nums">{money(invoice.taxAmount, invoice.currency)}</span>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_8.5rem] border-t border-neutral-400 pt-2 text-right">
          <span>Total:</span>
          <span className="tabular-nums">{money(invoice.total, invoice.currency)}</span>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_8.5rem] border-t-4 border-double border-neutral-900 pt-2 text-right font-semibold">
          <span>Amount Due ({invoice.currency}):</span>
          <span className="tabular-nums">{money(invoice.total, invoice.currency)}</span>
        </div>
      </div>

      {invoice.notes ? (
        <div className="mt-8 text-sm leading-relaxed">
          <p className="font-semibold">Notes</p>
          <p className="mt-2">{invoice.notes}</p>
        </div>
      ) : null}
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
          <Textarea
            id={`invoice-line-${index}`}
            value={line.description}
            placeholder="Service title"
            rows={2}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                lines: current.lines.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, description: event.target.value } : item,
                ),
              }))
            }
            className="rounded-xl text-base"
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
  const { user } = useAuth();
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.invoicesRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canReadClients = permissions.includes(CRM_PERMISSIONS.clientsRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.invoicesCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.invoicesUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.invoicesDelete);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);
  const [editing, setEditing] = useState<CrmInvoice | null>(null);
  const [viewing, setViewing] = useState<CrmInvoice | null>(null);
  const [opening, setOpening] = useState(false);

  const load = useCallback((page: number) => listInvoices({ page, limit: 20 }), []);
  const list = usePagedList(load, "invoices", canRead);
  const contacts = useResource(() => listContacts({ limit: 200 }), Boolean(viewing) && canReadContacts);
  const clients = useResource(() => listClients({ limit: 200 }), Boolean(viewing) && canReadClients);

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
            <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
              {viewing ? (
                <InvoiceDocument
                  invoice={viewing}
                  contact={contacts.data?.items.find((item) => item.id === viewing.contactId) ?? null}
                  issuer={{
                    name: user?.name?.trim() || "Sales CRM",
                    email: user?.email ?? "",
                    phone: user ? formatIssuerPhone(user.countryCode, user.mobileNo) : "",
                  }}
                  taxId={clients.data?.items.find((item) => item.contactId === viewing.contactId)?.gstin ?? null}
                />
              ) : null}
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
