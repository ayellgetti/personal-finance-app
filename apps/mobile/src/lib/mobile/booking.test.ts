import { describe, expect, it } from "vitest";
import { endsAtFromSlot, pickCurrentBooking, validateBooking } from "@/lib/mobile/booking";
import type { CrmCalendarEvent } from "@/types/crm";

describe("validateBooking", () => {
  const from = new Date(2026, 8, 21, 12, 0, 0);

  it("rejects a booking start before today", () => {
    expect(
      validateBooking({ startsAt: "2026-09-20T10:00", endsAt: "2026-09-20T18:00", slot: "" }, from).startsAt,
    ).toBe("Booking date must be today or in the future");
  });

  it("requires a start and either an end or a slot", () => {
    expect(validateBooking({ startsAt: "", endsAt: "", slot: "" }, from)).toMatchObject({
      startsAt: "Start date and time is required",
      endsAt: "End date and time or a slot is required",
    });
  });

  it("allows a booking that starts today", () => {
    expect(validateBooking({ startsAt: "2026-09-21T10:00", endsAt: "2026-09-21T18:00", slot: "" }, from)).toEqual(
      {},
    );
  });
});

describe("pickCurrentBooking", () => {
  const booking = (id: string, startsAt: string, endsAt: string, enquiryId: string | null): CrmCalendarEvent =>
    ({
      id,
      title: id,
      startsAt,
      endsAt,
      slot: null,
      contactId: "c1",
      enquiryId,
      assigneeId: null,
      notes: null,
    }) as CrmCalendarEvent;

  it("prefers the upcoming booking linked to the converted enquiry", () => {
    const chosen = pickCurrentBooking(
      [
        booking("past", "2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z", "enq-1"),
        booking("next", "2026-12-01T00:00:00.000Z", "2026-12-02T00:00:00.000Z", "enq-1"),
        booking("other", "2026-11-01T00:00:00.000Z", "2026-11-02T00:00:00.000Z", "enq-2"),
      ],
      "enq-1",
      new Date("2026-10-10T00:00:00.000Z").getTime(),
    );
    expect(chosen?.id).toBe("next");
  });
});

describe("endsAtFromSlot", () => {
  it("closes a morning slot at 16:00 IST", () => {
    expect(new Date(endsAtFromSlot("2026-10-10T09:00:00+05:30", "morning")).toISOString()).toBe(
      "2026-10-10T10:30:00.000Z",
    );
  });
});