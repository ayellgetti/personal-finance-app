import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { validateBody } from "../../../middlewares/validate.js";
import { otpController } from "./otp.controller.js";
import {
  generateOtpBodySchema,
  resendOtpBodySchema,
  verifyOtpBodySchema,
} from "./otp.request.js";

export const otpRouter = Router();

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
