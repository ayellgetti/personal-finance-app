import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.js";
import { requireAuth } from "../../../middlewares/require-auth.js";
import { validate, validateBody } from "../../../middlewares/validate.js";
import { loanController } from "./loan.controller.js";
import {
  createLoanBodySchema,
  listLoansQuerySchema,
  loanIdParamsSchema,
  removeLoanBodySchema,
  updateLoanBodySchema,
} from "./loan.request.js";

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
