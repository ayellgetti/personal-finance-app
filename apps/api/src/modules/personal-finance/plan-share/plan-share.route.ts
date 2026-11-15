import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { planShareController } from "./plan-share.controller";
import {
  createPlanShareBodySchema,
  removePlanShareBodySchema,
  sharedPlanParamsSchema,
} from "./plan-share.request";

/** Owner-side management. Requires sign-in. */
export const planShareRouter = Router();

planShareRouter.use(requireAuth);

planShareRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    await planShareController.list(req, res);
  }),
);

planShareRouter.post(
  "/",
  validateBody(createPlanShareBodySchema),
  asyncHandler(async (req, res) => {
    await planShareController.create(req, res);
  }),
);

planShareRouter.post(
  "/remove",
  validateBody(removePlanShareBodySchema),
  asyncHandler(async (req, res) => {
    await planShareController.revoke(req, res);
  }),
);

/**
 * Public, unauthenticated. The only finance route without requireAuth: possession of an
 * unguessable token is the credential, and it can only read one stored snapshot.
 */
export const sharedPlanRouter = Router();

// Bad or expired tokens are expected traffic here, not failures worth a database row each.
sharedPlanRouter.use((_req, res, next) => {
  res.locals.skipFailureLogFor4xx = true;
  next();
});

sharedPlanRouter.get(
  "/plans/:token",
  validate({ params: sharedPlanParamsSchema }),
  asyncHandler(async (req, res) => {
    await planShareController.view(req, res);
  }),
);
