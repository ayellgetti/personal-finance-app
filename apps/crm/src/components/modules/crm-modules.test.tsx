/** @vitest-environment jsdom */
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { CalendarModule } from "@/components/modules/CalendarModule";
import { ClientsModule } from "@/components/modules/ClientsModule";
import { ContactsModule } from "@/components/modules/ContactsModule";
import { EnquiriesModule } from "@/components/modules/EnquiriesModule";
import { TasksModule } from "@/components/modules/TasksModule";
import { ApiError } from "@/lib/api";
import {
  adminMe,
  convertEnquiry,
  emptyPage,
  fetchCrmMe,
  listCalendar,
  listClients,
  listContacts,
  listEnquiries,
  listTasks,
  updateTaskStatus,
} from "@/test/crm-remote-mock";
import { renderCrm } from "@/test/render-crm";
import type { CrmCalendarItem, CrmClient, CrmContact, CrmEnquiry, CrmTask } from "@/types/crm";

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
  expectedValue: 50000,
  assignedToId: null,
  notes: null,
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
    listClients.mockResolvedValue(emptyPage());
    listTasks.mockResolvedValue(emptyPage());
    listCalendar.mockResolvedValue({ items: [] });
    convertEnquiry.mockReset();
    updateTaskStatus.mockReset();
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

  it("shows the converted client on the Clients screen", async () => {
    const created: CrmClient[] = [];
    listContacts.mockResolvedValue(emptyPage([contact]));
    listEnquiries.mockResolvedValue(emptyPage([enquiry]));
    listClients.mockImplementation(async () => emptyPage(created));
    convertEnquiry.mockImplementation(async () => {
      created.push(client);
      return {
        enquiry: { ...enquiry, status: "won" as const },
        contact: { ...contact, type: "client" as const },
        client,
      };
    });

    renderCrm(<ConvertFlow />);
    expect(await screen.findByText("Banquet inquiry")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Convert" }));
    await waitFor(() => expect(convertEnquiry).toHaveBeenCalledWith("enquiry-1", {}));

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
});
