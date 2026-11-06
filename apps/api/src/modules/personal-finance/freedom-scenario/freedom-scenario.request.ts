import { z } from "zod";

export const FREEDOM_MODES = ["Lean FIRE", "FIRE", "Coast FIRE", "Fat FIRE"] as const;
export const MAX_FREEDOM_SCENARIOS = 3;

const amount = z.number().finite().min(0).max(1_000_000_000_000);
const signedAmount = z.number().finite().min(-1_000_000_000_000).max(1_000_000_000_000);

export const freedomScenarioInputSchema = z.object({
  monthlyExpenses: amount,
  currentAge: z.number().min(0).max(120),
  retirementAge: z.number().min(0).max(120),
  inflationRate: z.number().min(0).max(30),
  coastAge: z.number().min(0).max(120),
  expectedReturn: z.number().min(0).max(40),
});

export const freedomScenarioResultSchema = z.object({
  target: amount,
  targetAge: z.number().min(0).max(150),
  yearsToTarget: z.number().min(0).max(150),
  projectedCorpus: signedAmount,
  shortfall: amount,
  requiredMonthlyInvestment: amount,
  progressPct: z.number().finite().min(0).max(100_000),
});

export const createFreedomScenarioBodySchema = z.object({
  title: z.string().trim().min(1).max(60),
  mode: z.enum(FREEDOM_MODES),
  input: freedomScenarioInputSchema,
  result: freedomScenarioResultSchema,
});

export const removeFreedomScenarioBodySchema = z.object({ id: z.string().uuid() });

export type CreateFreedomScenarioBody = z.infer<typeof createFreedomScenarioBodySchema>;
export type RemoveFreedomScenarioBody = z.infer<typeof removeFreedomScenarioBodySchema>;
