/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { BottomNav } from "@/components/layout/BottomNav";
import { TABS } from "@/components/layout/nav";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS } from "@/types/crm";

const ALL = [
  CRM_PERMISSIONS.dashboardRead,
  CRM_PERMISSIONS.enquiriesRead,
  CRM_PERMISSIONS.calendarRead,
  CRM_PERMISSIONS.clientsRead,
  CRM_PERMISSIONS.paymentsRead,
];

describe("bottom tab bar", () => {
  it("renders exactly five tabs", () => {
    renderMobile(<BottomNav permissions={ALL} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    for (const tab of TABS) {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    }
  });

  it("marks the tab for the current route as current", () => {
    renderMobile(<BottomNav permissions={ALL} />, ["/booked"]);
    expect(screen.getByRole("link", { name: "Booked" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("keeps Home from matching every route", () => {
    renderMobile(<BottomNav permissions={ALL} />, ["/enquiries"]);
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Enquiries" })).toHaveAttribute("aria-current", "page");
  });

  it("disables tabs the role cannot open but still shows five slots", () => {
    renderMobile(<BottomNav permissions={[CRM_PERMISSIONS.dashboardRead]} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enquiries" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Calendar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Booked" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Payments" })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  });

  it("shows a badge dot only for tabs with pending items", () => {
    renderMobile(<BottomNav permissions={ALL} badges={{ "/enquiries": 3 }} />);
    expect(screen.getByLabelText("3 pending")).toBeInTheDocument();
    expect(screen.queryByLabelText("0 pending")).not.toBeInTheDocument();
  });
});
