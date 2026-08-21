import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import multer, { type Multer, type StorageEngine } from "multer";
import { setting } from "../config/setting";

export interface UploadStorageProvider {
  readonly storage: StorageEngine;
}

export class DiskUploadStorageProvider implements UploadStorageProvider {
  readonly storage: StorageEngine;

  constructor(directory = setting.upload.directory) {
    const uploadDirectory = path.resolve(directory);
    mkdirSync(uploadDirectory, { recursive: true });

    this.storage = multer.diskStorage({
      destination: uploadDirectory,
      filename: (_req, file, callback) => {
        callback(null, `${randomUUID()}${this.safeExtension(file.originalname)}`);
      },
    });
  }

  private safeExtension(filename: string): string {
    const extension = path.extname(filename).toLowerCase();
    return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
  }
}

export function createUpload(
  provider: UploadStorageProvider = new DiskUploadStorageProvider(),
): Multer {
  return multer({
    storage: provider.storage,
    limits: {
      fileSize: setting.upload.maxFileSizeBytes,
    },
  });
}

export const upload = createUpload();
