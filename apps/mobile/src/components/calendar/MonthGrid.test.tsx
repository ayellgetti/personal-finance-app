/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { groupByDay, monthGrid } from "@/lib/mobile/calendar";
import { renderMobile } from "@/test/render-mobile";
import type { CrmCalendarItem } from "@/types/crm";

const CURSOR = new Date(2026, 9, 1);

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
  {
    kind: "followup",
    id: "f1",
    title: "Call Priya",
    at: new Date(2026, 9, 9, 11, 0).toISOString(),
    endsAt: null,
    contactId: null,
    enquiryId: null,
  },
];

function renderGrid(onSelect = vi.fn(), onSwipe = vi.fn()) {
  renderMobile(
    <MonthGrid
      days={monthGrid(CURSOR)}
      cursor={CURSOR}
      byDay={groupByDay(ITEMS)}
      selectedKey={null}
      onSelect={onSelect}
      onSwipe={onSwipe}
    />,
  );
  return { onSelect, onSwipe };
}

describe("month grid", () => {
  it("announces how many items sit on a day", () => {
    renderGrid();

    expect(screen.getByRole("button", { name: /Fri Oct 09 2026, 2 items/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Thu Oct 08 2026, 0 items/ })).toBeInTheDocument();
  });

  it("selects the tapped day", () => {
    const { onSelect } = renderGrid();

    fireEvent.click(screen.getByRole("button", { name: /Fri Oct 09 2026/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toBeInstanceOf(Date);
  });

  it("moves to the next or previous month with horizontal swipes", () => {
    const { onSwipe } = renderGrid();
    const grid = screen.getByRole("button", { name: /Fri Oct 09 2026/ }).parentElement?.parentElement;
    expect(grid).not.toBeNull();

    fireEvent.touchStart(grid!, { touches: [{ clientX: 240, clientY: 120 }] });
    fireEvent.touchEnd(grid!, { changedTouches: [{ clientX: 120, clientY: 125 }] });
    fireEvent.touchStart(grid!, { touches: [{ clientX: 100, clientY: 120 }] });
    fireEvent.touchEnd(grid!, { changedTouches: [{ clientX: 210, clientY: 125 }] });

    expect(onSwipe).toHaveBeenNthCalledWith(1, 1);
    expect(onSwipe).toHaveBeenNthCalledWith(2, -1);
  });

  it("renders a full six week grid", () => {
    renderGrid();

    expect(screen.getAllByRole("button")).toHaveLength(42);
  });
});
