import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmContactModel,
  type CrmContactModel,
} from "../../../models/index";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import type {
  CreateContactBody,
  ListContactsQuery,
  RemoveContactBody,
  UpdateContactBody,
} from "./contact.request";

export class ContactService {
  constructor(private readonly model: CrmContactModel = crmContactModel) {}

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
