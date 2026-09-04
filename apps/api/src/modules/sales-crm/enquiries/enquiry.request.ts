import { z } from "zod";
import {
  crmEnquiryStatusSchema,
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
  })
  .default({});

export type EnquiryIdParams = z.infer<typeof enquiryIdParamsSchema>;
export type ListEnquiriesQuery = z.infer<typeof listEnquiriesQuerySchema>;
export type CreateEnquiryBody = z.infer<typeof createEnquiryBodySchema>;
export type UpdateEnquiryBody = z.infer<typeof updateEnquiryBodySchema>;
export type RemoveEnquiryBody = z.infer<typeof removeEnquiryBodySchema>;
export type ConvertEnquiryBody = z.infer<typeof convertEnquiryBodySchema>;
