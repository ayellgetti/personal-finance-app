import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/store";
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
  type CrmContact,
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
    <svg viewBox="0 0 80 80" className="h-[4.25rem] w-[4.25rem] shrink-0" aria-hidden="true">
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

type InvoiceIssuer = { name: string; email: string; phone: string };

function InvoiceDocument({
  invoice,
  contact,
  issuer,
  taxId,
}: {
  invoice: CrmInvoice;
  contact: CrmContact | null;
  issuer: InvoiceIssuer;
  taxId: string | null;
}) {
  const lines = invoice.lines ?? [];
  const [given, ...familyParts] = issuer.name.trim().split(/\s+/);
  const family = familyParts.join(" ");
  const subtitle = contact?.companyName?.trim() || "";
  const taxLabel = `Tax ${invoice.taxPercent}%${taxId ? ` (${taxId})` : ""}:`;
  return (
    <article className="crm-invoice-print bg-white px-6 py-8 text-neutral-900">
      <header className="flex items-start justify-between gap-8">
        <div className="flex min-w-0 items-center gap-3">
          <DaisyMark />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[1.85rem] font-normal tracking-tight text-[#a56fbe]">{given || issuer.name}</p>
            {family ? <p className="mt-1 truncate text-[0.95rem] text-[#8a8a8a]">{family}</p> : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <h2 className="text-[2.7rem] font-normal leading-none tracking-[0.06em] text-neutral-900">INVOICE</h2>
          {subtitle ? <p className="mt-1 text-sm text-neutral-800">{subtitle}</p> : null}
          <div className="mt-4 space-y-0.5 text-sm leading-snug text-neutral-800">
            <p className="font-semibold">{issuer.name}</p>
            {issuer.email ? <p>{issuer.email}</p> : null}
            {issuer.phone ? <p>{issuer.phone}</p> : null}
          </div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-8 border-t border-neutral-300 pt-5">
        <div className="text-sm leading-snug">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-neutral-800">BILL TO</p>
          <p className="mt-2 font-semibold">{invoice.billToName}</p>
          {contact?.email ? <p className="mt-3">{contact.email}</p> : null}
          <p className={contact?.email ? undefined : "mt-3"}>{invoice.billToMobile}</p>
        </div>
        <div className="justify-self-end">
          <dl className="grid grid-cols-[auto_auto] justify-end gap-x-6 gap-y-1 whitespace-nowrap text-right text-sm">
            <dt>Invoice Number:</dt>
            <dd>{invoice.number}</dd>
            <dt>Invoice Date:</dt>
            <dd>{formatLongDate(invoice.issuedAt)}</dd>
            <dt>Payment Due:</dt>
            <dd>{formatLongDate(invoice.dueAt)}</dd>
          </dl>
          <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-4 whitespace-nowrap bg-[#f0f0f0] px-3 py-2 text-sm">
            <span className="text-right">Amount Due ({invoice.currency}):</span>
            <span className="font-bold tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#7b3f9e] text-left text-white">
            <th className="bg-[#7b3f9e] px-3 py-2.5 font-semibold">Services</th>
            <th className="w-24 bg-[#7b3f9e] px-3 py-2.5 text-right font-semibold">Quantity</th>
            <th className="w-28 bg-[#7b3f9e] px-3 py-2.5 text-right font-semibold">Rate</th>
            <th className="w-32 bg-[#7b3f9e] px-3 py-2.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const copy = lineCopy(line.description);
            return (
              <tr key={line.id}>
                <td className="px-3 py-4 align-top">
                  <p className="font-semibold">{copy.title}</p>
                  {copy.detail ? <p className="text-neutral-500">{copy.detail}</p> : null}
                </td>
                <td className="px-3 py-4 text-right align-top tabular-nums">{formatQuantity(line.quantity)}</td>
                <td className="px-3 py-4 text-right align-top tabular-nums">
                  {formatMoney(line.unitPrice, invoice.currency)}
                </td>
                <td className="px-3 py-4 text-right align-top tabular-nums">
                  {formatMoney(line.amount, invoice.currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="ml-auto mt-2 w-full max-w-sm border-t border-neutral-300 pt-3 text-sm">
        <div className="grid grid-cols-[1fr_8.5rem] gap-y-1 text-right">
          <span>Subtotal:</span>
          <span className="tabular-nums">{formatMoney(invoice.subtotal, invoice.currency)}</span>
          <span>{taxLabel}</span>
          <span className="tabular-nums">{formatMoney(invoice.taxAmount, invoice.currency)}</span>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_8.5rem] border-t border-neutral-400 pt-2 text-right">
          <span>Total:</span>
          <span className="tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_8.5rem] border-t-4 border-double border-neutral-900 pt-2 text-right font-semibold">
          <span>Amount Due ({invoice.currency}):</span>
          <span className="tabular-nums">{formatMoney(invoice.total, invoice.currency)}</span>
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

export function InvoicesModule() {
  const crm = useCrm();
  const { user } = useAuth();
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
      if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) void crm.loadContacts({ limit: 200 });
      if (crm.hasPermission(CRM_PERMISSIONS.clientsRead)) void crm.loadClients({ limit: 200 });
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
          <p className="text-xs text-muted-foreground">
            The first line of a service is the title. Anything on the next line prints underneath it.
          </p>
          {form.lines.map((line, index) => (
            <div key={index} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_5rem_7rem_auto]">
              <Textarea
                aria-label={`Line ${index + 1} description`}
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
                className="min-h-0 rounded-xl"
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
        className="sm:max-w-4xl"
        footer={
          <Button type="button" className="rounded-xl print:hidden" onClick={printStoredInvoice}>
            Print
          </Button>
        }
      >
        {viewing ? (
          <InvoiceDocument
            invoice={viewing}
            contact={crm.contacts.items.find((item) => item.id === viewing.contactId) ?? null}
            issuer={{
              name: user?.name?.trim() || "Sales CRM",
              email: user?.email ?? "",
              phone: user ? formatIssuerPhone(user.countryCode, user.mobileNo) : "",
            }}
            taxId={crm.clients.items.find((item) => item.contactId === viewing.contactId)?.gstin ?? null}
          />
        ) : null}
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
