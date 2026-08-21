import type { RequestHandler } from "express";
import { HttpError } from "../utils/http-error.util";
import { jwtUtil } from "../utils/jwt.util";

/**
 * Shared middleware. Do not mount it globally.
 * Attach it in a module route file (or on specific routes) when that
 * module needs an authenticated user.
 */
export const jwtAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    next(new HttpError(401, "Missing access token"));
    return;
  }

  try {
    req.user = jwtUtil.verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired access token"));
  }
};

export const requireAuth = jwtAuth;
