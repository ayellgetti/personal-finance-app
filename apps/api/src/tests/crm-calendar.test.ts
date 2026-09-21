import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import { CalendarService } from "../modules/sales-crm/calendar/calendar.service";
import { listCalendarQuerySchema } from "../modules/sales-crm/calendar/calendar.request";
import type {
  CrmCalendarEventModel,
  CrmClientModel,
  CrmContactModel,
  CrmEnquiryModel,
  CrmPaymentModel,
  CrmTaskModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

function setup() {
  const events = fakeCrud<{
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    contactId: string | null;
    enquiryId: string | null;
    isActive: number;
  }>("event", []);
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
  const enquiries = fakeCrud<{
    id: string;
    title?: string;
    contactId: string;
    status: string;
    nextFollowupDate?: Date | null;
    closedReason?: string | null;
    isActive: number;
  }>("enquiry", [{ id: "e-1", title: "Wedding hall", contactId: "c-1", status: "new", isActive: 1 }]);
  const clients = fakeCrud<{
    id: string;
    contactId: string;
    convertedFromEnquiryId: string | null;
    isActive: number;
  }>("client", []);
  const payments = fakeCrud<{
    id: string;
    referenceType: "client" | "vendor";
    referenceId: string;
    enquiryId: string | null;
    status: "pending" | "paid" | "failed" | "refunded";
    isActive: number;
  }>("payment", []);
  const service = new CalendarService(
    events.model as unknown as CrmCalendarEventModel,
    tasks.model as unknown as CrmTaskModel,
    contacts.model as unknown as CrmContactModel,
    enquiries.model as unknown as CrmEnquiryModel,
    clients.model as unknown as CrmClientModel,
    payments.model as unknown as CrmPaymentModel,
  );
  return { service, events, enquiries, clients, payments };
}

test("calendar feed includes tasks, standalone events, and booked enquiries", async () => {
  const { service } = setup();
  await service.createEvent("user-1", {
    title: "Site visit",
    startsAt: new Date("2026-09-12T09:00:00.000Z"),
    endsAt: new Date("2026-09-12T10:00:00.000Z"),
  });
  await service.createEvent("user-1", {
    title: "Wedding booking",
    startsAt: new Date("2026-09-13T09:00:00.000Z"),
    endsAt: new Date("2026-09-13T17:00:00.000Z"),
    enquiryId: "e-1",
  });
  const feed = await service.feed({
    from: new Date("2026-09-01T00:00:00.000Z"),
    to: new Date("2026-09-30T00:00:00.000Z"),
  });
  assert.equal(feed.items.length, 3);
  assert.deepEqual(
    feed.items.map((item) => item.kind),
    ["task", "event", "booking"],
  );
});

test("calendar feed includes scheduled follow-ups of open enquiries", async () => {
  const { service, enquiries } = setup();
  await enquiries.model.update(
    { id: "e-1" },
    { status: "contacted", nextFollowupDate: new Date("2026-09-14T06:30:00.000Z") },
  );
  await enquiries.model.create({
    title: "Closed lead",
    contactId: "c-2",
    status: "closed",
    nextFollowupDate: new Date("2026-09-15T06:30:00.000Z"),
    isActive: 1,
  });

  const feed = await service.feed({
    from: new Date("2026-09-01T00:00:00.000Z"),
    to: new Date("2026-09-30T00:00:00.000Z"),
  });

  const followUps = feed.items.filter((item) => item.kind === "followup");
  assert.equal(followUps.length, 1);
  assert.equal(followUps[0]?.id, "e-1");
  assert.equal(followUps[0]?.title, "Follow-up: Wedding hall");
  assert.equal(followUps[0]?.at.toISOString(), "2026-09-14T06:30:00.000Z");
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

test("removing a booking soft-deletes the enquiry it is linked to", async () => {
  const { service, events, enquiries } = setup();
  const booking = await service.createEvent("user-1", {
    title: "Wedding booking",
    startsAt: new Date("2026-09-13T09:00:00.000Z"),
    endsAt: new Date("2026-09-13T17:00:00.000Z"),
    enquiryId: "e-1",
  });

  const removed = await service.removeEvent("user-1", { id: booking.id });

  assert.equal(removed.enquiryId, "e-1");
  assert.equal(enquiries.rows[0]?.isActive, 0);
  assert.equal(events.rows[0]?.isActive, 0);
  assert.equal((await service.listEvents({})).items.length, 0);
});

test("removing a standalone event leaves enquiries untouched", async () => {
  const { service, enquiries } = setup();
  const event = await service.createEvent("user-1", {
    title: "Site visit",
    startsAt: new Date("2026-09-12T09:00:00.000Z"),
    endsAt: new Date("2026-09-12T10:00:00.000Z"),
  });

  const removed = await service.removeEvent("user-1", { id: event.id });

  assert.equal(removed.enquiryId, null);
  assert.equal(enquiries.rows[0]?.isActive, 1);
});

test("a booking with a paid payment cannot be removed", async () => {
  const { service, events, enquiries, clients, payments } = setup();
  await enquiries.model.update({ id: "e-1" }, { status: "closed", closedReason: "Booked" });
  const client = await clients.model.create({
    contactId: "c-1",
    convertedFromEnquiryId: "e-1",
    isActive: 1,
  });
  await payments.model.create({
    referenceType: "client",
    referenceId: client.id,
    enquiryId: null,
    status: "paid",
    isActive: 1,
  });
  const booking = await service.createEvent("user-1", {
    title: "Wedding booking",
    startsAt: new Date("2026-09-13T09:00:00.000Z"),
    endsAt: new Date("2026-09-13T17:00:00.000Z"),
    enquiryId: "e-1",
  });

  await assert.rejects(
    () => service.removeEvent("user-1", { id: booking.id }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 409 &&
      error.message === "Cannot remove a booking after payment has been made",
  );
  assert.equal(enquiries.rows[0]?.isActive, 1);
  assert.equal(events.rows[0]?.isActive, 1);
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
