import { describe, expect, it } from "vitest";
import { groupPayments } from "@/lib/mobile/payment-groups";
import type { CrmPayment } from "@/types/crm";

function payment(overrides: Partial<CrmPayment>): CrmPayment {
  return {
    id: "pay-1",
    referenceType: "client",
    referenceId: "client-1",
    enquiryId: null,
    amount: 1000,
    currency: "INR",
    type: "INCOME",
    mode: "UPI",
    status: "paid",
    paidAt: "2026-10-10T00:00:00.000Z",
    reference: null,
    ...overrides,
  };
}

describe("payment groups", () => {
  it("sums one client's payments into a single total", () => {
    const groups = groupPayments([
      payment({ id: "a", amount: 45000, reference: "Final payment" }),
      payment({ id: "b", amount: 25000, reference: "Second payment", mode: "CASH" }),
      payment({ id: "c", amount: 5000, reference: "Advance" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.net).toBe(75000);
    expect(groups[0]?.payments).toHaveLength(3);
    expect(groups[0]?.status).toBe("paid");
  });

  it("keeps a second booking and a vendor on their own totals", () => {
    const groups = groupPayments([
      payment({ id: "a", amount: 1000, bookingId: "booking-1" }),
      payment({ id: "b", amount: 2000, bookingId: "booking-2" }),
      payment({ id: "c", referenceType: "vendor", referenceId: "vendor-1", type: "EXPENSE", amount: 500 }),
    ]);

    expect(groups).toHaveLength(3);
    expect(groups.find((group) => group.bookingId === "booking-1")?.net).toBe(1000);
    expect(groups.find((group) => group.bookingId === "booking-2")?.net).toBe(2000);
    expect(groups.find((group) => group.referenceType === "vendor")?.net).toBe(-500);
  });
});
