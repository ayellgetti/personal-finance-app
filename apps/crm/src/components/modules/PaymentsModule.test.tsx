/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { PaymentsModule } from "@/components/modules/PaymentsModule";
import {
  adminMe,
  createCalendarEvent,
  createFollowUp,
  createPayment,
  emptyPage,
  fetchCrmMe,
  listClients,
  listContacts,
  listPayments,
} from "@/test/crm-remote-mock";
import { renderCrm } from "@/test/render-crm";
import { CRM_PERMISSIONS, type CrmContact } from "@/types/crm";

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
    expect(screen.getByRole("option", { name: "Decor Co · +919222222222" })).toBeInTheDocument();
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
    expect(await screen.findByRole("heading", { name: /₹25,000|25,000/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add payment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add reminder" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add follow-up" })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0] as HTMLElement);

    fireEvent.click(screen.getByRole("button", { name: "Table view" }));
    expect(await screen.findByRole("columnheader", { name: "Payee" })).toBeInTheDocument();
  });

  it("searches by payee mobile and creates contextual reminders and follow-ups", async () => {
    const contact = {
      id: "contact-1",
      name: "Priya Shah",
      mobile: "+919888888888",
      type: "client" as const,
      email: null,
      companyName: null,
      notes: null,
    };
    listContacts.mockResolvedValue(emptyPage([contact]));
    listClients.mockResolvedValue(emptyPage([{
      id: "client-1",
      contactId: contact.id,
      status: "active",
      billingName: "Acme Events",
      gstin: null,
      convertedFromEnquiryId: "enquiry-1",
      startsAt: null,
      endsAt: null,
    }]));
    listPayments.mockResolvedValue(emptyPage([{
      id: "payment-1",
      referenceType: "client",
      referenceId: "client-1",
      enquiryId: "enquiry-1",
      amount: 25000,
      currency: "INR",
      type: "INCOME",
      mode: "UPI",
      status: "paid",
      paidAt: new Date().toISOString(),
      reference: "TXN-4421",
    }]));
    createCalendarEvent.mockResolvedValue({
      id: "event-1",
      title: "Call Priya",
      startsAt: new Date().toISOString(),
      endsAt: new Date().toISOString(),
      slot: null,
      notes: null,
      contactId: contact.id,
      enquiryId: "enquiry-1",
    });
    createFollowUp.mockResolvedValue({});

    renderCrm(<PaymentsModule />);
    expect(await screen.findByText("Priya Shah · +919888888888")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "9888888888" } });
    expect(screen.getByText("TXN-4421")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "missing" } });
    expect(screen.queryByText("TXN-4421")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: "Add reminder" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Call Priya" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add reminder" }).at(-1) as HTMLElement);
    await waitFor(() => expect(createCalendarEvent).toHaveBeenCalledWith(
      expect.objectContaining({ contactId: contact.id, enquiryId: "enquiry-1" }),
    ));

    fireEvent.click(screen.getByRole("button", { name: "Add follow-up" }));
    fireEvent.change(screen.getByLabelText("Notes"), { target: { value: "Confirm balance" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add follow-up" }).at(-1) as HTMLElement);
    await waitFor(() => expect(createFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({ enquiryId: "enquiry-1", stage: "closed" }),
    ));
  });

  it("hides contextual create actions when the role only has payment read access", async () => {
    fetchCrmMe.mockResolvedValue({
      ...adminMe,
      roles: [{ id: "role-viewer", name: "Viewer", slug: "viewer" }],
      permissions: [CRM_PERMISSIONS.paymentsRead],
    });
    listPayments.mockResolvedValue(emptyPage([{
      id: "payment-1",
      referenceType: "vendor",
      referenceId: vendor.id,
      enquiryId: null,
      amount: 5000,
      currency: "INR",
      type: "EXPENSE",
      mode: "UPI",
      status: "paid",
      paidAt: new Date().toISOString(),
      reference: null,
    }]));

    renderCrm(<PaymentsModule />);
    expect(await screen.findByRole("button", { name: "View" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add payment" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add reminder" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add follow-up" })).not.toBeInTheDocument();
  });
});
