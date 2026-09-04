import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import { EnquiryService, type ConvertedEnquiry } from "../modules/sales-crm/enquiries/enquiry.service";
import { createEnquiryBodySchema } from "../modules/sales-crm/enquiries/enquiry.request";
import type {
  CrmClientModel,
  CrmContactModel,
  CrmEnquiryModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

type FakeContact = {
  id: string;
  name: string;
  mobile: string;
  type: "lead" | "client" | "vendor" | "employee";
  isActive: number;
  createdBy?: string;
  updatedBy?: string;
};

type FakeEnquiry = {
  id: string;
  contactId: string;
  title: string;
  source: string;
  status: "new" | "in_progress" | "won" | "lost" | "on_hold";
  expectedValue: number | null;
  assignedToId: string | null;
  notes: string | null;
  isActive: number;
  createdBy?: string;
  updatedBy?: string;
};

type FakeClient = {
  id: string;
  contactId: string;
  status: "active" | "inactive";
  billingName: string;
  gstin: string | null;
  convertedFromEnquiryId: string | null;
  isActive: number;
  createdBy?: string;
  updatedBy?: string;
};

function setup(contactSeed: FakeContact[] = [], enquirySeed: FakeEnquiry[] = []) {
  const contacts = fakeCrud("contact", contactSeed);
  const enquiries = fakeCrud("enquiry", enquirySeed);
  const clients = fakeCrud<FakeClient>("client", []);
  const service = new EnquiryService(
    enquiries.model as unknown as CrmEnquiryModel,
    contacts.model as unknown as CrmContactModel,
    clients.model as unknown as CrmClientModel,
    async (input) => {
      const enquiry = await enquiries.model.update(
        { id: input.enquiryId },
        { status: "won", updatedBy: input.actorId },
      );
      const contact = await contacts.model.update(
        { id: input.contactId },
        { type: "client", updatedBy: input.actorId },
      );
      const existing = input.existingClientId
        ? await clients.model.update(
            { id: input.existingClientId },
            {
              isActive: 1,
              billingName: input.billingName,
              updatedBy: input.actorId,
            },
          )
        : await clients.model.create({
            contactId: input.contactId,
            status: "active",
            billingName: input.billingName,
            gstin: null,
            convertedFromEnquiryId: input.convertedFromEnquiryId,
            createdBy: input.actorId,
            updatedBy: input.actorId,
          });
      return { enquiry, contact, client: existing } as ConvertedEnquiry;
    },
  );
  return { service, contacts, enquiries, clients };
}

test("enquiry create, list, update, and soft-delete hide the row", async () => {
  const { service, contacts } = setup([
    { id: "c-1", name: "Ada", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const created = await service.create("user-1", {
    contactId: "c-1",
    title: "Banquet",
    source: "web",
  });
  assert.equal(created.status, "new");
  const listed = await service.list({ contactId: "c-1" });
  assert.equal(listed.items.length, 1);
  await service.update("user-1", created.id, { status: "in_progress" });
  await service.remove("user-1", { id: created.id });
  assert.equal((await service.list({})).items.length, 0);
  assert.equal(contacts.rows[0]?.type, "lead");
});

test("enquiry against a soft-deleted contact is 422", async () => {
  const { service } = setup([
    { id: "c-1", name: "Ada", mobile: "111", type: "lead", isActive: 0 },
  ]);
  await assert.rejects(
    () =>
      service.create("user-1", {
        contactId: "c-1",
        title: "Banquet",
        source: "web",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
});

test("convert sets won + client type and creates a client; second convert is idempotent", async () => {
  const { service, contacts, clients } = setup([
    { id: "c-1", name: "Ada Lovelace", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Banquet",
    source: "web",
  });
  const first = await service.convert("user-1", enquiry.id, { billingName: "Ada LLC" });
  assert.equal(first.enquiry.status, "won");
  assert.equal(first.contact.type, "client");
  assert.equal(first.client.billingName, "Ada LLC");
  assert.equal(first.client.contactId, "c-1");
  assert.equal(contacts.rows[0]?.type, "client");
  assert.equal(clients.rows.length, 1);

  const second = await service.convert("user-1", enquiry.id, {});
  assert.equal(second.client.id, first.client.id);
  assert.equal(clients.rows.length, 1);
});

test("enquiry create rejects empty title", () => {
  assert.equal(
    createEnquiryBodySchema.safeParse({
      contactId: "00000000-0000-4000-8000-000000000001",
      title: "",
      source: "web",
    }).success,
    false,
  );
});
