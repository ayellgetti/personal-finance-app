import type { Request, Response } from "express";
import { BaseController } from "../../shared/base/base.controller";
import { currentUserId, requireParamId } from "../crm.http";
import type {
  CreateCalendarEventBody,
  ListCalendarEventsQuery,
  ListCalendarQuery,
  RemoveCalendarEventBody,
  UpdateCalendarEventBody,
} from "./calendar.request";
import { calendarService, type CalendarService } from "./calendar.service";

export class CalendarController extends BaseController {
  constructor(private readonly service: CalendarService = calendarService) {
    super();
  }

  async feed(req: Request, res: Response) {
    const result = await this.service.feed(req.query as unknown as ListCalendarQuery);
    this.sendSuccess(req, res, result, "Calendar retrieved");
  }

  async listEvents(req: Request, res: Response) {
    const result = await this.service.listEvents(
      req.query as ListCalendarEventsQuery,
    );
    this.sendSuccess(req, res, result, "Calendar events retrieved");
  }

  async getEventById(req: Request, res: Response) {
    const event = await this.service.getEventById(requireParamId(req, "Calendar event"));
    this.sendSuccess(req, res, { event }, "Calendar event retrieved");
  }

  async createEvent(req: Request, res: Response) {
    const event = await this.service.createEvent(
      currentUserId(req),
      req.body as CreateCalendarEventBody,
    );
    this.sendSuccess(req, res, { event }, "Calendar event created", 201);
  }

  async updateEvent(req: Request, res: Response) {
    const event = await this.service.updateEvent(
      currentUserId(req),
      requireParamId(req, "Calendar event"),
      req.body as UpdateCalendarEventBody,
    );
    this.sendSuccess(req, res, { event }, "Calendar event updated");
  }

  async removeEvent(req: Request, res: Response) {
    const result = await this.service.removeEvent(
      currentUserId(req),
      req.body as RemoveCalendarEventBody,
    );
    this.sendSuccess(req, res, result, "Calendar event removed");
  }
}

export const calendarController = new CalendarController();
