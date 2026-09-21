import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import { EnquiryService, type ConvertedEnquiry } from "../modules/sales-crm/enquiries/enquiry.service";
import { convertEnquiryBodySchema, createEnquiryBodySchema } from "../modules/sales-crm/enquiries/enquiry.request";
import type {
  CrmCalendarEventModel,
  CrmClientModel,
  CrmContactModel,
  CrmEnquiryModel,
  CrmFollowUpModel,
  CrmPaymentModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

const DUE_DATE = new Date("2026-10-01T12:00:00.000Z");

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
  status:
    | "new"
    | "contacted"
    | "qualified"
    | "discussion"
    | "quotation_sent"
    | "negotiation"
    | "schedule_meeting"
    | "closed";
  closedReason: string | null;
  expectedValue: number | null;
  assignedToId: string | null;
  notes: string | null;
  dueDateWindow: string | null;
  dueDate: Date | null;
  nextFollowupDate: Date | null;
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

const BOOKING_START = new Date("2026-12-12T10:30:00.000Z");
const BOOKING_END = new Date("2026-12-12T17:30:00.000Z");

function setup(contactSeed: FakeContact[] = [], enquirySeed: FakeEnquiry[] = []) {
  const contacts = fakeCrud("contact", contactSeed);
  const enquiries = fakeCrud("enquiry", enquirySeed);
  const clients = fakeCrud<FakeClient>("client", []);
  const followUps = fakeCrud<{
    id: string;
    isActive: number;
    enquiryId: string;
    dueAt: Date;
    notes: string | null;
    stage: string;
  }>("followup", []);
  const events = fakeCrud<{
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date;
    slot: "morning" | "evening" | "full_day" | null;
    contactId: string | null;
    enquiryId: string | null;
    notes: string | null;
    isActive: number;
  }>("event", []);
  const payments = fakeCrud<{
    id: string;
    referenceType: "client" | "vendor";
    referenceId: string;
    enquiryId: string | null;
    status: "pending" | "paid" | "failed" | "refunded";
    isActive: number;
  }>("payment", []);
  const service = new EnquiryService(
    enquiries.model as unknown as CrmEnquiryModel,
    contacts.model as unknown as CrmContactModel,
    clients.model as unknown as CrmClientModel,
    async (input) => {
      const enquiry = await enquiries.model.update(
        { id: input.enquiryId },
        { status: "closed", closedReason: "Booked", updatedBy: input.actorId },
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
      const event = await events.model.create({
        title: input.booking.title,
        startsAt: input.booking.startsAt,
        endsAt: input.booking.endsAt,
        slot: input.booking.slot,
        notes: input.booking.notes,
        contactId: input.contactId,
        enquiryId: input.enquiryId,
        isActive: 1,
      });
      return { enquiry, contact, client: existing, event } as ConvertedEnquiry;
    },
    followUps.model as unknown as CrmFollowUpModel,
    events.model as unknown as CrmCalendarEventModel,
    payments.model as unknown as CrmPaymentModel,
  );
  return { service, contacts, enquiries, clients, followUps, events, payments };
}

test("enquiry create, list, update, and soft-delete hide the row", async () => {
  const { service, contacts } = setup([
    { id: "c-1", name: "Ada", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const created = await service.create("user-1", {
    contactId: "c-1",
    title: "Banquet",
    source: "web",
    dueDate: DUE_DATE,
  });
  assert.equal(created.status, "new");
  const listed = await service.list({ contactId: "c-1" });
  assert.equal(listed.items.length, 1);
  await service.update("user-1", created.id, { status: "contacted" });
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
        dueDate: DUE_DATE,
      }),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
});

test("closing an enquiry without a reason is 422", async () => {
  const { service } = setup([
    { id: "c-1", name: "Ada", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Banquet",
    source: "web",
    dueDate: DUE_DATE,
  });
  await assert.rejects(
    () => service.update("user-1", enquiry.id, { status: "closed" }),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
  // With a reason it should succeed
  const updated = await service.update("user-1", enquiry.id, {
    status: "closed",
    closedReason: "Lost: Budget constraints",
  });
  assert.equal(updated.status, "closed");
});

test("convert sets closed + client type and creates a linked booking event; second convert is idempotent", async () => {
  const { service, contacts, clients, events } = setup([
    { id: "c-1", name: "Ada Lovelace", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Banquet",
    source: "web",
    dueDate: DUE_DATE,
  });
  await assert.rejects(
    () => service.convert("user-1", enquiry.id, { billingName: "Ada LLC" }),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
  const first = await service.convert("user-1", enquiry.id, {
    billingName: "Ada LLC",
    startsAt: BOOKING_START,
    endsAt: BOOKING_END,
  });
  assert.equal(first.enquiry.status, "closed");
  assert.equal((first.enquiry as FakeEnquiry).closedReason, "Booked");
  assert.equal(first.contact.type, "client");
  assert.equal(first.client.billingName, "Ada LLC");
  assert.equal(first.client.contactId, "c-1");
  assert.equal(contacts.rows[0]?.type, "client");
  assert.equal(clients.rows.length, 1);
  assert.equal(first.event.enquiryId, enquiry.id);
  assert.equal(first.event.contactId, "c-1");
  assert.equal(first.event.startsAt.getTime(), BOOKING_START.getTime());
  assert.equal(events.rows.length, 1);

  const second = await service.convert("user-1", enquiry.id, {});
  assert.equal(second.client.id, first.client.id);
  assert.equal(second.event.id, first.event.id);
  assert.equal(clients.rows.length, 1);
  assert.equal(events.rows.length, 1);
});

test("convert seeds the booking notes from the latest enquiry update", async () => {
  const { service, events } = setup([
    { id: "c-1", name: "Ada Lovelace", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Wedding",
    source: "web",
    dueDate: DUE_DATE,
    notes: "Menu: Veg deluxe",
  });
  await service.update("user-1", enquiry.id, { notes: "Menu: Mix deluxe, 250 guests" });

  const converted = await service.convert("user-1", enquiry.id, {
    startsAt: BOOKING_START,
    endsAt: BOOKING_END,
  });

  assert.equal(converted.event.notes, "Menu: Mix deluxe, 250 guests");
  assert.equal(events.rows[0]?.notes, "Menu: Mix deluxe, 250 guests");
});

test("convert falls back to the enquiry notes when no follow-up carries one", async () => {
  const { service, followUps } = setup([
    { id: "c-1", name: "Ada Lovelace", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Sangeet",
    source: "web",
    dueDate: DUE_DATE,
    notes: "Lawn, evening",
  });
  const seeded = followUps.rows[0];
  assert.ok(seeded);
  await followUps.model.update({ id: seeded.id }, { notes: null });

  const converted = await service.convert("user-1", enquiry.id, {
    startsAt: BOOKING_START,
    endsAt: BOOKING_END,
  });

  assert.equal(converted.event.notes, "Lawn, evening");
});

test("convert accepts a slot instead of an end datetime", async () => {
  const { service } = setup([
    { id: "c-1", name: "Ada Lovelace", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Wedding",
    source: "web",
    dueDate: DUE_DATE,
  });
  const converted = await service.convert("user-1", enquiry.id, {
    startsAt: new Date("2026-12-12T03:00:00.000Z"),
    slot: "evening",
  });
  assert.equal(converted.event.slot, "evening");
  assert.ok(converted.event.endsAt.getTime() > converted.event.startsAt.getTime());
});

test("a closed booked enquiry with a paid client payment cannot be removed", async () => {
  const { service, enquiries, payments } = setup([
    { id: "c-1", name: "Ada Lovelace", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Wedding",
    source: "web",
    dueDate: DUE_DATE,
  });
  const converted = await service.convert("user-1", enquiry.id, {
    startsAt: BOOKING_START,
    endsAt: BOOKING_END,
  });
  await payments.model.create({
    referenceType: "client",
    referenceId: converted.client.id,
    enquiryId: null,
    status: "paid",
  });

  await assert.rejects(
    () => service.remove("user-1", { id: enquiry.id }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 409 &&
      error.message === "Cannot remove a booked enquiry after payment has been made",
  );
  assert.equal(enquiries.rows[0]?.isActive, 1);
});

test("removing a booked enquiry soft-deletes its booking instead of orphaning it", async () => {
  const { service, events } = setup([
    { id: "c-1", name: "Ada Lovelace", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Baby Shower",
    source: "web",
    dueDate: DUE_DATE,
  });
  await service.convert("user-1", enquiry.id, {
    startsAt: BOOKING_START,
    endsAt: BOOKING_END,
  });
  assert.equal(events.rows[0]?.isActive, 1);

  await service.remove("user-1", { id: enquiry.id });

  assert.equal(events.rows[0]?.isActive, 0);
});

test("convert body requires start plus end datetime or slot", () => {
  assert.equal(convertEnquiryBodySchema.safeParse({}).success, true);
  assert.equal(
    convertEnquiryBodySchema.safeParse({
      startsAt: BOOKING_START.toISOString(),
    }).success,
    false,
  );
  assert.equal(
    convertEnquiryBodySchema.safeParse({
      startsAt: BOOKING_START.toISOString(),
      slot: "morning",
    }).success,
    true,
  );
  assert.equal(
    convertEnquiryBodySchema.safeParse({
      startsAt: BOOKING_START.toISOString(),
      endsAt: BOOKING_END.toISOString(),
    }).success,
    true,
  );
});

test("enquiry create rejects empty title", () => {
  assert.equal(
    createEnquiryBodySchema.safeParse({
      contactId: "00000000-0000-4000-8000-000000000001",
      title: "",
      source: "web",
      dueDate: DUE_DATE,
    }).success,
    false,
  );
});

test("enquiry create requires an exact due date", () => {
  assert.equal(
    createEnquiryBodySchema.safeParse({
      contactId: "00000000-0000-4000-8000-000000000001",
      title: "Banquet",
      source: "web",
    }).success,
    false,
  );
  assert.equal(
    createEnquiryBodySchema.safeParse({
      contactId: "00000000-0000-4000-8000-000000000001",
      title: "Banquet",
      source: "web",
      dueDate: "2026-10-01",
    }).success,
    true,
  );
});

test("enquiry create rejects a due date before today", () => {
  assert.equal(
    createEnquiryBodySchema.safeParse({
      contactId: "00000000-0000-4000-8000-000000000001",
      title: "Banquet",
      source: "web",
      dueDate: "2020-01-01",
    }).success,
    false,
  );
});

test("convert body rejects a booking start before today", () => {
  assert.equal(
    convertEnquiryBodySchema.safeParse({
      startsAt: "2020-01-01T10:00:00.000Z",
      slot: "morning",
    }).success,
    false,
  );
});

test("enquiry create stores the exact due date and logs note history", async () => {
  const { service, followUps } = setup([
    { id: "c-1", name: "Ada", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const created = await service.create("user-1", {
    contactId: "c-1",
    title: "Banquet",
    source: "web",
    dueDate: DUE_DATE,
    notes: "Prefers evening slot",
  });
  assert.ok(created.dueDate instanceof Date);
  assert.equal(created.dueDate.getFullYear(), DUE_DATE.getFullYear());
  assert.equal(created.dueDate.getMonth(), DUE_DATE.getMonth());
  assert.equal(created.dueDate.getDate(), DUE_DATE.getDate());
  assert.equal(followUps.rows.length, 1);
  assert.equal(followUps.rows[0]?.notes, "Prefers evening slot");
  assert.equal(followUps.rows[0]?.stage, "new");
});

test("enquiry note and status changes append follow-up history", async () => {
  const { service, followUps } = setup([
    { id: "c-1", name: "Ada", mobile: "111", type: "lead", isActive: 1 },
  ]);
  const enquiry = await service.create("user-1", {
    contactId: "c-1",
    title: "Banquet",
    source: "web",
    dueDate: DUE_DATE,
  });
  await service.update("user-1", enquiry.id, { notes: "Called, awaiting quote" });
  await service.update("user-1", enquiry.id, { status: "contacted" });
  assert.equal(followUps.rows.length, 2);
  assert.equal(followUps.rows[0]?.notes, "Called, awaiting quote");
  assert.equal(followUps.rows[1]?.stage, "contacted");
  assert.equal(followUps.rows[1]?.notes, null);
});
