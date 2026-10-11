/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import Calendar from "@/pages/Calendar";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listCalendar: vi.fn(),
  listClients: vi.fn(),
  listContacts: vi.fn(),
  listPayments: vi.fn(),
  fetchClient: vi.fn(),
  fetchEnquiry: vi.fn(),
  fetchContactDetail: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [
    CRM_PERMISSIONS.calendarRead,
    CRM_PERMISSIONS.clientsRead,
    CRM_PERMISSIONS.contactsRead,
  ];
  remote.listClients.mockResolvedValue(pageOf([]));
  remote.listContacts.mockResolvedValue(pageOf([]));
  remote.listPayments.mockResolvedValue(pageOf([]));
  remote.listCalendar.mockResolvedValue({ items: [] });
});

describe("calendar", () => {
  it("opens the booked detail when a booking is clicked", async () => {
    const at = new Date();
    at.setDate(Math.min(at.getDate(), 28));
    at.setHours(16, 0, 0, 0);
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
      startsAt: at.toISOString(),
      endsAt: new Date(at.getTime() + 7 * 60 * 60 * 1000).toISOString(),
    };
    remote.listClients.mockResolvedValue(pageOf([client]));
    remote.listContacts.mockResolvedValue(pageOf([contact]));
    remote.listCalendar.mockResolvedValue({
      items: [
        {
          kind: "booking",
          id: "booking-1",
          title: "Wedding reception 80pax",
          at: at.toISOString(),
          endsAt: client.endsAt,
          contactId: contact.id,
          enquiryId: "enq-1",
          slot: "evening",
          notes: null,
        },
      ],
    });
    remote.fetchContactDetail.mockResolvedValue({
      contact,
      enquiries: [],
      payments: [],
      bookings: [
        {
          id: "booking-1",
          title: "Wedding reception 80pax",
          startsAt: at.toISOString(),
          endsAt: client.endsAt,
          slot: "evening",
          contactId: contact.id,
          enquiryId: "enq-1",
          assigneeId: null,
          notes: "Menu final confirmed for the booked reception.",
        },
      ],
    });

    renderMobile(<Calendar />, ["/calendar"]);
    fireEvent.click(await screen.findByRole("button", { name: /Wedding reception 80pax/ }));

    expect(await screen.findByRole("tab", { name: "Current booking (1)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Riya Kapoor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Contact" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Payments" })).toBeInTheDocument();
  });
});
