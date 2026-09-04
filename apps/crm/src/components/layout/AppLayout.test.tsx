/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/layout/AppLayout";
import { visibleNavItems } from "@/components/layout/nav";
import { CRM_PERMISSIONS } from "@/types/crm";

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: { name: "Ada Lovelace", email: "ada@example.com" },
    logout: vi.fn(),
  }),
}));

function renderLayout(permissions: string[]) {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <MemoryRouter>
        <AppLayout
          active="dashboard"
          permissions={permissions}
          onSelect={() => undefined}
          title="Dashboard"
          description="Your CRM workspace at a glance"
        >
          <div>Dashboard body</div>
        </AppLayout>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("admin nav", () => {
  it("hides Users, Roles, and the Admin group without those permissions", () => {
    renderLayout([CRM_PERMISSIONS.dashboardRead]);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Roles" })).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows Users and Roles when the matching read permissions are present", () => {
    renderLayout([CRM_PERMISSIONS.usersRead, CRM_PERMISSIONS.rolesRead]);
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));

    expect(screen.getByRole("button", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Roles" })).toBeInTheDocument();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
  });

  it("filters admin items from the nav catalog without mutating other groups", () => {
    const items = visibleNavItems([CRM_PERMISSIONS.dashboardRead]);
    expect(items.some((item) => item.id === "users" || item.id === "roles")).toBe(false);
    expect(items.some((item) => item.id === "contacts")).toBe(true);
  });
});
