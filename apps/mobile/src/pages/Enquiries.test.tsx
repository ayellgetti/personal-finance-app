/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import Enquiries from "@/pages/Enquiries";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmEnquiry } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listEnquiries: vi.fn(),
  listContacts: vi.fn(),
  listCrmUsers: vi.fn(),
  updateEnquiry: vi.fn(),
  createEnquiry: vi.fn(),
  createContact: vi.fn(),
  removeEnquiry: vi.fn(),
  convertEnquiry: vi.fn(),
  fetchContactDetail: vi.fn(),
  listFollowUps: vi.fn(),
  createFollowUp: vi.fn(),
  updateFollowUp: vi.fn(),
  createCalendarEvent: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

const enquiry: CrmEnquiry = {
  id: "enq-1",
  contactId: "c1",
  title: "Corporate offsite",
  source: "Referral",
  status: "contacted",
  closedReason: null,
  expectedValue: null,
  assignedToId: null,
  notes: null,
  dueDateWindow: null,
  dueDate: "2026-10-20T12:00:00.000Z",
  nextFollowupDate: null,
  createdAt: null,
  updatedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [
    CRM_PERMISSIONS.enquiriesRead,
    CRM_PERMISSIONS.enquiriesCreate,
    CRM_PERMISSIONS.enquiriesUpdate,
    CRM_PERMISSIONS.usersRead,
  ];
  remote.listEnquiries.mockResolvedValue(pageOf([enquiry]));
  remote.listContacts.mockResolvedValue(pageOf([]));
  remote.listCrmUsers.mockResolvedValue(
    pageOf([
      {
        id: "u1",
        firstName: "Asha",
        lastName: "Rao",
        email: "asha@example.com",
        mobileNo: "9876543210",
        dob: "1992-04-01",
        gender: "female",
        countryCode: "+91",
        roleIds: [],
      },
    ]),
  );
  remote.updateEnquiry.mockResolvedValue({ ...enquiry, status: "closed", closedReason: "Went elsewhere" });
});

describe("enquiries", () => {
  it("is forbidden without crm.enquiries.read", () => {
    state.permissions = [];
    renderMobile(<Enquiries />, ["/enquiries"]);
    expect(screen.getByText("Your role cannot view enquiries.")).toBeInTheDocument();
  });

  it("filters by assignee on the server", async () => {
    renderMobile(<Enquiries />, ["/enquiries"]);
    expect(await screen.findByText("Corporate offsite")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Filter and sort/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Assigned to/ }));
    fireEvent.click(screen.getByRole("radio", { name: "Asha Rao" }));
    await waitFor(() =>
      expect(remote.listEnquiries).toHaveBeenLastCalledWith(expect.objectContaining({ assignedToId: "u1" })),
    );
  });

  it("asks for a lost reason before closing a board card", async () => {
    renderMobile(<Enquiries />, ["/enquiries"]);
    await screen.findByText("Corporate offsite");
    fireEvent.click(screen.getByRole("button", { name: "Board" }));
    const stage = await screen.findByLabelText("Stage for Corporate offsite");
    fireEvent.change(stage, { target: { value: "closed" } });

    const confirm = screen.getByRole("alertdialog", { name: "Confirm stage move" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Lost" }));
    const close = within(confirm).getByRole("button", { name: "Close enquiry" });
    expect(close).toBeDisabled();
    fireEvent.change(within(confirm).getByLabelText("Why it was lost"), { target: { value: "Went elsewhere" } });
    fireEvent.click(close);
    await waitFor(() =>
      expect(remote.updateEnquiry).toHaveBeenCalledWith("enq-1", {
        status: "closed",
        closedReason: "Lost: Went elsewhere",
      }),
    );
  });

  it("closes as Booked without a booking when convert is not allowed", async () => {
    renderMobile(<Enquiries />, ["/enquiries"]);
    await screen.findByText("Corporate offsite");
    fireEvent.click(screen.getByRole("button", { name: "Board" }));
    fireEvent.change(await screen.findByLabelText("Stage for Corporate offsite"), { target: { value: "closed" } });
    const confirm = screen.getByRole("alertdialog", { name: "Confirm stage move" });
    fireEvent.click(within(confirm).getByRole("button", { name: "Close enquiry" }));
    await waitFor(() =>
      expect(remote.updateEnquiry).toHaveBeenCalledWith("enq-1", { status: "closed", closedReason: "Booked" }),
    );
    expect(remote.convertEnquiry).not.toHaveBeenCalled();
  });

  it("validates a new enquiry inline", async () => {
    renderMobile(<Enquiries />, ["/enquiries?new=1"]);
    fireEvent.click(await screen.findByRole("button", { name: "Create" }));
    expect(await screen.findByText("Title is required (160 characters max)")).toBeInTheDocument();
    expect(screen.getByText("Source is required (80 characters max)")).toBeInTheDocument();
    expect(screen.getByText("Enter a mobile number of 7 to 15 digits")).toBeInTheDocument();
    expect(remote.createContact).not.toHaveBeenCalled();
    expect(remote.createEnquiry).not.toHaveBeenCalled();
  });

  it("offers a retry when the list fails", async () => {
    remote.listEnquiries.mockRejectedValue(new Error("Server unavailable"));
    renderMobile(<Enquiries />, ["/enquiries"]);
    expect(await screen.findByText("Server unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
