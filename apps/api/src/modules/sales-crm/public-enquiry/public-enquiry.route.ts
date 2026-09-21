import { Router } from "express";
import { asyncHandler } from "../../../middlewares/async-handler.middleware";
import { validateBody } from "../../../middlewares/request-validate.middleware";
import { publicEnquiryController } from "./public-enquiry.controller";
import { createPublicEnquiryBodySchema } from "./public-enquiry.request";

export const publicEnquiryRouter = Router();

publicEnquiryRouter.post(
  "/enquiries",
  validateBody(createPublicEnquiryBodySchema),
  asyncHandler(async (req, res) => {
    await publicEnquiryController.create(req, res);
  }),
);
