import {
  CRM_CLIENT_STATUSES,
  CRM_CONTACT_TYPES,
  CRM_ENQUIRY_STATUSES,
  CRM_PAYMENT_MODES,
  CRM_PAYMENT_STATUSES,
  CRM_PAYMENT_TYPES,
  CRM_TASK_STATUSES,
  type CrmClientStatus,
  type CrmContactType,
  type CrmEnquiryStatus,
  type CrmPaymentMode,
  type CrmPaymentStatus,
  type CrmPaymentType,
  type CrmTaskStatus,
} from "@/types/crm";

export const CONTACT_TYPE_LABELS: Record<CrmContactType, string> = {
  lead: "Lead",
  client: "Client",
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

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
