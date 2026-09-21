import type { CrmCalendarEvent, CrmClient, CrmContact, CrmEnquiry } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import { prisma } from "../../../utils/prisma.util";
import {
  crmCalendarEventModel,
  crmClientModel,
  crmContactModel,
  crmEnquiryModel,
  crmFollowUpModel,
  crmPaymentModel,
  type CrmCalendarEventModel,
  type CrmClientModel,
  type CrmContactModel,
  type CrmEnquiryModel,
  type CrmFollowUpModel,
  type CrmPaymentModel,
} from "../../../models/index";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import { isBookedAndPaid } from "../booking-lock";
import { resolveEventRange } from "../calendar/event-slot";
import { endOfLocalDay } from "./enquiry-due-date";
import type {
  ConvertEnquiryBody,
  CreateEnquiryBody,
  ListEnquiriesQuery,
  RemoveEnquiryBody,
  UpdateEnquiryBody,
} from "./enquiry.request";

export type ConvertedEnquiry = {
  enquiry: CrmEnquiry;
  contact: CrmContact;
  client: CrmClient;
  event: CrmCalendarEvent;
};

export type PersistEnquiryConversion = (input: {
  actorId: string;
  enquiryId: string;
  contactId: string;
  billingName: string;
  existingClientId: string | null;
  convertedFromEnquiryId: string;
  booking: {
    title: string;
    startsAt: Date;
    endsAt: Date;
    slot: CrmCalendarEvent["slot"];
  };
}) => Promise<ConvertedEnquiry>;

export async function persistEnquiryConversion(input: {
  actorId: string;
  enquiryId: string;
  contactId: string;
  billingName: string;
  existingClientId: string | null;
  convertedFromEnquiryId: string;
  booking: {
    title: string;
    startsAt: Date;
    endsAt: Date;
    slot: CrmCalendarEvent["slot"];
  };
}): Promise<ConvertedEnquiry> {
  return prisma.$transaction(async (tx) => {
    const enquiry = await tx.crmEnquiry.update({
      where: { id: input.enquiryId },
      data: { status: "closed", closedReason: "Booked", updatedBy: input.actorId },
    });
    const contact = await tx.crmContact.update({
      where: { id: input.contactId },
      data: { type: "client", updatedBy: input.actorId },
    });
    const client = input.existingClientId
      ? await tx.crmClient.update({
          where: { id: input.existingClientId },
          data: {
            isActive: 1,
            deletedAt: null,
            deletedBy: null,
            billingName: input.billingName,
            updatedBy: input.actorId,
          },
        })
      : await tx.crmClient.create({
          data: {
            contactId: input.contactId,
            status: "active",
            billingName: input.billingName,
            convertedFromEnquiryId: input.convertedFromEnquiryId,
            createdBy: input.actorId,
            updatedBy: input.actorId,
          },
        });
    const event = await tx.crmCalendarEvent.create({
      data: {
        title: input.booking.title,
        startsAt: input.booking.startsAt,
        endsAt: input.booking.endsAt,
        slot: input.booking.slot,
        contactId: input.contactId,
        enquiryId: input.enquiryId,
        createdBy: input.actorId,
        updatedBy: input.actorId,
      },
    });
    return { enquiry, contact, client, event };
  });
}

export class EnquiryService {
  constructor(
    private readonly model: CrmEnquiryModel = crmEnquiryModel,
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly clients: CrmClientModel = crmClientModel,
    private readonly persistConvert: PersistEnquiryConversion = persistEnquiryConversion,
    private readonly followUps: CrmFollowUpModel = crmFollowUpModel,
    private readonly events: CrmCalendarEventModel = crmCalendarEventModel,
    private readonly payments: CrmPaymentModel = crmPaymentModel,
  ) {}

  list(query: ListEnquiriesQuery) {
    const where: Prisma.CrmEnquiryWhereInput = { isActive: 1 };
    if (query.status) {
      where.status = query.status;
    }
    if (query.contactId) {
      where.contactId = query.contactId;
    }
    if (query.assignedToId) {
      where.assignedToId = query.assignedToId;
    }
    return this.model.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return requireActive(await this.model.readOne({ id }), "Enquiry");
  }

  async create(actorId: string, input: CreateEnquiryBody) {
    await this.requireUsableContact(input.contactId);
    const dueDate = endOfLocalDay(input.dueDate);
    const enquiry = await this.model.create({
      contactId: input.contactId,
      title: input.title,
      source: input.source,
      status: input.status ?? "new",
      expectedValue: input.expectedValue ?? null,
      assignedToId: input.assignedToId ?? null,
      notes: input.notes ?? null,
      dueDate,
      ...actorCreate(actorId),
    });
    if (input.notes?.trim()) {
      await this.recordHistory(actorId, enquiry, enquiry.notes, enquiry.status);
    }
    return enquiry;
  }

  async update(actorId: string, id: string, input: UpdateEnquiryBody) {
    const existing = await this.getById(id);
    if (input.contactId) {
      await this.requireUsableContact(input.contactId);
    }
    if (input.status === "closed" && !input.closedReason?.trim()) {
      throw new HttpError(422, "A closed reason is required when closing an enquiry");
    }
    const dueDate = input.dueDate !== undefined ? endOfLocalDay(input.dueDate) : undefined;
    const enquiry = await this.model.update(
      { id },
      {
        ...input,
        ...(dueDate ? { dueDate } : {}),
        ...actorUpdate(actorId),
      },
    );
    const notesChanged =
      input.notes !== undefined && (input.notes ?? null) !== (existing.notes ?? null);
    const statusChanged = input.status !== undefined && input.status !== existing.status;
    if (notesChanged || statusChanged) {
      await this.recordHistory(
        actorId,
        enquiry,
        notesChanged ? enquiry.notes : null,
        enquiry.status,
      );
    }
    return enquiry;
  }

  async remove(actorId: string, input: RemoveEnquiryBody) {
    const enquiry = await this.getById(input.id);
    const locked = await isBookedAndPaid(enquiry, {
      clients: this.clients,
      events: this.events,
      payments: this.payments,
    });
    if (locked) {
      throw new HttpError(409, "Cannot remove a booked enquiry after payment has been made");
    }
    await this.model.update({ id: input.id }, actorDelete(actorId));
    await this.events.updateMany({ enquiryId: input.id, isActive: 1 }, actorDelete(actorId));
    return { id: input.id, removed: true };
  }

  async convert(
    actorId: string,
    id: string,
    input: ConvertEnquiryBody = {},
  ): Promise<ConvertedEnquiry> {
    const enquiry = await this.getById(id);
    const contact = await this.contacts.readOne({ id: enquiry.contactId });
    if (!contact || contact.isActive !== 1) {
      throw new HttpError(422, "Cannot convert an enquiry for an inactive contact");
    }

    const existingClient = await this.clients.findOne({ contactId: contact.id });
    const activeClient =
      existingClient && existingClient.isActive === 1 ? existingClient : null;
    const existingEvent = await this.events.findOne({
      enquiryId: enquiry.id,
      isActive: 1,
    });

    if (enquiry.status === "closed" && activeClient && existingEvent) {
      return { enquiry, contact, client: activeClient, event: existingEvent };
    }

    if (!input.startsAt) {
      throw new HttpError(422, "Event start datetime is required");
    }
    const booking = resolveEventRange({
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      slot: input.slot,
    });

    if (enquiry.status === "closed" && activeClient && !existingEvent) {
      const event = await this.events.create({
        title: enquiry.title,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        slot: booking.slot,
        contactId: contact.id,
        enquiryId: enquiry.id,
        ...actorCreate(actorId),
      });
      return { enquiry, contact, client: activeClient, event };
    }

    const billingName = input.billingName?.trim() || contact.name;
    return this.persistConvert({
      actorId,
      enquiryId: enquiry.id,
      contactId: contact.id,
      billingName,
      existingClientId: existingClient?.id ?? null,
      convertedFromEnquiryId: enquiry.id,
      booking: {
        title: enquiry.title,
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        slot: booking.slot,
      },
    });
  }

  private async recordHistory(
    actorId: string,
    enquiry: CrmEnquiry,
    notes: string | null,
    stage: CrmEnquiry["status"],
  ) {
    await this.followUps.create({
      enquiryId: enquiry.id,
      contactId: enquiry.contactId,
      stage,
      dueAt: new Date(),
      nextFollowupDate: enquiry.nextFollowupDate ?? enquiry.dueDate ?? null,
      notes,
      ...actorCreate(actorId),
    });
  }

  private async requireUsableContact(contactId: string) {
    const contact = await this.contacts.readOne({ id: contactId });
    if (!contact) {
      throw new HttpError(404, "Contact not found");
    }
    if (contact.isActive !== 1) {
      throw new HttpError(422, "Cannot create an enquiry for a deleted contact");
    }
    return contact;
  }
}

export const enquiryService = new EnquiryService();
