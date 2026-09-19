import type { CrmEventSlot } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";

export const CRM_EVENT_SLOTS = ["morning", "evening", "full_day"] as const;

const IST = "Asia/Kolkata";

const SLOT_END_IST: Record<CrmEventSlot, { hour: number; minute: number }> = {
  morning: { hour: 16, minute: 0 },
  evening: { hour: 23, minute: 0 },
  full_day: { hour: 23, minute: 0 },
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function endsAtFromSlot(startsAt: Date, slot: CrmEventSlot): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(startsAt);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const end = SLOT_END_IST[slot];
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(end.hour)}:${pad(end.minute)}:00+05:30`,
  );
}

export function resolveEventRange(input: {
  startsAt: Date;
  endsAt?: Date | null;
  slot?: CrmEventSlot | null;
}): { startsAt: Date; endsAt: Date; slot: CrmEventSlot | null } {
  const slot = input.slot ?? null;
  const endsAt = input.endsAt ?? (slot ? endsAtFromSlot(input.startsAt, slot) : null);
  if (!endsAt) {
    throw new HttpError(422, "End datetime or slot is required");
  }
  if (Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= input.startsAt.getTime()) {
    throw new HttpError(422, "endsAt must be after startsAt");
  }
  return { startsAt: input.startsAt, endsAt, slot };
}
