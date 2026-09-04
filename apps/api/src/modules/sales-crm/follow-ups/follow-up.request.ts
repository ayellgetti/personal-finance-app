import { z } from "zod";
import {
  crmFollowUpStatusSchema,
  crmIdParamsSchema,
  crmListQuerySchema,
  crmRemoveBodySchema,
} from "../crm.request";

export const followUpIdParamsSchema = crmIdParamsSchema;
export const removeFollowUpBodySchema = crmRemoveBodySchema;

export const listFollowUpsQuerySchema = crmListQuerySchema.extend({
  status: crmFollowUpStatusSchema.optional(),
  enquiryId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const createFollowUpBodySchema = z.object({
  contactId: z.string().uuid(),
  enquiryId: z.string().uuid().nullable().optional(),
  dueAt: z.coerce.date(),
  status: crmFollowUpStatusSchema.optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

export const updateFollowUpBodySchema = createFollowUpBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type FollowUpIdParams = z.infer<typeof followUpIdParamsSchema>;
export type ListFollowUpsQuery = z.infer<typeof listFollowUpsQuerySchema>;
export type CreateFollowUpBody = z.infer<typeof createFollowUpBodySchema>;
export type UpdateFollowUpBody = z.infer<typeof updateFollowUpBodySchema>;
export type RemoveFollowUpBody = z.infer<typeof removeFollowUpBodySchema>;
