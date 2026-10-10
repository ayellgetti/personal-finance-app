import type { ConvertEnquiryInput, CrmCalendarEvent, CrmEventSlot } from "@/types/crm";

export type BookingFormState = {
  startsAt: string;
  endsAt: string;
  slot: "" | CrmEventSlot;
};

const SLOT_END_IST: Record<CrmEventSlot, { hour: number; minute: number }> = {
  morning: { hour: 16, minute: 0 },
  evening: { hour: 23, minute: 0 },
  full_day: { hour: 23, minute: 0 },
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isLocalDateKeyOnOrAfterToday(value: string, from = new Date()): boolean {
  return value >= toLocalDateKey(from);
}

export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

/** Slot end times are IST windows on the booking's start day. */
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
  const end = SLOT_END_IST[slot];
  return isoToLocalInput(
    new Date(`${year}-${pad(month)}-${pad(day)}T${pad(end.hour)}:${pad(end.minute)}:00+05:30`).toISOString(),
  );
}

export function validateBooking(form: BookingFormState, from = new Date()): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.startsAt) errors.startsAt = "Start date and time is required";
  else if (!isLocalDateKeyOnOrAfterToday(form.startsAt.slice(0, 10), from)) {
    errors.startsAt = "Booking date must be today or in the future";
  }
  if (!form.endsAt && !form.slot) {
    errors.endsAt = "End date and time or a slot is required";
    errors.slot = "End date and time or a slot is required";
  }
  if (form.startsAt && form.endsAt && new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
    errors.endsAt = "End must be after start";
  }
  return errors;
}

export function toBookingInput(form: BookingFormState, billingName?: string): ConvertEnquiryInput {
  const name = billingName?.trim();
  return {
    billingName: name || undefined,
    startsAt: localInputToIso(form.startsAt),
    endsAt: form.endsAt ? localInputToIso(form.endsAt) : null,
    slot: form.slot || null,
  };
}

export function applyBookingSlot(form: BookingFormState, slot: BookingFormState["slot"]): BookingFormState {
  const next = { ...form, slot };
  if (slot && form.startsAt) next.endsAt = endsAtFromSlot(form.startsAt, slot);
  return next;
}

/** Upcoming booking for a contact, preferring the enquiry this client was converted from. */
export function pickCurrentBooking(
  bookings: CrmCalendarEvent[],
  convertedFromEnquiryId?: string | null,
  now = Date.now(),
): CrmCalendarEvent | null {
  if (bookings.length === 0) return null;
  const linked = convertedFromEnquiryId
    ? bookings.filter((booking) => booking.enquiryId === convertedFromEnquiryId)
    : bookings;
  const pool = linked.length > 0 ? linked : bookings;
  const upcoming = pool
    .filter((booking) => new Date(booking.endsAt).getTime() >= now)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  return upcoming[0] ?? [...pool].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()).at(-1) ?? null;
}

export function applyBookingStart(form: BookingFormState, startsAt: string): BookingFormState {
  const next = { ...form, startsAt };
  if (form.slot && startsAt) next.endsAt = endsAtFromSlot(startsAt, form.slot);
  return next;
}
