import { isoToLocalInput, localInputToIso } from "@/lib/crm/display";
import type { CreateCalendarEventInput } from "@/types/crm";

export type ReminderFormState = {
  title: string;
  description: string;
  remindAt: string;
  contactId: string;
};

export const EMPTY_REMINDER: ReminderFormState = {
  title: "",
  description: "",
  remindAt: "",
  contactId: "",
};

export function localDateTimeOn(date: Date, hours: number, minutes = 0): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hours)}:${pad(minutes)}`;
}

export function reminderFormForDay(day: Date): ReminderFormState {
  return { ...EMPTY_REMINDER, remindAt: localDateTimeOn(day, 9) };
}

export function reminderFormFromRecord(record: {
  title: string;
  notes?: string | null;
  at: string;
  contactId?: string | null;
}): ReminderFormState {
  return {
    title: record.title,
    description: record.notes ?? "",
    remindAt: isoToLocalInput(record.at),
    contactId: record.contactId ?? "",
  };
}

export function reminderEndsAt(remindAt: string): string {
  const start = new Date(remindAt);
  if (Number.isNaN(start.getTime())) return "";
  return new Date(start.getTime() + 30 * 60 * 1000).toISOString();
}

export function validateReminder(form: ReminderFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.remindAt) errors.remindAt = "Reminder time is required";
  else if (Number.isNaN(new Date(form.remindAt).getTime())) errors.remindAt = "Reminder time is invalid";
  return errors;
}

export function toReminderInput(form: ReminderFormState): CreateCalendarEventInput {
  return {
    title: form.title.trim(),
    startsAt: localInputToIso(form.remindAt),
    endsAt: reminderEndsAt(form.remindAt),
    slot: null,
    notes: form.description.trim() || null,
    contactId: form.contactId || null,
  };
}

export function isReminderEvent(event: { enquiryId: string | null }): boolean {
  return event.enquiryId == null;
}
