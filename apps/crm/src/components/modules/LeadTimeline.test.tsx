/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildLeadTimeline, closureLabel, LeadTimeline } from "@/components/modules/LeadTimeline";
import type { CrmEnquiry, CrmFollowUp } from "@/types/crm";

const enquiry: CrmEnquiry = {
  id: "enquiry-1",
  contactId: "contact-1",
  title: "Banquet inquiry",
  source: "Website",
  status: "contacted",
  closedReason: null,
  expectedValue: 50000,
  assignedToId: null,
  notes: null,
  dueDateWindow: "within_7_days",
  dueDate: "2026-09-24T23:59:59.000Z",
  nextFollowupDate: "2026-09-20T00:00:00.000Z",
  createdAt: "2026-09-15T08:00:00.000Z",
  updatedAt: "2026-09-16T10:00:00.000Z",
};

const followUp: CrmFollowUp = {
  id: "fu-1",
  enquiryId: enquiry.id,
  contactId: enquiry.contactId,
  stage: "contacted",
  dueAt: "2026-09-16T10:00:00.000Z",
  nextFollowupDate: "2026-09-20T00:00:00.000Z",
  notes: "Called the venue",
};

describe("closureLabel", () => {
  it("labels booked and lost closures", () => {
    expect(closureLabel(null)).toBe("Closed");
    expect(closureLabel("Booked")).toBe("Closed — Booked");
    expect(closureLabel("Lost: budget")).toBe("Closed — Lost: budget");
  });
});

describe("buildLeadTimeline", () => {
  it("orders created, follow-up, and next contact for an open lead", () => {
    const events = buildLeadTimeline(enquiry, [followUp], new Date("2026-09-18T12:00:00.000Z"));
    expect(events.map((event) => event.kind)).toEqual(["created", "followup", "next"]);
    expect(events[2]?.overdue).toBe(false);
  });

  it("marks the next follow-up overdue when the date has passed", () => {
    const events = buildLeadTimeline(enquiry, [followUp], new Date("2026-09-21T12:00:00.000Z"));
    const next = events.find((event) => event.kind === "next");
    expect(next?.overdue).toBe(true);
  });

  it("adds a booked closure and omits the next follow-up", () => {
    const closed: CrmEnquiry = {
      ...enquiry,
      status: "closed",
      closedReason: "Booked",
      nextFollowupDate: null,
      updatedAt: "2026-09-22T09:00:00.000Z",
    };
    const closedFollowUp: CrmFollowUp = {
      ...followUp,
      id: "fu-2",
      stage: "closed",
      dueAt: "2026-09-22T09:00:00.000Z",
      nextFollowupDate: null,
      notes: "Deposit received",
    };
    const events = buildLeadTimeline(closed, [followUp, closedFollowUp], new Date("2026-09-23T12:00:00.000Z"));
    expect(events.map((event) => event.kind)).toEqual(["created", "followup", "closed"]);
    expect(events[2]?.title).toBe("Closed — Booked");
    expect(events.some((event) => event.kind === "next")).toBe(false);
  });
});

describe("LeadTimeline", () => {
  it("renders created, follow-up notes, and next contact", () => {
    render(<LeadTimeline enquiry={enquiry} followUps={[followUp]} />);
    expect(screen.getByText("Lead created")).toBeInTheDocument();
    expect(screen.getByText("Follow-up — Contacted")).toBeInTheDocument();
    expect(screen.getByText("Called the venue")).toBeInTheDocument();
    expect(screen.getByText("Next follow-up")).toBeInTheDocument();
  });
});
