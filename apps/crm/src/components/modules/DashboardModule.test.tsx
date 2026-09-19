/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { DashboardModule } from "@/components/modules/DashboardModule";
import { formatMoney } from "@/lib/crm/display";
import { adminMe, fetchCrmMe, fetchDashboard } from "@/test/crm-remote-mock";
import { renderCrm } from "@/test/render-crm";

vi.mock("@/lib/auth/store", () => {
  const logout = vi.fn();
  return {
    useAuth: () => ({
      user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
      logout,
    }),
  };
});

vi.mock("@/lib/crm/remote", async () => import("@/test/crm-remote-mock"));

describe("DashboardModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCrmMe.mockResolvedValue(adminMe);
    fetchDashboard.mockResolvedValue({
      contactsByType: { lead: 0, client: 0, vendor: 0, employee: 0 },
      enquiries: { open: 0, closed: 0 },
      leadsGeneratedToday: 0,
      customerDueToday: 0,
      customerDueItems: [],
      overdueFollowUps: 2,
      followUpsToday: 4,
      paymentsPaidThisMonth: 140,
      paymentsIncomeThisMonth: 100,
      paymentsExpenseThisMonth: 40,
      tasksByStatus: { todo: 0, in_progress: 0, in_review: 0, done: 0 },
    });
  });

  it("shows follow-ups for today and splits transaction this month into income and expense", async () => {
    renderCrm(<DashboardModule />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Follow-ups for today" })).toHaveTextContent("4");
      expect(screen.getByText("Overdue follow-ups")).toBeInTheDocument();
      expect(screen.getByText("Transaction this month")).toBeInTheDocument();
      expect(screen.getByText("Income")).toBeInTheDocument();
      expect(screen.getByText("Expense")).toBeInTheDocument();
      expect(screen.getByText(formatMoney(100))).toBeInTheDocument();
      expect(screen.getByText(formatMoney(40))).toBeInTheDocument();
    });
  });
});
