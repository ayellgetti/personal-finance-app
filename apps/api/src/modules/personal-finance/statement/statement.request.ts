import { z } from "zod";
import { STATEMENT_CATEGORIES, STATEMENT_SOURCE_TYPES } from "./statement.parser";

export const statementIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listStatementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sourceType: z.enum(STATEMENT_SOURCE_TYPES).optional(),
});

export const listStatementLinesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const createStatementBodySchema = z.object({
  sourceType: z.enum(STATEMENT_SOURCE_TYPES),
  text: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(2_000_000).optional(),
  ),
  fileName: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(200).optional(),
  ),
  /** Unlocks password-protected PDF or Excel statements. Never stored. */
  password: z.preprocess(
    (value) => (typeof value === "string" && value === "" ? undefined : value),
    z.string().max(128).optional(),
  ),
});

export const removeStatementBodySchema = z.object({
  id: z.string().uuid(),
});

export const updateStatementLineBodySchema = z.object({
  category: z.enum(STATEMENT_CATEGORIES),
});

export type StatementIdParams = z.infer<typeof statementIdParamsSchema>;
export type ListStatementsQuery = z.infer<typeof listStatementsQuerySchema>;
export type ListStatementLinesQuery = z.infer<typeof listStatementLinesQuerySchema>;
export type CreateStatementBody = z.infer<typeof createStatementBodySchema>;
export type RemoveStatementBody = z.infer<typeof removeStatementBodySchema>;
export type UpdateStatementLineBody = z.infer<typeof updateStatementLineBodySchema>;
