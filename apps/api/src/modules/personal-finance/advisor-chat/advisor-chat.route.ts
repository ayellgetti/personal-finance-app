import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { advisorChatController } from "./advisor-chat.controller";
import {
  advisorChatBodySchema,
  advisorChatIdParamsSchema,
  listAdvisorChatsQuerySchema,
  removeAdvisorChatBodySchema,
} from "./advisor-chat.request";

export const advisorChatRouter = Router();

advisorChatRouter.use(requireAuth);

advisorChatRouter.get(
  "/chats",
  validate({ query: listAdvisorChatsQuerySchema }),
  asyncHandler(async (req, res) => {
    await advisorChatController.list(req, res);
  }),
);

advisorChatRouter.get(
  "/chats/:id",
  validate({ params: advisorChatIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await advisorChatController.getById(req, res);
  }),
);

advisorChatRouter.post(
  "/chats/remove",
  validateBody(removeAdvisorChatBodySchema),
  asyncHandler(async (req, res) => {
    await advisorChatController.remove(req, res);
  }),
);

advisorChatRouter.post(
  "/chat",
  validateBody(advisorChatBodySchema),
  asyncHandler(async (req, res) => {
    await advisorChatController.chat(req, res);
  }),
);
