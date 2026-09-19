import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import { ContactService } from "../modules/sales-crm/contacts/contact.service";
import { createContactBodySchema } from "../modules/sales-crm/contacts/contact.request";
import type {
  CrmClientModel,
  CrmContactModel,
  CrmEnquiryModel,
  CrmFollowUpModel,
  CrmPaymentModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

type FakeContact = {
  id: string;
  name: string;
  mobile: string;
  type: "lead" | "client" | "vendor" | "employee";
  email: string | null;
  companyName: string | null;
  notes: string | null;
  isActive: number;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string | null;
  deletedAt?: Date | null;
};

function service(seed: FakeContact[] = []) {
  const fake = fakeCrud("contact", seed);
  return {
    ...fake,
    service: new ContactService(fake.model as unknown as CrmContactModel),
  };
}

test("contact create, list pagination, update, and soft-delete hide the row", async () => {
  const { service: contacts, rows } = service();
  const created = await contacts.create("user-1", {
    name: "Ada",
    mobile: "9876543210",
    type: "lead",
  });
  assert.equal(created.name, "Ada");
  assert.equal(created.createdBy, "user-1");

  const listed = await contacts.list({ page: 1, limit: 10 });
  assert.equal(listed.items.length, 1);
  assert.equal(listed.pagination.total, 1);

  const updated = await contacts.update("user-1", created.id, { name: "Ada Lovelace" });
  assert.equal(updated.name, "Ada Lovelace");
  assert.equal(updated.updatedBy, "user-1");

  await contacts.remove("user-1", { id: created.id });
  assert.equal(rows[0]?.isActive, 0);
  const after = await contacts.list({});
  assert.equal(after.items.length, 0);
  await assert.rejects(
    () => contacts.getById(created.id),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test("contact list filters by type and search", async () => {
  const { service: contacts } = service([
    {
      id: "c-1",
      name: "Ada",
      mobile: "1111111111",
      type: "lead",
      email: null,
      companyName: null,
      notes: null,
      isActive: 1,
    },
    {
      id: "c-2",
      name: "Grace",
      mobile: "2222222222",
      type: "client",
      email: null,
      companyName: null,
      notes: null,
      isActive: 1,
    },
  ]);
  const leads = await contacts.list({ type: "lead" });
  assert.equal(leads.items.length, 1);
  assert.equal(leads.items[0]?.name, "Ada");
  const search = await contacts.list({ search: "2222" });
  assert.equal(search.items.length, 1);
  assert.equal(search.items[0]?.name, "Grace");
});

test("duplicate active contact mobile is 409", async () => {
  const { service: contacts } = service();
  await contacts.create("user-1", {
    name: "Ada",
    mobile: "9876543210",
    type: "lead",
  });
  await assert.rejects(
    () =>
      contacts.create("user-1", {
        name: "Other",
        mobile: "9876543210",
        type: "vendor",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409,
  );
});

test("contact detail groups follow-ups under each enquiry and lists related payments", async () => {
  const contacts = fakeCrud("contact", [
    {
      id: "c-1",
      name: "Ada",
      mobile: "1111111111",
      type: "client" as const,
      email: null,
      companyName: null,
      notes: null,
      isActive: 1,
    },
    {
      id: "c-other",
      name: "Other",
      mobile: "9999999999",
      type: "lead" as const,
      email: null,
      companyName: null,
      notes: null,
      isActive: 1,
    },
  ]);
  const enquiries = fakeCrud("enquiry", [
    {
      id: "e-new",
      contactId: "c-1",
      title: "Newer hall booking",
      source: "Walk-in",
      status: "new",
      createdAt: new Date("2026-09-18T10:00:00.000Z"),
      isActive: 1,
    },
    {
      id: "e-old",
      contactId: "c-1",
      title: "Older catering lead",
      source: "Website",
      status: "contacted",
      createdAt: new Date("2026-09-10T10:00:00.000Z"),
      isActive: 1,
    },
    {
      id: "e-other",
      contactId: "c-other",
      title: "Someone else",
      source: "Ads",
      status: "new",
      createdAt: new Date("2026-09-19T10:00:00.000Z"),
      isActive: 1,
    },
  ]);
  const followUps = fakeCrud("followup", [
    {
      id: "fu-1",
      enquiryId: "e-old",
      contactId: "c-1",
      stage: "contacted",
      dueAt: new Date("2026-09-12T09:00:00.000Z"),
      notes: "Called about catering",
      isActive: 1,
    },
    {
      id: "fu-other",
      enquiryId: "e-other",
      contactId: "c-other",
      stage: "new",
      dueAt: new Date("2026-09-19T11:00:00.000Z"),
      notes: "Not this contact",
      isActive: 1,
    },
  ]);
  const clients = fakeCrud("client", [
    {
      id: "client-1",
      contactId: "c-1",
      billingName: "Ada LLC",
      isActive: 1,
    },
  ]);
  const payments = fakeCrud("payment", [
    {
      id: "pay-client",
      referenceType: "client",
      referenceId: "client-1",
      enquiryId: "e-old",
      amount: 15000,
      status: "paid",
      paidAt: new Date("2026-09-16T00:00:00.000Z"),
      createdAt: new Date("2026-09-16T00:00:00.000Z"),
      isActive: 1,
    },
    {
      id: "pay-other",
      referenceType: "client",
      referenceId: "someone-else",
      enquiryId: "e-other",
      amount: 99,
      status: "paid",
      paidAt: new Date("2026-09-17T00:00:00.000Z"),
      createdAt: new Date("2026-09-17T00:00:00.000Z"),
      isActive: 1,
    },
  ]);
  const contactsService = new ContactService(
    contacts.model as unknown as CrmContactModel,
    enquiries.model as unknown as CrmEnquiryModel,
    followUps.model as unknown as CrmFollowUpModel,
    clients.model as unknown as CrmClientModel,
    payments.model as unknown as CrmPaymentModel,
  );

  const detail = await contactsService.getDetail("c-1");
  assert.equal(detail.contact.name, "Ada");
  assert.deepEqual(
    detail.enquiries.map((enquiry) => enquiry.id),
    ["e-new", "e-old"],
  );
  assert.equal(detail.enquiries[0]?.followUps.length, 0);
  assert.equal(detail.enquiries[1]?.followUps[0]?.notes, "Called about catering");
  assert.equal(detail.payments.length, 1);
  assert.equal(detail.payments[0]?.id, "pay-client");
});

test("contact create rejects empty name and invalid mobile", () => {
  assert.equal(createContactBodySchema.safeParse({ name: "", mobile: "9876543210", type: "lead" }).success, false);
  assert.equal(
    createContactBodySchema.safeParse({ name: "Ada", mobile: "abc", type: "lead" }).success,
    false,
  );
  assert.equal(
    createContactBodySchema.safeParse({ name: "Ada", mobile: "9876543210", type: "unknown" }).success,
    false,
  );
});
