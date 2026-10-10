/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MonthCategories } from "@/components/calendar/MonthCategories";
import { renderMobile } from "@/test/render-mobile";
import type { CrmCalendarItem, CrmPayment } from "@/types/crm";

const ITEMS: CrmCalendarItem[] = [
  {
    kind: "event",
    id: "e1",
    title: "Site visit",
    at: new Date(2026, 9, 10, 9, 0).toISOString(),
    endsAt: null,
    contactId: null,
    enquiryId: null,
  },
  {
    kind: "followup",
    id: "f1",
    title: "Call Priya",
    at: new Date(2026, 9, 11, 11, 0).toISOString(),
    endsAt: null,
    contactId: null,
    enquiryId: null,
  },
  {
    kind: "task",
    id: "t1",
    title: "Send quote",
    at: new Date(2026, 9, 12, 8, 0).toISOString(),
    endsAt: null,
    contactId: null,
    enquiryId: null,
  },
];

const PAYMENTS: CrmPayment[] = [
  {
    id: "p1",
    referenceType: "client",
    referenceId: "client-1",
    enquiryId: null,
    amount: 25000,
    currency: "INR",
    type: "INCOME",
    mode: "UPI",
    status: "paid",
    paidAt: new Date(2026, 9, 10, 15, 0).toISOString(),
    reference: "UPI-10",
  },
];

describe("month categories", () => {
  it("lists every category for the month and filters from the tab row", () => {
    const onCategory = vi.fn();
    const { rerender } = renderMobile(
      <MonthCategories
        category="all"
        onCategory={onCategory}
        items={ITEMS}
        payments={PAYMENTS}
        query=""
        showPayments
      />,
    );

    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Site visit")).toBeInTheDocument();
    expect(screen.getByText("Call Priya")).toBeInTheDocument();
    expect(screen.getByText("Send quote")).toBeInTheDocument();
    expect(screen.getByText(/UPI-10/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Follow-up" }));
    expect(onCategory).toHaveBeenCalledWith("followup");

    rerender(
      <MonthCategories
        category="followup"
        onCategory={onCategory}
        items={ITEMS}
        payments={PAYMENTS}
        query=""
        showPayments
      />,
    );

    expect(screen.getByText("Call Priya")).toBeInTheDocument();
    expect(screen.queryByText("Site visit")).not.toBeInTheDocument();
    expect(screen.queryByText(/UPI-10/)).not.toBeInTheDocument();
  });

  it("hides the payment tab when the role cannot read payments", () => {
    renderMobile(
      <MonthCategories
        category="all"
        onCategory={vi.fn()}
        items={ITEMS}
        payments={[]}
        query=""
        showPayments={false}
      />,
    );

    expect(screen.queryByRole("tab", { name: "Payment" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Booked" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Reminder" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Other" })).toBeInTheDocument();
  });
});