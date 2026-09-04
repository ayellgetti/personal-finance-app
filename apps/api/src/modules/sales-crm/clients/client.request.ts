import { z } from "zod";
import {
  crmClientStatusSchema,
  crmIdParamsSchema,
  crmListQuerySchema,
  crmRemoveBodySchema,
} from "../crm.request";

export const clientIdParamsSchema = crmIdParamsSchema;
export const removeClientBodySchema = crmRemoveBodySchema;

export const listClientsQuerySchema = crmListQuerySchema.extend({
  status: crmClientStatusSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createClientBodySchema = z.object({
  contactId: z.string().uuid(),
  billingName: z.string().trim().min(1).max(200),
  status: crmClientStatusSchema.optional(),
  gstin: z.string().trim().min(1).max(32).nullable().optional(),
  convertedFromEnquiryId: z.string().uuid().nullable().optional(),
});

export const updateClientBodySchema = createClientBodySchema
  .omit({ contactId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type ClientIdParams = z.infer<typeof clientIdParamsSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type CreateClientBody = z.infer<typeof createClientBodySchema>;
export type UpdateClientBody = z.infer<typeof updateClientBodySchema>;
export type RemoveClientBody = z.infer<typeof removeClientBodySchema>;
