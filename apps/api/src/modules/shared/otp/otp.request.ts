import { z } from "zod";

export const OTP_TYPE = {
  REGISTER: "register",
  FORGOT_PASSWORD: "forgot-password",
} as const;

export const otpTypeSchema = z.enum([
  OTP_TYPE.REGISTER,
  OTP_TYPE.FORGOT_PASSWORD,
]);

const otpDestinationSchema = z.object({
  mobileNo: z.string().trim().regex(/^\+?[0-9]{7,15}$/, "Invalid mobile number"),
  email: z.string().trim().email().optional(),
  type: otpTypeSchema,
});

export const generateOtpBodySchema = otpDestinationSchema.superRefine((value, ctx) => {
  if (value.type === OTP_TYPE.REGISTER && !value.email) {
    ctx.addIssue({
      code: "custom",
      path: ["email"],
      message: "Email is required to send a registration OTP",
    });
  }
});

export const resendOtpBodySchema = generateOtpBodySchema;

export const verifyOtpBodySchema = otpDestinationSchema.extend({
  no: z.coerce.number().int().min(100000).max(999999),
});

export type GenerateOtpBody = z.infer<typeof generateOtpBodySchema>;
export type ResendOtpBody = z.infer<typeof resendOtpBodySchema>;
export type VerifyOtpBody = z.infer<typeof verifyOtpBodySchema>;
