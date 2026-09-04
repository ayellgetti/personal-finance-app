import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { meController } from "./me.controller";

export const meRouter = Router();

meRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    await meController.me(req, res);
  }),
);
