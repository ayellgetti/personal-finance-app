import { HttpError } from "../../../utils/http-error.util";
import { CRM_CONTACT_TYPES, crmMobileSchema } from "../crm.request";

type ContactType = (typeof CRM_CONTACT_TYPES)[number];

export type ParsedContactRow = {
  row: number;
  name: string;
  mobile: string;
  type: string;
};

export type ContactImportSkip = {
  row: number;
  mobile: string;
  reason: string;
};

const NAME_HEADERS = new Set(["name", "full name", "contact name"]);
const MOBILE_HEADERS = new Set([
  "mobile",
  "mobile no",
  "mobile no.",
  "mobile number",
  "phone",
  "phone no",
  "phone no.",
  "phone number",
]);
const TYPE_HEADERS = new Set(["type", "contact type"]);

export function normalizeContactType(value: string): ContactType | null {
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if ((CRM_CONTACT_TYPES as readonly string[]).includes(key)) {
    return key as ContactType;
  }
  return null;
}

export function normalizeMobile(value: string): string {
  const trimmed = value.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char ?? "";
  }
  cells.push(current.trim());
  return cells;
}

function headerIndex(cells: string[], names: Set<string>): number {
  return cells.findIndex((cell) => names.has(cell.trim().toLowerCase()));
}

export function parseContactCsv(text: string): { rows: ParsedContactRow[]; skipped: ContactImportSkip[] } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter((entry) => entry.line.length > 0);
  const header = lines[0];
  if (!header) {
    throw new HttpError(422, "CSV must include a header row: name, mobile, type");
  }
  const headers = splitCsvLine(header.line);
  const nameIndex = headerIndex(headers, NAME_HEADERS);
  const mobileIndex = headerIndex(headers, MOBILE_HEADERS);
  const typeIndex = headerIndex(headers, TYPE_HEADERS);
  if (nameIndex < 0 || mobileIndex < 0 || typeIndex < 0) {
    throw new HttpError(422, "CSV header must include name, mobile, and type");
  }

  const rows: ParsedContactRow[] = [];
  const skipped: ContactImportSkip[] = [];
  for (const entry of lines.slice(1)) {
    const cells = splitCsvLine(entry.line);
    const name = cells[nameIndex] ?? "";
    const mobile = cells[mobileIndex] ?? "";
    const type = cells[typeIndex] ?? "";
    if (!name && !mobile && !type) continue;
    rows.push({ row: entry.number, name, mobile, type });
  }
  if (rows.length === 0) {
    throw new HttpError(422, "No contacts to import");
  }
  if (rows.length > 500) {
    throw new HttpError(422, "Import at most 500 contacts at a time");
  }
  return { rows, skipped };
}

export function contactRowIssue(row: ParsedContactRow): string | null {
  if (!row.name.trim()) return "Name is required";
  if (row.name.trim().length > 120) return "Name is too long";
  const mobile = normalizeMobile(row.mobile);
  if (!crmMobileSchema.safeParse(mobile).success) return "Invalid mobile number";
  if (!normalizeContactType(row.type)) return "Type must be lead, client, vendor, or employee";
  return null;
}
