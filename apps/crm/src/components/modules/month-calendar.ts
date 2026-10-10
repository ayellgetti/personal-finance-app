export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Inclusive local-day range covering the month grid (leading and trailing days included). */
export function monthRangeIso(cursor: Date): { from: string; to: string } {
  const cells = monthGrid(cursor);
  const first = cells[0] ?? startOfDay(cursor);
  const last = cells[cells.length - 1] ?? first;
  const to = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
  return { from: first.toISOString(), to: to.toISOString() };
}

export function coversLocalDay(startsAt: string | null, endsAt: string | null, day: Date): boolean {
  if (!startsAt) return false;
  const start = startOfDay(new Date(startsAt));
  if (Number.isNaN(start.getTime())) return false;
  const endDate = endsAt ? new Date(endsAt) : start;
  const end = Number.isNaN(endDate.getTime()) ? start : startOfDay(endDate);
  const target = startOfDay(day).getTime();
  const from = Math.min(start.getTime(), end.getTime());
  const to = Math.max(start.getTime(), end.getTime());
  return target >= from && target <= to;
}

export type MonthChip = {
  id: string;
  label: string;
  className: string;
};
