import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../lib/http-error.js";

type RequestSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    for (const key of ["body", "query", "params"] as const) {
      const schema = schemas[key];
      if (!schema) {
        continue;
      }

      const parsed = schema.safeParse(req[key]);
      if (!parsed.success) {
        next(new HttpError(422, "Validation failed", parsed.error.flatten()));
        return;
      }

      if (key === "body") {
        req.body = parsed.data;
      } else {
        Object.assign(req[key], parsed.data);
      }
    }

    next();
  };
}

export function validateBody(schema: ZodType): RequestHandler {
  return validate({ body: schema });
}
