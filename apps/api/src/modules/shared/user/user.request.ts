import { z } from "zod";

export const updateMeBodySchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    gender: z.string().trim().min(1).max(20),
    avatar: z.string().trim().max(2048).nullable(),
    avatarBackground: z.string().trim().max(2048).nullable(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type UpdateMeBody = z.infer<typeof updateMeBodySchema>;

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
  })
  .refine((value) => value.currentPassword !== value.newPassword, {
    message: "New password must be different from the current password",
    path: ["newPassword"],
  });

export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
