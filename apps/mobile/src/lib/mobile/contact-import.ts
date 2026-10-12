export const CONTACT_IMPORT_SAMPLE = `name,mobile,type
Ada Lovelace,9876543210,lead
Grace Hopper,9123456780,client`;

export type ContactImportPreview = {
  row: number;
  name: string;
  mobile: string;
  type: string;
  error: string | null;
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
const TYPES = new Set(["lead", "client", "vendor", "employee"]);

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

function normalizeMobile(value: string): string {
  const trimmed = value.trim();
  const plus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return plus ? `+${digits}` : digits;
}

export function previewContactCsv(text: string): { rows: ContactImportPreview[]; error: string | null } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter((entry) => entry.line.length > 0);
  const header = lines[0];
  if (!header) return { rows: [], error: "Add a header row: name, mobile, type" };
  const headers = splitCsvLine(header.line).map((cell) => cell.toLowerCase());
  const nameIndex = headers.findIndex((cell) => NAME_HEADERS.has(cell));
  const mobileIndex = headers.findIndex((cell) => MOBILE_HEADERS.has(cell));
  const typeIndex = headers.findIndex((cell) => TYPE_HEADERS.has(cell));
  if (nameIndex < 0 || mobileIndex < 0 || typeIndex < 0) {
    return { rows: [], error: "Header must include name, mobile, and type" };
  }
  const rows: ContactImportPreview[] = [];
  for (const entry of lines.slice(1)) {
    const cells = splitCsvLine(entry.line);
    const name = cells[nameIndex] ?? "";
    const mobile = normalizeMobile(cells[mobileIndex] ?? "");
    const type = (cells[typeIndex] ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (!name && !mobile && !type) continue;
    let error: string | null = null;
    if (!name.trim()) error = "Name is required";
    else if (!/^\+?[0-9]{7,15}$/.test(mobile)) error = "Invalid mobile number";
    else if (!TYPES.has(type)) error = "Type must be lead, client, vendor, or employee";
    rows.push({ row: entry.number, name: name.trim(), mobile, type, error });
  }
  if (rows.length === 0) return { rows: [], error: "No contacts to import" };
  if (rows.length > 500) return { rows: rows.slice(0, 500), error: "Only the first 500 rows can be imported" };
  return { rows, error: null };
}
