/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import Contacts from "@/pages/Contacts";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmContact } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listContacts: vi.fn(),
  createContact: vi.fn(),
  updateContact: vi.fn(),
  removeContact: vi.fn(),
  fetchContactDetail: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

const priya: CrmContact = {
  id: "c1",
  name: "Priya Sharma",
  mobile: "+919876543210",
  type: "lead",
  email: "priya@example.com",
  companyName: null,
  notes: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [
    CRM_PERMISSIONS.contactsRead,
    CRM_PERMISSIONS.contactsCreate,
    CRM_PERMISSIONS.contactsUpdate,
    CRM_PERMISSIONS.contactsDelete,
  ];
  remote.listContacts.mockResolvedValue(pageOf([priya]));
  remote.fetchContactDetail.mockResolvedValue({
    contact: priya,
    enquiries: [
      {
        id: "enq-1",
        contactId: "c1",
        title: "Sangeet night",
        source: "Instagram",
        status: "contacted",
        closedReason: null,
        expectedValue: null,
        assignedToId: null,
        notes: null,
        dueDateWindow: null,
        dueDate: "2026-10-20T12:00:00.000Z",
        nextFollowupDate: null,
        createdAt: "2026-10-01T10:00:00.000Z",
        updatedAt: null,
        followUps: [],
      },
    ],
    payments: [],
    bookings: [],
  });
  remote.updateContact.mockResolvedValue(priya);
  remote.removeContact.mockResolvedValue(undefined);
});

describe("contacts", () => {
  it("is forbidden without crm.contacts.read", () => {
    state.permissions = [];
    renderMobile(<Contacts />, ["/contacts"]);
    expect(screen.getByText("Your role cannot view contacts.")).toBeInTheDocument();
  });

  it("opens the contact hub with enquiry history", async () => {
    renderMobile(<Contacts />, ["/contacts"]);
    fireEvent.click(await screen.findByText("Priya Sharma"));
    expect(await screen.findByRole("link", { name: /Call/ })).toHaveAttribute("href", "tel:+919876543210");
    expect(screen.getByRole("link", { name: /Email/ })).toHaveAttribute("href", "mailto:priya@example.com");

    fireEvent.click(screen.getByRole("button", { name: "Enquiries" }));
    expect(await screen.findByText("Sangeet night")).toBeInTheDocument();
  });

  it("edits a contact and keeps validation inline", async () => {
    renderMobile(<Contacts />, ["/contacts"]);
    fireEvent.click(await screen.findByText("Priya Sharma"));
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    const mobile = await screen.findByLabelText("Mobile");
    fireEvent.change(mobile, { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Save contact" }));
    expect(await screen.findByText("Enter a mobile number of 7 to 15 digits")).toBeInTheDocument();
    expect(remote.updateContact).not.toHaveBeenCalled();

    fireEvent.change(mobile, { target: { value: "+919812345678" } });
    fireEvent.click(screen.getByRole("button", { name: "Save contact" }));
    await waitFor(() =>
      expect(remote.updateContact).toHaveBeenCalledWith("c1", expect.objectContaining({ mobile: "+919812345678" })),
    );
  });

  it("confirms before removing a contact", async () => {
    renderMobile(<Contacts />, ["/contacts"]);
    fireEvent.click(await screen.findByText("Priya Sharma"));
    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
    const confirm = screen.getByRole("alertdialog");
    fireEvent.click(within(confirm).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(remote.removeContact).toHaveBeenCalledWith("c1"));
  });

  it("hides edit and remove without the permissions", async () => {
    state.permissions = [CRM_PERMISSIONS.contactsRead];
    renderMobile(<Contacts />, ["/contacts"]);
    fireEvent.click(await screen.findByText("Priya Sharma"));
    expect(await screen.findByRole("link", { name: /Call/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument();
  });
});
