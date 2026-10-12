import { z } from "zod";
import { crmEmailSchema, crmIdParamsSchema, crmListQuerySchema, crmMobileSchema, crmRemoveBodySchema } from "../crm.request";

export const CRM_CHANNELS = ["email", "sms", "in_app"] as const;
export const CRM_MESSAGE_STATUSES = ["scheduled", "sending", "sent", "failed", "cancelled"] as const;

export const crmChannelSchema = z.enum(CRM_CHANNELS);
export const crmMessageStatusSchema = z.enum(CRM_MESSAGE_STATUSES);

const variableKey = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,39}$/, "Invalid variable name");
const variableSchema = z.record(variableKey, z.string().max(500)).refine((value) => Object.keys(value).length <= 20, {
  message: "At most 20 variables",
});

const subjectSchema = z.string().trim().min(1).max(200);
const bodySchema = z.string().trim().min(1).max(8000);
const addressSchema = z.string().trim().min(1).max(254);

export const listTemplatesQuerySchema = crmListQuerySchema.extend({
  channel: crmChannelSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createTemplateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    channel: crmChannelSchema,
    subject: subjectSchema.nullable().optional(),
    body: bodySchema,
  })
  .superRefine((value, context) => {
    if (value.channel === "sms" && value.subject) {
      context.addIssue({ code: "custom", message: "SMS templates do not use a subject", path: ["subject"] });
    }
    if (value.channel !== "sms" && !value.subject) {
      context.addIssue({ code: "custom", message: "A subject is required", path: ["subject"] });
    }
  });

export const updateTemplateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    channel: crmChannelSchema.optional(),
    subject: subjectSchema.nullable().optional(),
    body: bodySchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

export const listMessagesQuerySchema = crmListQuerySchema.extend({
  channel: crmChannelSchema.optional(),
  status: crmMessageStatusSchema.optional(),
  contactId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createMessageBodySchema = z
  .object({
    channel: crmChannelSchema,
    templateId: z.string().uuid().optional(),
    subject: subjectSchema.optional(),
    body: bodySchema.optional(),
    contactId: z.string().uuid().optional(),
    recipientUserId: z.string().uuid().optional(),
    toAddress: addressSchema.optional(),
    variables: variableSchema.optional(),
    scheduledAt: z.coerce.date().optional(),
  })
  .superRefine((value, context) => {
    if (value.templateId && (value.subject || value.body)) {
      context.addIssue({
        code: "custom",
        message: "Use a template or write the message, not both",
        path: ["templateId"],
      });
    }
    if (!value.templateId && !value.body) {
      context.addIssue({ code: "custom", message: "Write a message or choose a template", path: ["body"] });
    }
    if (!value.templateId && value.channel !== "sms" && !value.subject) {
      context.addIssue({ code: "custom", message: "A subject is required", path: ["subject"] });
    }
    if (value.channel === "in_app" && !value.recipientUserId) {
      context.addIssue({
        code: "custom",
        message: "Choose a staff recipient",
        path: ["recipientUserId"],
      });
    }
    if (value.channel === "email" && value.toAddress && !crmEmailSchema.safeParse(value.toAddress).success) {
      context.addIssue({ code: "custom", message: "Invalid email address", path: ["toAddress"] });
    }
    if (value.channel === "sms" && value.toAddress && !crmMobileSchema.safeParse(value.toAddress).success) {
      context.addIssue({ code: "custom", message: "Invalid mobile number", path: ["toAddress"] });
    }
  });

export const updateMessageBodySchema = z
  .object({
    subject: subjectSchema.nullable().optional(),
    body: bodySchema.optional(),
    toAddress: addressSchema.optional(),
    variables: variableSchema.optional(),
    scheduledAt: z.coerce.date().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

export const listNotificationsQuerySchema = crmListQuerySchema.extend({
  unread: z.enum(["0", "1"]).optional(),
});

export const templateIdParamsSchema = crmIdParamsSchema;
export const messageIdParamsSchema = crmIdParamsSchema;
export const removeTemplateBodySchema = crmRemoveBodySchema;
export const removeMessageBodySchema = crmRemoveBodySchema;

export type ListTemplatesQuery = z.infer<typeof listTemplatesQuerySchema>;
export type CreateTemplateBody = z.infer<typeof createTemplateBodySchema>;
export type UpdateTemplateBody = z.infer<typeof updateTemplateBodySchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type CreateMessageBody = z.infer<typeof createMessageBodySchema>;
export type UpdateMessageBody = z.infer<typeof updateMessageBodySchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type RemoveTemplateBody = z.infer<typeof removeTemplateBodySchema>;
export type RemoveMessageBody = z.infer<typeof removeMessageBodySchema>;
