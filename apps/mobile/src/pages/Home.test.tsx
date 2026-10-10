/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import Home from "@/pages/Home";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmDashboard } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  fetchDashboard: vi.fn(),
  listClients: vi.fn(),
  listCalendar: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/auth/store", () => ({ useAuth: () => ({ user: { firstName: "Ada" } }) }));
vi.mock("@/lib/mobile/remote", () => remote);

const dashboard: CrmDashboard = {
  contactsByType: { lead: 7, client: 3, vendor: 2, employee: 1 },
  enquiries: { open: 5, closed: 4 },
  leadsGeneratedToday: 1,
  customerDueToday: 2,
  customerDueItems: [],
  overdueFollowUps: 0,
  followUpsToday: 3,
  paymentsPaidThisMonth: 2,
  paymentsIncomeThisMonth: 50000,
  paymentsExpenseThisMonth: 12000,
  tasksByStatus: { todo: 4, in_progress: 1, in_review: 0, done: 6 },
};

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [
    CRM_PERMISSIONS.dashboardRead,
    CRM_PERMISSIONS.tasksRead,
    CRM_PERMISSIONS.contactsRead,
    CRM_PERMISSIONS.paymentsRead,
  ];
  remote.fetchDashboard.mockResolvedValue(dashboard);
  remote.listClients.mockResolvedValue(pageOf([]));
  remote.listCalendar.mockResolvedValue({ items: [] });
});

describe("home", () => {
  it("is forbidden without crm.dashboard.read", () => {
    state.permissions = [];
    renderMobile(<Home />);
    expect(screen.getByText("Your role cannot view the dashboard.")).toBeInTheDocument();
  });

  it("shows contacts, monthly payments, and task links", async () => {
    renderMobile(<Home />);
    expect(await screen.findByText("Hi Ada")).toBeInTheDocument();
    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expense")).toBeInTheDocument();
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Todo\s*4/ })).toHaveAttribute("href", "/tasks?status=todo");
    expect(screen.getByRole("link", { name: /Lead\s*7/ })).toHaveAttribute("href", "/contacts?type=lead");
    expect(screen.getByRole("link", { name: /Income/ })).toHaveAttribute("href", "/payments?type=INCOME&month=current");
    expect(screen.getByRole("link", { name: /Balance/ })).toHaveAttribute("href", "/payments?month=current");
    expect(screen.getByRole("link", { name: "View payments" })).toHaveAttribute("href", "/payments");
  });

  it("offers a retry when the dashboard fails", async () => {
    remote.fetchDashboard.mockRejectedValue(new Error("Dashboard offline"));
    renderMobile(<Home />);
    expect(await screen.findByText("Dashboard offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
