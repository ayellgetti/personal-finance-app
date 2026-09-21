import { Prisma, type CrmCalendarEvent, type CrmClient } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmCalendarEventModel,
  crmClientModel,
  crmContactModel,
  crmEnquiryModel,
  type CrmCalendarEventModel,
  type CrmClientModel,
  type CrmContactModel,
  type CrmEnquiryModel,
} from "../../../models/index";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import type {
  CreateClientBody,
  ListClientsQuery,
  RemoveClientBody,
  UpdateClientBody,
} from "./client.request";

export type ClientWithBookingDates = CrmClient & {
  startsAt: Date | null;
  endsAt: Date | null;
};

function eventTime(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function pickCurrentBooking(
  bookings: CrmCalendarEvent[],
  convertedFromEnquiryId: string | null,
): CrmCalendarEvent | null {
  if (bookings.length === 0) return null;
  const linked = convertedFromEnquiryId
    ? bookings.filter((booking) => booking.enquiryId === convertedFromEnquiryId)
    : bookings;
  const pool = linked.length > 0 ? linked : bookings;
  const now = Date.now();
  const upcoming = pool
    .filter((booking) => eventTime(booking.endsAt) >= now)
    .sort((left, right) => eventTime(left.startsAt) - eventTime(right.startsAt));
  if (upcoming[0]) return upcoming[0];
  return [...pool].sort((left, right) => eventTime(left.startsAt) - eventTime(right.startsAt)).at(-1) ?? null;
}

export class ClientService {
  constructor(
    private readonly model: CrmClientModel = crmClientModel,
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
    private readonly events: CrmCalendarEventModel = crmCalendarEventModel,
  ) {}

  async list(query: ListClientsQuery) {
    const where: Prisma.CrmClientWhereInput = { isActive: 1 };
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { billingName: { contains: query.search, mode: "insensitive" } },
        { gstin: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.from || query.to) {
      const contactIds = await this.contactIdsWithBookingsInRange(query.from, query.to);
      if (contactIds.length === 0) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        return {
          items: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          },
        };
      }
      where.contactId = { in: contactIds };
    }
    const result = await this.model.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { createdAt: "desc" },
    });
    return {
      ...result,
      items: await this.withBookingDates(result.items),
    };
  }

  private async contactIdsWithBookingsInRange(from?: Date, to?: Date): Promise<string[]> {
    const events = await this.events.read({
      isActive: 1,
      AND: [to ? { startsAt: { lte: to } } : {}, from ? { endsAt: { gte: from } } : {}],
    });
    const enquiryIds = [
      ...new Set(
        events
          .map((event) => event.enquiryId)
          .filter((enquiryId): enquiryId is string => Boolean(enquiryId)),
      ),
    ];
    const enquiryRows =
      enquiryIds.length > 0
        ? await this.enquiries.read({ isActive: 1, id: { in: enquiryIds } })
        : [];
    const enquiryContactById = new Map(enquiryRows.map((enquiry) => [enquiry.id, enquiry.contactId]));
    const contactIds = new Set<string>();
    for (const event of events) {
      if (event.contactId) contactIds.add(event.contactId);
      if (event.enquiryId) {
        const contactId = enquiryContactById.get(event.enquiryId);
        if (contactId) contactIds.add(contactId);
      }
    }
    return [...contactIds];
  }

  async getById(id: string) {
    const client = requireActive(await this.model.readOne({ id }), "Client");
    const [withDates] = await this.withBookingDates([client]);
    return withDates ?? { ...client, startsAt: null, endsAt: null };
  }

  private async withBookingDates(clients: CrmClient[]): Promise<ClientWithBookingDates[]> {
    if (clients.length === 0) return [];
    const contactIds = clients.map((client) => client.contactId);
    const enquiryRows = await this.enquiries.read({
      isActive: 1,
      contactId: { in: contactIds },
    });
    const enquiryIds = enquiryRows.map((enquiry) => enquiry.id);
    const events = await this.events.read({
      isActive: 1,
      OR: [
        { contactId: { in: contactIds } },
        ...(enquiryIds.length > 0 ? [{ enquiryId: { in: enquiryIds } }] : []),
      ],
    });
    return clients.map((client) => {
      const contactEnquiryIds = new Set(
        enquiryRows.filter((enquiry) => enquiry.contactId === client.contactId).map((enquiry) => enquiry.id),
      );
      const related = events.filter(
        (event) =>
          event.contactId === client.contactId ||
          (event.enquiryId != null && contactEnquiryIds.has(event.enquiryId)),
      );
      const current = pickCurrentBooking(related, client.convertedFromEnquiryId);
      return {
        ...client,
        startsAt: current?.startsAt ?? null,
        endsAt: current?.endsAt ?? null,
      };
    });
  }

  async create(actorId: string, input: CreateClientBody) {
    const contact = await this.contacts.readOne({ id: input.contactId });
    if (!contact || contact.isActive !== 1) {
      throw new HttpError(404, "Contact not found");
    }
    if (contact.type !== "client") {
      throw new HttpError(422, "Client records require a contact with type client");
    }
    const existing = await this.model.findOne({ contactId: input.contactId });
    if (existing && existing.isActive === 1) {
      throw new HttpError(409, "A client already exists for this contact");
    }
    if (input.convertedFromEnquiryId) {
      const enquiry = await this.enquiries.readOne({ id: input.convertedFromEnquiryId });
      if (!enquiry || enquiry.isActive !== 1) {
        throw new HttpError(404, "Enquiry not found");
      }
    }
    if (existing) {
      return this.model.update(
        { id: existing.id },
        {
          billingName: input.billingName,
          status: input.status ?? "active",
          gstin: input.gstin ?? null,
          convertedFromEnquiryId: input.convertedFromEnquiryId ?? existing.convertedFromEnquiryId,
          isActive: 1,
          deletedAt: null,
          deletedBy: null,
          ...actorUpdate(actorId),
        },
      );
    }
    return this.model.create({
      contactId: input.contactId,
      billingName: input.billingName,
      status: input.status ?? "active",
      gstin: input.gstin ?? null,
      convertedFromEnquiryId: input.convertedFromEnquiryId ?? null,
      ...actorCreate(actorId),
    });
  }

  async update(actorId: string, id: string, input: UpdateClientBody) {
    await this.getById(id);
    if (input.convertedFromEnquiryId) {
      const enquiry = await this.enquiries.readOne({ id: input.convertedFromEnquiryId });
      if (!enquiry || enquiry.isActive !== 1) {
        throw new HttpError(404, "Enquiry not found");
      }
    }
    return this.model.update(
      { id },
      {
        ...input,
        ...actorUpdate(actorId),
      },
    );
  }

  async remove(actorId: string, input: RemoveClientBody) {
    await this.getById(input.id);
    await this.model.update({ id: input.id }, actorDelete(actorId));
    return { id: input.id, removed: true };
  }
}

export const clientService = new ClientService();
