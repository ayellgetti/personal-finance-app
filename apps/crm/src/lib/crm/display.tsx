import {
  CRM_CLIENT_STATUSES,
  CRM_CONTACT_TYPES,
  CRM_ENQUIRY_STATUSES,
  CRM_EVENT_SLOTS,
  CRM_PAYMENT_MODES,
  CRM_PAYMENT_STATUSES,
  CRM_PAYMENT_TYPES,
  CRM_TASK_STATUSES,
  type CrmClientStatus,
  type CrmContactType,
  type CrmEnquiryStatus,
  type CrmEventSlot,
  type CrmPaymentMode,
  type CrmPaymentStatus,
  type CrmPaymentType,
  type CrmTaskStatus,
} from "@/types/crm";

export const CONTACT_TYPE_LABELS: Record<CrmContactType, string> = {
  lead: "Lead",
  client: "Booked",
  vendor: "Vendor",
  employee: "Employee",
};

export const ENQUIRY_STATUS_LABELS: Record<CrmEnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  discussion: "Discussion",
  quotation_sent: "Quotation Sent",
  negotiation: "Negotiation",
  schedule_meeting: "Schedule Meeting / Site Visit",
  closed: "Closed",
};

export const CLIENT_STATUS_LABELS: Record<CrmClientStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const PAYMENT_TYPE_LABELS: Record<CrmPaymentType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
};

export const PAYMENT_MODE_LABELS: Record<CrmPaymentMode, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
};

export const PAYMENT_STATUS_LABELS: Record<CrmPaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const TASK_STATUS_LABELS: Record<CrmTaskStatus, string> = {
  todo: "Todo",
  in_progress: "In-Progress",
  in_review: "In-Review",
  done: "Done",
};

export const EVENT_SLOT_LABELS: Record<CrmEventSlot, string> = {
  morning: "Morning",
  evening: "Evening",
  full_day: "Full day",
};

const SLOT_END_IST: Record<CrmEventSlot, { hour: number; minute: number }> = {
  morning: { hour: 16, minute: 0 },
  evening: { hour: 23, minute: 0 },
  full_day: { hour: 23, minute: 0 },
};

export function endsAtFromSlot(startsAtIsoOrLocal: string, slot: CrmEventSlot): string {
  const startsAt = new Date(startsAtIsoOrLocal);
  if (Number.isNaN(startsAt.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(startsAt);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const pad = (n: number) => String(n).padStart(2, "0");
  const end = SLOT_END_IST[slot];
  return isoToLocalInput(
    new Date(`${year}-${pad(month)}-${pad(day)}T${pad(end.hour)}:${pad(end.minute)}:00+05:30`).toISOString(),
  );
}

export function eventSlotOptions() {
  return CRM_EVENT_SLOTS.map((slot) => (
    <option key={slot} value={slot}>
      {EVENT_SLOT_LABELS[slot]}
    </option>
  ));
}

export function paymentTypeOptions() {
  return CRM_PAYMENT_TYPES.map((type) => (
    <option key={type} value={type}>
      {PAYMENT_TYPE_LABELS[type]}
    </option>
  ));
}

export function paymentModeOptions() {
  return CRM_PAYMENT_MODES.map((mode) => (
    <option key={mode} value={mode}>
      {PAYMENT_MODE_LABELS[mode]}
    </option>
  ));
}

export const MOBILE_PATTERN = /^\+?[0-9]{7,15}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function isoToLocalDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return toLocalDateKey(date);
}

export function localDateInputToIso(value: string): string {
  return new Date(`${value}T12:00:00`).toISOString();
}

export function toLocalDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isLocalDateKeyOnOrAfterToday(value: string, from = new Date()): boolean {
  return value >= toLocalDateKey(from);
}

export function toLocalDateTimeMin(from = new Date()): string {
  return `${toLocalDateKey(from)}T00:00`;
}

export function parseLocalDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export const DUE_DATE_SHORTCUTS = [
  { id: "7d", label: "7 days", days: 7, months: 0 },
  { id: "1m", label: "1 month", days: 0, months: 1 },
  { id: "3m", label: "3 months", days: 0, months: 3 },
  { id: "6m", label: "6 months", days: 0, months: 6 },
] as const;

export type DueDateShortcutId = (typeof DUE_DATE_SHORTCUTS)[number]["id"];

export function applyDueDateShortcut(id: DueDateShortcutId, from = new Date()): Date {
  const shortcut = DUE_DATE_SHORTCUTS.find((item) => item.id === id);
  if (!shortcut) return new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return new Date(
    from.getFullYear(),
    from.getMonth() + shortcut.months,
    from.getDate() + shortcut.days,
  );
}

export function dueDateShortcutKey(id: DueDateShortcutId, from = new Date()): string {
  return toLocalDateKey(applyDueDateShortcut(id, from));
}

export function formatMoney(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

export function contactTypeOptions() {
  return CRM_CONTACT_TYPES.map((type) => (
    <option key={type} value={type}>
      {CONTACT_TYPE_LABELS[type]}
    </option>
  ));
}

export function enquiryStatusOptions() {
  return CRM_ENQUIRY_STATUSES.map((status) => (
    <option key={status} value={status}>
      {ENQUIRY_STATUS_LABELS[status]}
    </option>
  ));
}

export const CRM_ENQUIRY_SOURCES = [
  "Walk-in",
  "Referral",
  "Instagram",
  "Facebook",
  "Google",
  "WhatsApp",
  "Wedding Wire",
  "Other",
] as const;

export function enquirySourceOptions() {
  return CRM_ENQUIRY_SOURCES.map((source) => (
    <option key={source} value={source}>
      {source}
    </option>
  ));
}

export function clientStatusOptions() {
  return CRM_CLIENT_STATUSES.map((status) => (
    <option key={status} value={status}>
      {CLIENT_STATUS_LABELS[status]}
    </option>
  ));
}

export function paymentStatusOptions() {
  return CRM_PAYMENT_STATUSES.map((status) => (
    <option key={status} value={status}>
      {PAYMENT_STATUS_LABELS[status]}
    </option>
  ));
}

export function taskStatusOptions() {
  return CRM_TASK_STATUSES.map((status) => (
    <option key={status} value={status}>
      {TASK_STATUS_LABELS[status]}
    </option>
  ));
}
