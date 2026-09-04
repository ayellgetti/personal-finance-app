import { z } from "zod";
import {
  crmContactTypeSchema,
  crmEmailSchema,
  crmIdParamsSchema,
  crmListQuerySchema,
  crmMobileSchema,
  crmRemoveBodySchema,
} from "../crm.request";

export const contactIdParamsSchema = crmIdParamsSchema;
export const removeContactBodySchema = crmRemoveBodySchema;

export const listContactsQuerySchema = crmListQuerySchema.extend({
  type: crmContactTypeSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createContactBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  mobile: crmMobileSchema,
  type: crmContactTypeSchema,
  email: crmEmailSchema.nullable().optional(),
  companyName: z.string().trim().min(1).max(160).nullable().optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
});

export const updateContactBodySchema = createContactBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type ContactIdParams = z.infer<typeof contactIdParamsSchema>;
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
export type CreateContactBody = z.infer<typeof createContactBodySchema>;
export type UpdateContactBody = z.infer<typeof updateContactBodySchema>;
export type RemoveContactBody = z.infer<typeof removeContactBodySchema>;
