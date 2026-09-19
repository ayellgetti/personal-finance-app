import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import { ClientService } from "../modules/sales-crm/clients/client.service";
import { PaymentService } from "../modules/sales-crm/payments/payment.service";
import { createPaymentBodySchema } from "../modules/sales-crm/payments/payment.request";
import type {
  CrmClientModel,
  CrmContactModel,
  CrmEnquiryModel,
  CrmPaymentModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

function setup() {
  const contacts = fakeCrud("contact", [
    { id: "c-1", name: "Ada", mobile: "111", type: "client", isActive: 1 },
    { id: "c-lead", name: "Lead", mobile: "222", type: "lead", isActive: 1 },
    { id: "c-vendor", name: "Decor Co", mobile: "333", type: "vendor", isActive: 1 },
  ]);
  const enquiries = fakeCrud("enquiry", []);
  const clients = fakeCrud("client", []);
  const payments = fakeCrud("payment", []);
  const clientService = new ClientService(
    clients.model as unknown as CrmClientModel,
    contacts.model as unknown as CrmContactModel,
    enquiries.model as unknown as CrmEnquiryModel,
  );
  const paymentService = new PaymentService(
    payments.model as unknown as CrmPaymentModel,
    clients.model as unknown as CrmClientModel,
    enquiries.model as unknown as CrmEnquiryModel,
    contacts.model as unknown as CrmContactModel,
  );
  return { clientService, paymentService, clients, payments, contacts };
}

test("client create, list, update, and soft-delete hide the row", async () => {
  const { clientService } = setup();
  const created = await clientService.create("user-1", {
    contactId: "c-1",
    billingName: "Ada LLC",
  });
  assert.equal(created.billingName, "Ada LLC");
  const listed = await clientService.list({ search: "Ada" });
  assert.equal(listed.items.length, 1);
  await clientService.update("user-1", created.id, { gstin: "GSTIN1" });
  await clientService.remove("user-1", { id: created.id });
  assert.equal((await clientService.list({})).items.length, 0);
});

test("client cannot be created from a lead contact", async () => {
  const { clientService } = setup();
  await assert.rejects(
    () =>
      clientService.create("user-1", {
        contactId: "c-lead",
        billingName: "Nope",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
});

test("payment create, amount must be positive, and soft-delete hides the row", async () => {
  const { clientService, paymentService } = setup();
  const client = await clientService.create("user-1", {
    contactId: "c-1",
    billingName: "Ada LLC",
  });
  const payment = await paymentService.create("user-1", {
    referenceType: "client",
    referenceId: client.id,
    amount: 1500,
    mode: "UPI",
    status: "paid",
    paidAt: new Date("2026-09-02T00:00:00.000Z"),
  });
  assert.equal(payment.amount, 1500);
  assert.equal(payment.type, "INCOME");
  assert.equal(payment.mode, "UPI");
  const listed = await paymentService.list({
    referenceType: "client",
    referenceId: client.id,
    status: "paid",
    from: new Date("2026-09-01T00:00:00.000Z"),
    to: new Date("2026-09-30T00:00:00.000Z"),
  });
  assert.equal(listed.items.length, 1);
  await paymentService.remove("user-1", { id: payment.id });
  assert.equal((await paymentService.list({})).items.length, 0);

  assert.equal(
    createPaymentBodySchema.safeParse({
      referenceType: "client",
      referenceId: "00000000-0000-4000-8000-000000000001",
      amount: 0,
      mode: "UPI",
    }).success,
    false,
  );
  assert.equal(
    createPaymentBodySchema.safeParse({
      referenceType: "client",
      referenceId: "00000000-0000-4000-8000-000000000001",
      amount: -1,
      mode: "UPI",
    }).success,
    false,
  );
  assert.equal(
    createPaymentBodySchema.safeParse({
      referenceType: "client",
      referenceId: "00000000-0000-4000-8000-000000000001",
      amount: 10,
      mode: "WALLET",
    }).success,
    false,
  );
});

test("payment can be made to a vendor instead of a client", async () => {
  const { paymentService } = setup();
  const payment = await paymentService.create("user-1", {
    referenceType: "vendor",
    referenceId: "c-vendor",
    amount: 25000,
    type: "EXPENSE",
    mode: "BANK_TRANSFER",
    status: "paid",
  });
  assert.equal(payment.referenceType, "vendor");
  assert.equal(payment.referenceId, "c-vendor");
  assert.equal(payment.type, "EXPENSE");

  const listed = await paymentService.list({ referenceType: "vendor", referenceId: "c-vendor" });
  assert.equal(listed.items.length, 1);
});

test("payment requires both referenceType and referenceId, and the vendor contact must be type vendor", async () => {
  const { paymentService } = setup();

  assert.equal(
    createPaymentBodySchema.safeParse({
      amount: 1000,
      mode: "UPI",
    }).success,
    false,
  );
  assert.equal(
    createPaymentBodySchema.safeParse({
      referenceType: "client",
      amount: 1000,
      mode: "UPI",
    }).success,
    false,
  );

  await assert.rejects(
    () =>
      paymentService.create("user-1", {
        referenceType: "vendor",
        referenceId: "c-lead",
        amount: 500,
        mode: "CASH",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
});
