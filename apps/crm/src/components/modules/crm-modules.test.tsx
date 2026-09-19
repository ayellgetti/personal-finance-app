/** @vitest-environment jsdom */
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { CalendarModule } from "@/components/modules/CalendarModule";
import { ClientsModule } from "@/components/modules/ClientsModule";
import { ContactsModule } from "@/components/modules/ContactsModule";
import { DashboardModule } from "@/components/modules/DashboardModule";
import { EnquiriesModule } from "@/components/modules/EnquiriesModule";
import { FollowUpsModule } from "@/components/modules/FollowUpsModule";
import { TasksModule } from "@/components/modules/TasksModule";
import { ApiError } from "@/lib/api";
import {
  adminMe,
  convertEnquiry,
  emptyPage,
  fetchContactDetail,
  fetchCrmMe,
  fetchDashboard,
  listCalendar,
  listClients,
  listContacts,
  listEnquiries,
  listFollowUps,
  listTasks,
  updateTaskStatus,
} from "@/test/crm-remote-mock";
import { renderCrm } from "@/test/render-crm";
import type { CrmCalendarItem, CrmClient, CrmContact, CrmEnquiry, CrmPayment, CrmTask } from "@/types/crm";

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/crm/remote", async () => import("@/test/crm-remote-mock"));

const contacts: CrmContact[] = [
  {
    id: "c-lead",
    name: "Lead Person",
    mobile: "+919111111111",
    type: "lead",
    email: "lead@example.com",
    companyName: "Lead Co",
    notes: null,
  },
  {
    id: "c-vendor",
    name: "Vendor Person",
    mobile: "+919222222222",
    type: "vendor",
    email: null,
    companyName: "Vendor Co",
    notes: null,
  },
];

const contact: CrmContact = {
  id: "contact-1",
  name: "Priya Shah",
  mobile: "+919888888888",
  type: "lead",
  email: null,
  companyName: "Acme",
  notes: null,
};

const enquiry: CrmEnquiry = {
  id: "enquiry-1",
  contactId: contact.id,
  title: "Banquet inquiry",
  source: "Website",
  status: "new",
  closedReason: null,
  expectedValue: 50000,
  assignedToId: null,
  notes: null,
  dueDateWindow: "within_7_days",
  dueDate: "2026-09-24T23:59:59.000Z",
  nextFollowupDate: null,
  createdAt: "2026-09-15T08:00:00.000Z",
  updatedAt: "2026-09-15T08:00:00.000Z",
};

const client: CrmClient = {
  id: "client-1",
  contactId: contact.id,
  status: "active",
  billingName: "Acme Events",
  gstin: null,
  convertedFromEnquiryId: enquiry.id,
};

const draft: CrmTask = {
  id: "task-1",
  title: "Call prospect",
  description: null,
  status: "todo",
  assigneeId: null,
  dueAt: null,
  contactId: null,
  enquiryId: null,
};

function ConvertFlow() {
  const [view, setView] = useState<"enquiries" | "clients">("enquiries");
  return (
    <div>
      <button type="button" onClick={() => setView("clients")}>
        Go to clients
      </button>
      {view === "enquiries" ? (
        <EnquiriesModule />
      ) : (
        <ClientsModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />
      )}
    </div>
  );
}

describe("CRM modules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCrmMe.mockResolvedValue(adminMe);
    listContacts.mockResolvedValue(emptyPage());
    listEnquiries.mockResolvedValue(emptyPage());
    listFollowUps.mockResolvedValue(emptyPage());
    listClients.mockResolvedValue(emptyPage());
    listTasks.mockResolvedValue(emptyPage());
    listCalendar.mockResolvedValue({ items: [] });
    convertEnquiry.mockReset();
    updateTaskStatus.mockReset();
    fetchContactDetail.mockReset();
    fetchContactDetail.mockImplementation(async (id: string) => ({
      contact: {
        id,
        name: "",
        mobile: "",
        type: "lead",
        email: null,
        companyName: null,
        notes: null,
      },
      enquiries: [],
      payments: [],
      bookings: [],
    }));
  });

  it("validates the contact form before create", async () => {
    renderCrm(<ContactsModule />);
    await screen.findByRole("button", { name: "Add contact" });
    fireEvent.click(screen.getByRole("button", { name: "Add contact" }));
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("Mobile is required")).toBeInTheDocument();
  });

  it("filters the table by contact type", async () => {
    listContacts.mockImplementation(async (query?: { type?: string }) => {
      const items = query?.type ? contacts.filter((row) => row.type === query.type) : contacts;
      return emptyPage(items);
    });
    renderCrm(<ContactsModule />);
    expect(await screen.findByText("Lead Person")).toBeInTheDocument();
    expect(screen.getByText("Vendor Person")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "lead" } });

    await waitFor(() => {
      expect(screen.getByText("Lead Person")).toBeInTheDocument();
      expect(screen.queryByText("Vendor Person")).not.toBeInTheDocument();
    });
    expect(listContacts).toHaveBeenCalledWith(expect.objectContaining({ type: "lead" }));
  });

  it("shows an empty state when there are no contacts", async () => {
    renderCrm(<ContactsModule />);
    expect(await screen.findByText("No contacts yet")).toBeInTheDocument();
  });

  it("uses icon view, edit and remove actions with accessible names", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    renderCrm(<ContactsModule />);
    const view = await screen.findByRole("button", { name: "View" });
    const edit = screen.getByRole("button", { name: "Edit" });
    const remove = screen.getByRole("button", { name: "Remove" });
    expect(view).toBeInTheDocument();
    expect(edit).toBeInTheDocument();
    expect(remove).toBeInTheDocument();
    expect(view.querySelector("svg")).not.toBeNull();
    expect(edit.querySelector("svg")).not.toBeNull();
    expect(remove.querySelector("svg")).not.toBeNull();
  });

  it("opens a contact view with enquiry follow-ups and payments tabs", async () => {
    const payment: CrmPayment = {
      id: "pay-1",
      referenceType: "client",
      referenceId: "client-1",
      enquiryId: enquiry.id,
      amount: 15000,
      currency: "INR",
      type: "INCOME",
      mode: "UPI",
      status: "paid",
      paidAt: "2026-09-16T00:00:00.000Z",
      reference: "TXN-1",
    };
    listContacts.mockResolvedValue(emptyPage([contact]));
    fetchContactDetail.mockResolvedValue({
      contact,
      enquiries: [
        {
          ...enquiry,
          followUps: [
            {
              id: "fu-1",
              enquiryId: enquiry.id,
              contactId: contact.id,
              stage: "contacted",
              dueAt: "2026-09-16T10:00:00.000Z",
              nextFollowupDate: "2026-09-20T00:00:00.000Z",
              notes: "Called the venue",
            },
          ],
        },
        {
          ...enquiry,
          id: "enquiry-2",
          title: "Second catering enquiry",
          status: "qualified",
          followUps: [],
        },
      ],
      payments: [payment],
      bookings: [],
    });
    renderCrm(<ContactsModule />);
    fireEvent.click(await screen.findByRole("button", { name: "View" }));

    expect(await screen.findByRole("tab", { name: "Current booking (0)" })).toBeInTheDocument();
    expect(await screen.findByRole("tab", { name: "Enquiries (2)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Payments (1)" })).toBeInTheDocument();
    expect(screen.getByText("Banquet inquiry")).toBeInTheDocument();
    expect(screen.getByText("Second catering enquiry")).toBeInTheDocument();
    expect(screen.getByText("Called the venue")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Payments (1)" }));
    expect(await screen.findByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
  });

  it("shows the current booking tab on the contact view", async () => {
    listContacts.mockResolvedValue(emptyPage([{ ...contact, type: "client" }]));
    fetchContactDetail.mockResolvedValue({
      contact: { ...contact, type: "client" },
      enquiries: [{ ...enquiry, status: "closed", closedReason: "Booked", followUps: [] }],
      payments: [],
      bookings: [
        {
          id: "event-1",
          title: "Banquet inquiry",
          startsAt: "2026-12-12T10:30:00.000Z",
          endsAt: "2026-12-12T17:30:00.000Z",
          slot: "evening",
          contactId: contact.id,
          enquiryId: enquiry.id,
          assigneeId: null,
          notes: null,
        },
      ],
    });
    renderCrm(<ContactsModule />);
    fireEvent.click(await screen.findByRole("button", { name: "View" }));
    expect(await screen.findByRole("tab", { name: "Current booking (1)" })).toBeInTheDocument();
    expect(screen.getByText("Evening")).toBeInTheDocument();
    expect(screen.getByText("Linked enquiry")).toBeInTheDocument();
  });

  it("shows an error state when the list fails", async () => {
    listContacts.mockRejectedValue(new Error("Contacts unavailable"));
    renderCrm(<ContactsModule />);
    expect(await screen.findByText("Unable to load")).toBeInTheDocument();
    expect(screen.getByText("Contacts unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("shows no access when contacts read is forbidden", async () => {
    listContacts.mockRejectedValue(new ApiError(403, "Forbidden"));
    renderCrm(<ContactsModule />);
    expect(await screen.findByText("No access")).toBeInTheDocument();
  });

  it("moves a task into the matching status column", async () => {
    listTasks.mockResolvedValue(emptyPage([draft]));
    updateTaskStatus.mockImplementation(async (_id, status) => ({ ...draft, status }));
    renderCrm(<TasksModule />);
    expect(await screen.findByText("Call prospect")).toBeInTheDocument();
    expect(screen.getByText(/Todo \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/In-Progress \(0\)/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Move to In-Progress" }));

    await waitFor(() => {
      expect(screen.getByText(/Todo \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/In-Progress \(1\)/)).toBeInTheDocument();
    });
    expect(updateTaskStatus).toHaveBeenCalledWith("task-1", "in_progress");
  });

  it("requires a due date when creating an enquiry", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    renderCrm(<EnquiriesModule />);
    await screen.findByRole("button", { name: "Add enquiry" });
    fireEvent.click(screen.getByRole("button", { name: "Add enquiry" }));
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Due date is required")).toBeInTheDocument();
  });

  it("accepts a calendar shortcut as the enquiry due date", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    renderCrm(<EnquiriesModule />);
    fireEvent.click(await screen.findByRole("button", { name: "Add enquiry" }));
    fireEvent.click(screen.getByRole("button", { name: "7 days" }));
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.queryByText("Due date is required")).not.toBeInTheDocument();
  });

  it("shows the converted client on the Clients screen", async () => {
    const created: CrmClient[] = [];
    listContacts.mockResolvedValue(emptyPage([contact]));
    listEnquiries.mockResolvedValue(emptyPage([enquiry]));
    listClients.mockImplementation(async () => emptyPage(created));
    convertEnquiry.mockImplementation(async () => {
      created.push(client);
      return {
        enquiry: { ...enquiry, status: "closed" as const },
        contact: { ...contact, type: "client" as const },
        client,
        event: {
          id: "event-1",
          title: enquiry.title,
          startsAt: "2026-12-12T10:30:00.000Z",
          endsAt: "2026-12-12T17:30:00.000Z",
          slot: "evening" as const,
          contactId: contact.id,
          enquiryId: enquiry.id,
          assigneeId: null,
          notes: null,
        },
      };
    });

    renderCrm(<ConvertFlow />);
    expect(await screen.findByText("Banquet inquiry")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Convert" }));
    expect(await screen.findByRole("heading", { name: "Convert to booked" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Event start date & time"), { target: { value: "2026-12-12T16:00" } });
    fireEvent.change(screen.getByLabelText("Slot"), { target: { value: "evening" } });
    fireEvent.click(screen.getByRole("button", { name: "Convert to booked" }));
    await waitFor(() =>
      expect(convertEnquiry).toHaveBeenCalledWith(
        "enquiry-1",
        expect.objectContaining({ slot: "evening" }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Go to clients" }));
    expect(await screen.findByText("Acme Events")).toBeInTheDocument();
  });

  it("does not nest calendar item buttons inside a day button", async () => {
    const at = new Date();
    at.setDate(Math.min(at.getDate(), 28));
    at.setHours(14, 0, 0, 0);
    const item: CrmCalendarItem = {
      kind: "task",
      id: "cal-task-1",
      title: "Send venue proposal",
      at: at.toISOString(),
      endsAt: null,
    };
    listCalendar.mockResolvedValue({ items: [item] });
    renderCrm(<CalendarModule />);

    const itemButton = await screen.findByRole("button", { name: "Send venue proposal" });
    expect(itemButton.closest("button")).toBe(itemButton);
    expect(screen.queryByRole("button", { name: /10 Send venue proposal/ })).not.toBeInTheDocument();
  });

  it("shows lead created, follow-up, and next contact on the Follow-ups timeline", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    listEnquiries.mockResolvedValue(
      emptyPage([
        {
          ...enquiry,
          status: "contacted",
          nextFollowupDate: "2026-09-20T00:00:00.000Z",
        },
      ]),
    );
    listFollowUps.mockResolvedValue(
      emptyPage([
        {
          id: "fu-1",
          enquiryId: enquiry.id,
          contactId: contact.id,
          stage: "contacted",
          dueAt: "2026-09-16T10:00:00.000Z",
          nextFollowupDate: "2026-09-20T00:00:00.000Z",
          notes: "Called the venue",
        },
      ]),
    );

    renderCrm(<FollowUpsModule />);

    expect(await screen.findByText("Lead created")).toBeInTheDocument();
    expect(screen.getByText("Follow-up — Contacted")).toBeInTheDocument();
    expect(screen.getByText("Called the venue")).toBeInTheDocument();
    expect(screen.getByText("Next follow-up")).toBeInTheDocument();
  });

  it("opens add follow-up for the enquiry from the recent timeline title", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    listEnquiries.mockResolvedValue(emptyPage([enquiry]));
    renderCrm(<FollowUpsModule />);
    fireEvent.click(await screen.findByRole("button", { name: "Add followup" }));
    expect(await screen.findByRole("heading", { name: "Add follow-up" })).toBeInTheDocument();
    const select = document.getElementById("followup-enquiry") as HTMLSelectElement;
    expect(select.value).toBe("enquiry-1");
  });

  it("hides the add follow-up button once the lead is converted (closed) in the recent timeline", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    listEnquiries.mockResolvedValue(
      emptyPage([{ ...enquiry, status: "closed" as const, closedReason: "Booked" }]),
    );
    renderCrm(<FollowUpsModule />);
    expect(await screen.findByText("Banquet inquiry")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add followup" })).not.toBeInTheDocument();
  });

  it("filters the follow-up recent view by today, tomorrow, and upcoming", async () => {
    const now = new Date();
    const dueToday: CrmEnquiry = {
      ...enquiry,
      id: "enquiry-today",
      title: "Due today enquiry",
      status: "contacted",
      nextFollowupDate: now.toISOString(),
    };
    const dueUpcoming: CrmEnquiry = {
      ...enquiry,
      id: "enquiry-upcoming",
      title: "Due later enquiry",
      status: "contacted",
      nextFollowupDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    listContacts.mockResolvedValue(emptyPage([contact]));
    listEnquiries.mockResolvedValue(emptyPage([dueToday, dueUpcoming]));
    renderCrm(<FollowUpsModule />);

    expect(await screen.findByText("Due today enquiry")).toBeInTheDocument();
    expect(screen.getByText("Due later enquiry")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("When"), { target: { value: "today" } });
    await waitFor(() => {
      expect(screen.getByText("Due today enquiry")).toBeInTheDocument();
      expect(screen.queryByText("Due later enquiry")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("When"), { target: { value: "upcoming" } });
    await waitFor(() => {
      expect(screen.queryByText("Due today enquiry")).not.toBeInTheDocument();
      expect(screen.getByText("Due later enquiry")).toBeInTheDocument();
    });
  });

  it("pre-selects the today due filter from the dashboard", async () => {
    const now = new Date();
    const dueToday: CrmEnquiry = {
      ...enquiry,
      id: "enquiry-today",
      title: "Due today enquiry",
      status: "contacted",
      nextFollowupDate: now.toISOString(),
    };
    const dueUpcoming: CrmEnquiry = {
      ...enquiry,
      id: "enquiry-upcoming",
      title: "Due later enquiry",
      status: "contacted",
      nextFollowupDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };
    listContacts.mockResolvedValue(emptyPage([contact]));
    listEnquiries.mockResolvedValue(emptyPage([dueToday, dueUpcoming]));
    renderCrm(<FollowUpsModule initialDueFilter="today" />);

    expect(await screen.findByText("Due today enquiry")).toBeInTheDocument();
    expect(screen.queryByText("Due later enquiry")).not.toBeInTheDocument();
    expect(screen.getByLabelText("When")).toHaveValue("today");
  });

  it("opens Follow-ups with today selected from the dashboard card", async () => {
    const onOpenFollowUps = vi.fn();
    fetchDashboard.mockResolvedValue({
      contactsByType: { lead: 0, client: 0, vendor: 0, employee: 0 },
      enquiries: { open: 0, closed: 0 },
      leadsGeneratedToday: 0,
      customerDueToday: 0,
      customerDueItems: [],
      overdueFollowUps: 2,
      followUpsToday: 4,
      paymentsPaidThisMonth: 0,
      paymentsIncomeThisMonth: 0,
      paymentsExpenseThisMonth: 0,
      tasksByStatus: { todo: 0, in_progress: 0, in_review: 0, done: 0 },
    });
    renderCrm(<DashboardModule onOpenFollowUps={onOpenFollowUps} />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Follow-ups for today" })).toHaveTextContent("4");
    });
    fireEvent.click(screen.getByRole("button", { name: "Follow-ups for today" }));
    expect(onOpenFollowUps).toHaveBeenCalledWith("today");
  });

  it("opens a client view sidebar from the client row", async () => {
    const clientContact: CrmContact = { ...contact, type: "client" };
    listContacts.mockResolvedValue(emptyPage([clientContact]));
    listClients.mockResolvedValue(emptyPage([{ ...client, gstin: "27AAPFU0939F1ZV" }]));
    renderCrm(<ClientsModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);

    fireEvent.click(await screen.findByRole("button", { name: "View" }));

    expect(await screen.findByRole("heading", { name: "Acme Events" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Current booking/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Enquiry/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Payments/ })).toBeInTheDocument();
    expect(screen.getAllByText("27AAPFU0939F1ZV")).toHaveLength(2);
    expect(screen.getByText("+919888888888")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("shows customer name and mobile in the follow-up enquiry dropdown", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    listEnquiries.mockResolvedValue(emptyPage([enquiry]));
    renderCrm(<FollowUpsModule />);
    fireEvent.click(await screen.findByRole("button", { name: "Add follow-up" }));
    expect(
      await screen.findByRole("option", {
        name: "Priya Shah · +919888888888 · Banquet inquiry — New",
      }),
    ).toBeInTheDocument();
  });
});
