import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { requireAuth } from "../../../middlewares/jwt-auth.middleware";
import { validate, validateBody } from "../../../middlewares/request-validate.middleware";
import { loanController } from "./loan.controller";
import {
  createLoanBodySchema,
  listLoansQuerySchema,
  loanIdParamsSchema,
  removeLoanBodySchema,
  updateLoanBodySchema,
} from "./loan.request";

export const loanRouter = Router();

loanRouter.use(requireAuth);

loanRouter.get(
  "/",
  validate({ query: listLoansQuerySchema }),
  asyncHandler(async (req, res) => {
    await loanController.list(req, res);
  }),
);

loanRouter.post(
  "/",
  validateBody(createLoanBodySchema),
  asyncHandler(async (req, res) => {
    await loanController.create(req, res);
  }),
);

loanRouter.post(
  "/remove",
  validateBody(removeLoanBodySchema),
  asyncHandler(async (req, res) => {
    await loanController.remove(req, res);
  }),
);

loanRouter.get(
  "/:id",
  validate({ params: loanIdParamsSchema }),
  asyncHandler(async (req, res) => {
    await loanController.getById(req, res);
  }),
);

loanRouter.patch(
  "/:id",
  validate({ params: loanIdParamsSchema, body: updateLoanBodySchema }),
  asyncHandler(async (req, res) => {
    await loanController.update(req, res);
  }),
);
