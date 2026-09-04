import { z } from "zod";
import {
  crmEmailSchema,
  crmIdParamsSchema,
  crmListQuerySchema,
  crmMobileSchema,
} from "../crm.request";

export const crmUserIdParamsSchema = crmIdParamsSchema;

export const listCrmUsersQuerySchema = crmListQuerySchema.extend({
  search: z.string().trim().min(1).max(120).optional(),
});

export const createCrmUserBodySchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dob: z.iso.date(),
  gender: z.string().trim().min(1).max(20),
  countryCode: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{0,3}$/, "Invalid country code"),
  mobileNo: crmMobileSchema,
  email: crmEmailSchema,
  password: z.string().min(8).max(72),
  roleIds: z.array(z.string().uuid()).min(1),
});

export const updateCrmUserBodySchema = z
  .object({
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    dob: z.iso.date().optional(),
    gender: z.string().trim().min(1).max(20).optional(),
    countryCode: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{0,3}$/, "Invalid country code")
      .optional(),
    mobileNo: crmMobileSchema.optional(),
    email: crmEmailSchema.optional(),
    roleIds: z.array(z.string().uuid()).min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type CrmUserIdParams = z.infer<typeof crmUserIdParamsSchema>;
export type ListCrmUsersQuery = z.infer<typeof listCrmUsersQuerySchema>;
export type CreateCrmUserBody = z.infer<typeof createCrmUserBodySchema>;
export type UpdateCrmUserBody = z.infer<typeof updateCrmUserBodySchema>;
