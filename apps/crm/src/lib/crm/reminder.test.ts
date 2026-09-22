import { describe, expect, it } from "vitest";
import { reminderFormForDay, toReminderInput, validateReminder } from "@/lib/crm/reminder";

describe("reminder form", () => {
  it("requires a title", () => {
    expect(validateReminder({ title: "  ", description: "", remindAt: "2026-10-15T09:00", contactId: "" }).title).toBe(
      "Title is required",
    );
  });

  it("builds a calendar event payload without a slot", () => {
    const form = reminderFormForDay(new Date(2026, 9, 15));
    form.title = "Call florist";
    form.description = "Confirm marigold garlands";
    form.contactId = "contact-1";
    expect(toReminderInput(form)).toEqual(
      expect.objectContaining({
        title: "Call florist",
        notes: "Confirm marigold garlands",
        contactId: "contact-1",
        slot: null,
      }),
    );
  });
});
