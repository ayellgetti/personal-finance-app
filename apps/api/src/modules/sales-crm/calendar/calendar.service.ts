import type {
  CrmCalendarEvent,
  CrmEnquiry,
  CrmTask,
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { HttpError } from "../../../utils/http-error.util";
import {
  crmCalendarEventModel,
  crmClientModel,
  crmContactModel,
  crmEnquiryModel,
  crmPaymentModel,
  crmTaskModel,
  type CrmCalendarEventModel,
  type CrmClientModel,
  type CrmContactModel,
  type CrmEnquiryModel,
  type CrmPaymentModel,
  type CrmTaskModel,
} from "../../../models/index";
import { OPEN_ENQUIRY_STATUSES } from "../crm.request";
import { actorCreate, actorDelete, actorUpdate, requireActive } from "../crm.util";
import { isBookedAndPaid } from "../booking-lock";
import type {
  CreateCalendarEventBody,
  ListCalendarEventsQuery,
  ListCalendarQuery,
  RemoveCalendarEventBody,
  UpdateCalendarEventBody,
} from "./calendar.request";

export type CalendarFeedItem =
  | {
      kind: "task";
      id: string;
      title: string;
      at: Date;
      endsAt: null;
      task: CrmTask;
    }
  | {
      kind: "followup";
      id: string;
      title: string;
      at: Date;
      endsAt: null;
      enquiry: CrmEnquiry;
    }
  | {
      kind: "event" | "booking";
      id: string;
      title: string;
      at: Date;
      endsAt: Date;
      event: CrmCalendarEvent;
    };

export class CalendarService {
  constructor(
    private readonly events: CrmCalendarEventModel = crmCalendarEventModel,
    private readonly tasks: CrmTaskModel = crmTaskModel,
    private readonly contacts: CrmContactModel = crmContactModel,
    private readonly enquiries: CrmEnquiryModel = crmEnquiryModel,
    private readonly clients: CrmClientModel = crmClientModel,
    private readonly payments: CrmPaymentModel = crmPaymentModel,
  ) {}

  async feed(query: ListCalendarQuery) {
    const [taskRows, eventRows, followUpRows] = await Promise.all([
      this.tasks.read({
        isActive: 1,
        dueAt: { not: null, gte: query.from, lte: query.to },
      }),
      this.events.read({
        isActive: 1,
        startsAt: { lte: query.to },
        endsAt: { gte: query.from },
      }),
      this.enquiries.read({
        isActive: 1,
        status: { in: [...OPEN_ENQUIRY_STATUSES] },
        nextFollowupDate: { gte: query.from, lte: query.to },
      }),
    ]);

    const items: CalendarFeedItem[] = [
      ...taskRows
        .filter((task): task is CrmTask & { dueAt: Date } => task.dueAt !== null)
        .map((task) => ({
          kind: "task" as const,
          id: task.id,
          title: task.title,
          at: task.dueAt,
          endsAt: null,
          task,
        })),
      ...followUpRows
        .filter(
          (enquiry): enquiry is CrmEnquiry & { nextFollowupDate: Date } =>
            enquiry.nextFollowupDate !== null,
        )
        .map((enquiry) => ({
          kind: "followup" as const,
          id: enquiry.id,
          title: `Follow-up: ${enquiry.title}`,
          at: enquiry.nextFollowupDate,
          endsAt: null,
          enquiry,
        })),
      ...eventRows.map((event) => ({
        kind: event.enquiryId ? ("booking" as const) : ("event" as const),
        id: event.id,
        title: event.title,
        at: event.startsAt,
        endsAt: event.endsAt,
        event,
      })),
    ];

    items.sort((left, right) => left.at.getTime() - right.at.getTime());
    return { items };
  }

  listEvents(query: ListCalendarEventsQuery) {
    const where: Prisma.CrmCalendarEventWhereInput = { isActive: 1 };
    if (query.assigneeId) {
      where.assigneeId = query.assigneeId;
    }
    if (query.from || query.to) {
      where.AND = [
        query.to ? { startsAt: { lte: query.to } } : {},
        query.from ? { endsAt: { gte: query.from } } : {},
      ];
    }
    return this.events.paginate(where, query.page ?? 1, query.limit ?? 25, {
      orderBy: { startsAt: "asc" },
    });
  }

  async getEventById(id: string) {
    return requireActive(await this.events.readOne({ id }), "Calendar event");
  }

  async createEvent(actorId: string, input: CreateCalendarEventBody) {
    await this.assertOptionalRefs(input.contactId, input.enquiryId);
    return this.events.create({
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      contactId: input.contactId ?? null,
      enquiryId: input.enquiryId ?? null,
      assigneeId: input.assigneeId ?? null,
      notes: input.notes ?? null,
      slot: input.slot ?? null,
      ...actorCreate(actorId),
    });
  }

  async updateEvent(actorId: string, id: string, input: UpdateCalendarEventBody) {
    const existing = await this.getEventById(id);
    const startsAt = input.startsAt ?? existing.startsAt;
    const endsAt = input.endsAt ?? existing.endsAt;
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new HttpError(422, "endsAt must be after startsAt");
    }
    await this.assertOptionalRefs(input.contactId, input.enquiryId);
    return this.events.update(
      { id },
      {
        ...input,
        ...actorUpdate(actorId),
      },
    );
  }

  async removeEvent(actorId: string, input: RemoveCalendarEventBody) {
    const event = await this.getEventById(input.id);
    const enquiry = event.enquiryId ? await this.enquiries.readOne({ id: event.enquiryId }) : null;
    if (enquiry && enquiry.isActive === 1) {
      const locked = await isBookedAndPaid(enquiry, {
        clients: this.clients,
        events: this.events,
        payments: this.payments,
      });
      if (locked) {
        throw new HttpError(409, "Cannot remove a booking after payment has been made");
      }
      await this.enquiries.update({ id: enquiry.id }, actorDelete(actorId));
    }
    await this.events.update({ id: input.id }, actorDelete(actorId));
    return { id: input.id, removed: true, enquiryId: enquiry?.id ?? null };
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

export const calendarService = new CalendarService();
