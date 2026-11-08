import type { FreedomMode } from "@/types/finance";
import type { FreedomInputs, FreedomModeView } from "./calculations";

export const MAX_FREEDOM_SCENARIOS = 3;

export interface FreedomScenarioResult {
  target: number;
  targetAge: number;
  yearsToTarget: number;
  projectedCorpus: number;
  shortfall: number;
  requiredMonthlyInvestment: number;
  progressPct: number;
}

export interface FreedomScenarioInput {
  title: string;
  mode: FreedomMode;
  input: FreedomInputs;
  result: FreedomScenarioResult;
}

export interface FreedomScenario extends FreedomScenarioInput {
  id: string;
}

/** What gets saved: the editable inputs and the numbers they produced. */
export function toScenarioInput(
  title: string,
  mode: FreedomMode,
  input: FreedomInputs,
  view: FreedomModeView,
): FreedomScenarioInput {
  return {
    title: title.trim(),
    mode,
    input,
    result: {
      target: Math.round(view.target),
      targetAge: view.targetAge,
      yearsToTarget: view.yearsToTarget,
      projectedCorpus: Math.round(view.projectedCorpus),
      shortfall: Math.round(view.shortfall),
      requiredMonthlyInvestment: Math.round(view.requiredMonthlyInvestment),
      progressPct: Math.min(100_000, Math.max(0, Math.round(view.progressPct))),
    },
  };
}

export type CompareKind = "text" | "age" | "percent" | "money";

export interface CompareRow {
  label: string;
  kind: CompareKind;
  values: (string | number)[];
}

/** Rows for a side-by-side table: the current edit first, then each saved what-if. */
export function compareRows(
  current: Pick<FreedomScenarioInput, "mode" | "input" | "result">,
  saved: FreedomScenario[],
): CompareRow[] {
  const all = [current, ...saved];
  return [
    { label: "Path", kind: "text", values: all.map((s) => s.mode) },
    { label: "Retirement age", kind: "age", values: all.map((s) => s.input.retirementAge) },
    { label: "Monthly expense today", kind: "money", values: all.map((s) => s.input.monthlyExpenses) },
    { label: "Expected return", kind: "percent", values: all.map((s) => s.input.expectedReturn) },
    { label: "Inflation", kind: "percent", values: all.map((s) => s.input.inflationRate) },
    { label: "Your number", kind: "money", values: all.map((s) => s.result.target) },
    { label: "Projected corpus", kind: "money", values: all.map((s) => s.result.projectedCorpus) },
    { label: "Shortfall", kind: "money", values: all.map((s) => s.result.shortfall) },
    { label: "Invest per month to close it", kind: "money", values: all.map((s) => s.result.requiredMonthlyInvestment) },
  ];
}
