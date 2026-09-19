import { z } from "zod";
import {
  crmEnquiryStatusSchema,
  crmEventSlotSchema,
  crmIdParamsSchema,
  crmListQuerySchema,
  crmRemoveBodySchema,
} from "../crm.request";

export const enquiryIdParamsSchema = crmIdParamsSchema;
export const removeEnquiryBodySchema = crmRemoveBodySchema;

export const listEnquiriesQuerySchema = crmListQuerySchema.extend({
  status: crmEnquiryStatusSchema.optional(),
  contactId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
});

export const createEnquiryBodySchema = z.object({
  contactId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  source: z.string().trim().min(1).max(80),
  status: crmEnquiryStatusSchema.optional(),
  closedReason: z.string().trim().min(1).max(200).nullable().optional(),
  expectedValue: z.number().finite().nonnegative().nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  dueDate: z.coerce.date().refine((value) => !Number.isNaN(value.getTime()), {
    message: "Invalid due date",
  }),
});

export const updateEnquiryBodySchema = createEnquiryBodySchema
  .omit({ contactId: true })
  .partial()
  .extend({
    contactId: z.string().uuid().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const convertEnquiryBodySchema = z
  .object({
    billingName: z.string().trim().min(1).max(200).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    slot: crmEventSlotSchema.nullable().optional(),
  })
  .default({})
  .superRefine((value, ctx) => {
    if (value.startsAt && !value.endsAt && !value.slot) {
      ctx.addIssue({
        code: "custom",
        message: "End datetime or slot is required",
        path: ["endsAt"],
      });
    }
    if (!value.startsAt && (Boolean(value.endsAt) || Boolean(value.slot))) {
      ctx.addIssue({
        code: "custom",
        message: "Start datetime is required",
        path: ["startsAt"],
      });
    }
    if (value.startsAt && value.endsAt && value.endsAt.getTime() <= value.startsAt.getTime()) {
      ctx.addIssue({
        code: "custom",
        message: "endsAt must be after startsAt",
        path: ["endsAt"],
      });
    }
  });

export type EnquiryIdParams = z.infer<typeof enquiryIdParamsSchema>;
export type ListEnquiriesQuery = z.infer<typeof listEnquiriesQuerySchema>;
export type CreateEnquiryBody = z.infer<typeof createEnquiryBodySchema>;
export type UpdateEnquiryBody = z.infer<typeof updateEnquiryBodySchema>;
export type RemoveEnquiryBody = z.infer<typeof removeEnquiryBodySchema>;
export type ConvertEnquiryBody = z.infer<typeof convertEnquiryBodySchema>;
