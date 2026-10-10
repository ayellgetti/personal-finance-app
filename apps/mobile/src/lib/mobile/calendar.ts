import { CRM_PERMISSIONS, type CrmCalendarItem, type CrmCalendarKind, type CrmEventSlot } from "@/types/crm";

export type CalendarView = "day" | "week" | "month";

export const CALENDAR_VIEWS: readonly CalendarView[] = ["day", "week", "month"];

/** Weeks start on Monday, matching the CRM month grid. */
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const KIND_LABELS: Record<CrmCalendarKind, string> = {
  task: "Task",
  event: "Reminder",
  booking: "Booked",
  followup: "Follow-up",
};

/** Tinted chips for list rows; readable in both themes. */
export const KIND_CHIP_CLASSES: Record<CrmCalendarKind, string> = {
  task: "bg-primary/15 text-primary",
  event: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  booking: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  followup: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
};

/** Colour plus shape, so booked (square) and follow-up (diamond) stay distinct at month-cell size. */
export const KIND_MARK_CLASSES: Record<CrmCalendarKind, string> = {
  task: "h-1.5 w-1.5 rounded-full bg-primary",
  event: "h-1 w-2.5 rounded-full bg-sky-500",
  booking: "h-1.5 w-1.5 rounded-[2px] bg-emerald-500",
  followup: "h-1.5 w-1.5 rotate-45 bg-amber-500",
};

/** Left edge on agenda rows, matching the month marks. */
export const KIND_ACCENT_CLASSES: Record<CrmCalendarKind, string> = {
  task: "border-l-primary",
  event: "border-l-sky-500",
  booking: "border-l-emerald-500",
  followup: "border-l-amber-500",
};

/** The things a tapped date can start, mirroring the CRM day picker. */
export type CreateTarget = "reminder" | "enquiry" | "followUp" | "task";

export const CREATE_TARGETS: { target: CreateTarget; label: string; permission: string }[] = [
  { target: "reminder", label: "Reminder", permission: CRM_PERMISSIONS.calendarCreate },
  { target: "enquiry", label: "Enquiry", permission: CRM_PERMISSIONS.enquiriesCreate },
  { target: "followUp", label: "Follow-up", permission: CRM_PERMISSIONS.followUpsCreate },
  { target: "task", label: "Task", permission: CRM_PERMISSIONS.tasksCreate },
];

export const EVENT_SLOT_LABELS: Record<CrmEventSlot, string> = {
  morning: "Morning",
  evening: "Evening",
  full_day: "Full day",
};

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

/** Six Monday-aligned weeks, so the grid height never changes between months. */
export function monthGrid(month: Date): Date[] {
  const start = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function weekGrid(date: Date): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function visibleDays(view: CalendarView, cursor: Date): Date[] {
  if (view === "month") return monthGrid(cursor);
  if (view === "week") return weekGrid(cursor);
  return [startOfDay(cursor)];
}

export function shiftCursor(view: CalendarView, cursor: Date, direction: 1 | -1): Date {
  if (view === "month") return new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1);
  return addDays(cursor, direction * (view === "week" ? 7 : 1));
}

/** The feed window for the visible cells. 42 days stays inside the API's 92-day cap. */
export function rangeFor(days: Date[], cursor: Date): { from: string; to: string } {
  const first = days[0] ?? cursor;
  const last = days[days.length - 1] ?? cursor;
  return { from: startOfDay(first).toISOString(), to: endOfDay(last).toISOString() };
}

export function rangeLabel(view: CalendarView, days: Date[], cursor: Date): string {
  if (view === "month") {
    return cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  if (view === "day") {
    return cursor.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const first = days[0] ?? cursor;
  const last = days[days.length - 1] ?? cursor;
  const from = first.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const to = last.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  return `${from} – ${to}`;
}

/** Local calendar key; `toISOString().slice(0,10)` would shift days east of UTC. */
export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isSameMonth(date: Date, cursor: Date): boolean {
  return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
}

/** Horizontal filters under the month grid. Booked and reminders stay on their own tabs. */
export type MonthCategory = "all" | "booking" | "event" | "followup" | "payment" | "other";

export const MONTH_CATEGORIES: readonly { id: MonthCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "booking", label: "Booked" },
  { id: "event", label: "Reminder" },
  { id: "followup", label: "Follow-up" },
  { id: "payment", label: "Payment" },
  { id: "other", label: "Other" },
];

export function monthCategoryForKind(kind: CrmCalendarKind): Exclude<MonthCategory, "all" | "payment"> {
  if (kind === "booking") return "booking";
  if (kind === "event") return "event";
  if (kind === "followup") return "followup";
  return "other";
}

/** First instant of the month through the last, for the payment list window. */
export function monthBounds(cursor: Date): { from: string; to: string } {
  const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function itemsInMonth(items: readonly CrmCalendarItem[], cursor: Date): CrmCalendarItem[] {
  return items
    .filter((item) => isSameMonth(new Date(item.at), cursor))
    .sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime());
}

export function filterMonthItems(items: readonly CrmCalendarItem[], category: MonthCategory): CrmCalendarItem[] {
  if (category === "all") return [...items];
  if (category === "payment") return [];
  return items.filter((item) => monthCategoryForKind(item.kind) === category);
}

export function isToday(date: Date, now = new Date()): boolean {
  return dayKey(date) === dayKey(now);
}

export const DUE_DATE_SHORTCUTS = [
  { id: "7d", label: "7 days", days: 7, months: 0 },
  { id: "1m", label: "1 month", days: 0, months: 1 },
  { id: "3m", label: "3 months", days: 0, months: 3 },
  { id: "6m", label: "6 months", days: 0, months: 6 },
] as const;

export type DueDateShortcutId = (typeof DUE_DATE_SHORTCUTS)[number]["id"];

/** Adds the shortcut onto the local calendar day, letting month length roll over. */
export function applyDueDateShortcut(id: DueDateShortcutId, from = new Date()): Date {
  const shortcut = DUE_DATE_SHORTCUTS.find((item) => item.id === id);
  const base = startOfDay(from);
  if (!shortcut) return base;
  return new Date(base.getFullYear(), base.getMonth() + shortcut.months, base.getDate() + shortcut.days);
}

export function dueDateShortcutKey(id: DueDateShortcutId, from = new Date()): string {
  return dayKey(applyDueDateShortcut(id, from));
}

export function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function groupByDay(items: readonly CrmCalendarItem[]): Map<string, CrmCalendarItem[]> {
  const grouped = new Map<string, CrmCalendarItem[]>();
  for (const item of items) {
    const key = dayKey(new Date(item.at));
    const list = grouped.get(key) ?? [];
    list.push(item);
    grouped.set(key, list);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }
  return grouped;
}

export function itemCaption(item: CrmCalendarItem): string {
  const slot = item.slot ? EVENT_SLOT_LABELS[item.slot] : null;
  return slot ? `${item.title} · ${slot}` : item.title;
}
