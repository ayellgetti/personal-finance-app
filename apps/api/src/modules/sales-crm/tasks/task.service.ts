import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmContactModel,
  crmEnquiryModel,
  crmTaskModel,
  type CrmContactModel,
  type CrmEnquiryModel,
  type CrmTaskModel,
} from "../../../models/index";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import type {
  CreateTaskBody,
  ListTasksQuery,
  RemoveTaskBody,
  UpdateTaskBody,
  UpdateTaskStatusBody,
} from "./task.request";

export class TaskService {
  constructor(
    private readonly model: CrmTaskModel = crmTaskModel,
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
  ) {}

  list(query: ListTasksQuery) {
    const where: Prisma.CrmTaskWhereInput = { isActive: 1 };
    if (query.status) {
      where.status = query.status;
    }
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }
    return this.model.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return requireActive(await this.model.readOne({ id }), "Task");
  }

  async create(actorId: string, input: CreateTaskBody) {
    await this.assertOptionalRefs(input.contactId, input.enquiryId);
    return this.model.create({
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "todo",
      assigneeId: input.assigneeId ?? null,
      dueAt: input.dueAt ?? null,
      contactId: input.contactId ?? null,
      enquiryId: input.enquiryId ?? null,
      ...actorCreate(actorId),
    });
  }

  async update(actorId: string, id: string, input: UpdateTaskBody) {
    await this.getById(id);
    await this.assertOptionalRefs(input.contactId, input.enquiryId);
    return this.model.update(
      { id },
      {
        ...input,
        ...actorUpdate(actorId),
      },
    );
  }

  async updateStatus(actorId: string, id: string, input: UpdateTaskStatusBody) {
    return this.update(actorId, id, { status: input.status });
  }

  async remove(actorId: string, input: RemoveTaskBody) {
    await this.getById(input.id);
    await this.model.update({ id: input.id }, actorDelete(actorId));
    return { id: input.id, removed: true };
  }

  private async assertOptionalRefs(
    contactId: string | null | undefined,
    enquiryId: string | null | undefined,
  ) {
    if (contactId) {
      const contact = await this.contacts.readOne({ id: contactId });
      if (!contact || contact.isActive !== 1) {
        throw new HttpError(404, "Contact not found");
      }
    }
    if (enquiryId) {
      const enquiry = await this.enquiries.readOne({ id: enquiryId });
      if (!enquiry || enquiry.isActive !== 1) {
        throw new HttpError(404, "Enquiry not found");
      }
    }
  }
}

export const taskService = new TaskService();
