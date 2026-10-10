/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import Payments from "@/pages/Payments";
import { formatMoney } from "@/lib/mobile/format";
import { pageOf } from "@/test/fixtures";
import { renderMobile } from "@/test/render-mobile";
import { CRM_PERMISSIONS, type CrmPayment } from "@/types/crm";

const state = vi.hoisted(() => ({ permissions: [] as string[] }));
const remote = vi.hoisted(() => ({
  listPayments: vi.fn(),
  listClients: vi.fn(),
  listContacts: vi.fn(),
}));

vi.mock("@/lib/mobile/store", () => ({ useMobile: () => ({ permissions: state.permissions }) }));
vi.mock("@/lib/mobile/remote", () => remote);

function payment(overrides: Partial<CrmPayment>): CrmPayment {
  return {
    id: "pay-1",
    referenceType: "client",
    referenceId: "client-1",
    enquiryId: null,
    amount: 50000,
    currency: "INR",
    type: "INCOME",
    mode: "UPI",
    status: "paid",
    paidAt: "2026-10-01T00:00:00.000Z",
    reference: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.permissions = [CRM_PERMISSIONS.paymentsRead];
  remote.listPayments.mockResolvedValue(
    pageOf([
      payment({ id: "in", amount: 50000, type: "INCOME" }),
      payment({ id: "out", amount: 12000, type: "EXPENSE" }),
    ]),
  );
});

describe("payments", () => {
  it("is forbidden without crm.payments.read", () => {
    state.permissions = [];
    renderMobile(<Payments />, ["/payments"]);
    expect(screen.getByText("Your role cannot view payments.")).toBeInTheDocument();
  });

  it("shows income, expense, and the balance of the loaded rows", async () => {
    renderMobile(<Payments />, ["/payments"]);
    const totals = await screen.findByLabelText("Loaded totals");
    expect(within(totals).getByText("Income")).toBeInTheDocument();
    expect(within(totals).getByText("Expense")).toBeInTheDocument();
    expect(within(totals).getByText("Balance")).toBeInTheDocument();
    expect(within(totals).getByText(formatMoney(50000, "INR"))).toBeInTheDocument();
    expect(within(totals).getByText(formatMoney(12000, "INR"))).toBeInTheDocument();
    expect(within(totals).getByText(formatMoney(38000, "INR"))).toHaveClass("text-emerald-700");
  });
});
