import type { RequestHandler } from "express";
import multer from "multer";
import { HttpError } from "../utils/http-error.util";
import { upload } from "../utils/upload.util";

function handleUpload(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    handler(req, res, (error?: unknown) => {
      if (!error) {
        next();
        return;
      }

      if (error instanceof multer.MulterError) {
        next(new HttpError(400, "File upload failed", { code: error.code }));
        return;
      }

      next(error);
    });
  };
}

export function uploadSingle(fieldName: string): RequestHandler {
  return handleUpload(upload.single(fieldName));
}

export function uploadArray(fieldName: string, maxCount?: number): RequestHandler {
  return handleUpload(upload.array(fieldName, maxCount));
}
