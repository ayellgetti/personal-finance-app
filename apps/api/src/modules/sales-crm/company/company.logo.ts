import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const MAX_ENV_LOGO_BYTES = 1024 * 1024;

const FILE_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** http(s) URL, image data URL, or an image file inside the API directory. Anything else is ignored. */
export function resolveEnvLogo(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;

  const resolved = path.resolve(API_ROOT, raw);
  const insideRoot = resolved === API_ROOT || resolved.startsWith(API_ROOT + path.sep);
  if (!insideRoot) return "";
  const mime = FILE_TYPES[path.extname(resolved).toLowerCase()];
  if (!mime || !existsSync(resolved)) return "";
  const bytes = readFileSync(resolved);
  if (bytes.length === 0 || bytes.length > MAX_ENV_LOGO_BYTES) return "";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}
