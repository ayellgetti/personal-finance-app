export const STATEMENT_SOURCE_TYPES = ["bank", "phone"] as const;
export type StatementSourceType = (typeof STATEMENT_SOURCE_TYPES)[number];

export const STATEMENT_CATEGORIES = [
  "salary",
  "transfer",
  "upi",
  "food",
  "groceries",
  "fuel",
  "shopping",
  "rent",
  "utilities",
  "entertainment",
  "travel",
  "insurance",
  "investment",
  "emi",
  "cash_atm",
  "fees",
  "income",
  "other",
] as const;

export type StatementCategory = (typeof STATEMENT_CATEGORIES)[number];

export type ParsedStatementLine = {
  postedOn: Date | null;
  description: string;
  amount: number;
  direction: "credit" | "debit";
  category: StatementCategory;
  merchant: string | null;
};

export type StatementParseResult = {
  lines: ParsedStatementLine[];
  summary: StatementSummary;
};

export type StatementSummary = {
  creditTotal: number;
  debitTotal: number;
  net: number;
  byCategory: Array<{ category: StatementCategory; credit: number; debit: number; net: number }>;
  periodFrom: string | null;
  periodTo: string | null;
};

const MAX_LINES = 5_000;
const HEADER_SEARCH_ROWS = 60;

const CATEGORY_RULES: Array<{ category: StatementCategory; pattern: RegExp }> = [
  { category: "salary", pattern: /\b(salary|payroll|wages|neft.*sal)\b/i },
  { category: "emi", pattern: /\b(emi|loan repayment|autodebit.*loan)\b/i },
  { category: "investment", pattern: /\b(sip|mutual fund|groww|zerodha|nps|ppf|fd booking)\b/i },
  { category: "insurance", pattern: /\b(lic|premium|insurance|policybazaar)\b/i },
  { category: "rent", pattern: /\b(rent|landlord)\b/i },
  { category: "fuel", pattern: /\b(fuel|petrol|diesel|hpcl|bpcl|iocl)\b/i },
  { category: "groceries", pattern: /\b(grocery|groceries|bigbasket|blinkit|zepto|dmart|reliance fresh)\b/i },
  { category: "food", pattern: /\b(swiggy|zomato|eatsure|restaurant|cafe|dominos)\b/i },
  { category: "shopping", pattern: /\b(amazon|flipkart|myntra|ajio|nykaa)\b/i },
  { category: "entertainment", pattern: /\b(netflix|spotify|hotstar|prime video|bookmyshow)\b/i },
  { category: "travel", pattern: /\b(uber|ola|irctc|makemytrip|indigo|air india|flight)\b/i },
  { category: "utilities", pattern: /\b(electricity|bescom|water bill|broadband|airtel|jio|vi recharge)\b/i },
  { category: "cash_atm", pattern: /\b(atm|cash wdl|cash withdrawal)\b/i },
  { category: "fees", pattern: /\b(gst|charge|fee|penalty|interest paid)\b/i },
  { category: "transfer", pattern: /\b(neft|imps|rtgs|self transfer|own account)\b/i },
  { category: "upi", pattern: /\bupi\b/i },
];

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseAmount(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  // Match the numeric token rather than stripping symbols, so currency
  // prefixes such as `Rs.` cannot bleed into the number.
  const match = /\d[\d,]*(?:\.\d+)?/.exec(raw);
  if (!match) {
    return null;
  }
  const value = Number.parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(value) ? Math.abs(value) : null;
}

type AmountCell = { value: number; direction: "credit" | "debit" | null };

/**
 * Reads one money cell. Statements express direction in the cell itself in
 * several ways: a `Cr`/`Dr` suffix, a parenthesised or trailing minus, or
 * nothing at all when separate debit and credit columns carry the sign.
 */
function parseAmountCell(raw: string | undefined): AmountCell | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed || /^[-–—.\s]+$/.test(trimmed)) {
    return null;
  }

  const value = parseAmount(trimmed);
  if (value == null || value === 0) {
    return null;
  }

  let direction: "credit" | "debit" | null = null;
  if (/(^|[\s\d.)])(cr|credit)\.?$/i.test(trimmed) || /^(cr|credit)\b\.?/i.test(trimmed)) {
    direction = "credit";
  } else if (/(^|[\s\d.)])(dr|debit)\.?$/i.test(trimmed) || /^(dr|debit)\b\.?/i.test(trimmed)) {
    direction = "debit";
  }

  const negative =
    /\(\s*[\d.,]+\s*\)/.test(trimmed) || /(^|\s)-\s*[\d.,]/.test(trimmed) || /[\d.,]\s*-\s*$/.test(trimmed);
  if (!direction && negative) {
    direction = "debit";
  }

  return { value, direction };
}

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function fullYear(raw: number): number {
  return raw < 100 ? 2000 + raw : raw;
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) {
    return null;
  }
  // Statements often append a posting time or a `(Value 02/04/2025)` note.
  const trimmed = raw.trim().replace(/[\s,]+\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?$/i, "").trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day));
  }
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(trimmed);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const yearRaw = Number(dmy[3]);
    if (!day || !month || !yearRaw || month > 12 || day > 31) return null;
    return new Date(Date.UTC(fullYear(yearRaw), month - 1, day));
  }
  const named = /^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s,]?\s*(\d{2,4})$/.exec(trimmed);
  if (named) {
    const day = Number(named[1]);
    const monthKey = named[2]?.slice(0, 3).toLowerCase();
    const yearRaw = Number(named[3]);
    const month = monthKey ? MONTHS[monthKey] : undefined;
    if (!day || month == null || !yearRaw) return null;
    return new Date(Date.UTC(fullYear(yearRaw), month, day));
  }
  const monthFirst = /^([A-Za-z]{3,})\.?[-\s](\d{1,2}),?\s*(\d{2,4})$/.exec(trimmed);
  if (monthFirst) {
    const monthKey = monthFirst[1]?.slice(0, 3).toLowerCase();
    const day = Number(monthFirst[2]);
    const yearRaw = Number(monthFirst[3]);
    const month = monthKey ? MONTHS[monthKey] : undefined;
    if (!day || month == null || !yearRaw) return null;
    return new Date(Date.UTC(fullYear(yearRaw), month, day));
  }
  return null;
}

const DELIMITERS = ["\t", ",", ";", "|"] as const;
type Delimiter = (typeof DELIMITERS)[number];

function splitDelimitedLine(line: string, delimiter: Delimiter): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function countOutsideQuotes(line: string, delimiter: Delimiter): number {
  let count = 0;
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }
  return count;
}

/**
 * Picks the delimiter that yields the most consistent column count. Counting
 * raw occurrences would favour commas over tabs on statements whose amounts
 * are grouped (`1,24,550.00`).
 */
function detectDelimiter(rows: string[]): Delimiter {
  let best: Delimiter = ",";
  let bestScore = 0;

  for (const delimiter of DELIMITERS) {
    const frequency = new Map<number, number>();
    for (const row of rows) {
      const count = countOutsideQuotes(row, delimiter);
      if (count > 0) {
        frequency.set(count, (frequency.get(count) ?? 0) + 1);
      }
    }
    for (const [count, rowsAtCount] of frequency) {
      const score = count * rowsAtCount;
      if (score > bestScore) {
        best = delimiter;
        bestScore = score;
      }
    }
  }

  return best;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function headerIndex(headers: string[], candidates: string[], exclude: string[] = []): number {
  return headers.findIndex(
    (header) =>
      candidates.some((candidate) => header.includes(candidate)) &&
      !exclude.some((word) => header.includes(word)),
  );
}

function headerScore(headers: string[]): number {
  const joined = headers.join(" ");
  let score = 0;
  if (/\bdate\b|\bdt\b/.test(joined)) score += 1;
  if (/narration|description|particular|details|remark|transaction|txn|payee/.test(joined)) score += 1;
  if (/withdraw|deposit|debit|credit|amount|amt/.test(joined)) score += 1;
  return score;
}

/**
 * Bank exports frequently start with account/branch preamble rows, so the
 * header is not necessarily the first line.
 */
function findHeaderRowIndex(rows: string[], delimiter: Delimiter): number {
  const limit = Math.min(rows.length, HEADER_SEARCH_ROWS);
  let fallback = -1;
  for (let index = 0; index < limit; index += 1) {
    const row = rows[index];
    if (!row) {
      continue;
    }
    const headers = splitDelimitedLine(row, delimiter).map(normalizeHeader);
    if (headers.filter((header) => header.length > 0).length < 2) {
      continue;
    }
    const score = headerScore(headers);
    if (score >= 3) {
      return index;
    }
    if (score >= 2 && fallback < 0) {
      fallback = index;
    }
  }
  return fallback;
}

/** Carry-forward and total rows repeat the balance and are not transactions. */
const NON_TRANSACTION_ROW =
  /^(opening|closing)\s+balance|^balance\s+(b\/?f|c\/?f|brought|carried)|^(b\/?f|c\/?f)\b|^(sub\s*)?total\b|^grand\s+total\b/i;

function isNonTransactionRow(description: string): boolean {
  return NON_TRANSACTION_ROW.test(description.trim());
}

function categorize(description: string, direction: "credit" | "debit"): StatementCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(description)) {
      return rule.category;
    }
  }
  if (direction === "credit") {
    return "income";
  }
  return "other";
}

function merchantFrom(description: string): string | null {
  const upi = /UPI[-\/]?([A-Za-z0-9 .&]+)/i.exec(description);
  if (upi?.[1]) {
    return upi[1].trim().slice(0, 80);
  }
  const paidTo = /(?:paid to|received from)\s+([^,/]+)/i.exec(description);
  if (paidTo?.[1]) {
    return paidTo[1].trim().slice(0, 80);
  }
  return description.slice(0, 48) || null;
}

function summarize(lines: ParsedStatementLine[]): StatementSummary {
  const buckets = new Map<StatementCategory, { credit: number; debit: number }>();
  let creditTotal = 0;
  let debitTotal = 0;
  let periodFrom: Date | null = null;
  let periodTo: Date | null = null;

  for (const line of lines) {
    if (line.direction === "credit") {
      creditTotal += line.amount;
    } else {
      debitTotal += line.amount;
    }
    const bucket = buckets.get(line.category) ?? { credit: 0, debit: 0 };
    if (line.direction === "credit") {
      bucket.credit += line.amount;
    } else {
      bucket.debit += line.amount;
    }
    buckets.set(line.category, bucket);
    if (line.postedOn) {
      if (!periodFrom || line.postedOn < periodFrom) periodFrom = line.postedOn;
      if (!periodTo || line.postedOn > periodTo) periodTo = line.postedOn;
    }
  }

  const byCategory = [...buckets.entries()]
    .map(([category, totals]) => ({
      category,
      credit: roundMoney(totals.credit),
      debit: roundMoney(totals.debit),
      net: roundMoney(totals.credit - totals.debit),
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  return {
    creditTotal: roundMoney(creditTotal),
    debitTotal: roundMoney(debitTotal),
    net: roundMoney(creditTotal - debitTotal),
    byCategory,
    periodFrom: periodFrom?.toISOString() ?? null,
    periodTo: periodTo?.toISOString() ?? null,
  };
}

function parseDelimited(text: string): ParsedStatementLine[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (rows.length < 2) {
    return [];
  }

  const delimiter = detectDelimiter(rows.slice(0, HEADER_SEARCH_ROWS));
  const headerRowIndex = findHeaderRowIndex(rows, delimiter);
  const headerRow = headerRowIndex >= 0 ? rows[headerRowIndex] : undefined;
  if (!headerRow) {
    return [];
  }

  const headers = splitDelimitedLine(headerRow, delimiter).map(normalizeHeader);
  const dateIdx = headerIndex(headers, ["date", "txn dt", "value dt", "posted"]);
  const descIdx = headerIndex(
    headers,
    ["narration", "description", "particular", "details", "remark", "transaction", "txn", "payee"],
    ["date", "dt", "amount", "amt", "type"],
  );
  const debitIdx = headerIndex(headers, ["withdrawal", "debit", "dr amt", "paid", "money out"], [
    "balance",
    "credit",
  ]);
  const creditIdx = headerIndex(headers, ["deposit", "credit", "cr amt", "received", "money in"], [
    "balance",
    "debit",
  ]);
  const amountIdx = headerIndex(
    headers,
    ["amount", "amt", "value"],
    ["balance", "withdraw", "deposit", "debit", "credit"],
  );
  const typeIdx = headerIndex(headers, ["type", "dr cr", "debit credit", "cr dr"], ["amount", "amt"]);
  const balanceIdx = headerIndex(headers, ["balance"]);

  if (descIdx < 0 && amountIdx < 0 && debitIdx < 0) {
    return [];
  }

  const lines: ParsedStatementLine[] = [];
  let previousBalance: number | null = null;

  for (const row of rows.slice(headerRowIndex + 1)) {
    if (lines.length >= MAX_LINES) {
      break;
    }
    const cells = splitDelimitedLine(row, delimiter);
    const description = (descIdx >= 0 ? cells[descIdx] : cells.join(" ")) ?? "";
    if (!description || isNonTransactionRow(description)) {
      continue;
    }

    const balance = balanceIdx >= 0 ? parseAmount(cells[balanceIdx]) : null;
    let amount: number | null = null;
    let direction: "credit" | "debit" | null = null;

    const debit = debitIdx >= 0 ? parseAmountCell(cells[debitIdx]) : null;
    const credit = creditIdx >= 0 ? parseAmountCell(cells[creditIdx]) : null;
    if (debit) {
      amount = debit.value;
      direction = debit.direction ?? "debit";
    } else if (credit) {
      amount = credit.value;
      direction = credit.direction ?? "credit";
    } else {
      const single = amountIdx >= 0 ? parseAmountCell(cells[amountIdx]) : null;
      amount = single?.value ?? null;
      direction = single?.direction ?? null;

      const typeRaw = (typeIdx >= 0 ? cells[typeIdx] : "")?.toLowerCase() ?? "";
      if (/\b(cr|credit|in|received|deposit)\b/.test(typeRaw)) {
        direction = "credit";
      } else if (/\b(dr|debit|out|paid|withdrawal)\b/.test(typeRaw)) {
        direction = "debit";
      }

      // A running balance disambiguates statements that only carry one amount column.
      if (!direction && amount != null && balance != null && previousBalance != null) {
        direction = balance >= previousBalance ? "credit" : "debit";
      }
    }

    if (balance != null) {
      previousBalance = balance;
    }

    if (amount == null || amount === 0 || !direction) {
      continue;
    }

    lines.push({
      postedOn: dateIdx >= 0 ? parseDate(cells[dateIdx]) : null,
      description,
      amount: roundMoney(amount),
      direction,
      category: categorize(description, direction),
      merchant: merchantFrom(description),
    });
  }

  return lines;
}

const LEADING_DATE =
  /^(\d{4}-\d{2}-\d{2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{1,2}[-\s][A-Za-z]{3,9}[-\s,]?\s*\d{2,4})/;
const TRAILING_AMOUNT = /(?:^|\s)(\(?-?[\d,]+(?:\.\d{1,2})?\)?)\s*(cr|dr)?\.?$/i;

/**
 * Handles statements that arrive as aligned rows rather than a delimited table:
 * a PDF whose header we could not map to columns, or a pasted text dump.
 */
function parseLooseRows(text: string): ParsedStatementLine[] {
  const rows = text
    .split(/\r?\n/)
    .map((row) => row.replace(/\s+/g, " ").trim())
    .filter((row) => row.length > 0);

  const lines: ParsedStatementLine[] = [];
  let previousBalance: number | null = null;

  for (const row of rows) {
    if (lines.length >= MAX_LINES) {
      break;
    }
    const dateMatch = LEADING_DATE.exec(row);
    const postedOn = parseDate(dateMatch?.[1]);
    if (!dateMatch || !postedOn) {
      continue;
    }

    const trailing: AmountCell[] = [];
    let head = row.slice(dateMatch[0].length).trim();
    while (trailing.length < 3) {
      const match = TRAILING_AMOUNT.exec(head);
      if (!match) {
        break;
      }
      const parsed = parseAmountCell(match[0]);
      if (!parsed) {
        break;
      }
      trailing.unshift(parsed);
      head = head.slice(0, match.index).trim();
    }

    if (trailing.length === 0 || head.length < 2) {
      continue;
    }
    if (isNonTransactionRow(head)) {
      // Still useful as the opening balance for the rows that follow.
      previousBalance = trailing[trailing.length - 1]?.value ?? previousBalance;
      continue;
    }

    const balance = trailing.length >= 2 ? (trailing[trailing.length - 1]?.value ?? null) : null;
    const money = trailing.length >= 2 ? trailing[trailing.length - 2] : trailing[0];
    if (!money) {
      continue;
    }

    let direction = money.direction;
    if (!direction && balance != null && previousBalance != null) {
      direction = balance >= previousBalance ? "credit" : "debit";
    }
    if (balance != null) {
      previousBalance = balance;
    }
    if (!direction) {
      direction = /\b(credited|received|deposit|refund)\b/i.test(head) ? "credit" : "debit";
    }

    lines.push({
      postedOn,
      description: head,
      amount: roundMoney(money.value),
      direction,
      category: categorize(head, direction),
      merchant: merchantFrom(head),
    });
  }

  return lines;
}

function parseSmsLines(text: string): ParsedStatementLine[] {
  const lines: ParsedStatementLine[] = [];
  const pattern =
    /(?:(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,}[a-z]*\.?,?\s+\d{4})\s+)?(?:INR|Rs\.?|₹)\s*([\d,]+(?:\.\d{1,2})?)\s+(credited|debited|paid|received)\b/gi;

  for (const match of text.matchAll(pattern)) {
    if (lines.length >= MAX_LINES) {
      break;
    }
    const amount = parseAmount(match[2]);
    const verb = match[3]?.toLowerCase() ?? "";
    if (amount == null || amount === 0) {
      continue;
    }
    const direction: "credit" | "debit" =
      verb === "credited" || verb === "received" ? "credit" : "debit";
    const description = match[0].replace(/\s+/g, " ").trim();
    lines.push({
      postedOn: parseDate(match[1]),
      description,
      amount: roundMoney(amount),
      direction,
      category: categorize(description, direction),
      merchant: merchantFrom(description),
    });
  }

  return lines;
}

export function parseStatementText(text: string): StatementParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      lines: [],
      summary: {
        creditTotal: 0,
        debitTotal: 0,
        net: 0,
        byCategory: [],
        periodFrom: null,
        periodTo: null,
      },
    };
  }

  const delimited = parseDelimited(trimmed);
  const loose = delimited.length > 0 ? delimited : parseLooseRows(trimmed);
  const resolved = loose.length > 0 ? loose : parseSmsLines(trimmed);

  return { lines: resolved, summary: summarize(resolved) };
}
