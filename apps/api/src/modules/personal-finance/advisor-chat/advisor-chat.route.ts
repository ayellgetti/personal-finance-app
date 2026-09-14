import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { advisorChatController } from "./advisor-chat.controller";
import { advisorChatBodySchema } from "./advisor-chat.request";

export const advisorChatRouter = Router();

advisorChatRouter.use(requireAuth);

advisorChatRouter.post(
  "/chat",
  validateBody(advisorChatBodySchema),
  asyncHandler(async (req, res) => {
    await advisorChatController.chat(req, res);
  }),
);
