import { z } from "zod";

const money = z.number().finite().min(-1_000_000_000_000).max(1_000_000_000_000);

export const listCheckInsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(120).optional(),
});

/** Latest month a client can legitimately be in: the current month in the furthest-ahead timezone (UTC+14). */
function latestAllowedMonth(now = new Date()): string {
  const ahead = new Date(now.getTime() + 14 * 60 * 60 * 1000);
  return `${ahead.getUTCFullYear()}-${String(ahead.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const upsertCheckInBodySchema = z
  .object({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM"),
    netWorth: money,
    assets: money.min(0),
    liabilities: money.min(0),
    monthlyIncome: money.min(0),
    monthlyExpense: money.min(0),
    healthScore: z.number().int().min(0).max(100),
  })
  .superRefine((value, ctx) => {
    if (value.month > latestAllowedMonth()) {
      ctx.addIssue({ code: "custom", path: ["month"], message: "Month cannot be in the future" });
    }
    // Net worth is derived; allow a little slack for figures rounded independently.
    if (Math.abs(value.netWorth - (value.assets - value.liabilities)) > 2) {
      ctx.addIssue({ code: "custom", path: ["netWorth"], message: "Net worth must equal assets minus liabilities" });
    }
  });

/**
 * Express 5 re-parses `req.query` on every read, so the validation middleware's coercion is lost
 * and `limit` arrives as a string. Parse it here so the service always gets a number.
 */
export function parseListCheckInsQuery(query: unknown): ListCheckInsQuery {
  return listCheckInsQuerySchema.parse(query ?? {});
}

export type ListCheckInsQuery = z.infer<typeof listCheckInsQuerySchema>;
export type UpsertCheckInBody = z.infer<typeof upsertCheckInBodySchema>;
