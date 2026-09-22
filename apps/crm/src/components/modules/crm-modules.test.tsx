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
import { RemindersModule } from "@/components/modules/RemindersModule";
import { RolesModule } from "@/components/modules/RolesModule";
import { TasksModule } from "@/components/modules/TasksModule";
import { UsersModule } from "@/components/modules/UsersModule";
import { ApiError } from "@/lib/api";
import {
  adminMe,
  convertEnquiry,
  createCalendarEvent,
  createRole,
  emptyPage,
  fetchContactDetail,
  fetchCrmMe,
  fetchDashboard,
  listCalendar,
  listCalendarEvents,
  listClients,
  listContacts,
  listEnquiries,
  listFollowUpCalendar,
  listFollowUps,
  listPermissions,
  listRoles,
  listTasks,
  listCrmUsers,
  updateCalendarEvent,
  updateRole,
  updateTaskStatus,
} from "@/test/crm-remote-mock";
import { renderCrm } from "@/test/render-crm";
import { formatDateTime } from "@/lib/crm/display";
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
  startsAt: "2026-12-12T10:30:00.000Z",
  endsAt: "2026-12-12T17:30:00.000Z",
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
        Go to booked
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
    listCalendarEvents.mockResolvedValue(emptyPage());
    listRoles.mockResolvedValue([]);
    listPermissions.mockResolvedValue([]);
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

  it("edits the booking notes and copies them to the clipboard", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const booking = {
      id: "event-1",
      title: "Banquet inquiry",
      startsAt: "2026-12-12T10:30:00.000Z",
      endsAt: "2026-12-12T17:30:00.000Z",
      slot: "evening" as const,
      contactId: contact.id,
      enquiryId: enquiry.id,
      assigneeId: null,
      notes: "Menu: Mix deluxe",
    };
    const finalNotes = "Menu: Mix deluxe\nFinal menu: paneer tikka, dal makhani";
    listContacts.mockResolvedValue(emptyPage([{ ...contact, type: "client" }]));
    fetchContactDetail.mockResolvedValue({
      contact: { ...contact, type: "client" },
      enquiries: [{ ...enquiry, status: "closed", closedReason: "Booked", followUps: [] }],
      payments: [],
      bookings: [booking],
    });
    updateCalendarEvent.mockImplementation(async (id: string, input: { notes?: string | null }) => ({
      ...booking,
      id,
      notes: input.notes ?? null,
    }));

    renderCrm(<ContactsModule />);
    fireEvent.click(await screen.findByRole("button", { name: "View" }));
    expect(await screen.findByText("Menu: Mix deluxe")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit notes" }));
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: finalNotes } });
    fireEvent.click(screen.getByRole("button", { name: "Save notes" }));

    await waitFor(() => {
      expect(updateCalendarEvent).toHaveBeenCalledWith("event-1", { notes: finalNotes });
    });
    expect(await screen.findByText(/Final menu: paneer tikka, dal makhani/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(finalNotes);
    });
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

  it("shows the converted booking on the Booked screen", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Go to booked" }));
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
      contactId: null,
      enquiryId: null,
    };
    listCalendar.mockResolvedValue({ items: [item] });
    renderCrm(<CalendarModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);

    const itemButton = await screen.findByRole("button", { name: "Send venue proposal" });
    expect(itemButton.closest("button")).toBe(itemButton);
    expect(screen.queryByRole("button", { name: /10 Send venue proposal/ })).not.toBeInTheDocument();
  });

  it("asks what to add when a calendar day is clicked", async () => {
    const onCreateFor = vi.fn();
    renderCrm(
      <CalendarModule
        onOpenContact={() => undefined}
        onOpenPayments={() => undefined}
        onCreateFor={onCreateFor}
      />,
    );

    await screen.findAllByText("15");
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    });
    const dayCell = screen.getAllByText("15")[0]?.parentElement;
    expect(dayCell).not.toBeUndefined();
    fireEvent.click(dayCell as HTMLElement);

    expect(await screen.findByRole("button", { name: "Add enquiry" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add follow-up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add booking" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add task" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reminder" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add event" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Add event" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add payment" }));

    expect(onCreateFor).toHaveBeenCalledWith("payments", expect.stringMatching(/^\d{4}-\d{2}-15$/));
  });

  it("opens a reminder form with title, description, time, and optional contact", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    createCalendarEvent.mockResolvedValue({
      id: "event-new",
      title: "Call florist",
      startsAt: "2026-09-22T03:30:00.000Z",
      endsAt: "2026-09-22T04:00:00.000Z",
      slot: null,
      contactId: contact.id,
      enquiryId: null,
      assigneeId: null,
      notes: "Confirm marigold garlands",
    });
    const onCreateFor = vi.fn();
    renderCrm(
      <CalendarModule
        onOpenContact={() => undefined}
        onOpenPayments={() => undefined}
        onCreateFor={onCreateFor}
      />,
    );

    await screen.findAllByText("15");
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    });
    fireEvent.click(screen.getAllByText("15")[0]?.parentElement as HTMLElement);
    fireEvent.click(await screen.findByRole("button", { name: "Reminder" }));

    expect(await screen.findByRole("heading", { name: "Add reminder" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Call florist" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Confirm marigold garlands" } });
    fireEvent.change(screen.getByLabelText("Contact"), { target: { value: contact.id } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Call florist",
          notes: "Confirm marigold garlands",
          contactId: contact.id,
          slot: null,
        }),
      );
    });
    expect(onCreateFor).not.toHaveBeenCalled();
  });

  it("opens the task form on the picked date", async () => {
    renderCrm(<TasksModule createOnDate="2026-10-15" onCreateOpened={() => undefined} />);

    expect(await screen.findByRole("heading", { name: "Add task" })).toBeInTheDocument();
    const due = screen.getByLabelText("Due") as HTMLInputElement;
    expect(due.value).toBe("2026-10-15T09:00");
  });

  it("adds a reminder from the work list", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    createCalendarEvent.mockResolvedValue({
      id: "reminder-1",
      title: "Call florist",
      startsAt: "2026-10-15T03:30:00.000Z",
      endsAt: "2026-10-15T04:00:00.000Z",
      slot: null,
      contactId: contact.id,
      enquiryId: null,
      assigneeId: null,
      notes: "Confirm marigold garlands",
    });
    renderCrm(<RemindersModule onOpenContact={() => undefined} />);

    fireEvent.click(await screen.findByRole("button", { name: "Add reminder" }));
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Title is required")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Call florist" } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Confirm marigold garlands" } });
    fireEvent.change(screen.getByLabelText("Contact"), { target: { value: contact.id } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Call florist",
          notes: "Confirm marigold garlands",
          contactId: contact.id,
          slot: null,
        }),
      );
    });
  });

  it("switches reminders between table, cards, and calendar", async () => {
    const at = new Date();
    at.setDate(Math.min(at.getDate(), 28));
    at.setHours(9, 0, 0, 0);
    listCalendarEvents.mockResolvedValue(
      emptyPage([
        {
          id: "reminder-1",
          title: "Call florist",
          startsAt: at.toISOString(),
          endsAt: new Date(at.getTime() + 30 * 60 * 1000).toISOString(),
          slot: null,
          contactId: contact.id,
          enquiryId: null,
          assigneeId: null,
          notes: "Confirm marigold garlands",
        },
      ]),
    );
    listContacts.mockResolvedValue(emptyPage([contact]));
    renderCrm(<RemindersModule onOpenContact={() => undefined} />);

    expect(await screen.findByText("Call florist")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Remind at" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Card view" }));
    expect(await screen.findByText("Confirm marigold garlands")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Remind at" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Calendar view" }));
    expect(await screen.findByText("Mon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Call florist/ })).toBeInTheDocument();
  });

  it("switches bookings between table and cards", async () => {
    listClients.mockResolvedValue(emptyPage([{ ...client, gstin: "29ABCDE1234F1Z5" }]));
    listContacts.mockResolvedValue(emptyPage([{ ...contact, type: "client" as const }]));
    renderCrm(<ClientsModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);

    expect(await screen.findByRole("columnheader", { name: "Billing name" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Card view" }));
    expect(await screen.findByText("29ABCDE1234F1Z5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Acme Events" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Billing name" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Table view" }));
    expect(await screen.findByRole("columnheader", { name: "Billing name" })).toBeInTheDocument();
  });

  it("switches users between table and cards", async () => {
    listCrmUsers.mockResolvedValue(
      emptyPage([
        {
          id: "user-2",
          firstName: "Grace",
          lastName: "Hopper",
          email: "grace@example.com",
          mobileNo: "+919111122222",
          dob: "1906-12-09",
          gender: "female",
          countryCode: "+91",
          roleIds: ["role-admin"],
        },
      ]),
    );
    listRoles.mockResolvedValue([{ id: "role-admin", name: "Admin", slug: "admin", permissionIds: [] }]);
    renderCrm(<UsersModule />);

    expect(await screen.findByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Card view" }));
    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Name" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Table view" }));
    expect(await screen.findByRole("columnheader", { name: "Name" })).toBeInTheDocument();
  });

  it("switches roles between table and cards", async () => {
    listRoles.mockResolvedValue([
      { id: "role-sales", name: "Sales", slug: "sales", permissionIds: ["p-read"] },
    ]);
    listPermissions.mockResolvedValue([
      {
        id: "p-read",
        code: "crm.roles.read",
        name: "View roles",
        description: "See roles and the permissions granted to each role.",
      },
    ]);
    renderCrm(<RolesModule />);

    expect(await screen.findByRole("columnheader", { name: "Role" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Card view" }));
    expect(await screen.findByText("sales")).toBeInTheDocument();
    expect(screen.getByText("View roles")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Role" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Table view" }));
    expect(await screen.findByRole("columnheader", { name: "Role" })).toBeInTheDocument();
  });

  it("opens the follow-up form on the picked date", async () => {
    listEnquiries.mockResolvedValue(emptyPage([enquiry]));
    listContacts.mockResolvedValue(emptyPage([contact]));
    listFollowUps.mockResolvedValue(emptyPage([]));
    renderCrm(<FollowUpsModule createOnDate="2026-10-15" onCreateOpened={() => undefined} />);

    expect(await screen.findByRole("heading", { name: "Add follow-up" })).toBeInTheDocument();
    const nextDate = screen.getByLabelText("Next follow-up date & time") as HTMLInputElement;
    expect(nextDate.value).toBe("2026-10-15T09:00");
  });

  it("opens the enquiry form on the picked date", async () => {
    listContacts.mockResolvedValue(emptyPage([contact]));
    renderCrm(<EnquiriesModule createOnDate="2026-10-15" onCreateOpened={() => undefined} />);

    expect(await screen.findByRole("heading", { name: "Add enquiry" })).toBeInTheDocument();
    const pickedDay = screen
      .getAllByRole("button", { pressed: true })
      .find((button) => button.textContent === "15");
    expect(pickedDay).toBeDefined();
  });

  it("shows booked enquiries as distinct calendar items", async () => {
    const at = new Date();
    at.setDate(Math.min(at.getDate(), 28));
    at.setHours(14, 0, 0, 0);
    listCalendar.mockResolvedValue({
      items: [
        {
          kind: "booking",
          id: "booking-1",
          title: "Wedding booking",
          at: at.toISOString(),
          endsAt: new Date(at.getTime() + 60 * 60 * 1000).toISOString(),
          contactId: null,
          enquiryId: null,
          slot: "evening",
          notes: "Veg menu + live counter",
        },
      ],
    });
    renderCrm(<CalendarModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);

    const booking = await screen.findByRole("button", { name: "Wedding booking · Evening" });
    expect(booking).toHaveClass("bg-emerald-100");
  });

  it("shows scheduled follow-ups on the calendar and opens the lead history", async () => {
    const onOpenContact = vi.fn();
    const at = new Date();
    at.setDate(Math.min(at.getDate(), 28));
    at.setHours(11, 0, 0, 0);
    listCalendar.mockResolvedValue({
      items: [
        {
          kind: "followup",
          id: "enquiry-1",
          title: "Follow-up: Wedding hall",
          at: at.toISOString(),
          endsAt: null,
          contactId: "contact-1",
          enquiryId: "enquiry-1",
        },
      ],
    });
    fetchContactDetail.mockResolvedValue({
      contact,
      enquiries: [
        {
          ...enquiry,
          status: "contacted",
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
      ],
      payments: [],
      bookings: [],
    });
    renderCrm(<CalendarModule onOpenContact={onOpenContact} onOpenPayments={() => undefined} />);

    await screen.findByRole("button", { name: "Follow-up: Wedding hall" });
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    });
    const followUp = screen.getByRole("button", { name: "Follow-up: Wedding hall" });
    expect(followUp).toHaveClass("bg-amber-100");

    fireEvent.click(followUp);

    expect(await screen.findByText("Priya Shah")).toBeInTheDocument();
    expect(screen.getByText("Lead created")).toBeInTheDocument();
    expect(screen.getByText("Follow-up — Contacted")).toBeInTheDocument();
    expect(screen.getByText("Called the venue")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open contact" }));
    expect(onOpenContact).toHaveBeenCalledWith("contact-1");
  });

  it("opens the lead history from a follow-up on the follow-ups calendar", async () => {
    const at = new Date();
    at.setDate(Math.min(at.getDate(), 28));
    at.setHours(11, 0, 0, 0);
    listFollowUpCalendar.mockResolvedValue({
      items: [
        {
          kind: "followup",
          enquiryId: enquiry.id,
          title: enquiry.title,
          contactId: contact.id,
          status: "contacted",
          at: at.toISOString(),
          nextFollowupDate: at.toISOString(),
          overdue: false,
        },
      ],
      overdue: [],
    });
    fetchContactDetail.mockResolvedValue({
      contact,
      enquiries: [
        {
          ...enquiry,
          status: "contacted",
          followUps: [
            {
              id: "fu-1",
              enquiryId: enquiry.id,
              contactId: contact.id,
              stage: "contacted",
              dueAt: "2026-09-16T10:00:00.000Z",
              nextFollowupDate: at.toISOString(),
              notes: "Called the venue",
            },
          ],
        },
      ],
      payments: [],
      bookings: [],
    });
    renderCrm(<FollowUpsModule />);

    fireEvent.click(await screen.findByRole("button", { name: "Calendar view" }));
    fireEvent.click(await screen.findByRole("button", { name: /Follow-ups 1/ }));
    fireEvent.click(await screen.findByRole("button", { name: new RegExp(enquiry.title) }));

    expect(await screen.findByText("Priya Shah")).toBeInTheDocument();
    expect(screen.getByText("Called the venue")).toBeInTheDocument();
  });

  it("switches the calendar between day, week, and month views", async () => {
    const at = new Date();
    at.setHours(14, 0, 0, 0);
    listCalendar.mockResolvedValue({
      items: [
        {
          kind: "event",
          id: "event-1",
          title: "Venue walkthrough",
          at: at.toISOString(),
          endsAt: null,
          contactId: null,
          enquiryId: null,
        },
      ],
    });
    renderCrm(<CalendarModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);

    await screen.findByRole("button", { name: "Venue walkthrough" });

    const settled = async (assert: () => void) => {
      await waitFor(() => {
        expect(document.querySelector('[aria-busy="true"]')).toBeNull();
        assert();
      });
    };

    fireEvent.click(screen.getByRole("button", { name: "Day view" }));
    await settled(() => {
      expect(screen.getByText("Reminder")).toBeInTheDocument();
      expect(screen.queryByText("Nothing scheduled")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await settled(() => expect(screen.getByText("Nothing scheduled")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    fireEvent.click(screen.getByRole("button", { name: "Week view" }));
    await settled(() => expect(screen.getByText("Venue walkthrough")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Month view" }));
    await settled(() =>
      expect(screen.getByRole("button", { name: "Venue walkthrough" })).toBeInTheDocument(),
    );
  });

  it("opens the booked view sidebar from a calendar booking", async () => {
    const clientContact: CrmContact = { ...contact, type: "client" };
    const at = new Date();
    at.setDate(Math.min(at.getDate(), 28));
    at.setHours(14, 0, 0, 0);
    listContacts.mockResolvedValue(emptyPage([clientContact]));
    listClients.mockResolvedValue(emptyPage([client]));
    listCalendar.mockResolvedValue({
      items: [
        {
          kind: "booking",
          id: "booking-1",
          title: "Wedding booking",
          at: at.toISOString(),
          endsAt: new Date(at.getTime() + 60 * 60 * 1000).toISOString(),
          contactId: contact.id,
          enquiryId: enquiry.id,
        },
      ],
    });
    renderCrm(<CalendarModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);

    await screen.findByRole("button", { name: "Wedding booking" });
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    });
    fireEvent.click(screen.getByRole("button", { name: "Wedding booking" }));

    expect(await screen.findByRole("heading", { name: "Acme Events" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Current booking/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Enquiry/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Payments/ })).toBeInTheDocument();
  });

  it("warns that removing a booking also removes its enquiry", async () => {
    const at = new Date();
    at.setDate(Math.min(at.getDate(), 28));
    at.setHours(14, 0, 0, 0);
    listCalendar.mockResolvedValue({
      items: [
        {
          kind: "booking",
          id: "booking-1",
          title: "Wedding booking",
          at: at.toISOString(),
          endsAt: new Date(at.getTime() + 60 * 60 * 1000).toISOString(),
          contactId: null,
          enquiryId: null,
        },
      ],
    });
    renderCrm(<CalendarModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);

    await screen.findByRole("button", { name: "Wedding booking" });
    await waitFor(() => {
      expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    });
    fireEvent.click(screen.getByRole("button", { name: "Wedding booking" }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove booking" }));

    expect(
      await screen.findByText(
        "The enquiry linked to this booking is removed with it. A booking with a paid payment cannot be removed.",
      ),
    ).toBeInTheDocument();
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

  it("filters booked rows by from and to dates", async () => {
    const clientContact: CrmContact = { ...contact, type: "client" };
    listContacts.mockResolvedValue(emptyPage([clientContact]));
    listClients.mockResolvedValue(emptyPage([client]));
    renderCrm(<ClientsModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);

    await screen.findByText("Acme Events");
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-12-31" } });

    await waitFor(() => {
      expect(listClients).toHaveBeenCalledWith(
        expect.objectContaining({
          from: new Date(2026, 11, 1).toISOString(),
          to: new Date(2026, 11, 31, 23, 59, 59, 999).toISOString(),
        }),
      );
    });
  });

  it("opens a booked view sidebar from the booked row", async () => {
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
    expect(screen.getAllByText("Start date").length).toBeGreaterThan(0);
    expect(screen.getAllByText("End date").length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatDateTime(client.startsAt)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatDateTime(client.endsAt)).length).toBeGreaterThan(0);
  });

  it("fills booked start and end dates from the contact booking when the list omits them", async () => {
    const clientContact: CrmContact = { ...contact, type: "client" };
    listContacts.mockResolvedValue(emptyPage([clientContact]));
    listClients.mockResolvedValue(emptyPage([{ ...client, startsAt: null, endsAt: null }]));
    fetchContactDetail.mockResolvedValue({
      contact: clientContact,
      enquiries: [{ ...enquiry, status: "closed", closedReason: "Booked", followUps: [] }],
      payments: [],
      bookings: [
        {
          id: "event-1",
          title: "Other enquiry",
          startsAt: "2026-09-26T10:30:00.000Z",
          endsAt: "2026-09-26T17:30:00.000Z",
          slot: "evening",
          contactId: contact.id,
          enquiryId: enquiry.id,
          assigneeId: null,
          notes: null,
        },
      ],
    });
    renderCrm(<ClientsModule onOpenContact={() => undefined} onOpenPayments={() => undefined} />);
    expect(await screen.findByText(formatDateTime("2026-09-26T10:30:00.000Z"))).toBeInTheDocument();
    expect(screen.getByText(formatDateTime("2026-09-26T17:30:00.000Z"))).toBeInTheDocument();
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

  it("creates a role from Add role with a selected permission", async () => {
    listPermissions.mockResolvedValue([
      {
        id: "p-read",
        code: "crm.roles.read",
        name: "View roles",
        description: "See roles and the permissions granted to each role.",
      },
    ]);
    createRole.mockResolvedValue({
      id: "role-field",
      name: "Field Lead",
      slug: "field-lead",
      permissionIds: ["p-read"],
    });
    renderCrm(<RolesModule />);
    fireEvent.click(await screen.findByRole("button", { name: "Add role" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Field Lead" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(createRole).toHaveBeenCalledWith({
        name: "Field Lead",
        permissionIds: ["p-read"],
      }),
    );
  });

  it("shows permission descriptions when viewing a role", async () => {
    listRoles.mockResolvedValue([
      { id: "role-admin", name: "Admin", slug: "admin", permissionIds: ["p-read"] },
    ]);
    listPermissions.mockResolvedValue([
      {
        id: "p-read",
        code: "crm.roles.read",
        name: "View roles",
        description: "See roles and the permissions granted to each role.",
      },
    ]);
    renderCrm(<RolesModule />);
    fireEvent.click(await screen.findByRole("button", { name: "View" }));
    expect(await screen.findByText("See roles and the permissions granted to each role.")).toBeInTheDocument();
    expect(screen.getByText("crm.roles.read")).toBeInTheDocument();
  });

  it("saves edited role name and permissions", async () => {
    listRoles.mockResolvedValue([
      { id: "role-sales", name: "Sales", slug: "sales", permissionIds: ["p-read"] },
    ]);
    listPermissions.mockResolvedValue([
      {
        id: "p-read",
        code: "crm.roles.read",
        name: "View roles",
        description: "See roles and the permissions granted to each role.",
      },
      {
        id: "p-update",
        code: "crm.roles.update",
        name: "Update roles",
        description: "Create roles and change role names or granted permissions.",
      },
    ]);
    updateRole.mockResolvedValue({
      id: "role-sales",
      name: "Inside Sales",
      slug: "sales",
      permissionIds: ["p-read", "p-update"],
    });
    renderCrm(<RolesModule />);
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Inside Sales" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Update roles/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(updateRole).toHaveBeenCalledWith("role-sales", {
        name: "Inside Sales",
        permissionIds: ["p-read", "p-update"],
      }),
    );
  });
});
