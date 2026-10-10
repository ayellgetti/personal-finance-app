/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { renderMobile } from "@/test/render-mobile";

describe("mobile header", () => {
  it("shows the current page title between the menu and create buttons", () => {
    renderMobile(<MobileHeader title="Contacts" onOpenMenu={vi.fn()} onOpenQuickAdd={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Contacts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("button", { name: "Create" })).not.toBeInTheDocument();
  });

  it("opens the menu without triggering quick add", () => {
    const onOpenMenu = vi.fn();
    const onOpenQuickAdd = vi.fn();
    renderMobile(<MobileHeader title="Home" onOpenMenu={onOpenMenu} onOpenQuickAdd={onOpenQuickAdd} />);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    expect(onOpenMenu).toHaveBeenCalledTimes(1);
    expect(onOpenQuickAdd).not.toHaveBeenCalled();
  });

  it("opens quick add from the plus-circle button", () => {
    const onOpenMenu = vi.fn();
    const onOpenQuickAdd = vi.fn();
    renderMobile(<MobileHeader title="Home" onOpenMenu={onOpenMenu} onOpenQuickAdd={onOpenQuickAdd} showQuickAdd />);

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onOpenQuickAdd).toHaveBeenCalledTimes(1);
    expect(onOpenMenu).not.toHaveBeenCalled();
  });
});
