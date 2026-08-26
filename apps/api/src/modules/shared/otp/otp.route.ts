import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { otpController } from "./otp.controller";
import {
  generateOtpBodySchema,
  resendOtpBodySchema,
  verifyOtpBodySchema,
} from "./otp.request";

export const otpRouter = Router();

otpRouter.get(
  "/stats",
  requireAuth,
  asyncHandler(async (req, res) => {
    await otpController.stats(req, res);
  }),
);

otpRouter.post(
  "/generate",
  validateBody(generateOtpBodySchema),
  asyncHandler(async (req, res) => {
    await otpController.generate(req, res);
  }),
);

otpRouter.post(
  "/resend",
  validateBody(resendOtpBodySchema),
  asyncHandler(async (req, res) => {
    await otpController.resend(req, res);
  }),
);

otpRouter.post(
  "/verify",
  validateBody(verifyOtpBodySchema),
  asyncHandler(async (req, res) => {
    await otpController.verify(req, res);
  }),
);
