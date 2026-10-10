/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { EnquiryDetailSheet } from "@/components/records/EnquiryDetailSheet";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmEnquiry } from "@/types/crm";

vi.mock("@/lib/mobile/remote", () => ({
  fetchContactDetail: vi.fn().mockResolvedValue({
    contact: { id: "c1", name: "Akash", mobile: "9000000000", type: "customer", email: null, companyName: null, notes: null },
    enquiries: [],
    payments: [],
    bookings: [],
  }),
  listFollowUps: vi.fn(),
  removeEnquiry: vi.fn(),
  updateEnquiry: vi.fn(),
}));

const ENQUIRY: CrmEnquiry = {
  id: "enq-1",
  contactId: "c1",
  title: "Baby Shower 50pax",
  source: "Walk-in",
  status: "new",
  closedReason: null,
  expectedValue: null,
  assignedToId: null,
  notes: null,
  dueDateWindow: null,
  dueDate: "2026-09-27T00:00:00.000Z",
  nextFollowupDate: null,
  createdAt: "2026-09-23T13:41:00.000Z",
  updatedAt: null,
};

describe("enquiry detail", () => {
  it("shows the case, stage move, and the follow-up, convert, edit, and remove actions", async () => {
    renderMobile(
      <EnquiryDetailSheet
        enquiry={ENQUIRY}
        permissions={[
          CRM_PERMISSIONS.contactsRead,
          CRM_PERMISSIONS.enquiriesUpdate,
          CRM_PERMISSIONS.enquiriesDelete,
          CRM_PERMISSIONS.enquiriesConvert,
          CRM_PERMISSIONS.followUpsCreate,
        ]}
        onClose={vi.fn()}
        onChanged={vi.fn()}
        onEdit={vi.fn()}
        onFollow={vi.fn()}
        onConvert={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Baby Shower 50pax" })).toBeInTheDocument();
    expect(screen.getByText("Walk-in")).toBeInTheDocument();
    expect(screen.getByLabelText("Move stage")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add follow-up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convert" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    expect(await screen.findByText("Akash")).toBeInTheDocument();
    expect(screen.getByText("9000000000")).toBeInTheDocument();
    expect(screen.getByText("Lead created")).toBeInTheDocument();
  });
});