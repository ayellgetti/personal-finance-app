import { extractTextItems, getDocumentProxy, type StructuredTextItem } from "unpdf";
import { read as readWorkbook, utils as sheetUtils } from "xlsx";
import { HttpError } from "../../../utils/http-error.util";

export type StatementFileKind = "pdf" | "spreadsheet" | "text";

export type StatementUpload = {
  buffer: Buffer;
  /** Only used to disambiguate zip containers; content is detected from magic bytes. */
  fileName: string;
  password?: string | undefined;
};

const MAX_PDF_PAGES = 200;
/** Text items whose baselines are within this many PDF units belong to the same visual row. */
const ROW_TOLERANCE = 2.5;

const PDF_MAGIC = "%PDF-";
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04];
const OLE_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const IMAGE_MAGICS = [
  [0x89, 0x50, 0x4e, 0x47], // PNG
  [0xff, 0xd8, 0xff], // JPEG
  [0x47, 0x49, 0x46, 0x38], // GIF
  [0x42, 0x4d], // BMP
];

const SPREADSHEET_EXTENSIONS = /\.(xlsx|xlsm|xlsb|xls|ods)$/i;

const HEADER_DATE = /\b(date|dt)\b/;
const HEADER_DESCRIPTION = /(narration|description|particular|details|remark|transaction|txn|payee|reference)/;
const HEADER_MONEY = /(withdraw|deposit|debit|credit|amount|amt|balance)/;

function startsWith(buffer: Buffer, magic: number[]): boolean {
  return magic.every((byte, index) => buffer[index] === byte);
}

/** Rejects binary payloads that would otherwise decode into garbage "text". */
function looksLikeText(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, 8192);
  if (sample.includes(0x00)) {
    return false;
  }
  let control = 0;
  for (const byte of sample) {
    const isAllowedWhitespace = byte === 0x09 || byte === 0x0a || byte === 0x0d;
    if (!isAllowedWhitespace && (byte < 0x20 || byte === 0x7f)) {
      control += 1;
    }
  }
  return control / Math.max(sample.length, 1) < 0.05;
}

export function detectStatementFileKind(buffer: Buffer, fileName: string): StatementFileKind | null {
  if (buffer.subarray(0, 1024).toString("latin1").includes(PDF_MAGIC)) {
    return "pdf";
  }
  if (startsWith(buffer, OLE_MAGIC)) {
    return "spreadsheet";
  }
  if (startsWith(buffer, ZIP_MAGIC)) {
    return SPREADSHEET_EXTENSIONS.test(fileName) ? "spreadsheet" : null;
  }
  if (IMAGE_MAGICS.some((magic) => startsWith(buffer, magic))) {
    return null;
  }
  return looksLikeText(buffer) ? "text" : null;
}

function decodeText(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.subarray(2).toString("utf16le");
  }
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    return Buffer.from(buffer.subarray(2)).swap16().toString("utf16le");
  }
  return buffer.toString("utf8").replace(/^\uFEFF/, "");
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "";
}

function errorCode(error: unknown): number | null {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    return typeof code === "number" ? code : null;
  }
  return null;
}

function pdfFailure(error: unknown): HttpError {
  if (errorName(error) === "PasswordException") {
    // pdf.js PasswordExceptionCode: 1 = NEED_PASSWORD, 2 = INCORRECT_PASSWORD.
    return errorCode(error) === 2
      ? new HttpError(422, "The statement password is incorrect")
      : new HttpError(422, "This PDF is password protected. Re-upload it with the statement password.");
  }
  if (errorName(error) === "InvalidPDFException") {
    return new HttpError(422, "The uploaded PDF is damaged or not a valid PDF");
  }
  return new HttpError(422, "Could not read the uploaded PDF");
}

type LayoutCell = { text: string; start: number; end: number };

function mergeRowCells(items: StructuredTextItem[]): LayoutCell[] {
  const cells: LayoutCell[] = [];
  for (const item of [...items].sort((a, b) => a.x - b.x)) {
    const text = item.str.replace(/\s+/g, " ").trim();
    if (!text) {
      continue;
    }
    const start = item.x;
    const end = item.x + Math.max(item.width, 0);
    const previous = cells[cells.length - 1];
    const gapLimit = Math.max(item.fontSize * 0.6, 2);
    if (previous && start - previous.end <= gapLimit) {
      previous.text = `${previous.text} ${text}`;
      previous.end = Math.max(previous.end, end);
      continue;
    }
    cells.push({ text, start, end });
  }
  return cells;
}

function toLayoutRows(items: StructuredTextItem[]): LayoutCell[][] {
  const usable = items.filter((item) => item.str.trim().length > 0);
  if (usable.length === 0) {
    return [];
  }
  const sorted = [...usable].sort((a, b) => b.y - a.y || a.x - b.x);
  const grouped: StructuredTextItem[][] = [];
  let current: StructuredTextItem[] = [];
  let currentY = 0;

  for (const item of sorted) {
    if (current.length === 0) {
      current = [item];
      currentY = item.y;
      continue;
    }
    if (Math.abs(item.y - currentY) <= ROW_TOLERANCE) {
      current.push(item);
      continue;
    }
    grouped.push(current);
    current = [item];
    currentY = item.y;
  }
  if (current.length > 0) {
    grouped.push(current);
  }

  return grouped.map(mergeRowCells).filter((row) => row.length > 0);
}

function isHeaderRow(cells: LayoutCell[]): boolean {
  if (cells.length < 3) {
    return false;
  }
  const text = cells.map((cell) => cell.text.toLowerCase()).join(" ");
  return HEADER_DATE.test(text) && HEADER_DESCRIPTION.test(text) && HEADER_MONEY.test(text);
}

function columnIndexFor(cell: LayoutCell, columns: LayoutCell[]): number {
  let bestIndex = -1;
  let bestScore = Number.NEGATIVE_INFINITY;
  const cellCenter = (cell.start + cell.end) / 2;

  columns.forEach((column, index) => {
    const overlap = Math.min(cell.end, column.end) - Math.max(cell.start, column.start);
    const distance = Math.abs(cellCenter - (column.start + column.end) / 2);
    const score = overlap > 0 ? overlap * 1000 - distance : -distance;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function sanitizeCell(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").trim();
}

/**
 * Rebuilds a tab-separated table from the PDF text layer so that empty
 * withdrawal/deposit cells survive: the parser needs them to tell debits from
 * credits, and a plain text dump collapses them away.
 */
function layoutRowsToTsv(rows: LayoutCell[][]): string | null {
  const headerIndex = rows.findIndex(isHeaderRow);
  if (headerIndex < 0) {
    return null;
  }

  const columns = rows[headerIndex];
  if (!columns) {
    return null;
  }
  const headers = columns.map((column) => sanitizeCell(column.text));
  const descriptionColumn = headers.findIndex((header) => HEADER_DESCRIPTION.test(header.toLowerCase()));
  const dateColumn = headers.findIndex((header) => HEADER_DATE.test(header.toLowerCase()));

  const body: string[][] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    if (isHeaderRow(row)) {
      continue;
    }
    const cells = new Array<string>(columns.length).fill("");
    for (const cell of row) {
      const index = columnIndexFor(cell, columns);
      if (index < 0) {
        continue;
      }
      const existing = cells[index] ?? "";
      cells[index] = existing ? `${existing} ${cell.text}` : cell.text;
    }

    const populated = cells.filter((cell) => cell.trim().length > 0).length;
    if (populated === 0) {
      continue;
    }

    const previous = body[body.length - 1];
    const wrapsPreviousDescription =
      populated === 1 &&
      descriptionColumn >= 0 &&
      (cells[descriptionColumn] ?? "").trim().length > 0 &&
      (dateColumn < 0 || (cells[dateColumn] ?? "").trim().length === 0);

    if (wrapsPreviousDescription && previous) {
      previous[descriptionColumn] = `${previous[descriptionColumn] ?? ""} ${cells[descriptionColumn]}`.trim();
      continue;
    }

    body.push(cells);
  }

  if (body.length === 0) {
    return null;
  }

  return [headers, ...body].map((cells) => cells.map(sanitizeCell).join("\t")).join("\n");
}

function layoutRowsToPlainText(rows: LayoutCell[][]): string {
  return rows.map((row) => row.map((cell) => sanitizeCell(cell.text)).join(" ")).join("\n");
}

export async function extractPdfText(buffer: Buffer, password?: string): Promise<string> {
  let items: StructuredTextItem[][];
  try {
    const document = await getDocumentProxy(new Uint8Array(buffer), password ? { password } : {});
    if (document.numPages > MAX_PDF_PAGES) {
      throw new HttpError(422, `This PDF has ${document.numPages} pages; the limit is ${MAX_PDF_PAGES}`);
    }
    items = (await extractTextItems(document)).items;
  } catch (error) {
    throw error instanceof HttpError ? error : pdfFailure(error);
  }

  const rows = items.flatMap(toLayoutRows);
  if (rows.length === 0) {
    throw new HttpError(
      422,
      "This PDF has no selectable text, so it is likely a scan. Upload the CSV or Excel statement instead.",
    );
  }

  return layoutRowsToTsv(rows) ?? layoutRowsToPlainText(rows);
}

export function extractSpreadsheetText(buffer: Buffer, password?: string): string {
  let sheetNames: string[];
  let sheets: string[];
  try {
    const workbook = readWorkbook(buffer, {
      type: "buffer",
      raw: false,
      cellDates: true,
      dateNF: "yyyy-mm-dd",
      ...(password ? { password } : {}),
    });
    sheetNames = workbook.SheetNames;
    sheets = sheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      return sheet ? sheetUtils.sheet_to_csv(sheet, { FS: "\t", blankrows: false, dateNF: "yyyy-mm-dd" }) : "";
    });
  } catch (error) {
    if (/password/i.test(error instanceof Error ? error.message : "")) {
      throw new HttpError(422, "This spreadsheet is password protected. Re-upload it with the statement password.");
    }
    throw new HttpError(422, "Could not read the uploaded spreadsheet");
  }

  // Bank exports often carry extra summary tabs; the transaction tab is the longest one.
  const best = sheets.reduce((longest, sheet) => (sheet.length > longest.length ? sheet : longest), "");
  if (!best.trim()) {
    throw new HttpError(422, "The uploaded spreadsheet is empty");
  }
  return best;
}

export async function extractStatementText(file: StatementUpload): Promise<string> {
  const kind = detectStatementFileKind(file.buffer, file.fileName);

  if (kind === "pdf") {
    return extractPdfText(file.buffer, file.password);
  }
  if (kind === "spreadsheet") {
    return extractSpreadsheetText(file.buffer, file.password);
  }
  if (kind === "text") {
    return decodeText(file.buffer);
  }

  throw new HttpError(422, "Upload a PDF, CSV, Excel or text statement");
}
