import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { authController } from "./auth.controller";
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from "./auth.request";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerBodySchema),
  asyncHandler(async (req, res) => {
    await authController.register(req, res);
  }),
);

authRouter.post(
  "/login",
  validateBody(loginBodySchema),
  asyncHandler(async (req, res) => {
    await authController.login(req, res);
  }),
);

authRouter.post(
  "/refresh",
  validateBody(refreshBodySchema),
  asyncHandler(async (req, res) => {
    await authController.refresh(req, res);
  }),
);

authRouter.post(
  "/logout",
  validateBody(logoutBodySchema),
  asyncHandler(async (req, res) => {
    await authController.logout(req, res);
  }),
);

authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordBodySchema),
  asyncHandler(async (req, res) => {
    await authController.forgotPassword(req, res);
  }),
);
