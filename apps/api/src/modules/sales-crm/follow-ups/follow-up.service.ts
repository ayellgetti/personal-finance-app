import type { CrmEnquiry, CrmEnquiryStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmEnquiryModel,
  crmFollowUpModel,
  type CrmEnquiryModel,
  type CrmFollowUpModel,
} from "../../../models/index";
import { OPEN_ENQUIRY_STATUSES } from "../crm.request";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import { isFollowUpOverdue } from "../enquiries/enquiry-due-date";
import type {
  CreateFollowUpBody,
  ListFollowUpCalendarQuery,
  ListFollowUpsQuery,
  RemoveFollowUpBody,
  UpdateFollowUpBody,
} from "./follow-up.request";

export type FollowUpCalendarKind = "new_enquiry" | "followup";

export type FollowUpCalendarItem = {
  kind: FollowUpCalendarKind;
  enquiryId: string;
  title: string;
  contactId: string;
  status: CrmEnquiryStatus;
  at: Date;
  nextFollowupDate: Date | null;
  overdue: boolean;
};

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
      orderBy: { createdAt: "desc" },
    });
  }

  async getById(id: string) {
    return requireActive(await this.model.readOne({ id }), "Follow-up");
  }

  async create(actorId: string, input: CreateFollowUpBody) {
    const enquiry = await this.requireActiveEnquiry(input.enquiryId);
    const followUp = await this.model.create({
      enquiryId: enquiry.id,
      contactId: enquiry.contactId,
      stage: input.stage,
      dueAt: input.dueAt,
      nextFollowupDate: input.nextFollowupDate,
      notes: input.notes ?? null,
      ...actorCreate(actorId),
    });
    await this.enquiries.update(
      { id: enquiry.id },
      {
        nextFollowupDate: input.nextFollowupDate,
        ...actorUpdate(actorId),
      },
    );
    return followUp;
  }

  async update(actorId: string, id: string, input: UpdateFollowUpBody) {
    const existing = await this.getById(id);
    let enquiry = await this.requireActiveEnquiry(existing.enquiryId);
    if (input.enquiryId && input.enquiryId !== existing.enquiryId) {
      enquiry = await this.requireActiveEnquiry(input.enquiryId);
    }
    const followUp = await this.model.update(
      { id },
      {
        ...input,
        ...(input.enquiryId ? { contactId: enquiry.contactId } : {}),
        ...actorUpdate(actorId),
      },
    );
    if (input.nextFollowupDate) {
      await this.enquiries.update(
        { id: enquiry.id },
        {
          nextFollowupDate: input.nextFollowupDate,
          ...actorUpdate(actorId),
        },
      );
    }
    return followUp;
  }

  async remove(actorId: string, input: RemoveFollowUpBody) {
    await this.getById(input.id);
    await this.model.update({ id: input.id }, actorDelete(actorId));
    return { id: input.id, removed: true };
  }

  async calendar(query: ListFollowUpCalendarQuery, now = new Date()) {
    const openStatuses = [...OPEN_ENQUIRY_STATUSES];
    const contactedStatuses = openStatuses.filter((status) => status !== "new");
    const [newEnquiries, followUpEnquiries, overdueEnquiries] = await Promise.all([
      this.enquiries.read({
        isActive: 1,
        status: "new",
        dueDate: { gte: query.from, lte: query.to },
      }),
      this.enquiries.read({
        isActive: 1,
        status: { in: contactedStatuses },
        nextFollowupDate: { gte: query.from, lte: query.to },
      }),
      this.enquiries.read({
        isActive: 1,
        status: { in: openStatuses },
        nextFollowupDate: { lt: now },
      }),
    ]);

    const items: FollowUpCalendarItem[] = [
      ...newEnquiries.map((enquiry) =>
        this.toCalendarItem("new_enquiry", enquiry, enquiry.dueDate ?? enquiry.createdAt, now),
      ),
      ...followUpEnquiries.map((enquiry) =>
        this.toCalendarItem(
          "followup",
          enquiry,
          enquiry.nextFollowupDate ?? enquiry.createdAt,
          now,
        ),
      ),
    ];
    items.sort((left, right) => left.at.getTime() - right.at.getTime());

    const overdue = overdueEnquiries.map((enquiry) =>
      this.toCalendarItem(
        enquiry.status === "new" ? "new_enquiry" : "followup",
        enquiry,
        enquiry.nextFollowupDate ?? enquiry.dueDate ?? enquiry.createdAt,
        now,
      ),
    );

    return { items, overdue };
  }

  private toCalendarItem(
    kind: FollowUpCalendarKind,
    enquiry: CrmEnquiry,
    at: Date,
    now: Date,
  ): FollowUpCalendarItem {
    return {
      kind,
      enquiryId: enquiry.id,
      title: enquiry.title,
      contactId: enquiry.contactId,
      status: enquiry.status,
      at,
      nextFollowupDate: enquiry.nextFollowupDate,
      overdue: isFollowUpOverdue({
        nextFollowupDate: enquiry.nextFollowupDate,
        enquiryStatus: enquiry.status,
        now,
      }),
    };
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
