import { describe, expect, it } from "vitest";
import { filterFollowUpCalendar, readFollowUpWhen } from "@/lib/mobile/follow-ups";
import type { CrmFollowUpCalendar } from "@/types/crm";

const now = new Date(2026, 9, 10, 12, 0, 0);

function atLocal(day: number): string {
  return new Date(2026, 9, day, 12, 0, 0).toISOString();
}

const calendar: CrmFollowUpCalendar = {
  items: [
    {
      kind: "followup",
      enquiryId: "today",
      title: "Today call",
      contactId: "c1",
      status: "contacted",
      at: atLocal(10),
      nextFollowupDate: null,
      overdue: false,
    },
    {
      kind: "followup",
      enquiryId: "later",
      title: "Later call",
      contactId: "c1",
      status: "qualified",
      at: atLocal(12),
      nextFollowupDate: null,
      overdue: false,
    },
  ],
  overdue: [
    {
      kind: "followup",
      enquiryId: "late",
      title: "Late call",
      contactId: "c1",
      status: "discussion",
      at: atLocal(8),
      nextFollowupDate: atLocal(8),
      overdue: true,
    },
  ],
};

describe("follow-up views", () => {
  it("reads the work-queue filter from the address", () => {
    expect(readFollowUpWhen(null)).toBe("today");
    expect(readFollowUpWhen("overdue")).toBe("overdue");
    expect(readFollowUpWhen("nope")).toBe("today");
  });

  it("splits today, upcoming, and overdue leads", () => {
    expect(filterFollowUpCalendar(calendar, "today", now).map((item) => item.title)).toEqual(["Today call"]);
    expect(filterFollowUpCalendar(calendar, "upcoming", now).map((item) => item.title)).toEqual(["Later call"]);
    expect(filterFollowUpCalendar(calendar, "overdue", now).map((item) => item.title)).toEqual(["Late call"]);
  });
});