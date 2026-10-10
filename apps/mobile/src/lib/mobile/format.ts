const DATE_TIME = new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_ONLY = new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const TIME_ONLY = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

function parse(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | null): string {
  const date = parse(value);
  return date ? DATE_TIME.format(date) : "—";
}

export function formatDate(value: string | null): string {
  const date = parse(value);
  return date ? DATE_ONLY.format(date) : "—";
}

export function formatTime(value: string | null): string {
  const date = parse(value);
  return date ? TIME_ONLY.format(date) : "—";
}

export function isSameDay(value: string | null, reference: Date): boolean {
  const date = parse(value);
  if (!date) return false;
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

/** Name with the mobile beside it, when a number is known. */
export function personLine(name: string, mobile?: string | null): string {
  const number = mobile?.trim();
  return number ? `${name} · ${number}` : name;
}

/** Turns `quotation_sent` into `Quotation sent` for status chips. */
export function humanize(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** `<input type="date">` needs a local YYYY-MM-DD, not a UTC ISO string. */
export function toDateInputValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function startOfDayIso(date: Date): string {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString();
}

export function endOfDayIso(date: Date): string {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy.toISOString();
}

/** Case-insensitive match across the fields a list row can be found by. An empty query matches everything. */
export function matchesQuery(query: string, ...parts: Array<string | number | null | undefined>): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return parts.some((part) => String(part ?? "").toLowerCase().includes(needle));
}

/** Income is green; expense is red. Shared by payment lists, the calendar, and payment detail. */
export function paymentTypeClass(type: "INCOME" | "EXPENSE"): string {
  return type === "EXPENSE" ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300";
}

export function paymentTypeAccent(type: "INCOME" | "EXPENSE"): string {
  return type === "EXPENSE" ? "border-l-rose-500" : "border-l-emerald-500";
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
