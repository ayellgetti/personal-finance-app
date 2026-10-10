/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { CreateFollowUpSheet } from "@/components/forms/CreateFollowUpSheet";
import { createFollowUp, updateFollowUp } from "@/lib/mobile/remote";
import { renderMobile } from "@/test/render-mobile";

vi.mock("@/lib/mobile/remote", () => ({
  createFollowUp: vi.fn().mockResolvedValue({ id: "follow-1" }),
  updateFollowUp: vi.fn().mockResolvedValue({ id: "follow-1" }),
  listEnquiries: vi.fn(),
  listContacts: vi.fn(),
}));

describe("booked follow-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers only Booked or Closed and requires the next date", async () => {
    renderMobile(
      <CreateFollowUpSheet
        open
        enquiry={{ id: "enquiry-1", title: "Wedding reception" }}
        stageSet="booked"
        day={new Date("2026-10-10T00:00:00")}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Stage" })).toHaveTextContent("Booked");
    expect(screen.queryByRole("option", { name: "Contacted" })).not.toBeInTheDocument();
    const nextDate = screen.getByLabelText("Next follow-up");
    expect(nextDate).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Log follow-up" }));
    expect(createFollowUp).not.toHaveBeenCalled();

    fireEvent.change(nextDate, { target: { value: "2026-10-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Log follow-up" }));

    await waitFor(() =>
      expect(createFollowUp).toHaveBeenCalledWith(
        expect.objectContaining({
          enquiryId: "enquiry-1",
          stage: "closed",
          nextFollowupDate: expect.stringContaining("2026-10-20"),
        }),
      ),
    );
  });

  it("saves an existing follow-up instead of creating another one", async () => {
    renderMobile(
      <CreateFollowUpSheet
        open
        followUp={{
          id: "follow-9",
          enquiryId: "enquiry-1",
          contactId: "contact-1",
          stage: "qualified",
          dueAt: "2026-10-10T04:30:00.000Z",
          nextFollowupDate: "2026-10-12T04:30:00.000Z",
          notes: "Sent the menu",
        }}
        enquiry={{ id: "enquiry-1", title: "Wedding reception" }}
        day={new Date("2026-10-10T00:00:00")}
        onOpenChange={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save follow-up" }));

    await waitFor(() =>
      expect(updateFollowUp).toHaveBeenCalledWith(
        "follow-9",
        expect.objectContaining({ enquiryId: "enquiry-1", stage: "qualified", notes: "Sent the menu" }),
      ),
    );
    expect(createFollowUp).not.toHaveBeenCalled();
  });
});
