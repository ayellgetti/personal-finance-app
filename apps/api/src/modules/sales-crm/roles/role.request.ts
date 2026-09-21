import { z } from "zod";
import { crmIdParamsSchema } from "../crm.request";

export const roleIdParamsSchema = crmIdParamsSchema;

export const createRoleBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const updateRoleBodySchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    permissionIds: z.array(z.string().uuid()).optional(),
  })
  .refine((value) => value.name !== undefined || value.permissionIds !== undefined, {
    message: "Provide a name or permissionIds",
  });

export type RoleIdParams = z.infer<typeof roleIdParamsSchema>;
export type CreateRoleBody = z.infer<typeof createRoleBodySchema>;
export type UpdateRoleBody = z.infer<typeof updateRoleBodySchema>;
