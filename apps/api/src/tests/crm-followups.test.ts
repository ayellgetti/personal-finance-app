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

function setup(
  enquirySeed: Array<Record<string, unknown>> = [
    {
      id: "e-1",
      contactId: "c-1",
      title: "Banquet",
      source: "web",
      status: "new",
      nextFollowupDate: null,
      isActive: 1,
    },
  ],
) {
  const enquiries = fakeCrud("enquiry", enquirySeed as Array<{ id: string; isActive: number }>);
  const followUps = fakeCrud("followup", []);
  const service = new FollowUpService(
    followUps.model as unknown as CrmFollowUpModel,
    enquiries.model as unknown as CrmEnquiryModel,
  );
  return { service, followUps, enquiries };
}

test("follow-up create derives contactId from enquiry and supports list filters", async () => {
  const { service, followUps } = setup();
  const dueAt = new Date("2026-09-10T10:00:00.000Z");
  const created = await service.create("user-1", {
    enquiryId: "e-1",
    stage: "new",
    dueAt,
    nextFollowupDate: new Date("2026-09-17T10:00:00.000Z"),
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
        nextFollowupDate: new Date(),
      }),
    (error: unknown) => error instanceof HttpError && error.status === 404,
  );
});

test("follow-up body requires enquiryId, stage, and nextFollowupDate", () => {
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
    false,
  );
  assert.equal(
    createFollowUpBodySchema.safeParse({
      enquiryId: "00000000-0000-4000-8000-000000000001",
      stage: "contacted",
      dueAt: "2026-09-10T10:00:00.000Z",
      nextFollowupDate: "2026-09-17T10:00:00.000Z",
    }).success,
    true,
  );
  assert.equal(
    createFollowUpBodySchema.safeParse({
      enquiryId: "00000000-0000-4000-8000-000000000001",
      stage: "invalid_stage",
      dueAt: "2026-09-10T10:00:00.000Z",
      nextFollowupDate: "2026-09-17T10:00:00.000Z",
    }).success,
    false,
  );
});

test("follow-up create stores nextFollowupDate on the enquiry", async () => {
  const { service, enquiries } = setup();
  const nextFollowupDate = new Date("2026-09-20T10:00:00.000Z");
  await service.create("user-1", {
    enquiryId: "e-1",
    stage: "new",
    dueAt: new Date("2026-09-10T10:00:00.000Z"),
    nextFollowupDate,
    notes: "Call back after quote",
  });
  assert.equal(
    (enquiries.rows[0] as { nextFollowupDate?: Date }).nextFollowupDate?.getTime(),
    nextFollowupDate.getTime(),
  );
});

test("follow-up calendar separates new enquiries, follow-ups, and overdue", async () => {
  const now = new Date("2026-09-17T12:00:00.000Z");
  const { service } = setup([
    {
      id: "e-new",
      contactId: "c-1",
      title: "New hall",
      status: "new",
      dueDate: new Date("2026-09-18T23:59:59.000Z"),
      nextFollowupDate: null,
      isActive: 1,
    },
    {
      id: "e-fu",
      contactId: "c-2",
      title: "Follow hall",
      status: "contacted",
      dueDate: new Date("2026-09-10T23:59:59.000Z"),
      nextFollowupDate: new Date("2026-09-18T10:00:00.000Z"),
      isActive: 1,
    },
    {
      id: "e-overdue",
      contactId: "c-3",
      title: "Late hall",
      status: "discussion",
      dueDate: new Date("2026-09-01T23:59:59.000Z"),
      nextFollowupDate: new Date("2026-09-10T10:00:00.000Z"),
      isActive: 1,
    },
    {
      id: "e-closed",
      contactId: "c-4",
      title: "Closed hall",
      status: "closed",
      nextFollowupDate: new Date("2026-09-10T10:00:00.000Z"),
      isActive: 1,
    },
  ]);
  const feed = await service.calendar(
    {
      from: new Date("2026-09-01T00:00:00.000Z"),
      to: new Date("2026-09-30T23:59:59.000Z"),
    },
    now,
  );
  assert.equal(feed.items.filter((item) => item.kind === "new_enquiry").length, 1);
  assert.equal(feed.items.filter((item) => item.kind === "followup").length, 2);
  assert.equal(feed.overdue.length, 1);
  assert.equal(feed.overdue[0]?.enquiryId, "e-overdue");
  assert.equal(feed.overdue[0]?.overdue, true);
});
