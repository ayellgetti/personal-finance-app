import { z } from "zod";

const boundedText = (max: number) => z.string().trim().min(1).max(max);

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
        priority: z.number().int().min(1).max(20),
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
        monthlyAmount: z.number().nonnegative().nullable(),
      }),
    )
    .min(1)
    .max(12),
  immediateActions: z
    .array(
      z.object({
        priority: z.number().int().min(1).max(20),
        action: boundedText(240),
        rationale: boundedText(700),
        monthlyAmount: z.number().nonnegative().nullable(),
      }),
    )
    .min(1)
    .max(12),
  debtStrategy: z.object({
    summary: boundedText(1000),
    steps: z
      .array(
        z.object({
          order: z.number().int().min(1).max(20),
          loan: boundedText(160),
          action: boundedText(500),
          reason: boundedText(700),
        }),
      )
      .min(1)
      .max(12),
    expectedDebtFreeMonth: z.number().int().nonnegative(),
  }),
  investmentStrategy: z.object({
    status: z.enum(["continue", "pause", "resume", "review"]),
    resumeTrigger: boundedText(500),
    monthlyAmountWhenResumed: z.number().nonnegative().nullable(),
    rationale: boundedText(900),
  }),
  emiTweaks: z
    .array(
      z.object({
        loan: boundedText(160),
        change: boundedText(500),
        monthlyExtra: z.number().nonnegative(),
        estimatedMonthsSaved: z.number().int().nonnegative().nullable(),
        estimatedInterestSaved: z.number().nonnegative().nullable(),
        caveat: boundedText(500),
      }),
    )
    .max(12),
  assumptions: z.array(boundedText(500)).min(1).max(12),
  disclaimer: boundedText(1200),
});

export type AdvisorReport = z.infer<typeof advisorReportSchema>;
