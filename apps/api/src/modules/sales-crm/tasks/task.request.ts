import { z } from "zod";
import {
  crmIdParamsSchema,
  crmListQuerySchema,
  crmRemoveBodySchema,
  crmTaskStatusSchema,
} from "../crm.request";

export const taskIdParamsSchema = crmIdParamsSchema;
export const removeTaskBodySchema = crmRemoveBodySchema;

export const listTasksQuerySchema = crmListQuerySchema.extend({
  status: crmTaskStatusSchema.optional(),
  assigneeId: z.string().uuid().optional(),
});

export const createTaskBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  status: crmTaskStatusSchema.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueAt: z.coerce.date().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  enquiryId: z.string().uuid().nullable().optional(),
});

export const updateTaskBodySchema = createTaskBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const updateTaskStatusBodySchema = z.object({
  status: crmTaskStatusSchema,
});

export type TaskIdParams = z.infer<typeof taskIdParamsSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type UpdateTaskStatusBody = z.infer<typeof updateTaskStatusBodySchema>;
export type RemoveTaskBody = z.infer<typeof removeTaskBodySchema>;
