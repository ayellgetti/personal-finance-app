/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { QuickReminderSheet } from "@/components/forms/QuickReminderSheet";
import { createCalendarEvent } from "@/lib/mobile/remote";
import { renderMobile } from "@/test/render-mobile";

vi.mock("@/lib/mobile/remote", () => ({
  createCalendarEvent: vi.fn().mockResolvedValue({ id: "event-1" }),
}));

describe("quick reminder", () => {
  it("keeps the person and only asks for the reminder", async () => {
    const onCreated = vi.fn();
    renderMobile(
      <QuickReminderSheet
        target={{ label: "Riya Kapoor · 9811122233", contactId: "contact-1", enquiryId: "enquiry-1" }}
        onOpenChange={vi.fn()}
        onCreated={onCreated}
      />,
    );

    expect(screen.getByRole("heading", { name: "Add reminder" })).toBeInTheDocument();
    expect(screen.getByText("Reminder for Riya Kapoor · 9811122233")).toBeInTheDocument();
    expect(screen.queryByLabelText("Contact")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Call about menu" } });
    fireEvent.click(screen.getByRole("button", { name: "Add reminder" }));

    await waitFor(() =>
      expect(createCalendarEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Call about menu",
          contactId: "contact-1",
          enquiryId: "enquiry-1",
        }),
      ),
    );
  });
});
