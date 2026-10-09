import { describe, expect, it } from "vitest";
import {
  dayKey,
  groupByDay,
  monthGrid,
  rangeFor,
  rangeLabel,
  shiftCursor,
  visibleDays,
  weekGrid,
} from "@/lib/mobile/calendar";
import type { CrmCalendarItem } from "@/types/crm";

function item(partial: Partial<CrmCalendarItem> & { id: string; at: string }): CrmCalendarItem {
  return {
    kind: "task",
    title: partial.id,
    endsAt: null,
    contactId: null,
    enquiryId: null,
    ...partial,
  };
}

describe("calendar grids", () => {
  it("builds six Monday-aligned weeks for any month", () => {
    const grid = monthGrid(new Date(2026, 9, 1));

    expect(grid).toHaveLength(42);
    expect(grid[0]?.getDay()).toBe(1);
    expect(grid.some((day) => dayKey(day) === "2026-10-01")).toBe(true);
    expect(grid.some((day) => dayKey(day) === "2026-10-31")).toBe(true);
  });

  it("builds a Monday to Sunday week around any day", () => {
    const week = weekGrid(new Date(2026, 9, 9));

    expect(week.map(dayKey)).toEqual([
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
    ]);
  });

  it("shows a single day in day view", () => {
    expect(visibleDays("day", new Date(2026, 9, 9))).toHaveLength(1);
  });
});

describe("calendar navigation", () => {
  it("steps by month, week or day depending on the view", () => {
    const cursor = new Date(2026, 9, 9);

    expect(dayKey(shiftCursor("month", cursor, 1))).toBe("2026-11-01");
    expect(dayKey(shiftCursor("week", cursor, -1))).toBe("2026-10-02");
    expect(dayKey(shiftCursor("day", cursor, 1))).toBe("2026-10-10");
  });

  it("covers the whole visible span, inclusive of the last day", () => {
    const days = weekGrid(new Date(2026, 9, 9));
    const range = rangeFor(days, new Date(2026, 9, 9));

    expect(new Date(range.from).getTime()).toBeLessThan(new Date(range.to).getTime());
    expect(dayKey(new Date(range.from))).toBe("2026-10-05");
    expect(dayKey(new Date(range.to))).toBe("2026-10-11");
  });

  it("stays inside the ninety-two day API cap for a month grid", () => {
    const days = monthGrid(new Date(2026, 9, 1));
    const range = rangeFor(days, new Date(2026, 9, 1));
    const spanDays = (new Date(range.to).getTime() - new Date(range.from).getTime()) / 86_400_000;

    expect(spanDays).toBeLessThan(92);
  });

  it("labels the month, the week span and the single day", () => {
    const month = new Date(2026, 9, 1);
    expect(rangeLabel("month", monthGrid(month), month)).toContain("2026");

    const week = weekGrid(new Date(2026, 9, 9));
    expect(rangeLabel("week", week, new Date(2026, 9, 9))).toContain("–");
  });
});

describe("grouping", () => {
  it("buckets items by local day and sorts each bucket by time", () => {
    const grouped = groupByDay([
      item({ id: "late", at: new Date(2026, 9, 9, 17, 0).toISOString() }),
      item({ id: "early", at: new Date(2026, 9, 9, 9, 0).toISOString(), kind: "followup" }),
      item({ id: "other", at: new Date(2026, 9, 10, 9, 0).toISOString(), kind: "booking" }),
    ]);

    expect(grouped.get("2026-10-09")?.map((entry) => entry.id)).toEqual(["early", "late"]);
    expect(grouped.get("2026-10-10")?.map((entry) => entry.id)).toEqual(["other"]);
  });
});
