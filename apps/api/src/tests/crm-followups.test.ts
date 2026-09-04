import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import { FollowUpService } from "../modules/sales-crm/follow-ups/follow-up.service";
import { createFollowUpBodySchema } from "../modules/sales-crm/follow-ups/follow-up.request";
import type {
  CrmContactModel,
  CrmEnquiryModel,
  CrmFollowUpModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

function setup() {
  const contacts = fakeCrud("contact", [
    { id: "c-1", name: "Ada", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiries = fakeCrud("enquiry", [
    {
      id: "e-1",
      contactId: "c-1",
      title: "Case",
      source: "web",
      status: "new",
      isActive: 1,
    },
  ]);
  const followUps = fakeCrud("followup", []);
  const service = new FollowUpService(
    followUps.model as unknown as CrmFollowUpModel,
    contacts.model as unknown as CrmContactModel,
    enquiries.model as unknown as CrmEnquiryModel,
  );
  return { service, followUps };
}

test("follow-up create requires contactId and supports list filters", async () => {
  const { service } = setup();
  const dueAt = new Date("2026-09-10T10:00:00.000Z");
  const created = await service.create("user-1", {
    contactId: "c-1",
    enquiryId: "e-1",
    dueAt,
    notes: "Call back",
  });
  assert.equal(created.contactId, "c-1");
  const listed = await service.list({
    status: "pending",
    contactId: "c-1",
    from: new Date("2026-09-01T00:00:00.000Z"),
    to: new Date("2026-09-30T00:00:00.000Z"),
  });
  assert.equal(listed.items.length, 1);
  await service.remove("user-1", { id: created.id });
  assert.equal((await service.list({})).items.length, 0);
});

test("follow-up for missing contact is 404", async () => {
  const { service } = setup();
  await assert.rejects(
    () =>
      service.create("user-1", {
        contactId: "missing",
        dueAt: new Date(),
      }),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test("follow-up body requires contactId", () => {
  assert.equal(
    createFollowUpBodySchema.safeParse({ dueAt: "2026-09-10T10:00:00.000Z" }).success,
    false,
  );
  assert.equal(
    createFollowUpBodySchema.safeParse({
      contactId: "00000000-0000-4000-8000-000000000001",
      dueAt: "2026-09-10T10:00:00.000Z",
    }).success,
    true,
  );
});
