import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validateBody } from "../../../middlewares/validate.js";
import { userController } from "./user.controller.js";
import { requireSelf } from "./user.middleware.js";
import { changePasswordBodySchema, updateMeBodySchema } from "./user.request.js";

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    await userController.me(req, res);
  }),
);

userRouter.patch(
  "/me",
  validateBody(updateMeBodySchema),
  asyncHandler(async (req, res) => {
    await userController.updateMe(req, res);
  }),
);

userRouter.post(
  "/me/password",
  validateBody(changePasswordBodySchema),
  asyncHandler(async (req, res) => {
    await userController.changePassword(req, res);
  }),
);

userRouter.get(
  "/:id",
  requireSelf,
  asyncHandler(async (req, res) => {
    await userController.getById(req, res);
  }),
);
