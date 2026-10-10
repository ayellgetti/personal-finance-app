/** @vitest-environment jsdom */
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DueDatePicker } from "@/components/forms/DueDatePicker";
import { applyDueDateShortcut, dayKey } from "@/lib/mobile/calendar";

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function Harness({ from, initial = "" }: { from: Date; initial?: string }) {
  const [value, setValue] = useState(initial);
  return <DueDatePicker value={value} onChange={setValue} from={from} />;
}

describe("DueDatePicker", () => {
  const from = new Date(2026, 9, 10);

  it("sets an exact date from the 7 day, 1 month, 3 month, and 6 month shortcuts", () => {
    render(<Harness from={from} />);
    expect(screen.getByText("Pick a date")).toBeInTheDocument();
    expect(screen.getByText("October 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "7 days" }));
    expect(screen.getByRole("button", { name: dayLabel(applyDueDateShortcut("7d", from)) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "1 month" }));
    expect(screen.getByRole("button", { name: dayLabel(applyDueDateShortcut("1m", from)) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("November 2026")).toBeInTheDocument();

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
    expect(screen.queryByText("Pick a date")).not.toBeInTheDocument();
  });

  it("does not let a day before today be selected", () => {
    render(<Harness from={from} />);
    expect(screen.getByRole("button", { name: dayLabel(new Date(2026, 9, 9)) })).toBeDisabled();
    expect(screen.getByRole("button", { name: dayLabel(from) })).toBeEnabled();
  });

  it("selects a calendar day and still lets the month move", () => {
    render(<Harness from={from} />);
    const target = new Date(2026, 9, 24);
    fireEvent.click(screen.getByRole("button", { name: dayLabel(target) }));
    expect(screen.getByRole("button", { name: dayLabel(target) })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(dayKey(target)).toBe("2026-10-24");
  });
});
