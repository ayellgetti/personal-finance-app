import { endOfDayIso, isSameDay, startOfDayIso } from "@/lib/mobile/format";
import type { CrmFollowUpCalendar, CrmFollowUpCalendarItem } from "@/types/crm";

export const FOLLOW_UP_WHENS = ["today", "overdue", "upcoming", "history"] as const;
export type FollowUpWhen = (typeof FOLLOW_UP_WHENS)[number];

export function readFollowUpWhen(value: string | null): FollowUpWhen {
  if (value && (FOLLOW_UP_WHENS as readonly string[]).includes(value)) return value as FollowUpWhen;
  return "today";
}

/** Upcoming stays inside the API's 92-day calendar cap. */
export function followUpCalendarRange(now = new Date()): { from: string; to: string } {
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  return { from: startOfDayIso(now), to: endOfDayIso(end) };
}

export function filterFollowUpCalendar(
  calendar: CrmFollowUpCalendar,
  when: Exclude<FollowUpWhen, "history">,
  now = new Date(),
): CrmFollowUpCalendarItem[] {
  if (when === "overdue") return calendar.overdue;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return calendar.items.filter((item) => {
    if (when === "today") return isSameDay(item.at, now);
    return new Date(item.at).getTime() >= tomorrow.getTime();
  });
}
