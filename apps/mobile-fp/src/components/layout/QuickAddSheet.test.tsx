/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { QuickAddSheet } from "@/components/layout/QuickAddSheet";
import { renderMobile } from "@/test/render-mobile";

describe("quick add sheet", () => {
  it("offers finance create actions", () => {
    renderMobile(<QuickAddSheet open onOpenChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: /Income/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Expense/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Loan/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Goal/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Investment/ })).toBeInTheDocument();
  });

  it("renders nothing while closed", () => {
    renderMobile(<QuickAddSheet open={false} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /Income/ })).not.toBeInTheDocument();
  });
});
