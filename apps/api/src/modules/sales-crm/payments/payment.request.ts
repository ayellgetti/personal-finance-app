import { z } from "zod";
import {
  crmIdParamsSchema,
  crmListQuerySchema,
  crmPaymentModeSchema,
  crmPaymentStatusSchema,
  crmPaymentTypeSchema,
  crmRemoveBodySchema,
} from "../crm.request";

export const paymentIdParamsSchema = crmIdParamsSchema;
export const removePaymentBodySchema = crmRemoveBodySchema;

export const listPaymentsQuerySchema = crmListQuerySchema.extend({
  clientId: z.string().uuid().optional(),
  status: crmPaymentStatusSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const createPaymentBodySchema = z.object({
  clientId: z.string().uuid(),
  enquiryId: z.string().uuid().nullable().optional(),
  amount: z.number().finite().positive(),
  currency: z.string().trim().min(1).max(8).optional(),
  type: crmPaymentTypeSchema.optional(),
  mode: crmPaymentModeSchema,
  status: crmPaymentStatusSchema.optional(),
  paidAt: z.coerce.date().nullable().optional(),
  reference: z.string().trim().min(1).max(80).nullable().optional(),
});

export const updatePaymentBodySchema = createPaymentBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type PaymentIdParams = z.infer<typeof paymentIdParamsSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
export type CreatePaymentBody = z.infer<typeof createPaymentBodySchema>;
export type UpdatePaymentBody = z.infer<typeof updatePaymentBodySchema>;
export type RemovePaymentBody = z.infer<typeof removePaymentBodySchema>;
