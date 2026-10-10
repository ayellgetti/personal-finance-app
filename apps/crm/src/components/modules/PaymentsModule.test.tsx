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

vi.mock("@/lib/auth/store", () => {
  const user = { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" };
  const logout = vi.fn();
  return { useAuth: () => ({ user, logout }) };
});

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

  it("switches payments between table, cards, and calendar", async () => {
    const paidAt = new Date();
    paidAt.setDate(Math.min(paidAt.getDate(), 28));
    paidAt.setHours(10, 0, 0, 0);
    listClients.mockResolvedValue(
      emptyPage([
        {
          id: "client-1",
          contactId: "contact-1",
          status: "active",
          billingName: "Acme Events",
          gstin: null,
          convertedFromEnquiryId: null,
          startsAt: null,
          endsAt: null,
        },
      ]),
    );
    listPayments.mockResolvedValue(
      emptyPage([
        {
          id: "payment-1",
          referenceType: "client",
          referenceId: "client-1",
          enquiryId: null,
          amount: 25000,
          currency: "INR",
          type: "INCOME",
          mode: "UPI",
          status: "paid",
          paidAt: paidAt.toISOString(),
          reference: "TXN-4421",
        },
      ]),
    );
    renderCrm(<PaymentsModule />);

    expect(await screen.findByRole("columnheader", { name: "Payee" })).toBeInTheDocument();
    expect(screen.getByText("TXN-4421")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Card view" }));
    expect(await screen.findByText("Acme Events")).toBeInTheDocument();
    expect(screen.getByText("TXN-4421")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Payee" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Calendar view" }));
    expect(await screen.findByText("Mon")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Acme Events/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Payee" })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(listPayments).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 500, from: expect.any(String), to: expect.any(String) }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /Acme Events/ }));
    expect(await screen.findByRole("button", { name: "Save" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Table view" }));
    expect(await screen.findByRole("columnheader", { name: "Payee" })).toBeInTheDocument();
  });
});
