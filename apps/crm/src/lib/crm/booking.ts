import { endsAtFromSlot, isLocalDateKeyOnOrAfterToday, localInputToIso } from "@/lib/crm/display";
import type { ConvertEnquiryInput, CrmCalendarEvent, CrmEventSlot } from "@/types/crm";

export type BookingFormState = {
  startsAt: string;
  endsAt: string;
  slot: "" | CrmEventSlot;
};

export const EMPTY_BOOKING: BookingFormState = {
  startsAt: "",
  endsAt: "",
  slot: "",
};

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

export function toBookingInput(form: BookingFormState): ConvertEnquiryInput {
  return {
    startsAt: localInputToIso(form.startsAt),
    endsAt: form.endsAt ? localInputToIso(form.endsAt) : null,
    slot: form.slot || null,
  };
}

export function applyBookingSlot(form: BookingFormState, slot: BookingFormState["slot"]): BookingFormState {
  const next = { ...form, slot };
  if (slot && form.startsAt) {
    next.endsAt = endsAtFromSlot(form.startsAt, slot);
  }
  return next;
}

export function applyBookingStart(form: BookingFormState, startsAt: string): BookingFormState {
  const next = { ...form, startsAt };
  if (form.slot && startsAt) {
    next.endsAt = endsAtFromSlot(startsAt, form.slot);
  }
  return next;
}

export function pickCurrentBooking(
  bookings: CrmCalendarEvent[],
  convertedFromEnquiryId?: string | null,
): CrmCalendarEvent | null {
  if (bookings.length === 0) return null;
  const linked = convertedFromEnquiryId
    ? bookings.filter((booking) => booking.enquiryId === convertedFromEnquiryId)
    : bookings;
  const pool = linked.length > 0 ? linked : bookings;
  const now = Date.now();
  const upcoming = pool
    .filter((booking) => new Date(booking.endsAt).getTime() >= now)
    .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
  return upcoming[0] ?? [...pool].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime()).at(-1) ?? null;
}

export function bookingDatesForClient(
  client: { startsAt: string | null; endsAt: string | null; convertedFromEnquiryId: string | null },
  bookings: CrmCalendarEvent[] = [],
): { startsAt: string | null; endsAt: string | null } {
  if (client.startsAt && client.endsAt) {
    return { startsAt: client.startsAt, endsAt: client.endsAt };
  }
  const current = pickCurrentBooking(bookings, client.convertedFromEnquiryId);
  return {
    startsAt: client.startsAt ?? current?.startsAt ?? null,
    endsAt: client.endsAt ?? current?.endsAt ?? null,
  };
}
