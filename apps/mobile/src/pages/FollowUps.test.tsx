/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import FollowUps from "@/pages/FollowUps";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS } from "@/types/crm";

vi.mock("@/lib/mobile/store", () => ({
  useMobile: () => ({
    permissions: [
      CRM_PERMISSIONS.followUpsRead,
      CRM_PERMISSIONS.followUpsCreate,
      CRM_PERMISSIONS.enquiriesRead,
      CRM_PERMISSIONS.contactsRead,
    ],
  }),
}));

vi.mock("@/lib/mobile/remote", () => ({
  listFollowUpCalendar: vi.fn().mockResolvedValue({
    items: [
      {
        kind: "followup",
        enquiryId: "enq-1",
        title: "Wedding reception",
        contactId: "c1",
        status: "contacted",
        at: new Date().toISOString(),
        nextFollowupDate: null,
        overdue: false,
      },
    ],
    overdue: [],
  }),
  listFollowUps: vi.fn().mockResolvedValue({
    items: [
      {
        id: "fu-1",
        enquiryId: "enq-1",
        contactId: "c1",
        stage: "contacted",
        dueAt: "2026-10-10T04:30:00.000Z",
        nextFollowupDate: "2026-10-12T04:30:00.000Z",
        notes: "Asked for the menu",
      },
    ],
    pagination: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  }),
  listEnquiries: vi.fn().mockResolvedValue({
    items: [
      {
        id: "enq-1",
        contactId: "c1",
        title: "Wedding reception",
        source: "Walk-in",
        status: "contacted",
        closedReason: null,
        expectedValue: null,
        assignedToId: null,
        notes: null,
        dueDateWindow: null,
        dueDate: null,
        nextFollowupDate: null,
        createdAt: null,
        updatedAt: null,
      },
    ],
    pagination: { total: 1, page: 1, limit: 20, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  }),
  listContacts: vi.fn().mockResolvedValue({
    items: [],
    pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
  }),
  fetchEnquiry: vi.fn(),
  createFollowUp: vi.fn(),
  updateFollowUp: vi.fn(),
  removeFollowUp: vi.fn(),
}));

describe("follow-ups", () => {
  it("lists today's lead activity and opens a new follow-up from quick add", async () => {
    renderMobile(<FollowUps />, ["/follow-ups?new=1"]);

    expect(await screen.findByRole("heading", { name: "New follow-up" })).toBeInTheDocument();
    expect(screen.getAllByText("Wedding reception").length).toBeGreaterThan(0);
  });

  it("shows the follow-up history for a lead", async () => {
    renderMobile(<FollowUps />, ["/follow-ups?when=history"]);

    fireEvent.click(screen.getByRole("button", { name: /Filter and sort/ }));
    fireEvent.click(await screen.findByRole("button", { name: /^When/ }));
    fireEvent.click(screen.getByRole("radio", { name: "History" }));
    expect(await screen.findByText(/Asked for the menu/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Wedding reception")).toBeInTheDocument());
  });
});