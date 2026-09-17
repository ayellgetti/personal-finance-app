import { z } from "zod";
import {
  crmEnquiryStatusSchema,
  crmIdParamsSchema,
  crmListQuerySchema,
  crmRemoveBodySchema,
} from "../crm.request";
import { MAX_CALENDAR_RANGE_MS } from "../crm.util";

export const followUpIdParamsSchema = crmIdParamsSchema;
export const removeFollowUpBodySchema = crmRemoveBodySchema;

export const listFollowUpsQuerySchema = crmListQuerySchema.extend({
  enquiryId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  stage: crmEnquiryStatusSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const createFollowUpBodySchema = z.object({
  enquiryId: z.string().uuid(),
  stage: crmEnquiryStatusSchema,
  dueAt: z.coerce.date(),
  nextFollowupDate: z.coerce.date(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

export const updateFollowUpBodySchema = createFollowUpBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listFollowUpCalendarQuerySchema = z
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

export type FollowUpIdParams = z.infer<typeof followUpIdParamsSchema>;
export type ListFollowUpsQuery = z.infer<typeof listFollowUpsQuerySchema>;
export type CreateFollowUpBody = z.infer<typeof createFollowUpBodySchema>;
export type UpdateFollowUpBody = z.infer<typeof updateFollowUpBodySchema>;
export type RemoveFollowUpBody = z.infer<typeof removeFollowUpBodySchema>;
export type ListFollowUpCalendarQuery = z.infer<typeof listFollowUpCalendarQuerySchema>;
