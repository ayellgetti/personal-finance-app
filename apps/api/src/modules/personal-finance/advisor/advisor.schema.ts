import { z } from "zod";

const boundedText = (max: number) => z.string().trim().min(1).max(max);

// The model drops optional numbers as often as it sends null, and a rejected
// report costs a full OpenAI call, so treat a missing value as null.
const amount = z
  .number()
  .nonnegative()
  .nullish()
  .transform((value) => value ?? null);

const wholeAmount = z
  .number()
  .int()
  .nonnegative()
  .nullish()
  .transform((value) => value ?? null);

const rank = z.number().int().min(1).max(20).nullish();

function sequencePriority<T extends { priority?: number | null }>(items: T[]) {
  return items.map((item, index) => ({ ...item, priority: item.priority ?? index + 1 }));
}

function sequenceOrder<T extends { order?: number | null }>(items: T[]) {
  return items.map((item, index) => ({ ...item, order: item.order ?? index + 1 }));
}

export const advisorReportSchema = z.object({
  executiveSummary: boundedText(1200),
  summaryReport: z.object({
    headline: boundedText(160),
    highlights: z
      .array(
        z.object({
          label: boundedText(80),
          detail: boundedText(400),
        }),
      )
      .min(1)
      .max(8),
  }),
  riskWarnings: z
    .array(
      z.object({
        severity: z.enum(["high", "medium", "low"]),
        title: boundedText(160),
        detail: boundedText(700),
      }),
    )
    .max(8),
  planOfAction: z
    .array(
      z.object({
        priority: rank,
        category: z.enum([
          "Emergency Fund",
          "Debt",
          "Expenses",
          "Savings",
          "Investments",
          "Insurance",
          "Safety",
          "Goals",
        ]),
        impact: z.enum(["High", "Medium", "Low"]),
        action: boundedText(240),
        rationale: boundedText(700),
        monthlyAmount: amount,
      }),
    )
    .min(1)
    .max(12)
    .transform(sequencePriority),
  immediateActions: z
    .array(
      z.object({
        priority: rank,
        action: boundedText(240),
        rationale: boundedText(700),
        monthlyAmount: amount,
      }),
    )
    .min(1)
    .max(12)
    .transform(sequencePriority),
  debtStrategy: z.object({
    summary: boundedText(1000),
    steps: z
      .array(
        z.object({
          order: rank,
          loan: boundedText(160),
          action: boundedText(500),
          reason: boundedText(700),
        }),
      )
      .max(12)
      .transform(sequenceOrder),
    expectedDebtFreeMonth: wholeAmount,
  }),
  investmentStrategy: z.object({
    status: z.enum(["continue", "pause", "resume", "review"]),
    resumeTrigger: boundedText(500),
    monthlyAmountWhenResumed: amount,
    rationale: boundedText(900),
  }),
  emiTweaks: z
    .array(
      z.object({
        loan: boundedText(160),
        change: boundedText(500),
        monthlyExtra: amount,
        estimatedMonthsSaved: wholeAmount,
        estimatedInterestSaved: amount,
        caveat: boundedText(500),
      }),
    )
    .max(12),
  assumptions: z.array(boundedText(500)).min(1).max(12),
  disclaimer: boundedText(1200),
});

export type AdvisorReport = z.infer<typeof advisorReportSchema>;
