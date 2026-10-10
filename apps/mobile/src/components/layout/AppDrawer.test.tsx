/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { AppDrawer } from "@/components/layout/AppDrawer";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS } from "@/types/crm";

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: { name: "Ada Lovelace", email: "ada@example.com" },
    logout: vi.fn(),
  }),
}));

function renderDrawer(permissions: string[], path = "/enquiries") {
  return renderMobile(
    <AppDrawer open onOpenChange={vi.fn()} permissions={permissions} />,
    [path],
  );
}

describe("sales CRM sidebar", () => {
  it("lists the web CRM groups and items in the same order", () => {
    renderDrawer([CRM_PERMISSIONS.usersRead, CRM_PERMISSIONS.rolesRead]);

    expect(screen.getByRole("heading", { name: "Sales CRM" })).toBeInTheDocument();
    expect(screen.getByText("Pipeline & collections")).toBeInTheDocument();

    const labels = screen.getAllByRole("link").map((link) => link.textContent);
    expect(labels).toEqual([
      "Dashboard",
      "Calendar",
      "Contacts",
      "Enquiries",
      "Follow-ups",
      "Booked",
      "Payments",
      "Tasks",
      "Reminders",
      "Users",
      "Roles",
    ]);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Enquiries" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("hides Users, Roles, and the Admin group without those permissions", () => {
    renderDrawer([CRM_PERMISSIONS.dashboardRead]);

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Follow-ups" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Roles" })).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });
});
