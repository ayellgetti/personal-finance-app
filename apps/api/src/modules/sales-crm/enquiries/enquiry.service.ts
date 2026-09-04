import type { CrmClient, CrmContact, CrmEnquiry } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import { prisma } from "../../../utils/prisma.util";
import {
  crmClientModel,
  crmContactModel,
  crmEnquiryModel,
  type CrmClientModel,
  type CrmContactModel,
  type CrmEnquiryModel,
} from "../../../models/index";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
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
};

export type PersistEnquiryConversion = (input: {
  actorId: string;
  enquiryId: string;
  contactId: string;
  billingName: string;
  existingClientId: string | null;
  convertedFromEnquiryId: string;
}) => Promise<ConvertedEnquiry>;

export async function persistEnquiryConversion(input: {
  actorId: string;
  enquiryId: string;
  contactId: string;
  billingName: string;
  existingClientId: string | null;
  convertedFromEnquiryId: string;
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
    return { enquiry, contact, client };
  });
}

export class EnquiryService {
  constructor(
    private readonly model: CrmEnquiryModel = crmEnquiryModel,
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly clients: CrmClientModel = crmClientModel,
    private readonly persistConvert: PersistEnquiryConversion = persistEnquiryConversion,
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
    return this.model.create({
      contactId: input.contactId,
      title: input.title,
      source: input.source,
      status: input.status ?? "new",
      expectedValue: input.expectedValue ?? null,
      assignedToId: input.assignedToId ?? null,
      notes: input.notes ?? null,
      ...actorCreate(actorId),
    });
  }

  async update(actorId: string, id: string, input: UpdateEnquiryBody) {
    await this.getById(id);
    if (input.contactId) {
      await this.requireUsableContact(input.contactId);
    }
    if (input.status === "closed" && !input.closedReason?.trim()) {
      throw new HttpError(422, "A closed reason is required when closing an enquiry");
    }
    return this.model.update(
      { id },
      {
        ...input,
        ...actorUpdate(actorId),
      },
    );
  }

  async remove(actorId: string, input: RemoveEnquiryBody) {
    await this.getById(input.id);
    await this.model.update({ id: input.id }, actorDelete(actorId));
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

    if (enquiry.status === "closed" && activeClient) {
      return { enquiry, contact, client: activeClient };
    }

    const billingName = input.billingName?.trim() || contact.name;
    return this.persistConvert({
      actorId,
      enquiryId: enquiry.id,
      contactId: contact.id,
      billingName,
      existingClientId: existingClient?.id ?? null,
      convertedFromEnquiryId: enquiry.id,
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
