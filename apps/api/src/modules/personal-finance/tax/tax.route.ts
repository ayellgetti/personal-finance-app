import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { taxController } from "./tax.controller";
import {
  createTaxScenarioBodySchema,
  listTaxScenariosQuerySchema,
  removeTaxScenarioBodySchema,
  taxIdParamsSchema,
  taxPlanInputSchema,
  updateTaxScenarioBodySchema,
} from "./tax.request";

export const taxRouter = Router();

taxRouter.use(requireAuth);

taxRouter.get("/catalog", (req, res) => {
  taxController.catalog(req, res);
});

taxRouter.post(
  "/preview",
  validateBody(taxPlanInputSchema),
  (req, res) => {
    taxController.preview(req, res);
  },
);

taxRouter.get(
  "/scenarios",
  validate({ query: listTaxScenariosQuerySchema }),
  asyncHandler(async (req, res) => {
    await taxController.list(req, res);
  }),
);

taxRouter.post(
  "/scenarios",
  validateBody(createTaxScenarioBodySchema),
  asyncHandler(async (req, res) => {
    await taxController.create(req, res);
  }),
);

taxRouter.post(
  "/scenarios/remove",
  validateBody(removeTaxScenarioBodySchema),
  asyncHandler(async (req, res) => {
    await taxController.remove(req, res);
  }),
);

taxRouter.get(
  "/scenarios/:id",
  validate({ params: taxIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await taxController.getById(req, res);
  }),
);

taxRouter.patch(
  "/scenarios/:id",
  validate({ params: taxIdParamsSchema, body: updateTaxScenarioBodySchema }),
  asyncHandler(async (req, res) => {
    await taxController.update(req, res);
  }),
);
