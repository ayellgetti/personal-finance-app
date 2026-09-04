import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmEnquiryModel,
  crmFollowUpModel,
  type CrmEnquiryModel,
  type CrmFollowUpModel,
} from "../../../models/index";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import type {
  CreateFollowUpBody,
  ListFollowUpsQuery,
  RemoveFollowUpBody,
  UpdateFollowUpBody,
} from "./follow-up.request";

export class FollowUpService {
  constructor(
    private readonly model: CrmFollowUpModel = crmFollowUpModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
  ) {}

  list(query: ListFollowUpsQuery) {
    const where: Prisma.CrmFollowUpWhereInput = { isActive: 1 };
    if (query.stage) {
      where.stage = query.stage;
    }
    if (query.enquiryId) {
      where.enquiryId = query.enquiryId;
    }
    if (query.contactId) {
      where.contactId = query.contactId;
    }
    if (query.from || query.to) {
      where.dueAt = {
        ...(query.from ? { gte: query.from } : {}),
        ...(query.to ? { lte: query.to } : {}),
      };
    }
    return this.model.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { dueAt: "asc" },
    });
  }

  async getById(id: string) {
    return requireActive(await this.model.readOne({ id }), "Follow-up");
  }

  async create(actorId: string, input: CreateFollowUpBody) {
    const enquiry = await this.requireActiveEnquiry(input.enquiryId);
    return this.model.create({
      enquiryId: enquiry.id,
      contactId: enquiry.contactId,
      stage: input.stage,
      dueAt: input.dueAt,
      notes: input.notes ?? null,
      ...actorCreate(actorId),
    });
  }

  async update(actorId: string, id: string, input: UpdateFollowUpBody) {
    await this.getById(id);
    if (input.enquiryId) {
      await this.requireActiveEnquiry(input.enquiryId);
    }
    return this.model.update(
      { id },
      {
        ...input,
        ...actorUpdate(actorId),
      },
    );
  }

  async remove(actorId: string, input: RemoveFollowUpBody) {
    await this.getById(input.id);
    await this.model.update({ id: input.id }, actorDelete(actorId));
    return { id: input.id, removed: true };
  }

  private async requireActiveEnquiry(enquiryId: string) {
    const enquiry = await this.enquiries.readOne({ id: enquiryId });
    if (!enquiry || enquiry.isActive !== 1) {
      throw new HttpError(404, "Enquiry not found");
    }
    return enquiry;
  }

}


export const followUpService = new FollowUpService();
