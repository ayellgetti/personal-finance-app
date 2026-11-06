import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { checkInController } from "./check-in.controller";
import { listCheckInsQuerySchema, upsertCheckInBodySchema } from "./check-in.request";

export const checkInRouter = Router();

checkInRouter.use(requireAuth);

checkInRouter.get(
  "/",
  validate({ query: listCheckInsQuerySchema }),
  asyncHandler(async (req, res) => {
    await checkInController.list(req, res);
  }),
);

checkInRouter.put(
  "/",
  validateBody(upsertCheckInBodySchema),
  asyncHandler(async (req, res) => {
    await checkInController.upsert(req, res);
  }),
);
