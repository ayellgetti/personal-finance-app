/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MonthYearPicker } from "@/components/MonthYearPicker";
import { renderMobile } from "@/test/render-mobile";

describe("month and year picker", () => {
  it("jumps to the selected month and year", () => {
    const onChange = vi.fn();
    renderMobile(<MonthYearPicker cursor={new Date(2026, 9, 1)} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /Choose month and year, currently October 2026/ }));
    fireEvent.change(screen.getByLabelText("Month"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "2028" } });
    fireEvent.click(screen.getByRole("button", { name: "Go" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]).toEqual(new Date(2028, 2, 1));
  });
});
