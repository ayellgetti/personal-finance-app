import { z } from "zod";

export const MAX_ACTIVE_PLAN_SHARES = 5;
export const PLAN_SHARE_EXPIRY_DAYS = [7, 30, 90] as const;
/** base64url of 32 random bytes. */
export const PLAN_SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const money = z.number().finite().min(-1_000_000_000_000).max(1_000_000_000_000);
const text = (max: number) => z.string().trim().min(1).max(max);

/**
 * What a viewer sees. Deliberately limited to totals, scores and plan items:
 * no name, email, date of birth, employer, or individual loan, account or policy details.
 * `.strict()` rejects any extra key a client tries to add.
 */
export const planSnapshotSchema = z
  .object({
    generatedAt: z.string().datetime(),
    currency: text(8),
    netWorth: money,
    assets: money,
    liabilities: money,
    monthlyIncome: money,
    monthlyBills: money,
    savingsRate: money,
    healthScore: z
      .object({
        total: z.number().int().min(0).max(100),
        components: z
          .array(
            z
              .object({ label: text(60), score: z.number().int().min(0).max(100), answered: z.boolean() })
              .strict(),
          )
          .max(8),
      })
      .strict(),
    emergency: z.object({ months: money, targetMonths: money }).strict(),
    freedom: z
      .object({ mode: text(20), target: money, projectedCorpus: money, targetYear: z.number().int().min(1900).max(2300) })
      .strict()
      .nullable(),
    goals: z
      .array(
        z
          .object({ name: text(80), type: text(40), targetAmount: money, currentSaved: money, status: text(20) })
          .strict(),
      )
      .max(20),
    nextSteps: z.array(z.object({ title: text(120), detail: text(400) }).strict()).max(5),
    cover: z
      .object({ termCurrent: money, termRecommended: money, healthCurrent: money, healthRecommended: money })
      .strict(),
  })
  .strict();

export const createPlanShareBodySchema = z.object({
  label: text(60),
  expiresInDays: z.union([z.literal(7), z.literal(30), z.literal(90)]),
  snapshot: planSnapshotSchema,
});

export const removePlanShareBodySchema = z.object({ id: z.string().uuid() });

export const sharedPlanParamsSchema = z.object({
  token: z.string().regex(PLAN_SHARE_TOKEN_PATTERN, "Invalid link"),
});

export type PlanSnapshotBody = z.infer<typeof planSnapshotSchema>;
export type CreatePlanShareBody = z.infer<typeof createPlanShareBodySchema>;
export type RemovePlanShareBody = z.infer<typeof removePlanShareBodySchema>;
