import { api, apiForm, ApiError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth/store";

function requireAuth() {
  if (!getAccessToken()) {
    throw new Error("Not signed in");
  }
}

export type StatementSourceType = "bank" | "phone";

export type StatementCategory =
  | "salary"
  | "transfer"
  | "upi"
  | "food"
  | "groceries"
  | "fuel"
  | "shopping"
  | "rent"
  | "utilities"
  | "entertainment"
  | "travel"
  | "insurance"
  | "investment"
  | "emi"
  | "cash_atm"
  | "fees"
  | "income"
  | "other";

export type StatementSummary = {
  creditTotal: number;
  debitTotal: number;
  net: number;
  byCategory: Array<{ category: StatementCategory; credit: number; debit: number; net: number }>;
  periodFrom: string | null;
  periodTo: string | null;
};

export type StatementImport = {
  id: string;
  sourceType: StatementSourceType;
  fileName: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  currency: string;
  status: string;
  summary: StatementSummary;
  lineCount: number;
  createdAt: string;
};

export type StatementLine = {
  id: string;
  importId: string;
  postedOn: string | null;
  description: string;
  amount: number;
  direction: "credit" | "debit";
  category: StatementCategory;
  merchant: string | null;
};

export const STATEMENT_CATEGORY_LABELS: Record<StatementCategory, string> = {
  salary: "Salary",
  transfer: "Transfer",
  upi: "UPI",
  food: "Food",
  groceries: "Groceries",
  fuel: "Fuel",
  shopping: "Shopping",
  rent: "Rent",
  utilities: "Utilities",
  entertainment: "Entertainment",
  travel: "Travel",
  insurance: "Insurance",
  investment: "Investment",
  emi: "EMI",
  cash_atm: "Cash / ATM",
  fees: "Fees",
  income: "Other income",
  other: "Other",
};

export async function listStatementImports(): Promise<StatementImport[]> {
  requireAuth();
  const result = await api<{ items: StatementImport[] }>("/api/statements?limit=50");
  return result.items;
}

export async function getStatementImport(id: string): Promise<StatementImport> {
  requireAuth();
  const result = await api<{ statement: StatementImport }>(`/api/statements/${id}`);
  return result.statement;
}

export async function listStatementLines(id: string): Promise<StatementLine[]> {
  requireAuth();
  const result = await api<{ items: StatementLine[] }>(`/api/statements/${id}/lines?limit=100`);
  return result.items;
}

export async function analyzeStatementText(
  sourceType: StatementSourceType,
  text: string,
  fileName?: string,
): Promise<StatementImport> {
  requireAuth();
  const result = await api<{ statement: StatementImport }>("/api/statements", {
    method: "POST",
    body: { sourceType, text, fileName },
  });
  return result.statement;
}

export async function analyzeStatementFile(
  sourceType: StatementSourceType,
  file: File,
  password?: string,
): Promise<StatementImport> {
  requireAuth();
  const form = new FormData();
  form.set("sourceType", sourceType);
  form.set("file", file);
  form.set("fileName", file.name);
  if (password) {
    form.set("password", password);
  }
  const result = await apiForm<{ statement: StatementImport }>("/api/statements/upload", form);
  return result.statement;
}

export async function updateStatementLineCategory(
  importId: string,
  lineId: string,
  category: StatementCategory,
): Promise<StatementLine> {
  requireAuth();
  const result = await api<{ line: StatementLine }>(`/api/statements/${importId}/lines/${lineId}`, {
    method: "PATCH",
    body: { category },
  });
  return result.line;
}

export async function removeStatementImport(id: string): Promise<void> {
  requireAuth();
  await api("/api/statements/remove", { method: "POST", body: { id } });
}

export function statementApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
}
