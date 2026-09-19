import { endsAtFromSlot, localInputToIso } from "@/lib/crm/display";
import type { ConvertEnquiryInput, CrmEventSlot } from "@/types/crm";

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

export function validateBooking(form: BookingFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.startsAt) errors.startsAt = "Start date and time is required";
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
