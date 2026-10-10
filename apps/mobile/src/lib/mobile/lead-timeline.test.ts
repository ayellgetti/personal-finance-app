import { describe, expect, it } from "vitest";
import { buildLeadTimeline } from "@/lib/mobile/lead-timeline";
import type { CrmEnquiry, CrmFollowUp } from "@/types/crm";

const enquiry: CrmEnquiry = {
  id: "enq-1",
  contactId: "contact-1",
  title: "Baby shower",
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

describe("lead timeline", () => {
  it("starts with the lead and keeps later follow-ups in order", () => {
    const followUps: CrmFollowUp[] = [
      {
        id: "fu-2",
        enquiryId: enquiry.id,
        contactId: enquiry.contactId,
        stage: "qualified",
        dueAt: "2026-09-25T10:00:00.000Z",
        nextFollowupDate: null,
        notes: "Sent menu",
      },
      {
        id: "fu-1",
        enquiryId: enquiry.id,
        contactId: enquiry.contactId,
        stage: "contacted",
        dueAt: "2026-09-24T10:00:00.000Z",
        nextFollowupDate: null,
        notes: null,
      },
    ];

    const events = buildLeadTimeline(enquiry, followUps);

    expect(events.map((event) => event.title)).toEqual([
      "Lead created",
      "Follow-up — Contacted",
      "Follow-up — Qualified",
    ]);
    expect(events[0]?.notes).toBe("Source: Walk-in");
  });
});