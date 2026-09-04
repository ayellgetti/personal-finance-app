import type { Request } from "express";
import { HttpError } from "../../utils/http-error.util";

export function currentUserId(req: Request): string {
  if (!req.user) {
    throw new HttpError(401, "Unauthenticated");
  }
  return req.user.id;
}

export function requireParamId(req: Request, entity: string): string {
  const id = req.params.id;
  if (typeof id !== "string") {
    throw new HttpError(400, `${entity} id is required`);
  }
  return id;
}
