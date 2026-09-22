import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/modules/shared";
import { formatDate } from "@/lib/crm/display";
import {
  BANQUET_CHECKLIST_CATEGORIES,
  BANQUET_EVENT_TIMES,
  BANQUET_MENU_PACKAGES,
  BANQUET_PAYMENT_MODES,
  BANQUET_PAYMENT_PARTICULARS,
  BANQUET_STAFF_ROLES,
  checklistItemGroups,
  eventTimeBySlug,
  menuPackageBySlug,
  packageRowCount,
  packagedCategories,
  paymentOptionName,
} from "@/lib/crm/banquet-checklist";

type ItemRow = {
  id: string;
  categorySlug: string;
  item: string;
  requirement: string;
};

type EventInfo = {
  clientName: string;
  mobileNo: string;
  menuPackage: string;
  eventDate: string;
  eventTime: string;
  guests: string;
};

type StaffRow = { quantity: string; names: string };

type PaymentRow = {
  id: string;
  particular: string;
  amount: string;
  mode: string;
  remarks: string;
};

const EMPTY_EVENT: EventInfo = {
  clientName: "",
  mobileNo: "",
  menuPackage: "",
  eventDate: "",
  eventTime: "",
  guests: "",
};

function emptyStaff(): Record<string, StaffRow> {
  return Object.fromEntries(
    BANQUET_STAFF_ROLES.map((role) => [role.slug, { quantity: "", names: "" }]),
  );
}

const DECORATION_PLACEHOLDER = `Enter decoration requirements...
Example:
• Stage backdrop
• Welcome board
• Floral decoration
• Table centrepieces
• Entrance decoration
• Balloon decoration
• LED / name board
• Lighting
• Photo booth
• Any special client requirement`;

const INSTRUCTION_PLACEHOLDER = `Enter instructions...
Example:
• Jain / special meal
• Timing for cake cutting
• Guest of honour arrival
• Any client-specific instruction`;

const inputClass =
  "h-10 rounded-lg border-stone-200 bg-stone-50 px-3 py-1 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:ring-amber-400 print:hidden";
const rowInputClass =
  "h-9 rounded-md border-stone-200 bg-white px-2.5 py-1 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:ring-amber-400 print:hidden";
const selectClass =
  "h-9 rounded-md border-stone-200 bg-white px-2.5 py-1 text-sm text-stone-800 print:hidden";
/** Header fields print on a rule so blank ones can be filled in by hand. */
const printFieldClass = "border-b border-stone-400 pb-0.5";
const cellClass = "border border-amber-100 p-1.5 align-middle print:border-black";
const headCellClass =
  "border border-amber-100 bg-stone-50 px-2 py-1.5 text-left text-xs font-semibold text-amber-800 print:border-black print:bg-white";

let nextRowId = 0;

function emptyRow(categorySlug = ""): ItemRow {
  nextRowId += 1;
  return {
    id: `row-${nextRowId}`,
    categorySlug,
    item: "",
    requirement: "",
  };
}

function initialRows(): ItemRow[] {
  return [emptyRow()];
}

function emptyPaymentRow(): PaymentRow {
  nextRowId += 1;
  return {
    id: `pay-${nextRowId}`,
    particular: "",
    amount: "",
    mode: "",
    remarks: "",
  };
}

function initialPayments(): PaymentRow[] {
  return [emptyPaymentRow()];
}

function rowHasContent(row: ItemRow): boolean {
  return Boolean(row.categorySlug || row.item || row.requirement);
}

/**
 * Keep filled (and extra) rows when the menu package changes.
 * Only adds blank packaged rows that the new package still needs.
 */
function rowsForPackage(packageSlug: string, existing: readonly ItemRow[]): ItemRow[] {
  const itemsPerCategory = menuPackageBySlug(packageSlug)?.itemsPerCategory ?? 0;
  const kept = existing.filter(rowHasContent);

  if (itemsPerCategory < 1) return kept.length > 0 ? [...kept] : initialRows();

  const packagedSlugs = new Set(packagedCategories().map((category) => category.slug));
  const extras = kept.filter((row) => !packagedSlugs.has(row.categorySlug));
  const byCategory = new Map<string, ItemRow[]>();
  for (const row of kept) {
    if (!packagedSlugs.has(row.categorySlug)) continue;
    const current = byCategory.get(row.categorySlug) ?? [];
    current.push(row);
    byCategory.set(row.categorySlug, current);
  }

  const packaged = packagedCategories().flatMap((category) => {
    const current = byCategory.get(category.slug) ?? [];
    const missing = Math.max(0, packageRowCount(category, itemsPerCategory) - current.length);
    return [...current, ...Array.from({ length: missing }, () => emptyRow(category.slug))];
  });

  return extras.length > 0 ? [...packaged, ...extras] : packaged;
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-xs font-medium leading-none text-stone-700">
        {label}
      </Label>
      <div className="mt-1.5 print:mt-0.5">{children}</div>
    </div>
  );
}

/** Printed sheet shows the entered value as text; the control itself is screen-only. */
function PrintValue({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`hidden whitespace-pre-wrap print:block ${className}`}>
      {value || "\u00A0"}
    </span>
  );
}

function NotesSection({
  id,
  title,
  value,
  onChange,
  placeholder,
  hint,
}: {
  id: string;
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint: string;
}) {
  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="mt-3 rounded-lg border border-amber-100 bg-stone-50/70 p-3 print:border-black print:bg-white print:shadow-none"
    >
      <h2 id={`${id}-heading`} className="mb-2 font-display text-sm font-semibold text-amber-800">
        {title}
      </h2>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={10}
        aria-label={title}
        className="min-h-[12rem] rounded-xl border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 print:hidden"
      />
      <PrintValue
        value={value}
        className="min-h-[6rem] rounded border border-stone-400 px-2 py-1"
      />
      <p className="mt-1.5 text-xs text-stone-500 print:hidden">{hint}</p>
    </section>
  );
}

export default function BanquetChecklist() {
  const [eventInfo, setEventInfo] = useState<EventInfo>(EMPTY_EVENT);
  const [rows, setRows] = useState<ItemRow[]>(initialRows);
  const [staff, setStaff] = useState<Record<string, StaffRow>>(emptyStaff);
  const [decoration, setDecoration] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>(initialPayments);
  const [instruction, setInstruction] = useState("");
  const [remarks, setRemarks] = useState("");
  const [signature, setSignature] = useState("");

  const setEvent = (key: keyof EventInfo, value: string) => {
    setEventInfo((current) => ({ ...current, [key]: value }));
  };

  const setStaffField = (slug: string, patch: Partial<StaffRow>) => {
    setStaff((current) => ({
      ...current,
      [slug]: { ...(current[slug] ?? { quantity: "", names: "" }), ...patch },
    }));
  };

  const updateRow = (id: string, patch: Partial<Omit<ItemRow, "id">>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const selectCategory = (id: string, categorySlug: string) => {
    updateRow(id, { categorySlug, item: "" });
  };

  const selectMenuPackage = (packageSlug: string) => {
    setEvent("menuPackage", packageSlug);
    setRows((current) => rowsForPackage(packageSlug, current));
  };

  const addItem = () => {
    setRows((current) => [...current, emptyRow()]);
  };

  const removeItem = (id: string) => {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  };

  const updatePayment = (id: string, patch: Partial<Omit<PaymentRow, "id">>) => {
    setPayments((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addPayment = () => {
    setPayments((current) => [...current, emptyPaymentRow()]);
  };

  const removePayment = (id: string) => {
    setPayments((current) =>
      current.length <= 1 ? current : current.filter((row) => row.id !== id),
    );
  };

  const resetState = () => {
    setEventInfo(EMPTY_EVENT);
    setRows(initialRows());
    setStaff(emptyStaff());
    setDecoration("");
    setPayments(initialPayments());
    setInstruction("");
    setRemarks("");
    setSignature("");
  };

  const categoryBySlug = new Map(
    BANQUET_CHECKLIST_CATEGORIES.map((category) => [category.slug, category] as const),
  );

  const rowsInCategory = (slug: string) => rows.filter((row) => row.categorySlug === slug);

  const confirmReset = () => {
    toast("Reset the complete checklist?", {
      action: {
        label: "Reset",
        onClick: () => {
          resetState();
          toast.success("Checklist reset");
        },
      },
      cancel: { label: "Cancel", onClick: () => undefined },
    });
  };

  return (
    <div className="banquet-checklist min-h-screen bg-[#fbf8f3] px-3 py-4 text-stone-800 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-amber-100 bg-white p-4 shadow-[0_16px_48px_-24px_rgba(120,90,40,0.35)] sm:p-6 print:max-w-none print:rounded-none print:border-black print:p-0 print:shadow-none">
        <h1 className="font-display text-xl font-semibold tracking-tight text-amber-700 sm:text-2xl">
          Event Day Manager – Final Handover Checklist
        </h1>
        <p className="mt-1 text-xs text-stone-500">
          Final checklist to be handed over to the Event Day Manager
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field id="client-name" label="Client Name">
            <Input
              id="client-name"
              value={eventInfo.clientName}
              onChange={(event) => setEvent("clientName", event.target.value)}
              placeholder="Client name"
              className={inputClass}
            />
            <PrintValue value={eventInfo.clientName} className={printFieldClass} />
          </Field>
          <Field id="mobile-no" label="Mobile No.">
            <Input
              id="mobile-no"
              type="tel"
              value={eventInfo.mobileNo}
              onChange={(event) => setEvent("mobileNo", event.target.value)}
              placeholder="Mobile no."
              className={inputClass}
            />
            <PrintValue value={eventInfo.mobileNo} className={printFieldClass} />
          </Field>
          <Field id="menu-package" label="Menu">
            <NativeSelect
              id="menu-package"
              value={eventInfo.menuPackage}
              onChange={selectMenuPackage}
              className={inputClass}
            >
              <option value="">Select menu...</option>
              {BANQUET_MENU_PACKAGES.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </NativeSelect>
            <PrintValue
              value={menuPackageBySlug(eventInfo.menuPackage)?.name ?? ""}
              className={printFieldClass}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field id="event-date" label="Event Date">
            <Input
              id="event-date"
              type="date"
              value={eventInfo.eventDate}
              onChange={(event) => setEvent("eventDate", event.target.value)}
              className={inputClass}
            />
            <PrintValue
              value={eventInfo.eventDate ? formatDate(eventInfo.eventDate) : ""}
              className={printFieldClass}
            />
          </Field>
          <Field id="event-time" label="Event Time">
            <NativeSelect
              id="event-time"
              value={eventInfo.eventTime}
              onChange={(value) => setEvent("eventTime", value)}
              className={inputClass}
            >
              <option value="">Select time...</option>
              {BANQUET_EVENT_TIMES.map((slot) => (
                <option key={slot.slug} value={slot.slug}>
                  {slot.name}
                </option>
              ))}
            </NativeSelect>
            <PrintValue
              value={eventTimeBySlug(eventInfo.eventTime)?.name ?? ""}
              className={printFieldClass}
            />
          </Field>
          <Field id="expected-guests" label="No. of Guests">
            <Input
              id="expected-guests"
              type="number"
              min={1}
              value={eventInfo.guests}
              onChange={(event) => setEvent("guests", event.target.value)}
              placeholder="Guests"
              className={inputClass}
            />
            <PrintValue value={eventInfo.guests} className={printFieldClass} />
          </Field>
        </div>

        <section
          aria-labelledby="menu-heading"
          className="mt-4 rounded-lg border border-amber-100 bg-stone-50/70 p-3 print:border-black print:bg-white print:shadow-none"
        >
          <h2 id="menu-heading" className="font-display text-sm font-semibold text-amber-800">
            Menu Selection
          </h2>
          <div className="mt-2 overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[40rem] border-collapse text-sm print:min-w-0">
              <thead>
                <tr>
                  <th scope="col" className={headCellClass}>
                    Category
                  </th>
                  <th scope="col" className={headCellClass}>
                    Item
                  </th>
                  <th scope="col" className={headCellClass}>
                    Things Required
                  </th>
                  <th scope="col" className={`${headCellClass} w-12 print:hidden`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const category = row.categorySlug
                    ? categoryBySlug.get(row.categorySlug)
                    : undefined;
                  const usedItems = new Set(
                    rowsInCategory(row.categorySlug)
                      .filter((other) => other.id !== row.id && other.item)
                      .map((other) => other.item),
                  );
                  return (
                    <tr key={row.id}>
                      <td className={cellClass}>
                        <NativeSelect
                          id={`row-${index + 1}-category`}
                          value={row.categorySlug}
                          onChange={(value) => selectCategory(row.id, value)}
                          className={selectClass}
                          aria-label={`Row ${index + 1} category`}
                        >
                          <option value="">Select category...</option>
                          {BANQUET_CHECKLIST_CATEGORIES.map((option) => (
                            <option key={option.slug} value={option.slug}>
                              {option.name}
                            </option>
                          ))}
                        </NativeSelect>
                        <PrintValue value={category?.name ?? ""} />
                      </td>
                      <td className={cellClass}>
                        <NativeSelect
                          id={`row-${index + 1}-item`}
                          value={row.item}
                          onChange={(value) => updateRow(row.id, { item: value })}
                          className={selectClass}
                          aria-label={`Row ${index + 1} item`}
                          disabled={!category}
                        >
                          <option value="">
                            {category ? "Select item..." : "Select category first"}
                          </option>
                          {category
                            ? checklistItemGroups(category).map((group) => {
                                const options = group.items.map((item) => (
                                  <option key={item} value={item} disabled={usedItems.has(item)}>
                                    {item}
                                  </option>
                                ));
                                return group.name ? (
                                  <optgroup key={group.name} label={group.name}>
                                    {options}
                                  </optgroup>
                                ) : (
                                  options
                                );
                              })
                            : null}
                        </NativeSelect>
                        <PrintValue value={row.item} />
                      </td>
                      <td className={cellClass}>
                        <Input
                          id={`row-${index + 1}-req`}
                          value={row.requirement}
                          onChange={(event) =>
                            updateRow(row.id, { requirement: event.target.value })
                          }
                          placeholder="Things required"
                          aria-label={`Row ${index + 1} things required`}
                          className={rowInputClass}
                        />
                        <PrintValue value={row.requirement} />
                      </td>
                      <td className={`${cellClass} print:hidden`}>
                        {rows.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-base text-red-700 hover:text-red-800"
                            aria-label="Remove item"
                            onClick={() => removeItem(row.id)}
                          >
                            ×
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-end gap-1 print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-stone-200 px-3 text-xs"
              onClick={addItem}
            >
              + Add item
            </Button>
          </div>
        </section>

        <NotesSection
          id="decoration"
          title="Decoration"
          value={decoration}
          onChange={setDecoration}
          placeholder={DECORATION_PLACEHOLDER}
          hint="Enter all decoration requirements, materials, quantities and special instructions."
        />

        <section
          aria-labelledby="payment-heading"
          className="mt-3 rounded-lg border border-amber-100 bg-stone-50/70 p-3 print:border-black print:bg-white print:shadow-none"
        >
          <h2 id="payment-heading" className="font-display text-sm font-semibold text-amber-800">
            Payment
          </h2>
          <div className="mt-2 overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[40rem] border-collapse text-sm print:min-w-0">
              <thead>
                <tr>
                  <th scope="col" className={headCellClass}>
                    Particular
                  </th>
                  <th scope="col" className={`${headCellClass} w-28`}>
                    Amount
                  </th>
                  <th scope="col" className={`${headCellClass} w-36`}>
                    Mode
                  </th>
                  <th scope="col" className={headCellClass}>
                    Remarks
                  </th>
                  <th scope="col" className={`${headCellClass} w-12 print:hidden`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((row, index) => (
                  <tr key={row.id}>
                    <td className={cellClass}>
                      <NativeSelect
                        id={`pay-${index + 1}-particular`}
                        value={row.particular}
                        onChange={(value) => updatePayment(row.id, { particular: value })}
                        className={selectClass}
                        aria-label={`Payment row ${index + 1} particular`}
                      >
                        <option value="">Select particular...</option>
                        {BANQUET_PAYMENT_PARTICULARS.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </NativeSelect>
                      <PrintValue
                        value={paymentOptionName(BANQUET_PAYMENT_PARTICULARS, row.particular)}
                      />
                    </td>
                    <td className={cellClass}>
                      <Input
                        id={`pay-${index + 1}-amount`}
                        type="number"
                        min={0}
                        value={row.amount}
                        onChange={(event) =>
                          updatePayment(row.id, { amount: event.target.value })
                        }
                        placeholder="Amount"
                        aria-label={`Payment row ${index + 1} amount`}
                        className={`${rowInputClass} text-right`}
                      />
                      <PrintValue value={row.amount} className="text-right" />
                    </td>
                    <td className={cellClass}>
                      <NativeSelect
                        id={`pay-${index + 1}-mode`}
                        value={row.mode}
                        onChange={(value) => updatePayment(row.id, { mode: value })}
                        className={selectClass}
                        aria-label={`Payment row ${index + 1} mode`}
                      >
                        <option value="">Select mode...</option>
                        {BANQUET_PAYMENT_MODES.map((option) => (
                          <option key={option.slug} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </NativeSelect>
                      <PrintValue value={paymentOptionName(BANQUET_PAYMENT_MODES, row.mode)} />
                    </td>
                    <td className={cellClass}>
                      <Input
                        id={`pay-${index + 1}-remarks`}
                        value={row.remarks}
                        onChange={(event) =>
                          updatePayment(row.id, { remarks: event.target.value })
                        }
                        placeholder="Remarks"
                        aria-label={`Payment row ${index + 1} remarks`}
                        className={rowInputClass}
                      />
                      <PrintValue value={row.remarks} />
                    </td>
                    <td className={`${cellClass} print:hidden`}>
                      {payments.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 text-base text-red-700 hover:text-red-800"
                          aria-label="Remove payment"
                          onClick={() => removePayment(row.id)}
                        >
                          ×
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-end gap-1 print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-stone-200 px-3 text-xs"
              onClick={addPayment}
            >
              + Add payment
            </Button>
          </div>
        </section>

        <section
          aria-labelledby="staff-heading"
          className="mt-3 rounded-lg border border-amber-100 bg-stone-50/70 p-3 print:border-black print:bg-white print:shadow-none"
        >
          <h2 id="staff-heading" className="font-display text-sm font-semibold text-amber-800">
            Staff
          </h2>
          <div className="mt-2 overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[40rem] border-collapse text-sm print:min-w-0">
              <thead>
                <tr>
                  <th scope="col" className={headCellClass}>
                    Role
                  </th>
                  <th scope="col" className={`${headCellClass} w-20 text-center`}>
                    Qty
                  </th>
                  <th scope="col" className={headCellClass}>
                    Names
                  </th>
                </tr>
              </thead>
              <tbody>
                {BANQUET_STAFF_ROLES.map((role, index) => {
                  const row = staff[role.slug] ?? { quantity: "", names: "" };
                  return (
                    <tr key={role.slug}>
                      <td className={cellClass}>
                        <NativeSelect
                          id={`staff-${index + 1}-role`}
                          value={role.slug}
                          onChange={() => undefined}
                          className={`${selectClass} disabled:cursor-default disabled:opacity-100`}
                          aria-label={`Staff row ${index + 1} role`}
                          disabled
                        >
                          {BANQUET_STAFF_ROLES.map((option) => (
                            <option key={option.slug} value={option.slug}>
                              {option.name}
                            </option>
                          ))}
                        </NativeSelect>
                        <PrintValue value={role.name} />
                      </td>
                      <td className={cellClass}>
                        <Input
                          id={`${role.slug}-quantity`}
                          type="number"
                          min={0}
                          value={row.quantity}
                          onChange={(event) =>
                            setStaffField(role.slug, { quantity: event.target.value })
                          }
                          placeholder="Qty"
                          aria-label={`${role.name} quantity`}
                          className={`${rowInputClass} text-center`}
                        />
                        <PrintValue value={row.quantity} className="text-center" />
                      </td>
                      <td className={cellClass}>
                        <Input
                          id={`${role.slug}-names`}
                          value={row.names}
                          onChange={(event) =>
                            setStaffField(role.slug, { names: event.target.value })
                          }
                          placeholder="Assigned names"
                          aria-label={`${role.name} names`}
                          className={rowInputClass}
                        />
                        <PrintValue value={row.names} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <NotesSection
          id="instruction"
          title="Instruction"
          value={instruction}
          onChange={setInstruction}
          placeholder={INSTRUCTION_PLACEHOLDER}
          hint="Enter event-day instructions for the manager and kitchen."
        />

        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Field id="manager-remarks" label="Manager remarks">
            <Textarea
              id="manager-remarks"
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Special instructions, pending items, client requirements..."
              className="min-h-[72px] rounded-xl border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 print:hidden"
            />
            <PrintValue
              value={remarks}
              className="min-h-[3rem] rounded border border-stone-400 px-2 py-1"
            />
          </Field>
          <Field id="manager-signature" label="Manager signature">
            <Input
              id="manager-signature"
              value={signature}
              onChange={(event) => setSignature(event.target.value)}
              placeholder="Signature"
              className={inputClass}
            />
            <PrintValue value={signature} className="min-h-[2.5rem] border-b border-stone-400" />
          </Field>
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-stone-200 px-5 text-sm"
            onClick={confirmReset}
          >
            Reset
          </Button>
          <Button
            type="button"
            className="h-9 rounded-full bg-amber-400 px-6 text-sm font-semibold text-stone-900 hover:bg-amber-500"
            onClick={() => window.print()}
          >
            Print checklist
          </Button>
        </div>
      </div>
    </div>
  );
}
