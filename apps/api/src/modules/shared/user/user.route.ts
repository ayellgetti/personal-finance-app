import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { userController } from "./user.controller";
import { requireSelf } from "./user.middleware";
import { changePasswordBodySchema, updateMeBodySchema } from "./user.request";

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
