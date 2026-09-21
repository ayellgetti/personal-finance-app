import assert from "node:assert/strict";
import test from "node:test";
import { EnquiryService } from "../modules/sales-crm/enquiries/enquiry.service";
import { createPublicEnquiryBodySchema } from "../modules/sales-crm/public-enquiry/public-enquiry.request";
import {
  PublicEnquiryService,
  expectedValueFromBudget,
  formatPublicEnquiryNotes,
  publicEnquiryTitle,
} from "../modules/sales-crm/public-enquiry/public-enquiry.service";
import type {
  CrmCalendarEventModel,
  CrmClientModel,
  CrmContactModel,
  CrmEnquiryModel,
  CrmFollowUpModel,
} from "../models/index";
import { fakeCrud } from "./crm-test-utils";

const EVENT_DATE = new Date("2026-12-12T00:00:00.000Z");

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
  status: string;
  notes: string | null;
  isActive: number;
};

function setup(contactSeed: FakeContact[] = []) {
  const contacts = fakeCrud("contact", contactSeed);
  const enquiries = fakeCrud<FakeEnquiry>("enquiry", []);
  const clients = fakeCrud("client", []);
  const followUps = fakeCrud("followup", []);
  const events = fakeCrud("event", []);
  const enquiryService = new EnquiryService(
    enquiries.model as unknown as CrmEnquiryModel,
    contacts.model as unknown as CrmContactModel,
    clients.model as unknown as CrmClientModel,
    async () => {
      throw new Error("convert is not used by public intake");
    },
    followUps.model as unknown as CrmFollowUpModel,
    events.model as unknown as CrmCalendarEventModel,
  );
  const service = new PublicEnquiryService(
    contacts.model as unknown as CrmContactModel,
    enquiryService,
  );
  return { service, contacts, enquiries, followUps };
}

test("public enquiry schema accepts a banquet form payload", () => {
  const parsed = createPublicEnquiryBodySchema.parse({
    name: "Priya Sharma",
    mobile: "9876543210",
    eventType: "Wedding",
    eventDate: "2026-12-12",
    timeSlot: "evening",
    guestCount: 100,
    source: "WhatsApp",
    venue: "Main Banquet Hall",
    budget: "₹2–5 lakh",
    menu: "Deluxe veg",
    decoration: "Floral",
    notes: "Prefer live counter",
  });
  assert.equal(parsed.kind, "banquet");
  assert.equal(parsed.name, "Priya Sharma");
  if (parsed.kind !== "banquet") throw new Error("expected banquet");
  assert.equal(parsed.timeSlot, "evening");
  assert.equal(expectedValueFromBudget(parsed.budget), 350_000);
});

test("public enquiry schema accepts a travel form payload", () => {
  const parsed = createPublicEnquiryBodySchema.parse({
    kind: "travel",
    name: "Amit Patel",
    mobile: "9123456780",
    tripType: "Honeymoon",
    destination: "Kerala",
    departureDate: "2026-11-01",
    returnDate: "2026-11-08",
    travelerCount: 2,
    source: "Instagram",
    budget: "₹1–2 lakh",
    travelClass: "Economy",
    accommodation: "Resort",
    notes: "Prefer houseboat one night",
  });
  assert.equal(parsed.kind, "travel");
  if (parsed.kind !== "travel") throw new Error("expected travel");
  assert.equal(parsed.destination, "Kerala");
  assert.equal(expectedValueFromBudget(parsed.budget), 150_000);
});

test("public enquiry creates a lead and stores structured notes", async () => {
  const { service, contacts, enquiries, followUps } = setup();
  const result = await service.submit({
    kind: "banquet",
    name: "Priya Sharma",
    mobile: "9876543210",
    eventType: "Wedding",
    eventDate: EVENT_DATE,
    timeSlot: "evening",
    guestCount: 100,
    source: "WhatsApp",
    venue: "Main Banquet Hall",
    notes: "Prefer live counter",
  });
  assert.deepEqual(result, { submitted: true });
  assert.equal(contacts.rows.length, 1);
  assert.equal(contacts.rows[0]?.type, "lead");
  assert.equal(contacts.rows[0]?.createdBy, "public");
  assert.equal(enquiries.rows.length, 1);
  assert.equal(enquiries.rows[0]?.title, "2026-12-12 - Wedding - 100 - Priya Sharma");
  assert.equal(enquiries.rows[0]?.source, "WhatsApp");
  assert.equal(enquiries.rows[0]?.status, "new");
  assert.match(String(enquiries.rows[0]?.notes), /Guests: 100/);
  assert.match(String(enquiries.rows[0]?.notes), /Prefer live counter/);
  assert.equal(followUps.rows.length, 1);
});

test("public enquiry reuses an existing contact with the same mobile", async () => {
  const { service, contacts, enquiries } = setup([
    { id: "c-1", name: "Existing", mobile: "9876543210", type: "lead", isActive: 1 },
  ]);
  await service.submit({
    kind: "banquet",
    name: "Someone Else",
    mobile: "9876543210",
    eventType: "Birthday",
    eventDate: EVENT_DATE,
    timeSlot: "morning",
    guestCount: 40,
    source: "Walk-in",
  });
  assert.equal(contacts.rows.length, 1);
  assert.equal(contacts.rows[0]?.name, "Existing");
  assert.equal(enquiries.rows[0]?.contactId, "c-1");
  assert.equal(enquiries.rows[0]?.title, "2026-12-12 - Birthday - 40 - Someone Else");
});

test("public enquiry notes include optional banquet fields", () => {
  const notes = formatPublicEnquiryNotes({
    kind: "banquet",
    name: "Priya Sharma",
    mobile: "9876543210",
    eventType: "Wedding",
    eventDate: EVENT_DATE,
    timeSlot: "full_day",
    guestCount: 250,
    source: "Instagram",
    venue: "Lawn",
    budget: "₹10 lakh+",
    menu: "Non-veg deluxe",
    decoration: "Stage + entrance",
    notes: "Need valet",
  });
  assert.match(notes, /Time slot: Full day/);
  assert.match(notes, /Venue: Lawn/);
  assert.match(notes, /Budget: ₹10 lakh\+/);
  assert.match(notes, /Notes: Need valet/);
});

test("public enquiry title is date, type, count, and client name", () => {
  assert.equal(
    publicEnquiryTitle({
      kind: "banquet",
      name: "Priya Sharma",
      mobile: "9876543210",
      eventType: "Wedding",
      eventDate: EVENT_DATE,
      timeSlot: "evening",
      guestCount: 100,
      source: "WhatsApp",
    }),
    "2026-12-12 - Wedding - 100 - Priya Sharma",
  );
});

test("public travel enquiry creates a lead and stores trip notes", async () => {
  const { service, contacts, enquiries } = setup();
  await service.submit({
    kind: "travel",
    name: "Amit Patel",
    mobile: "9123456780",
    tripType: "Honeymoon",
    destination: "Kerala",
    departureDate: EVENT_DATE,
    returnDate: new Date("2026-12-18T00:00:00.000Z"),
    travelerCount: 2,
    source: "Instagram",
    budget: "₹1–2 lakh",
    travelClass: "Economy",
    accommodation: "Resort",
    notes: "Prefer houseboat one night",
  });
  assert.equal(contacts.rows[0]?.name, "Amit Patel");
  assert.equal(enquiries.rows[0]?.title, "2026-12-12 - Honeymoon - 2 - Amit Patel");
  assert.match(String(enquiries.rows[0]?.notes), /Travelers: 2/);
  assert.match(String(enquiries.rows[0]?.notes), /Prefer houseboat one night/);
  assert.equal(enquiries.rows[0]?.source, "Instagram");
});
