import { z } from "zod";
import { crmIdParamsSchema, crmListQuerySchema, crmRemoveBodySchema } from "../crm.request";

export const CRM_INVOICE_STATUSES = ["draft", "issued", "paid", "cancelled"] as const;
export const crmInvoiceStatusSchema = z.enum(CRM_INVOICE_STATUSES);

export const invoiceIdParamsSchema = crmIdParamsSchema;
export const removeInvoiceBodySchema = crmRemoveBodySchema;

export const listInvoicesQuerySchema = crmListQuerySchema.extend({
  status: crmInvoiceStatusSchema.optional(),
  contactId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

const invoiceLineSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.number().finite().positive().max(1_000_000),
  unitPrice: z.number().finite().min(0).max(1_000_000_000),
});

const invoiceBodyBaseSchema = z.object({
  contactId: z.string().uuid(),
  status: crmInvoiceStatusSchema.optional(),
  issuedAt: z.coerce.date().optional(),
  dueAt: z.coerce.date().nullable().optional(),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3,8}$/, "Invalid currency")
    .optional(),
  notes: z.string().trim().max(4000).nullable().optional(),
  taxPercent: z.number().finite().min(0).max(100).optional(),
  lines: z.array(invoiceLineSchema).min(1).max(40),
});

export const createInvoiceBodySchema = invoiceBodyBaseSchema;

export const updateInvoiceBodySchema = invoiceBodyBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  })
  .refine((value) => value.lines === undefined || value.lines.length > 0, {
    message: "At least one line is required",
    path: ["lines"],
  });

export type InvoiceIdParams = z.infer<typeof invoiceIdParamsSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;
export type CreateInvoiceBody = z.infer<typeof createInvoiceBodySchema>;
export type UpdateInvoiceBody = z.infer<typeof updateInvoiceBodySchema>;
export type RemoveInvoiceBody = z.infer<typeof removeInvoiceBodySchema>;
