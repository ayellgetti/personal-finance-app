/** @vitest-environment jsdom */
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DatePicker } from "@/components/modules/DatePicker";
import { applyDueDateShortcut, dueDateShortcutKey, toLocalDateKey } from "@/lib/crm/display";

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function Harness({ from }: { from: Date }) {
  const [value, setValue] = useState("");
  return <DatePicker value={value} onChange={setValue} from={from} />;
}

describe("DatePicker", () => {
  const from = new Date(2026, 8, 19);

  it("sets an exact date from 7 day / 1 month / 3 month / 6 month shortcuts", () => {
    render(<Harness from={from} />);
    fireEvent.click(screen.getByRole("button", { name: "7 days" }));
    const seven = applyDueDateShortcut("7d", from);
    expect(screen.getByRole("button", { name: dayLabel(seven) })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "1 month" }));
    const month = applyDueDateShortcut("1m", from);
    expect(screen.getByRole("button", { name: dayLabel(month) })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "3 months" }));
    expect(screen.getByRole("button", { name: dayLabel(applyDueDateShortcut("3m", from)) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "6 months" }));
    expect(screen.getByRole("button", { name: dayLabel(applyDueDateShortcut("6m", from)) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(dueDateShortcutKey("6m", from)).toBe(toLocalDateKey(applyDueDateShortcut("6m", from)));
  });

  it("selects a calendar day as the exact due date", () => {
    render(<Harness from={from} />);
    const target = new Date(2026, 8, 24);
    fireEvent.click(screen.getByRole("button", { name: dayLabel(target) }));
    expect(screen.getByRole("button", { name: dayLabel(target) })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "false");
  });
});
