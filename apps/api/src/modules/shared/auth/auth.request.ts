import { z } from "zod";

export const registerBodySchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dob: z.iso.date(),
  gender: z.string().trim().min(1).max(20),
  countryCode: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{0,3}$/, "Invalid country code"),
  mobileNo: z.string().trim().regex(/^\+?[0-9]{7,15}$/, "Invalid mobile number"),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  no: z.coerce.number().int().min(100000).max(999999),
});

export const loginBodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordBodySchema = z.object({
  mobileNo: z.string().trim().regex(/^\+?[0-9]{7,15}$/, "Invalid mobile number"),
  no: z.coerce.number().int().min(100000).max(999999),
  password: z.string().min(8).max(72),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
