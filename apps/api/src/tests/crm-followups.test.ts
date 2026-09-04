import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import { FollowUpService } from "../modules/sales-crm/follow-ups/follow-up.service";
import { createFollowUpBodySchema } from "../modules/sales-crm/follow-ups/follow-up.request";
import type {
  CrmEnquiryModel,
  CrmFollowUpModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

function setup() {
  const enquiries = fakeCrud("enquiry", [
    {
      id: "e-1",
      contactId: "c-1",
      title: "Banquet",
      source: "web",
      status: "new",
      isActive: 1,
    },
  ]);
  const followUps = fakeCrud("followup", []);
  const service = new FollowUpService(
    followUps.model as unknown as CrmFollowUpModel,
    enquiries.model as unknown as CrmEnquiryModel,
  );
  return { service, followUps };
}

test("follow-up create derives contactId from enquiry and supports list filters", async () => {
  const { service, followUps } = setup();
  const dueAt = new Date("2026-09-10T10:00:00.000Z");
  const created = await service.create("user-1", {
    enquiryId: "e-1",
    stage: "new",
    dueAt,
    notes: "First call",
  });
  assert.equal(created.enquiryId, "e-1");
  assert.equal(created.contactId, "c-1");
  assert.equal(created.stage, "new");

  const listed = await service.list({
    enquiryId: "e-1",
    from: new Date("2026-09-01T00:00:00.000Z"),
    to: new Date("2026-09-30T00:00:00.000Z"),
  });
  assert.equal(listed.items.length, 1);
  await service.remove("user-1", { id: created.id });
  assert.equal((await service.list({})).items.length, 0);
  // followUps rows are soft-deleted (isActive=0) not removed
  assert.equal(followUps.rows.length, 1);
});

test("follow-up for missing enquiry is 404", async () => {
  const { service } = setup();
  await assert.rejects(
    () =>
      service.create("user-1", {
        enquiryId: "missing-id",
        stage: "new",
        dueAt: new Date(),
      }),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test("follow-up body requires enquiryId and stage", () => {
  assert.equal(
    createFollowUpBodySchema.safeParse({ dueAt: "2026-09-10T10:00:00.000Z" }).success,
    false,
  );
  assert.equal(
    createFollowUpBodySchema.safeParse({
      enquiryId: "00000000-0000-4000-8000-000000000001",
      stage: "contacted",
      dueAt: "2026-09-10T10:00:00.000Z",
    }).success,
    true,
  );
  assert.equal(
    createFollowUpBodySchema.safeParse({
      enquiryId: "00000000-0000-4000-8000-000000000001",
      stage: "invalid_stage",
      dueAt: "2026-09-10T10:00:00.000Z",
    }).success,
    false,
  );
});
