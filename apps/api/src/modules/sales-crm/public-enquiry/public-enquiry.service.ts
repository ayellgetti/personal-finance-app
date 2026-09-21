import type { CrmContact } from "@prisma/client";
import { crmContactModel, type CrmContactModel } from "../../../models/index";
import { actorCreate } from "../crm.util";
import { enquiryService, type EnquiryService } from "../enquiries/enquiry.service";
import {
  PUBLIC_ENQUIRY_ACTOR,
  type CreateBanquetPublicEnquiryBody,
  type CreatePublicEnquiryBody,
  type CreateTravelPublicEnquiryBody,
} from "./public-enquiry.request";

const BUDGET_MIDPOINTS: Record<string, number> = {
  "Under ₹50,000": 25_000,
  "₹50,000–1 lakh": 75_000,
  "Under ₹1 lakh": 75_000,
  "₹1–2 lakh": 150_000,
  "₹2–5 lakh": 350_000,
  "₹5–10 lakh": 750_000,
  "₹10 lakh+": 1_250_000,
};

const SLOT_LABELS: Record<CreateBanquetPublicEnquiryBody["timeSlot"], string> = {
  morning: "Morning",
  evening: "Evening",
  full_day: "Full day",
};

export function expectedValueFromBudget(budget: string | undefined): number | null {
  if (!budget) return null;
  return BUDGET_MIDPOINTS[budget] ?? null;
}

export function isTravelPublicEnquiry(
  input: CreatePublicEnquiryBody,
): input is CreateTravelPublicEnquiryBody {
  return input.kind === "travel";
}

export function formatPublicEnquiryNotes(input: CreatePublicEnquiryBody): string {
  if (isTravelPublicEnquiry(input)) {
    const lines = [
      `Trip type: ${input.tripType}`,
      `Destination: ${input.destination}`,
      `Departure: ${input.departureDate.toISOString().slice(0, 10)}`,
      `Travelers: ${input.travelerCount}`,
    ];
    if (input.returnDate) lines.push(`Return: ${input.returnDate.toISOString().slice(0, 10)}`);
    if (input.travelClass) lines.push(`Travel class: ${input.travelClass}`);
    if (input.accommodation) lines.push(`Accommodation: ${input.accommodation}`);
    if (input.budget) lines.push(`Budget: ${input.budget}`);
    if (input.notes) lines.push(`Notes: ${input.notes}`);
    return lines.join("\n");
  }

  const lines = [
    `Event type: ${input.eventType}`,
    `Event date: ${input.eventDate.toISOString().slice(0, 10)}`,
    `Time slot: ${SLOT_LABELS[input.timeSlot]}`,
    `Guests: ${input.guestCount}`,
  ];
  if (input.venue) lines.push(`Venue: ${input.venue}`);
  if (input.budget) lines.push(`Budget: ${input.budget}`);
  if (input.menu) lines.push(`Menu: ${input.menu}`);
  if (input.decoration) lines.push(`Decoration: ${input.decoration}`);
  if (input.notes) lines.push(`Notes: ${input.notes}`);
  return lines.join("\n");
}

function datePart(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function publicEnquiryTitle(input: CreatePublicEnquiryBody): string {
  if (isTravelPublicEnquiry(input)) {
    return `${datePart(input.departureDate)} - ${input.tripType} - ${input.travelerCount} - ${input.name}`.slice(
      0,
      160,
    );
  }
  return `${datePart(input.eventDate)} - ${input.eventType} - ${input.guestCount} - ${input.name}`.slice(0, 160);
}

export class PublicEnquiryService {
  constructor(
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly enquiries: EnquiryService = enquiryService,
  ) {}

  async submit(input: CreatePublicEnquiryBody): Promise<{ submitted: true }> {
    const contact = await this.resolveContact(input);
    const dueDate = isTravelPublicEnquiry(input) ? input.departureDate : input.eventDate;
    await this.enquiries.create(PUBLIC_ENQUIRY_ACTOR, {
      contactId: contact.id,
      title: publicEnquiryTitle(input),
      source: input.source,
      expectedValue: expectedValueFromBudget(input.budget),
      notes: formatPublicEnquiryNotes(input),
      dueDate,
    });
    return { submitted: true };
  }

  private async resolveContact(input: CreatePublicEnquiryBody): Promise<CrmContact> {
    const existing = await this.contacts.findOne({ mobile: input.mobile, isActive: 1 });
    if (existing) {
      return existing;
    }
    return this.contacts.create({
      name: input.name,
      mobile: input.mobile,
      type: "lead",
      ...actorCreate(PUBLIC_ENQUIRY_ACTOR),
    });
  }
}

export const publicEnquiryService = new PublicEnquiryService();
