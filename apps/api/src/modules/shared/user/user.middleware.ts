import type { RequestHandler } from "express";
import { HttpError } from "../../../utils/http-error.util";

/**
 * User-module middleware. Keep rules that only apply to this module here.
 * Shared auth checks stay in src/middlewares and are attached from the route file.
 */
export const requireSelf: RequestHandler = (req, _res, next) => {
  const requestedId = req.params.id;
  if (!req.user) {
    next(new HttpError(401, "Unauthenticated"));
    return;
  }

  if (typeof requestedId !== "string" || requestedId !== req.user.id) {
    next(new HttpError(403, "You can only access your own user record"));
    return;
  }

  next();
};
