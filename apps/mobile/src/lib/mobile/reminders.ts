import { listCalendarEvents } from "@/lib/mobile/remote";
import type { CrmCalendarEvent } from "@/types/crm";

/** Standalone reminders are calendar events with no enquiry. Bookings are not reminders. */
export function isStandaloneReminder(event: { enquiryId: string | null }): boolean {
  return event.enquiryId == null;
}

/**
 * The events list mixes bookings and reminders. Walk event pages until a phone-sized
 * batch of reminders is collected, or the list ends.
 */
export async function loadReminderBatch(
  startPage: number,
): Promise<{ items: CrmCalendarEvent[]; nextPage: number | null }> {
  const items: CrmCalendarEvent[] = [];
  let page = Math.max(1, startPage);
  let hasNext = true;
  let scans = 0;
  while (hasNext && scans < 20 && items.length < 20) {
    const result = await listCalendarEvents({ page, limit: 50 });
    scans += 1;
    items.push(...result.items.filter(isStandaloneReminder));
    hasNext = result.pagination.hasNextPage;
    page = result.pagination.page + 1;
  }
  return { items, nextPage: hasNext ? page : null };
}
