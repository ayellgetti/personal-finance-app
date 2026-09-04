import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requirePermission } from "../../../middlewares/require-permission.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { calendarController } from "./calendar.controller";
import {
  calendarEventIdParamsSchema,
  createCalendarEventBodySchema,
  listCalendarEventsQuerySchema,
  listCalendarQuerySchema,
  removeCalendarEventBodySchema,
  updateCalendarEventBodySchema,
} from "./calendar.request";

export const calendarRouter = Router();

calendarRouter.get(
  "/",
  requirePermission("crm.calendar.read"),
  validate({ query: listCalendarQuerySchema }),
  asyncHandler(async (req, res) => {
    await calendarController.feed(req, res);
  }),
);

export const calendarEventRouter = Router();

calendarEventRouter.get(
  "/",
  requirePermission("crm.calendar.read"),
  validate({ query: listCalendarEventsQuerySchema }),
  asyncHandler(async (req, res) => {
    await calendarController.listEvents(req, res);
  }),
);

calendarEventRouter.post(
  "/",
  requirePermission("crm.calendar.create"),
  validateBody(createCalendarEventBodySchema),
  asyncHandler(async (req, res) => {
    await calendarController.createEvent(req, res);
  }),
);

calendarEventRouter.post(
  "/remove",
  requirePermission("crm.calendar.delete"),
  validateBody(removeCalendarEventBodySchema),
  asyncHandler(async (req, res) => {
    await calendarController.removeEvent(req, res);
  }),
);

calendarEventRouter.get(
  "/:id",
  requirePermission("crm.calendar.read"),
  validate({ params: calendarEventIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await calendarController.getEventById(req, res);
  }),
);

calendarEventRouter.patch(
  "/:id",
  requirePermission("crm.calendar.update"),
  validate({ params: calendarEventIdParamsSchema, body: updateCalendarEventBodySchema }),
  asyncHandler(async (req, res) => {
    await calendarController.updateEvent(req, res);
  }),
);
