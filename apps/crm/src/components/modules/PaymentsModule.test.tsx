/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { PaymentsModule } from "@/components/modules/PaymentsModule";
import {
  adminMe,
  createPayment,
  emptyPage,
  fetchCrmMe,
  listClients,
  listContacts,
  listPayments,
} from "@/test/crm-remote-mock";
import { renderCrm } from "@/test/render-crm";
import type { CrmContact } from "@/types/crm";

vi.mock("@/lib/auth/store", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/crm/remote", async () => import("@/test/crm-remote-mock"));

const vendor: CrmContact = {
  id: "vendor-1",
  name: "Decor Co",
  mobile: "+919222222222",
  type: "vendor",
  email: null,
  companyName: null,
  notes: null,
};

describe("PaymentsModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCrmMe.mockResolvedValue(adminMe);
    listClients.mockResolvedValue(emptyPage());
    listContacts.mockResolvedValue(emptyPage());
    listPayments.mockResolvedValue(emptyPage());
    createPayment.mockReset();
  });

  it("shows a vendor dropdown when the payee type is Vendor instead of the booked field", async () => {
    listContacts.mockResolvedValue(emptyPage([vendor]));
    renderCrm(<PaymentsModule />);
    fireEvent.click(await screen.findByRole("button", { name: "Add payment" }));

    expect(screen.getByLabelText("Payment type")).toBeInTheDocument();
    expect(screen.getByLabelText("Booked")).toBeInTheDocument();
    expect(screen.queryByLabelText("Vendor")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "vendor" } });

    await waitFor(() => {
      expect(screen.queryByLabelText("Booked")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Vendor")).toBeInTheDocument();
    });
    expect(screen.getByRole("option", { name: "Decor Co" })).toBeInTheDocument();
  });

  it("submits referenceType vendor + referenceId when paying a vendor, regardless of payment type", async () => {
    listContacts.mockResolvedValue(emptyPage([vendor]));
    createPayment.mockResolvedValue({
      id: "payment-1",
      referenceType: "vendor",
      referenceId: vendor.id,
      enquiryId: null,
      amount: 5000,
      currency: "INR",
      type: "INCOME",
      mode: "UPI",
      status: "pending",
      paidAt: null,
      reference: null,
    });
    renderCrm(<PaymentsModule />);
    fireEvent.click(await screen.findByRole("button", { name: "Add payment" }));
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "vendor" } });
    await screen.findByLabelText("Vendor");
    fireEvent.change(screen.getByLabelText("Vendor"), { target: { value: vendor.id } });
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "5000" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(createPayment).toHaveBeenCalled());
    expect(createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ referenceType: "vendor", referenceId: vendor.id, type: "INCOME" }),
    );
  });
});
