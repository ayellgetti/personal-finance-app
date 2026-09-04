import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import { ContactService } from "../modules/sales-crm/contacts/contact.service";
import { createContactBodySchema } from "../modules/sales-crm/contacts/contact.request";
import type { CrmContactModel } from "../models/index";
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
