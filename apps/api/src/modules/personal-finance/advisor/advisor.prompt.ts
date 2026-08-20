import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { PlannerReport } from "../planner/planner.engine.js";

function loadAdvisorSystemPrompt(): string {
  const promptUrl = new URL("../../../../prompts/advisor.prompt.md", import.meta.url);
  return readFileSync(fileURLToPath(promptUrl), "utf8");
}

export const ADVISOR_SYSTEM_PROMPT = loadAdvisorSystemPrompt();

export type AdvisorFinancialContext = ReturnType<typeof buildAdvisorContext>;

function roundPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

export function buildRuleChecklist(report: PlannerReport) {
  const income = report.cashflow.income;
  const dtiPct = income > 0 ? (report.cashflow.loanEmis / income) * 100 : null;
  const discretionaryPct =
    income > 0 ? (report.cashflow.discretionary / income) * 100 : null;
  const highestLoan = report.liabilityPlan.avalanche[0];

  return {
    savingsRatePct: roundPct(report.cashflow.savingsRatePct),
    savingsRateBelow25: (report.cashflow.savingsRatePct ?? 100) < 25,
    dtiPct: roundPct(dtiPct),
    dtiAbove35: (dtiPct ?? 0) > 35,
    discretionaryPct: roundPct(discretionaryPct),
    discretionaryAbove10PctOfIncome: (discretionaryPct ?? 0) > 10,
    monthlySurplus: report.cashflow.surplus,
    highestRoiLoan: highestLoan
      ? {
          loan: "Loan 1",
          roiPct: highestLoan.roi,
          principal: highestLoan.principal,
          monthlyEmi: highestLoan.emi,
        }
      : null,
    multipleLoans: report.liabilityPlan.avalanche.length > 1,
    investmentsOnHold: report.cashflow.sipsOnHold,
    fireGap: report.goals.fireGap,
    fireProgressPct: roundPct(report.goals.fireProgressPct),
  };
}

export function buildAdvisorContext(report: PlannerReport) {
  return {
    currency: "INR",
    cashflow: {
      monthlyIncome: report.cashflow.income,
      monthlyLivingExpenses: report.cashflow.livingExpenses,
      monthlyLoanEmis: report.cashflow.loanEmis,
      monthlyActiveInvestments: report.cashflow.investments,
      monthlyCommittedOutflow: report.cashflow.totalOutflow,
      monthlySurplus: report.cashflow.surplus,
      savingsRatePct: report.cashflow.savingsRatePct,
      investmentsOnHold: report.cashflow.sipsOnHold,
      monthlyPausedInvestments: report.cashflow.pausedSip,
      monthlyDiscretionary: report.cashflow.discretionary,
    },
    netWorth: report.netWorth,
    goals: report.goals,
    loans: report.liabilityPlan.avalanche.map((loan, index) => ({
      loan: `Loan ${index + 1}`,
      roiPct: loan.roi,
      principal: loan.principal,
      monthlyEmi: loan.emi,
      remainingMonths: loan.remainingMonths,
      scheduledRemainingInterestEstimate: loan.remainingInterestEstimate,
    })),
    scenarios: report.liabilityPlan.scenarios,
    investmentResumeMilestone: report.liabilityPlan.investmentResumeMilestone,
    ruleChecklist: buildRuleChecklist(report),
  };
}

export function hashAdvisorContext(report: PlannerReport): string {
  return createHash("sha256")
    .update(JSON.stringify(buildAdvisorContext(report)))
    .digest("hex");
}

export function buildAdvisorUserPrompt(report: PlannerReport): string {
  return `Prepare a summary report and a plan of action from this sanitized data.
Apply the system-prompt rule engine to the ruleChecklist. Prioritize cashflow safety,
then expensive debt, then the supplied investment resume milestone. Explain EMI or
prepayment changes using only the supplied scenario comparisons.

Financial context:
${JSON.stringify(buildAdvisorContext(report))}`;
}
