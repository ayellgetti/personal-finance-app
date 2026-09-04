import { z } from "zod";
import {
  crmIdParamsSchema,
  crmListQuerySchema,
  crmRemoveBodySchema,
} from "../crm.request";
import { MAX_CALENDAR_RANGE_MS } from "../crm.util";

export const calendarEventIdParamsSchema = crmIdParamsSchema;
export const removeCalendarEventBodySchema = crmRemoveBodySchema;

export const listCalendarQuerySchema = z
  .object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  })
  .refine((value) => value.to.getTime() >= value.from.getTime(), {
    message: "to must be on or after from",
    path: ["to"],
  })
  .refine(
    (value) => value.to.getTime() - value.from.getTime() <= MAX_CALENDAR_RANGE_MS,
    {
      message: "Calendar range cannot exceed 92 days",
      path: ["to"],
    },
  );

export const listCalendarEventsQuerySchema = crmListQuerySchema.extend({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  assigneeId: z.string().uuid().optional(),
});

export const createCalendarEventBodySchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    contactId: z.string().uuid().nullable().optional(),
    enquiryId: z.string().uuid().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((value) => value.endsAt.getTime() > value.startsAt.getTime(), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

export const updateCalendarEventBodySchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    contactId: z.string().uuid().nullable().optional(),
    enquiryId: z.string().uuid().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    notes: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  })
  .refine(
    (value) =>
      value.startsAt === undefined ||
      value.endsAt === undefined ||
      value.endsAt.getTime() > value.startsAt.getTime(),
    {
      message: "endsAt must be after startsAt",
      path: ["endsAt"],
    },
  );

export type ListCalendarQuery = z.infer<typeof listCalendarQuerySchema>;
export type ListCalendarEventsQuery = z.infer<typeof listCalendarEventsQuerySchema>;
export type CreateCalendarEventBody = z.infer<typeof createCalendarEventBodySchema>;
export type UpdateCalendarEventBody = z.infer<typeof updateCalendarEventBodySchema>;
export type RemoveCalendarEventBody = z.infer<typeof removeCalendarEventBodySchema>;
export type CalendarEventIdParams = z.infer<typeof calendarEventIdParamsSchema>;
