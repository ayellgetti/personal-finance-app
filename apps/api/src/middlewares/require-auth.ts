import type { RequestHandler } from "express";
import { HttpError } from "../lib/http-error.js";
import { jwtUtil } from "../utils/jwt.util.js";

/**
 * Shared middleware. Do not mount it globally.
 * Attach it in a module route file (or on specific routes) when that
 * module needs an authenticated user.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
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
