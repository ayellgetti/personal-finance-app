import assert from "node:assert/strict";
import test from "node:test";
import { CalendarService } from "../modules/sales-crm/calendar/calendar.service";
import { listCalendarQuerySchema } from "../modules/sales-crm/calendar/calendar.request";
import type {
  CrmCalendarEventModel,
  CrmContactModel,
  CrmEnquiryModel,
  CrmFollowUpModel,
  CrmTaskModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

function setup() {
  const events = fakeCrud("event", []);
  const followUps = fakeCrud("followup", [
    {
      id: "f-1",
      enquiryId: "e-1",
      contactId: "c-1",
      stage: "new",
      dueAt: new Date("2026-09-10T10:00:00.000Z"),
      notes: "Call",
      isActive: 1,
    },
  ]);
  const tasks = fakeCrud("task", [
    {
      id: "t-1",
      title: "Prep deck",
      description: null,
      status: "todo",
      assigneeId: null,
      dueAt: new Date("2026-09-11T10:00:00.000Z"),
      contactId: null,
      enquiryId: null,
      isActive: 1,
    },
    {
      id: "t-hidden",
      title: "No due",
      description: null,
      status: "todo",
      assigneeId: null,
      dueAt: null,
      contactId: null,
      enquiryId: null,
      isActive: 1,
    },
  ]);
  const contacts = fakeCrud("contact", []);
  const enquiries = fakeCrud("enquiry", [
    { id: "e-1", contactId: "c-1", status: "new", isActive: 1 },
  ]);
  const service = new CalendarService(
    events.model as unknown as CrmCalendarEventModel,
    followUps.model as unknown as CrmFollowUpModel,
    tasks.model as unknown as CrmTaskModel,
    contacts.model as unknown as CrmContactModel,
    enquiries.model as unknown as CrmEnquiryModel,
  );
  return { service, events };
}

test("calendar feed unions follow-ups, due tasks, and events", async () => {
  const { service } = setup();
  await service.createEvent("user-1", {
    title: "Site visit",
    startsAt: new Date("2026-09-12T09:00:00.000Z"),
    endsAt: new Date("2026-09-12T10:00:00.000Z"),
  });
  const feed = await service.feed({
    from: new Date("2026-09-01T00:00:00.000Z"),
    to: new Date("2026-09-30T00:00:00.000Z"),
  });
  assert.equal(feed.items.length, 3);
  assert.deepEqual(
    feed.items.map((item) => item.kind),
    ["followup", "task", "event"],
  );
});

test("calendar event CRUD and soft-delete hide the row", async () => {
  const { service } = setup();
  const created = await service.createEvent("user-1", {
    title: "Kickoff",
    startsAt: new Date("2026-09-05T09:00:00.000Z"),
    endsAt: new Date("2026-09-05T10:00:00.000Z"),
  });
  const listed = await service.listEvents({});
  assert.equal(listed.items.length, 1);
  await service.updateEvent("user-1", created.id, { title: "Kickoff v2" });
  await service.removeEvent("user-1", { id: created.id });
  assert.equal((await service.listEvents({})).items.length, 0);
});

test("calendar range requires from/to and rejects spans over 92 days", () => {
  assert.equal(listCalendarQuerySchema.safeParse({}).success, false);
  assert.equal(
    listCalendarQuerySchema.safeParse({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-31T00:00:00.000Z",
    }).success,
    true,
  );
  assert.equal(
    listCalendarQuerySchema.safeParse({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-05-01T00:00:00.000Z",
    }).success,
    false,
  );
});
