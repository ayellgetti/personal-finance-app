/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { BottomNav } from "@/components/layout/BottomNav";
import { TABS } from "@/components/layout/nav";
import { renderMobile } from "@/test/render-mobile";

describe("bottom tab bar", () => {
  it("renders five finance tabs and keeps Profile out of the bar", () => {
    renderMobile(<BottomNav />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
    for (const tab of TABS) {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    }
  });

  it("marks the tab for the current route as current", () => {
    renderMobile(<BottomNav />, ["/wealth"]);
    expect(screen.getByRole("link", { name: "Wealth" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("keeps Home from matching every route", () => {
    renderMobile(<BottomNav />, ["/goals"]);
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute("aria-current", "page");
  });
});
