import { z } from "zod";
import { crmIdParamsSchema } from "../crm.request";

export const roleIdParamsSchema = crmIdParamsSchema;

export const updateRoleBodySchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export type RoleIdParams = z.infer<typeof roleIdParamsSchema>;
export type UpdateRoleBody = z.infer<typeof updateRoleBodySchema>;
