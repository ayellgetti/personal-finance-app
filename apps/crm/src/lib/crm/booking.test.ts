import { describe, expect, it } from "vitest";
import { validateBooking } from "@/lib/crm/booking";

describe("validateBooking", () => {
  const from = new Date(2026, 8, 21, 12, 0, 0);

  it("rejects a booking start before today", () => {
    expect(
      validateBooking(
        { startsAt: "2026-09-20T10:00", endsAt: "2026-09-20T18:00", slot: "" },
        from,
      ).startsAt,
    ).toBe("Booking date must be today or in the future");
  });

  it("allows a booking that starts today", () => {
    expect(
      validateBooking(
        { startsAt: "2026-09-21T10:00", endsAt: "2026-09-21T18:00", slot: "" },
        from,
      ),
    ).toEqual({});
  });
});
