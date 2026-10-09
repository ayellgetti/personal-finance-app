/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { DaySheet } from "@/components/calendar/DaySheet";
import { renderMobile } from "@/test/render-mobile";
import type { CrmCalendarItem } from "@/types/crm";

const DAY = new Date(2026, 9, 9);

const ITEMS: CrmCalendarItem[] = [
  {
    kind: "booking",
    id: "b1",
    title: "Sangeet hall",
    at: new Date(2026, 9, 9, 18, 0).toISOString(),
    endsAt: null,
    contactId: null,
    enquiryId: null,
  },
];

describe("day sheet", () => {
  it("lists what is already on the day", () => {
    renderMobile(
      <DaySheet day={DAY} items={ITEMS} targets={[]} onOpenChange={vi.fn()} onPick={vi.fn()} />,
    );

    expect(screen.getByText("Sangeet hall")).toBeInTheDocument();
    expect(screen.getByText("Booked")).toBeInTheDocument();
    expect(screen.getByText("1 item on this day.")).toBeInTheDocument();
  });

  it("offers only the create targets the role is allowed", () => {
    renderMobile(
      <DaySheet
        day={DAY}
        items={[]}
        targets={["reminder", "task"]}
        onOpenChange={vi.fn()}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Reminder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Task" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enquiry" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Follow-up" })).not.toBeInTheDocument();
  });

  it("reports the picked target", () => {
    const onPick = vi.fn();
    renderMobile(
      <DaySheet day={DAY} items={[]} targets={["followUp"]} onOpenChange={vi.fn()} onPick={onPick} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Follow-up" }));

    expect(onPick).toHaveBeenCalledWith("followUp");
  });

  it("renders nothing without a day", () => {
    renderMobile(
      <DaySheet day={null} items={ITEMS} targets={["task"]} onOpenChange={vi.fn()} onPick={vi.fn()} />,
    );

    expect(screen.queryByText("Sangeet hall")).not.toBeInTheDocument();
  });
});
