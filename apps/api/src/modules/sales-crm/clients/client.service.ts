import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
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
  CreateClientBody,
  ListClientsQuery,
  RemoveClientBody,
  UpdateClientBody,
} from "./client.request";

export class ClientService {
  constructor(
    private readonly model: CrmClientModel = crmClientModel,
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
  ) {}

  list(query: ListClientsQuery) {
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
    return this.model.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return requireActive(await this.model.readOne({ id }), "Client");
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
