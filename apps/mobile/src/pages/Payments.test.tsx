/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import Payments from "@/pages/Payments";
import { formatMoney } from "@/lib/mobile/format";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmPayment } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listPayments: vi.fn(),
  listClients: vi.fn(),
  listContacts: vi.fn(),
  fetchClient: vi.fn(),
  fetchContactDetail: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

function payment(overrides: Partial<CrmPayment>): CrmPayment {
  return {
    id: "pay-1",
    referenceType: "client",
    referenceId: "client-1",
    enquiryId: null,
    amount: 50000,
    currency: "INR",
    type: "INCOME",
    mode: "UPI",
    status: "paid",
    paidAt: "2026-10-01T00:00:00.000Z",
    reference: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [CRM_PERMISSIONS.paymentsRead];
  remote.listClients.mockResolvedValue(pageOf([]));
  remote.listContacts.mockResolvedValue(pageOf([]));
  remote.listPayments.mockResolvedValue(
    pageOf([
      payment({ id: "in", amount: 50000, type: "INCOME" }),
      payment({ id: "out", amount: 12000, type: "EXPENSE" }),
    ]),
  );
});

describe("payments", () => {
  it("is forbidden without crm.payments.read", () => {
    state.permissions = [];
    renderMobile(<Payments />, ["/payments"]);
    expect(screen.getByText("Your role cannot view payments.")).toBeInTheDocument();
  });

  it("shows income, expense, and the balance of the loaded rows", async () => {
    renderMobile(<Payments />, ["/payments"]);
    const totals = await screen.findByLabelText("Loaded totals");
    expect(within(totals).getByText("Income")).toBeInTheDocument();
    expect(within(totals).getByText("Expense")).toBeInTheDocument();
    expect(within(totals).getByText("Balance")).toBeInTheDocument();
    expect(within(totals).getByText(formatMoney(50000, "INR"))).toBeInTheDocument();
    expect(within(totals).getByText(formatMoney(12000, "INR"))).toBeInTheDocument();
    expect(within(totals).getByText(formatMoney(38000, "INR"))).toHaveClass("text-emerald-700");
  });

  it("opens the booked detail when a client payment is clicked", async () => {
    const contact = {
      id: "contact-1",
      name: "Riya Kapoor",
      mobile: "9811122233",
      type: "client" as const,
      email: "riya.kapoor@example.com",
      companyName: null,
      notes: null,
    };
    const client = {
      id: "client-1",
      contactId: contact.id,
      status: "active" as const,
      billingName: "Riya Kapoor",
      gstin: null,
      convertedFromEnquiryId: "enq-1",
      startsAt: "2026-11-15T10:30:00.000Z",
      endsAt: "2026-11-15T17:30:00.000Z",
    };
    state.permissions = [
      CRM_PERMISSIONS.paymentsRead,
      CRM_PERMISSIONS.clientsRead,
      CRM_PERMISSIONS.contactsRead,
    ];
    remote.listClients.mockResolvedValue(pageOf([client]));
    remote.listContacts.mockResolvedValue(pageOf([contact]));
    remote.listPayments.mockResolvedValue(pageOf([payment({ reference: "TXN-1" })]));
    remote.fetchContactDetail.mockResolvedValue({
      contact,
      enquiries: [],
      payments: [],
      bookings: [
        {
          id: "booking-1",
          title: "15-Nov-2026 Wedding reception 80pax",
          startsAt: "2026-11-15T10:30:00.000Z",
          endsAt: "2026-11-15T17:30:00.000Z",
          slot: "evening",
          contactId: contact.id,
          enquiryId: "enq-1",
          assigneeId: null,
          notes: "Menu final confirmed for the booked reception.",
        },
      ],
    });

    renderMobile(<Payments />, ["/payments"]);
    fireEvent.click(await screen.findByRole("button", { name: /Riya Kapoor/ }));

    expect(await screen.findByRole("tab", { name: "Current booking (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Enquiry (0)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Payments (0)" })).toBeInTheDocument();
    expect(screen.getByText("15-Nov-2026 Wedding reception 80pax")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Payments" })).toBeInTheDocument();
  });

  it("shows one total for a client's payments instead of a row each", async () => {
    remote.listPayments.mockResolvedValue(
      pageOf([
        payment({ id: "final", amount: 45000, reference: "Final payment" }),
        payment({ id: "second", amount: 25000, reference: "Second payment", mode: "CASH" }),
        payment({ id: "advance", amount: 5000, reference: "Advance" }),
      ]),
    );

    renderMobile(<Payments />, ["/payments"]);

    expect(await screen.findByRole("button", { name: /3 payments/ })).toHaveTextContent(formatMoney(75000, "INR"));
    expect(screen.queryByText("Final payment")).not.toBeInTheDocument();
    expect(screen.queryByText(formatMoney(45000, "INR"))).not.toBeInTheDocument();
  });
});
