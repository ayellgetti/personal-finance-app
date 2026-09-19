import { Prisma, type CrmCalendarEvent, type CrmContact, type CrmEnquiry, type CrmFollowUp, type CrmPayment } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
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
import type {
  CreateContactBody,
  ListContactsQuery,
  RemoveContactBody,
  UpdateContactBody,
} from "./contact.request";

export type ContactEnquiryDetail = CrmEnquiry & { followUps: CrmFollowUp[] };

export type ContactDetail = {
  contact: CrmContact;
  enquiries: ContactEnquiryDetail[];
  payments: CrmPayment[];
  bookings: CrmCalendarEvent[];
};

function sortTime(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const parsed = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export class ContactService {
  constructor(
    private readonly model: CrmContactModel = crmContactModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
    private readonly followUps: CrmFollowUpModel = crmFollowUpModel,
    private readonly clients: CrmClientModel = crmClientModel,
    private readonly payments: CrmPaymentModel = crmPaymentModel,
    private readonly events: CrmCalendarEventModel = crmCalendarEventModel,
  ) {}

  list(query: ListContactsQuery) {
    const where: Prisma.CrmContactWhereInput = { isActive: 1 };
    if (query.type) {
      where.type = query.type;
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { mobile: { contains: query.search, mode: "insensitive" } },
      ];
    }
    return this.model.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return requireActive(await this.model.readOne({ id }), "Contact");
  }

  async getDetail(id: string): Promise<ContactDetail> {
    const contact = await this.getById(id);
    const [enquiryRows, followUpRows, client] = await Promise.all([
      this.enquiries.read({ contactId: id, isActive: 1 }),
      this.followUps.read({ contactId: id, isActive: 1 }),
      this.clients.findOne({ contactId: id, isActive: 1 }),
    ]);

    const enquiryList = [...enquiryRows].sort((left, right) => sortTime(right.createdAt) - sortTime(left.createdAt));
    const followUpList = [...followUpRows].sort((left, right) => sortTime(left.dueAt) - sortTime(right.dueAt));
    const enquiryIds = enquiryList.map((enquiry) => enquiry.id);

    const paymentWhere: Prisma.CrmPaymentWhereInput = {
      isActive: 1,
      OR: [
        { referenceType: "vendor", referenceId: id },
        ...(client ? [{ referenceType: "client" as const, referenceId: client.id }] : []),
        ...(enquiryIds.length ? [{ enquiryId: { in: enquiryIds } }] : []),
      ],
    };
    const paymentRows = paymentWhere.OR && paymentWhere.OR.length > 0
      ? await this.payments.read(paymentWhere)
      : [];
    const payments = [...paymentRows].sort((left, right) => {
      const paid = sortTime(right.paidAt) - sortTime(left.paidAt);
      if (paid !== 0) return paid;
      return sortTime(right.createdAt) - sortTime(left.createdAt);
    });

    const bookingWhere: Prisma.CrmCalendarEventWhereInput = {
      isActive: 1,
      OR: [
        { contactId: id },
        ...(enquiryIds.length ? [{ enquiryId: { in: enquiryIds } }] : []),
      ],
    };
    const bookingRows = await this.events.read(bookingWhere);
    const uniqueBookings = new Map<string, CrmCalendarEvent>();
    for (const booking of bookingRows) {
      uniqueBookings.set(booking.id, booking);
    }
    const bookings = [...uniqueBookings.values()].sort((left, right) => {
      const start = sortTime(left.startsAt) - sortTime(right.startsAt);
      if (start !== 0) return start;
      return sortTime(right.createdAt) - sortTime(left.createdAt);
    });

    return {
      contact,
      enquiries: enquiryList.map((enquiry) => ({
        ...enquiry,
        followUps: followUpList.filter((followUp) => followUp.enquiryId === enquiry.id),
      })),
      payments,
      bookings,
    };
  }

  async create(actorId: string, input: CreateContactBody) {
    await this.assertUniqueMobile(input.mobile);
    return this.model.create({
      name: input.name,
      mobile: input.mobile,
      type: input.type,
      email: input.email ?? null,
      companyName: input.companyName ?? null,
      notes: input.notes ?? null,
      ...actorCreate(actorId),
    });
  }

  async update(actorId: string, id: string, input: UpdateContactBody) {
    await this.getById(id);
    if (input.mobile) {
      await this.assertUniqueMobile(input.mobile, id);
    }
    return this.model.update(
      { id },
      {
        ...input,
        ...actorUpdate(actorId),
      },
    );
  }

  async remove(actorId: string, input: RemoveContactBody) {
    await this.getById(input.id);
    await this.model.update({ id: input.id }, actorDelete(actorId));
    return { id: input.id, removed: true };
  }

  private async assertUniqueMobile(mobile: string, excludeId?: string) {
    const existing = await this.model.findOne({ mobile, isActive: 1 });
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "Duplicate mobile is not allowed");
    }
  }
}

export const contactService = new ContactService();
