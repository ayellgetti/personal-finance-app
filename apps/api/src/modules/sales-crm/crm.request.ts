import { z } from "zod";

export const crmIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const crmListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const crmRemoveBodySchema = z.object({
  id: z.string().uuid(),
});

export const crmMobileSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, "Invalid mobile number");

export const crmEmailSchema = z.string().trim().email().max(254);

export const CRM_CONTACT_TYPES = ["lead", "client", "vendor", "employee"] as const;
export const CRM_ENQUIRY_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "discussion",
  "quotation_sent",
  "negotiation",
  "schedule_meeting",
  "closed",
] as const;
export const OPEN_ENQUIRY_STATUSES = CRM_ENQUIRY_STATUSES.filter(
  (status) => status !== "closed",
);
export const CRM_CLIENT_STATUSES = ["active", "inactive"] as const;
export const CRM_PAYMENT_TYPES = ["INCOME", "EXPENSE"] as const;
export const CRM_PAYMENT_MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE"] as const;
export const CRM_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const CRM_TASK_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;

export const crmContactTypeSchema = z.enum(CRM_CONTACT_TYPES);
export const crmEnquiryStatusSchema = z.enum(CRM_ENQUIRY_STATUSES);
export const crmClientStatusSchema = z.enum(CRM_CLIENT_STATUSES);
export const crmPaymentTypeSchema = z.enum(CRM_PAYMENT_TYPES);
export const crmPaymentModeSchema = z.enum(CRM_PAYMENT_MODES);
export const crmPaymentStatusSchema = z.enum(CRM_PAYMENT_STATUSES);
export const crmTaskStatusSchema = z.enum(CRM_TASK_STATUSES);

export type CrmIdParams = z.infer<typeof crmIdParamsSchema>;
export type CrmListQuery = z.infer<typeof crmListQuerySchema>;
export type CrmRemoveBody = z.infer<typeof crmRemoveBodySchema>;
