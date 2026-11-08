import {
  FinanceData,
  FireGoalType,
  FIRE_POST_RETIREMENT_YEARS,
  FreedomMode,
  FREEDOM_EXPENSE_MULTIPLES,
  Goal,
  Investment,
  Loan,
  Scenario,
  EmploymentType,
} from "@/types/finance";

/* ---------------- formatting ---------------- */
export function formatCurrency(value: number, currency = "₹", compact = false): string {
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1_00_00_000) return `${currency}${(value / 1_00_00_000).toFixed(2)} Cr`;
    if (abs >= 1_00_000) return `${currency}${(value / 1_00_000).toFixed(2)} L`;
    if (abs >= 1_000) return `${currency}${(value / 1_000).toFixed(1)} K`;
  }
  return `${currency}${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/* ---------------- finance math helpers ---------------- */
export function fvLumpSum(pv: number, annualRatePct: number, years: number): number {
  return pv * Math.pow(1 + annualRatePct / 100, years);
}

export function fvSIP(monthly: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

// PMT required monthly to reach a future value
export function pmtForFV(targetFV: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  if (n <= 0) return targetFV;
  if (r === 0) return targetFV / n;
  return (targetFV * r) / ((Math.pow(1 + r, n) - 1) * (1 + r));
}

// months to pay off a loan with given EMI
export function loanPayoffMonths(outstanding: number, annualRatePct: number, emi: number): number {
  const r = annualRatePct / 100 / 12;
  if (emi <= outstanding * r) return Infinity; // EMI never covers interest
  if (r === 0) return Math.ceil(outstanding / emi);
  const n = -Math.log(1 - (outstanding * r) / emi) / Math.log(1 + r);
  return Math.ceil(n);
}

// outstanding principal after `months` of scheduled EMIs
export function loanBalanceAfterMonths(outstanding: number, annualRatePct: number, emi: number, months: number): number {
  if (months <= 0) return Math.max(0, outstanding);
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.max(0, outstanding - emi * months);
  const growth = Math.pow(1 + r, months);
  return Math.max(0, outstanding * growth - emi * ((growth - 1) / r));
}

export function totalInterestPaid(loan: Loan): number {
  const months = loanPayoffMonths(loan.outstanding, loan.interestRate, loan.emi);
  if (!isFinite(months)) return Infinity;
  return loan.emi * months - loan.outstanding;
}

/** Interest charged between two EMI counts, using reducing-balance math. */
export function interestPaidOverMonths(loan: Loan, startMonth: number, endMonth: number): number {
  if (loan.outstanding <= 0) return 0;
  const payoff = loanRemainingMonths(loan);
  const from = Math.max(0, startMonth);
  const to = Math.max(from, isFinite(payoff) ? Math.min(endMonth, payoff) : endMonth);
  if (to <= from) return 0;
  const startBal = loanBalanceAfterMonths(loan.outstanding, loan.interestRate, loan.emi, from);
  const endBal = loanBalanceAfterMonths(loan.outstanding, loan.interestRate, loan.emi, to);
  return Math.max(0, loan.emi * (to - from) - (startBal - endBal));
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function addCalendarMonths(from: Date, months: number): Date {
  return new Date(from.getFullYear(), from.getMonth() + months, 1);
}

export function formatMonthYear(date: Date): string {
  const month = MONTH_SHORT[date.getMonth()] ?? "Jan";
  return `${month} ${date.getFullYear()}`;
}

export function formatTenureMonths(months: number): string {
  if (!isFinite(months)) return "Never";
  if (months <= 0) return "Paid off";
  const years = Math.floor(months / 12);
  const leftover = months % 12;
  return `${years ? `${years}y ` : ""}${leftover}m`.trim();
}

/** Months until this loan is fully paid on the current EMI. */
export function loanRemainingMonths(loan: Loan): number {
  if (loan.outstanding <= 0) return 0;
  return loanPayoffMonths(loan.outstanding, loan.interestRate, loan.emi);
}

export function loanEndDate(loan: Loan, from = new Date()): Date | null {
  const months = loanRemainingMonths(loan);
  if (!isFinite(months) || months < 0) return null;
  return addCalendarMonths(from, months);
}

export function loanChartSeriesKey(loan: Loan, loans: Loan[]): string {
  const sameName = loans.filter((item) => item.name === loan.name);
  if (sameName.length <= 1) return loan.name;
  const sameType = sameName.filter((item) => item.type === loan.type);
  if (sameType.length <= 1) return `${loan.name} · ${loan.type}`;
  return `${loan.name} · ${loan.id.slice(0, 6)}`;
}

export interface LoanPayoffBar {
  id: string;
  name: string;
  seriesKey: string;
  months: number;
  neverEnds: boolean;
  endLabel: string;
  outstanding: number;
  interestLeft: number;
}

export function loanPayoffBars(loans: Loan[], from = new Date()): LoanPayoffBar[] {
  const active = loans.filter((loan) => loan.outstanding > 0);
  return active
    .map((loan) => {
      const months = loanRemainingMonths(loan);
      const neverEnds = !isFinite(months);
      const end = neverEnds ? null : addCalendarMonths(from, months);
      return {
        id: loan.id,
        name: loan.name,
        seriesKey: loanChartSeriesKey(loan, active),
        months: neverEnds ? 0 : months,
        neverEnds,
        endLabel: end ? formatMonthYear(end) : "Never",
        outstanding: loan.outstanding,
        interestLeft: neverEnds ? Infinity : totalInterestPaid(loan),
      };
    })
    .sort((a, b) => {
      if (a.neverEnds !== b.neverEnds) return a.neverEnds ? 1 : -1;
      if (a.months !== b.months) return a.months - b.months;
      return a.seriesKey.localeCompare(b.seriesKey);
    });
}

export type LoanBalanceChartPoint = {
  month: number;
  label: string;
  [loanKey: string]: number | string;
};

export function loanBalanceChartData(loans: Loan[], from = new Date()): LoanBalanceChartPoint[] {
  const active = loans.filter((loan) => loan.outstanding > 0);
  if (active.length === 0) return [];

  const remaining = active.map((loan) => loanRemainingMonths(loan));
  const finite = remaining.filter((months) => isFinite(months) && months > 0);
  const maxMonths = Math.min(finite.length ? Math.max(...finite) : 24, 360);
  const step = maxMonths <= 24 ? 1 : maxMonths <= 60 ? 3 : 12;
  const months = new Set<number>([0]);
  for (let month = step; month < maxMonths; month += step) months.add(month);
  months.add(maxMonths);
  for (const payoff of remaining) {
    if (isFinite(payoff) && payoff > 0 && payoff <= maxMonths) months.add(payoff);
  }

  return [...months].sort((a, b) => a - b).map((month) => {
    const point: LoanBalanceChartPoint = {
      month,
      label: month === 0 ? "Now" : formatMonthYear(addCalendarMonths(from, month)),
    };
    for (const loan of active) {
      const key = loanChartSeriesKey(loan, active);
      const payoff = loanRemainingMonths(loan);
      const balance =
        isFinite(payoff) && month >= payoff
          ? 0
          : loanBalanceAfterMonths(loan.outstanding, loan.interestRate, loan.emi, month);
      point[key] = Math.round(balance);
    }
    return point;
  });
}

export type LoanYearlyInterestPoint = {
  year: number;
  label: string;
  total: number;
  [loanKey: string]: number | string;
};

export function loanYearlyInterestChartData(loans: Loan[], from = new Date()): LoanYearlyInterestPoint[] {
  const active = loans.filter((loan) => loan.outstanding > 0);
  if (active.length === 0) return [];

  const remaining = active.map((loan) => loanRemainingMonths(loan));
  const finite = remaining.filter((months) => isFinite(months) && months > 0);
  const maxMonths = Math.min(finite.length ? Math.max(...finite) : 24, 360);
  if (maxMonths <= 0) return [];

  const points: LoanYearlyInterestPoint[] = [];
  let startMonth = 0;
  let calendarYear = from.getFullYear();

  while (startMonth < maxMonths) {
    const span = startMonth === 0 ? 12 - from.getMonth() : 12;
    const endMonth = Math.min(startMonth + Math.max(1, span), maxMonths);
    const point: LoanYearlyInterestPoint = {
      year: calendarYear,
      label: String(calendarYear),
      total: 0,
    };
    for (const loan of active) {
      const key = loanChartSeriesKey(loan, active);
      const interest = Math.round(interestPaidOverMonths(loan, startMonth, endMonth));
      point[key] = interest;
      point.total += interest;
    }
    points.push(point);
    startMonth = endMonth;
    calendarYear += 1;
  }

  while (points.length > 0 && (points[points.length - 1]?.total ?? 0) === 0) {
    points.pop();
  }
  return points;
}

/** Sum of daily-log spending dated in the current calendar month. */
export function dailySpentThisMonth(
  entries: { amount: number; date: string }[],
  now = new Date(),
): number {
  return entries
    .filter((entry) => {
      // A bare YYYY-MM-DD is a calendar date, not UTC midnight: read it as local time.
      const date = /^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? new Date(`${entry.date}T00:00:00`) : new Date(entry.date);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    })
    .reduce((sum, entry) => sum + entry.amount, 0);
}

/* ---------------- data readiness (gates verdicts on empty data) ---------------- */
export interface DataReadiness {
  hasIncome: boolean;
  hasExpenses: boolean;
  hasSavings: boolean;
  /** Income and expenses exist, so ratios and verdicts mean something. */
  ready: boolean;
  /** Plain-language list of what is still missing for a first result. */
  missing: string[];
}

export function dataReadiness(d: FinanceData): DataReadiness {
  const hasIncome = monthlyIncome(d) > 0;
  const hasExpenses = monthlyExpenses(d) > 0 || d.profile.monthlyEssentialExpenses > 0;
  const hasSavings = d.investments.length > 0 || d.profile.emergencyFund > 0 || d.profile.liquidAssets > 0;
  const missing: string[] = [];
  if (!hasIncome) missing.push("your monthly income");
  if (!hasExpenses) missing.push("your monthly expenses");
  if (!hasSavings) missing.push("one saving or investment");
  return { hasIncome, hasExpenses, hasSavings, ready: hasIncome && hasExpenses, missing };
}

/* ---------------- aggregate metrics ---------------- */
export function monthlyIncome(d: FinanceData): number {
  return d.incomes.reduce((s, i) => s + i.monthlyAmount, 0);
}
export function monthlyExpenses(d: FinanceData): number {
  return d.expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);
}
export function oneTimeExpenses(d: FinanceData): number {
  return d.expenses.filter((e) => !e.recurring).reduce((s, e) => s + e.amount, 0);
}
export function monthlyEMI(d: FinanceData): number {
  return d.loans.reduce((s, l) => s + l.emi, 0);
}

export interface CashflowShare {
  id: string;
  name: string;
  extra?: string;
  amount: number;
  percent: number;
}

function toCashflowShares(
  rows: Array<{ id: string; name: string; extra?: string; amount: number }>,
  total: number,
): CashflowShare[] {
  return [...rows]
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .map((row) => ({
      ...row,
      percent: total > 0 ? (row.amount / total) * 100 : 0,
    }));
}

export function incomeDistribution(d: FinanceData): CashflowShare[] {
  return toCashflowShares(
    d.incomes.map((item) => ({
      id: item.id,
      name: item.name,
      extra: item.type,
      amount: item.monthlyAmount,
    })),
    monthlyIncome(d),
  );
}

export function expenseDistribution(d: FinanceData): CashflowShare[] {
  const expenses = d.expenses
    .filter((item) => item.recurring)
    .map((item) => ({
      id: item.id,
      name: item.name,
      extra: item.category,
      amount: item.amount,
    }));
  const emis = d.loans.map((item) => ({
    id: item.id,
    name: item.name,
    extra: `${item.type} EMI`,
    amount: item.emi,
  }));
  return toCashflowShares([...expenses, ...emis], monthlyExpenses(d) + monthlyEMI(d));
}

export function cashflowShareLabel(shares: CashflowShare[]): string {
  if (!shares.length) return "Nothing added yet";
  return shares
    .map((row) => `${row.name} ${formatPercent(row.percent)}`)
    .join(", ");
}

export function coveragePercent(current: number, target: number): number {
  if (target <= 0) return current > 0 ? 100 : 0;
  return (current / target) * 100;
}
export function monthlyCreditCardDue(d: FinanceData): number {
  return d.creditCards.reduce((s, c) => s + c.minimumDue, 0);
}
export function totalCreditCardOutstanding(d: FinanceData): number {
  return d.creditCards.reduce((s, c) => s + c.outstanding, 0);
}
export function totalCreditLimit(d: FinanceData): number {
  return d.creditCards.reduce((s, c) => s + c.creditLimit, 0);
}
export function creditUtilization(d: FinanceData): number {
  const limit = totalCreditLimit(d);
  if (limit === 0) return 0;
  return (totalCreditCardOutstanding(d) / limit) * 100;
}
export function monthlySIP(d: FinanceData): number {
  return d.investments.reduce((s, i) => s + i.monthlySip, 0);
}
export function monthlyInsurancePremium(d: FinanceData): number {
  return d.insurances.reduce((s, i) => s + i.annualPremium, 0) / 12;
}
export function totalLiabilities(d: FinanceData): number {
  return d.loans.reduce((s, l) => s + l.outstanding, 0) + totalCreditCardOutstanding(d);
}
export function totalInvestments(d: FinanceData): number {
  return d.investments.reduce((s, i) => s + i.currentValue, 0);
}
export function totalAssets(d: FinanceData): number {
  return totalInvestments(d) + d.profile.emergencyFund;
}
export function netWorth(d: FinanceData): number {
  return totalAssets(d) - totalLiabilities(d);
}
export function monthlySavings(d: FinanceData): number {
  return monthlyIncome(d) - monthlyExpenses(d) - monthlyEMI(d) - monthlyCreditCardDue(d) - monthlyInsurancePremium(d);
}
export function savingsRate(d: FinanceData): number {
  const inc = monthlyIncome(d);
  if (inc === 0) return 0;
  return (monthlySavings(d) / inc) * 100;
}
export function debtToIncome(d: FinanceData): number {
  const inc = monthlyIncome(d);
  if (inc === 0) return 0;
  return ((monthlyEMI(d) + monthlyCreditCardDue(d)) / inc) * 100;
}

/* ---------------- investment analysis ---------------- */
export function portfolioFutureValue(d: FinanceData, years: number, scenarioAdj = 0): number {
  return d.investments.reduce((sum, inv) => {
    const rate = Math.max(0, inv.expectedReturn + scenarioAdj);
    return sum + fvLumpSum(inv.currentValue, rate, years) + fvSIP(inv.monthlySip, rate, years);
  }, 0);
}

export function weightedReturn(d: FinanceData): number {
  const total = totalInvestments(d);
  if (total === 0) return 0;
  return d.investments.reduce((s, i) => s + i.expectedReturn * (i.currentValue / total), 0);
}

export function assetAllocation(d: FinanceData): { name: string; value: number }[] {
  const map = new Map<string, number>();
  d.investments.forEach((i) => map.set(i.type, (map.get(i.type) || 0) + i.currentValue));
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function investmentProjection(inv: Investment): number {
  return fvLumpSum(inv.currentValue, inv.expectedReturn, inv.horizon) + fvSIP(inv.monthlySip, inv.expectedReturn, inv.horizon);
}

export interface ProjectionSchedulePoint {
  year: number;
  contributed: number;
  estimatedReturns: number;
  projectedValue: number;
  target?: number;
}

export function investmentProjectionSchedule(inv: Investment): ProjectionSchedulePoint[] {
  const years = Math.max(0, Math.ceil(inv.horizon));
  return Array.from({ length: years + 1 }, (_, year) => {
    const elapsedYears = Math.min(year, inv.horizon);
    const contributed = inv.currentValue + inv.monthlySip * elapsedYears * 12;
    const projectedValue =
      fvLumpSum(inv.currentValue, inv.expectedReturn, elapsedYears) +
      fvSIP(inv.monthlySip, inv.expectedReturn, elapsedYears);
    return {
      year: elapsedYears,
      contributed,
      estimatedReturns: Math.max(0, projectedValue - contributed),
      projectedValue,
    };
  });
}

/* ---------------- goals ---------------- */
export interface GoalAnalysis {
  goal: Goal;
  yearsLeft: number;
  inflationAdjustedTarget: number;
  projectedSavedValue: number;
  monthlyRequired: number;
  fundingGap: number;
  probability: number; // 0-100
  status: "On Track" | "At Risk" | "Off Track";
}

export function analyzeGoal(d: FinanceData, goal: Goal, assumedReturn = 11): GoalAnalysis {
  if (goal.type === "Emergency Fund") {
    const ef = emergencyFund(d);
    const status: GoalAnalysis["status"] =
      ef.status === "Green" ? "On Track" : ef.status === "Yellow" ? "At Risk" : "Off Track";
    return {
      goal: { ...goal, targetAmount: ef.recommendedTarget, currentSaved: ef.totalAvailable },
      yearsLeft: Math.max(0.1, ef.monthsToComplete / 12),
      inflationAdjustedTarget: ef.inflationAdjustedTarget,
      projectedSavedValue: ef.totalAvailable,
      monthlyRequired: ef.monthlyContribution,
      fundingGap: ef.shortfall,
      probability: ef.safetyScore,
      status,
    };
  }
  const yearsLeft = Math.max(0.1, (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365));
  const inflationAdjustedTarget = fvLumpSum(goal.targetAmount, d.profile.inflationRate, yearsLeft);
  const projectedSavedValue = fvLumpSum(goal.currentSaved, assumedReturn, yearsLeft);
  const remaining = Math.max(0, inflationAdjustedTarget - projectedSavedValue);
  const monthlyRequired = pmtForFV(remaining, assumedReturn, yearsLeft);
  const fundingGap = remaining;
  const surplus = monthlySavings(d);
  const ratio = surplus > 0 ? Math.min(1, surplus / Math.max(monthlyRequired, 1)) : 0;
  const probability = Math.round(Math.min(98, Math.max(8, ratio * 95 + (goal.currentSaved / Math.max(goal.targetAmount, 1)) * 20)));
  const status = probability >= 70 ? "On Track" : probability >= 40 ? "At Risk" : "Off Track";
  return { goal, yearsLeft, inflationAdjustedTarget, projectedSavedValue, monthlyRequired, fundingGap, probability, status };
}

export interface GoalFixes {
  /** Monthly amount that reaches the inflation-adjusted target by the chosen date. */
  monthlyNeeded: number;
  /** What the user can set aside today (monthly surplus, never negative). */
  monthlyAvailable: number;
  /** Extra monthly cash needed on top of the surplus; 0 when the surplus already covers it. */
  extraMonthlyNeeded: number;
  /** Earliest target date the current surplus can reach, or null if none within 40 years. */
  laterDate: Date | null;
  /** Today's-rupees target the current surplus can reach by the chosen date. */
  affordableTarget: number;
}

const FIX_STEP_YEARS = 0.5;
const FIX_MAX_YEARS = 40;

/**
 * Three ways to close a goal gap with the numbers already computed:
 * find more monthly cash, move the date, or lower the target.
 * Returns null for the emergency fund (owned by the Goals emergency card) and for goals already on track.
 */
export function goalFixes(d: FinanceData, goal: Goal, assumedReturn = 11): GoalFixes | null {
  if (goal.type === "Emergency Fund") return null;
  const analysis = analyzeGoal(d, goal, assumedReturn);
  if (analysis.status === "On Track") return null;

  const monthlyAvailable = Math.max(0, monthlySavings(d));
  const monthlyNeeded = analysis.monthlyRequired;
  const requiredFor = (years: number) => {
    const target = fvLumpSum(goal.targetAmount, d.profile.inflationRate, years);
    const saved = fvLumpSum(goal.currentSaved, assumedReturn, years);
    return pmtForFV(Math.max(0, target - saved), assumedReturn, years);
  };

  let laterDate: Date | null = null;
  if (monthlyAvailable > 0) {
    for (let years = analysis.yearsLeft + FIX_STEP_YEARS; years <= FIX_MAX_YEARS; years += FIX_STEP_YEARS) {
      if (requiredFor(years) <= monthlyAvailable) {
        laterDate = new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000);
        break;
      }
    }
  }

  const reachable =
    fvLumpSum(goal.currentSaved, assumedReturn, analysis.yearsLeft) + fvSIP(monthlyAvailable, assumedReturn, analysis.yearsLeft);
  const affordableTarget = reachable / Math.pow(1 + d.profile.inflationRate / 100, analysis.yearsLeft);

  return {
    monthlyNeeded,
    monthlyAvailable,
    extraMonthlyNeeded: Math.max(0, monthlyNeeded - monthlyAvailable),
    laterDate,
    affordableTarget: Math.min(goal.targetAmount, affordableTarget),
  };
}

export function goalProjectionSchedule(
  d: FinanceData,
  goal: Goal,
  assumedReturn = 11,
): ProjectionSchedulePoint[] {
  const analysis = analyzeGoal(d, goal, assumedReturn);
  const years = Math.max(1, Math.ceil(analysis.yearsLeft));
  const startingValue = analysis.goal.currentSaved;
  return Array.from({ length: years + 1 }, (_, year) => {
    const elapsedYears = Math.min(year, analysis.yearsLeft);
    const contributed = startingValue + analysis.monthlyRequired * elapsedYears * 12;
    const projectedValue =
      fvLumpSum(startingValue, assumedReturn, elapsedYears) +
      fvSIP(analysis.monthlyRequired, assumedReturn, elapsedYears);
    return {
      year: elapsedYears,
      contributed,
      estimatedReturns: Math.max(0, projectedValue - contributed),
      projectedValue,
      target: fvLumpSum(analysis.goal.targetAmount, d.profile.inflationRate, elapsedYears),
    };
  });
}

/* ---------------- insurance ---------------- */
export interface InsuranceAnalysis {
  recommendedTermCover: number;
  currentTermCover: number;
  termGap: number;
  recommendedHealthCover: number;
  currentHealthCover: number;
  healthGap: number;
}

/**
 * Years of income the family would need replaced. More dependents need more,
 * and nobody needs more years of cover than they have left before retirement.
 */
export function termCoverMultiple(d: FinanceData): number {
  const byDependents = d.profile.dependents >= 2 ? 15 : d.profile.dependents === 1 ? 10 : 5;
  return Math.min(byDependents, Math.max(0, d.profile.retirementAge - d.profile.age));
}

export function analyzeInsurance(d: FinanceData): InsuranceAnalysis {
  const annualIncome = monthlyIncome(d) * 12;
  const recommendedTermCover = annualIncome * termCoverMultiple(d) + totalLiabilities(d);
  const currentTermCover = d.insurances.filter((i) => i.type === "Term Insurance").reduce((s, i) => s + i.coverage, 0);
  const recommendedHealthCover = Math.max(1000000, (d.profile.dependents + 1) * 750000);
  const currentHealthCover = d.insurances.filter((i) => i.type === "Health Insurance").reduce((s, i) => s + i.coverage, 0);
  return {
    recommendedTermCover,
    currentTermCover,
    termGap: Math.max(0, recommendedTermCover - currentTermCover),
    recommendedHealthCover,
    currentHealthCover,
    healthGap: Math.max(0, recommendedHealthCover - currentHealthCover),
  };
}

/* ---------------- financial freedom ---------------- */
export interface FIResult {
  currentAnnualExpenses: number;
  fiNumber: number;
  retirementCorpus: number;
  passiveIncome: number;
  yearsRemaining: number;
  fiDate: Date;
  requiredMonthlyInvestment: number;
  probabilityScore: number;
  projectedCorpus: number;
}

/** Recurring monthly outflow the plan has to keep funding after work stops. */
export function plannedMonthlyOutflow(d: FinanceData): number {
  return monthlyExpenses(d) + monthlyEMI(d) + monthlyInsurancePremium(d);
}

export interface CoverShare {
  id: string;
  name: string;
  extra?: string;
  percent: number;
  funded: number;
  target: number;
}

export interface PositionSnapshot {
  assets: number;
  liabilities: number;
  netWorth: number;
  income: number;
  spend: number;
  surplus: number;
  dti: number;
  utilization: number;
  corpus: number;
  freedomTarget: number;
  freedomCover: number;
  goals: CoverShare[];
  termCover: CoverShare;
  healthCover: CoverShare;
}

export function positionSnapshot(d: FinanceData, goals?: GoalAnalysis[]): PositionSnapshot {
  const analyzed = goals ?? d.goals.map((goal) => analyzeGoal(d, goal));
  const ins = analyzeInsurance(d);
  const freedomTarget = plannedMonthlyOutflow(d) * 12 * FIRE_POST_RETIREMENT_YEARS;
  const corpus = totalInvestments(d);
  return {
    assets: totalAssets(d),
    liabilities: totalLiabilities(d),
    netWorth: netWorth(d),
    income: monthlyIncome(d),
    spend: monthlyExpenses(d) + monthlyEMI(d),
    surplus: monthlySavings(d),
    dti: debtToIncome(d),
    utilization: creditUtilization(d),
    corpus,
    freedomTarget,
    freedomCover: coveragePercent(corpus, freedomTarget),
    goals: analyzed.map((row) => ({
      id: row.goal.id,
      name: row.goal.name,
      extra: row.status,
      percent: coveragePercent(row.goal.currentSaved, row.inflationAdjustedTarget),
      funded: row.goal.currentSaved,
      target: row.inflationAdjustedTarget,
    })),
    termCover: {
      id: "term-cover",
      name: "Term cover",
      extra: ins.termGap > 0 ? "Below recommended" : "On target",
      percent: coveragePercent(ins.currentTermCover, ins.recommendedTermCover),
      funded: ins.currentTermCover,
      target: ins.recommendedTermCover,
    },
    healthCover: {
      id: "health-cover",
      name: "Health cover",
      extra: ins.healthGap > 0 ? "Below recommended" : "On target",
      percent: coveragePercent(ins.currentHealthCover, ins.recommendedHealthCover),
      funded: ins.currentHealthCover,
      target: ins.recommendedHealthCover,
    },
  };
}

export function financialFreedom(d: FinanceData): FIResult {
  const currentAnnualExpenses = plannedMonthlyOutflow(d) * 12;
  const yearsToRetire = Math.max(1, d.profile.retirementAge - d.profile.age);
  // FI number using 4% safe withdrawal, inflation-adjusted to retirement
  const futureAnnualExpenses = fvLumpSum(currentAnnualExpenses, d.profile.inflationRate, yearsToRetire);
  const fiNumber = futureAnnualExpenses * FIRE_POST_RETIREMENT_YEARS;
  const retirementCorpus = fiNumber;
  const projectedCorpus = portfolioFutureValue(d, yearsToRetire);
  const passiveIncome = (totalInvestments(d) * 0.04) / 12;
  const ret = weightedReturn(d) || 11;
  const gap = Math.max(0, fiNumber - portfolioFutureValue(d, yearsToRetire));
  const requiredMonthlyInvestment = pmtForFV(gap, ret, yearsToRetire);

  // estimate years to reach FI with current savings trajectory
  let years = 0;
  const monthlyContribution = monthlySIP(d);
  let corpus = totalInvestments(d);
  while (years < 60) {
    const target = fvLumpSum(currentAnnualExpenses, d.profile.inflationRate, years) * FIRE_POST_RETIREMENT_YEARS;
    if (corpus >= target) break;
    corpus = corpus * (1 + ret / 100) + monthlyContribution * 12 * (1 + ret / 100 / 2);
    years++;
  }
  const fiDate = new Date();
  fiDate.setFullYear(fiDate.getFullYear() + years);
  const probabilityScore = Math.round(Math.min(98, Math.max(10, (projectedCorpus / Math.max(fiNumber, 1)) * 100)));

  return {
    currentAnnualExpenses,
    fiNumber,
    retirementCorpus,
    passiveIncome,
    yearsRemaining: years,
    fiDate,
    requiredMonthlyInvestment,
    probabilityScore,
    projectedCorpus,
  };
}

export function yearsToRetirement(d: FinanceData): number {
  return Math.max(0, d.profile.retirementAge - d.profile.age);
}

/* ---------------- freedom modes (lean / fire / coast / fat) ---------------- */
export interface FreedomInputs {
  monthlyExpenses: number;
  currentAge: number;
  retirementAge: number;
  inflationRate: number;
  coastAge: number;
  expectedReturn: number;
}

export interface FreedomTargets {
  yearsToRetirement: number;
  coastAge: number;
  annualExpensesToday: number;
  annualExpensesAtRetirement: number;
  targets: Record<FreedomMode, number>;
}

export function defaultFreedomInputs(d: FinanceData): FreedomInputs {
  const retirementAge = d.profile.retirementAge;
  return {
    monthlyExpenses: Math.round(plannedMonthlyOutflow(d)),
    currentAge: d.profile.age,
    retirementAge,
    inflationRate: d.profile.inflationRate,
    coastAge: Math.min(retirementAge, d.profile.age + 5),
    expectedReturn: Math.round((weightedReturn(d) || 11) * 10) / 10,
  };
}

export function freedomTargets(input: FreedomInputs): FreedomTargets {
  const yearsToRetirement = Math.max(0, input.retirementAge - input.currentAge);
  const coastAge = Math.min(Math.max(input.coastAge, input.currentAge), input.retirementAge);
  const annualExpensesToday = Math.max(0, input.monthlyExpenses) * 12;
  const annualExpensesAtRetirement = fvLumpSum(annualExpensesToday, input.inflationRate, yearsToRetirement);
  const fire = annualExpensesAtRetirement * FREEDOM_EXPENSE_MULTIPLES.FIRE;
  // Coast FIRE: the corpus that compounds into the FIRE number with no further SIPs.
  const coast = fire / Math.pow(1 + input.expectedReturn / 100, input.retirementAge - coastAge);
  return {
    yearsToRetirement,
    coastAge,
    annualExpensesToday,
    annualExpensesAtRetirement,
    targets: {
      "Lean FIRE": annualExpensesAtRetirement * FREEDOM_EXPENSE_MULTIPLES["Lean FIRE"],
      FIRE: fire,
      "Coast FIRE": coast,
      "Fat FIRE": annualExpensesAtRetirement * FREEDOM_EXPENSE_MULTIPLES["Fat FIRE"],
    },
  };
}

export interface FreedomModeView {
  mode: FreedomMode;
  target: number;
  targetAge: number;
  yearsToTarget: number;
  projectedCorpus: number;
  shortfall: number;
  requiredMonthlyInvestment: number;
  progressPct: number;
}

export function freedomModeView(
  d: FinanceData,
  input: FreedomInputs,
  mode: FreedomMode,
): FreedomModeView {
  const { targets, coastAge } = freedomTargets(input);
  const target = targets[mode];
  const targetAge = mode === "Coast FIRE" ? coastAge : input.retirementAge;
  const yearsToTarget = Math.max(0, targetAge - input.currentAge);
  const projectedCorpus = portfolioFutureValue(d, yearsToTarget);
  const shortfall = Math.max(0, target - projectedCorpus);
  return {
    mode,
    target,
    targetAge,
    yearsToTarget,
    projectedCorpus,
    shortfall,
    requiredMonthlyInvestment: pmtForFV(shortfall, input.expectedReturn, yearsToTarget),
    progressPct: Math.min(100, (projectedCorpus / Math.max(target, 1)) * 100),
  };
}

export function firePathTargets(d: FinanceData): Record<FireGoalType, number> {
  const years = yearsToRetirement(d);
  const inflation = d.profile.inflationRate;
  const essentialAnnual = essentialMonthlyExpenses(d) * 12;
  const listedAnnual = monthlyExpenses(d) * 12;
  const fatAnnual = listedAnnual > essentialAnnual ? listedAnnual : essentialAnnual * 2;
  const inflate = (annual: number) => fvLumpSum(annual, inflation, years) * FIRE_POST_RETIREMENT_YEARS;
  const lean = inflate(essentialAnnual);
  const fat = inflate(fatAnnual);
  const growth = weightedReturn(d) || 11;
  const coast = years > 0 ? lean / Math.pow(1 + growth / 100, years) : lean;
  return {
    "Lean FIRE": lean,
    "Fat FIRE": fat,
    "Coast FIRE": coast,
  };
}

/* ---------------- health score ---------------- */
export interface HealthScore {
  total: number;
  /** False until income and expenses exist; the total is not meaningful before then. */
  ready: boolean;
  components: { label: string; score: number; weight: number; detail: string; answered: boolean }[];
}

export function healthScore(d: FinanceData): HealthScore {
  const sr = savingsRate(d);
  const dti = debtToIncome(d);
  const ef = emergencyFund(d);
  const emergencyMonths = ef.coverageMonths;
  const diversification = new Set(d.investments.map((i) => i.type)).size;
  const ins = analyzeInsurance(d);
  const insCover = ins.recommendedTermCover > 0 ? Math.min(1, ins.currentTermCover / ins.recommendedTermCover) : 0;

  const srScore = Math.max(0, Math.min(100, (sr / 30) * 100));
  const dtiScore = Math.max(0, 100 - (dti / 40) * 100);
  const efScore = Math.min(100, (emergencyMonths / Math.max(ef.targetMonths, 1)) * 100);
  const divScore = Math.min(100, (diversification / 6) * 100);
  const insScore = insCover * 100;

  const readiness = dataReadiness(d);
  const pending = "Needs more of your details";
  const components = [
    { label: "Emergency Fund", score: Math.round(efScore), weight: 0.25, answered: readiness.hasExpenses, detail: readiness.hasExpenses ? `${emergencyMonths.toFixed(1)} of ${ef.targetMonths} months covered` : pending },
    { label: "Savings Rate", score: Math.round(srScore), weight: 0.25, answered: readiness.hasIncome, detail: readiness.hasIncome ? `${sr.toFixed(0)}% of income saved` : pending },
    { label: "Debt Ratio", score: Math.round(dtiScore), weight: 0.2, answered: readiness.hasIncome, detail: readiness.hasIncome ? `${dti.toFixed(0)}% EMI-to-income` : pending },
    { label: "Diversification", score: Math.round(divScore), weight: 0.15, answered: d.investments.length > 0, detail: d.investments.length > 0 ? `${diversification} asset classes` : pending },
    { label: "Insurance Coverage", score: Math.round(insScore), weight: 0.15, answered: readiness.hasIncome, detail: readiness.hasIncome ? `${(insCover * 100).toFixed(0)}% of recommended` : pending },
  ];
  const total = Math.round(components.reduce((s, c) => s + c.score * c.weight, 0));
  return { total, ready: readiness.ready, components };
}

/* ---------------- forecast engine ---------------- */
const SCENARIO_ADJ: Record<Scenario, number> = {
  Conservative: -3,
  Moderate: 0,
  Aggressive: 3,
};

export function forecastNetWorth(d: FinanceData, scenario: Scenario): { year: string; netWorth: number; assets: number; debt: number }[] {
  const adj = SCENARIO_ADJ[scenario];
  const out: { year: string; netWorth: number; assets: number; debt: number }[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = 0; y <= 20; y++) {
    const assets = portfolioFutureValue(d, y, adj) + d.profile.emergencyFund;
    const debt =
      d.loans.reduce(
        (sum, l) => sum + loanBalanceAfterMonths(l.outstanding, l.interestRate, l.emi, y * 12),
        0,
      ) + totalCreditCardOutstanding(d);
    out.push({ year: `${currentYear + y}`, netWorth: assets - debt, assets, debt });
  }
  return out;
}

export function scenarioSummary(d: FinanceData) {
  const scenarios: Scenario[] = ["Conservative", "Moderate", "Aggressive"];
  return scenarios.map((s) => {
    const f = forecastNetWorth(d, s);
    return {
      scenario: s,
      y5: f[5].netWorth,
      y10: f[10].netWorth,
      y20: f[20].netWorth,
      retirementCorpus: portfolioFutureValue(d, Math.max(1, d.profile.retirementAge - d.profile.age), SCENARIO_ADJ[s]),
    };
  });
}

/* ---------------- AI advisor (rule-based) ---------------- */
/** Screen a tip can send the user to. A subset of the app's view ids. */
export type TipTarget = "goals" | "insurance" | "loans" | "investments" | "expenses" | "income" | "calculators";

export interface TipAction {
  label: string;
  target: TipTarget;
  /** Calculator to open when target is "calculators". */
  calculator?: "sip";
}

/** Where a number in a tip comes from: the user's saved data, or a rule of thumb. */
export interface TipBasis {
  kind: "data" | "assumption";
  label: string;
}

const fromData = (label: string): TipBasis => ({ kind: "data", label });
const assumed = (label: string): TipBasis => ({ kind: "assumption", label });

export interface Recommendation {
  title: string;
  detail: string;
  impact: "High" | "Medium" | "Low";
  category: string;
  action?: TipAction;
  basis?: TipBasis[];
}

/** One button per advisor category, shared by the dashboard and the advisor plan. */
export function actionForCategory(category: string): TipAction | undefined {
  switch (category) {
    case "Emergency Fund":
    case "Safety":
    case "Goals":
      return { label: "Set emergency target", target: "goals" };
    case "Insurance":
      return { label: "Review insurance", target: "insurance" };
    case "Debt":
      return { label: "Open loans", target: "loans" };
    case "Expenses":
      return { label: "Review expenses", target: "expenses" };
    case "Savings":
    case "Investments":
      return { label: "Open SIP calculator", target: "calculators", calculator: "sip" };
    default:
      return undefined;
  }
}

const IMPACT_RANK: Record<Recommendation["impact"], number> = { High: 0, Medium: 1, Low: 2 };

/** Categories that all describe the same thing: building the emergency fund. */
export const isEmergencyCategory = (category: string) => category === "Emergency Fund" || category === "Safety";

/**
 * Emergency-fund advice has one owner (the Goals screen), so a plan lists it once.
 * Keeps the highest-impact emergency item, in its own position, and drops the rest.
 */
export function keepOneEmergencyItem<T extends { category: string; impact: Recommendation["impact"] }>(items: T[]): T[] {
  const emergency = items.filter((item) => isEmergencyCategory(item.category));
  if (emergency.length < 2) return items;
  const keep = emergency.reduce((best, item) => (IMPACT_RANK[item.impact] < IMPACT_RANK[best.impact] ? item : best));
  return items.filter((item) => !isEmergencyCategory(item.category) || item === keep);
}

export function generateRecommendations(d: FinanceData): Recommendation[] {
  // No verdicts until income and expenses exist.
  if (!dataReadiness(d).ready) return [];
  const recs: Recommendation[] = [];
  const sr = savingsRate(d);
  const dti = debtToIncome(d);
  const ins = analyzeInsurance(d);
  const emergencyMonths = d.profile.emergencyFund / Math.max(monthlyExpenses(d) + monthlyEMI(d), 1);

  // highest interest loan
  const sortedLoans = [...d.loans].sort((a, b) => b.interestRate - a.interestRate);
  if (sortedLoans.length > 1) {
    recs.push({
      title: `Close ${sortedLoans[0].name} first`,
      detail: `At ${sortedLoans[0].interestRate}% it's your costliest debt. Prepaying it before lower-rate loans like ${sortedLoans[sortedLoans.length - 1].name} could save lakhs in interest.`,
      impact: "High",
      category: "Debt",
      action: { label: "Open loans", target: "loans" },
      basis: [fromData("Your loan rates")],
    });
  }
  const discretionary = d.expenses.filter((e) => ["Entertainment", "Dining Out", "Travel"].includes(e.category) && e.recurring).reduce((s, e) => s + e.amount, 0);
  if (discretionary > monthlyIncome(d) * 0.1) {
    recs.push({
      title: `Trim discretionary spending by 15%`,
      detail: `You spend ${formatCurrency(discretionary, d.profile.currency)}/mo on lifestyle. Cutting 15% frees ~${formatCurrency(discretionary * 0.15, d.profile.currency)}/mo to invest.`,
      impact: "Medium",
      category: "Expenses",
      action: { label: "Review expenses", target: "expenses" },
      basis: [fromData("Your recurring lifestyle spend"), assumed("15% cut")],
    });
  }
  if (sr < 25) {
    recs.push({
      title: `Boost your savings rate`,
      detail: `Your savings rate is ${sr.toFixed(0)}%. Aim for 30%+. Automate an additional SIP on every salary credit.`,
      impact: "High",
      category: "Savings",
      action: { label: "Open SIP calculator", target: "calculators", calculator: "sip" },
      basis: [fromData(`Your savings rate (${sr.toFixed(0)}%)`), assumed("30%+ target")],
    });
  } else {
    recs.push({
      title: `Increase SIP by ${formatCurrency(10000, d.profile.currency)}`,
      detail: `Your cashflow is healthy. A higher SIP compounds significantly toward your FI number.`,
      impact: "Medium",
      category: "Investments",
      action: { label: "Open SIP calculator", target: "calculators", calculator: "sip" },
      basis: [fromData("Your monthly surplus"), assumed("₹10,000 step")],
    });
  }
  if (emergencyMonths < 6) {
    recs.push({
      title: `Top up your emergency fund`,
      detail: `You have ${emergencyMonths.toFixed(1)} months of cover. Build it to 6 months (${formatCurrency((monthlyExpenses(d) + monthlyEMI(d)) * 6, d.profile.currency)}).`,
      impact: "High",
      category: "Safety",
      action: { label: "Set emergency target", target: "goals" },
      basis: [fromData("Your emergency fund and expenses"), assumed("6-month target")],
    });
  }
  if (ins.termGap > 0) {
    recs.push({
      title: `Increase term insurance cover`,
      detail: `Your cover has a gap of ${formatCurrency(ins.termGap, d.profile.currency, true)}. Term insurance is cheap — close this gap to protect dependents.`,
      impact: "High",
      category: "Insurance",
      action: { label: "Add term cover", target: "insurance" },
      basis: [fromData("Your income and loans"), assumed(`${termCoverMultiple(d)}× annual income, from your dependents`)],
    });
  }
  if (ins.healthGap > 0) {
    recs.push({
      title: `Raise health insurance coverage`,
      detail: `Recommended health cover is ${formatCurrency(ins.recommendedHealthCover, d.profile.currency, true)}; you're short by ${formatCurrency(ins.healthGap, d.profile.currency, true)}.`,
      impact: "Medium",
      category: "Insurance",
      action: { label: "Add health policy", target: "insurance" },
      basis: [fromData("Your dependents"), assumed("₹7.5 L per person, ₹10 L minimum")],
    });
  }
  if (dti > 35) {
    recs.push({
      title: `Reduce your debt load`,
      detail: `EMIs consume ${dti.toFixed(0)}% of income (healthy is <35%). Avoid new loans and prioritise prepayment.`,
      impact: "High",
      category: "Debt",
      action: { label: "Review loans", target: "loans" },
      basis: [fromData("Your EMIs and income"), assumed("35% EMI limit")],
    });
  }
  return recs.sort((a, b) => IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact]);
}

export function prepaymentStrategy(d: FinanceData): Loan[] {
  return [...d.loans].sort((a, b) => b.interestRate - a.interestRate);
}

export interface LoanWhatIfSaving {
  extraNow: number;
  extraMonthly: number;
  newEmi: number;
  originalMonths: number;
  newMonths: number;
  monthsSaved: number;
  originalInterest: number;
  newInterest: number;
  interestSaved: number;
  makesClosable: boolean;
}

function loanPayoffInterest(
  outstanding: number,
  annualRatePct: number,
  emi: number,
): { months: number; interest: number } | null {
  if (outstanding <= 0) return { months: 0, interest: 0 };
  if (emi <= 0) return null;
  const months = loanPayoffMonths(outstanding, annualRatePct, emi);
  if (!isFinite(months)) return null;
  if (months <= 0) return { months: 0, interest: 0 };
  const beforeLast = loanBalanceAfterMonths(outstanding, annualRatePct, emi, months - 1);
  const lastInterest = beforeLast * (annualRatePct / 100 / 12);
  const paid = emi * (months - 1) + beforeLast + lastInterest;
  return { months, interest: Math.max(0, paid - outstanding) };
}

function compareLoanPayoff(
  loan: Loan,
  extraNow: number,
  extraMonthly: number,
  newEmi: number,
  revisedOutstanding: number,
): LoanWhatIfSaving | null {
  const next = loanPayoffInterest(revisedOutstanding, loan.interestRate, newEmi);
  if (!next) return null;
  const baseline = loanPayoffInterest(loan.outstanding, loan.interestRate, loan.emi);
  const newInterest = next.interest;
  const originalInterest = baseline?.interest ?? Infinity;
  const originalMonths = baseline?.months ?? Infinity;
  const interestSaved = baseline ? Math.max(0, Math.round(originalInterest - newInterest)) : 0;
  const monthsSaved = baseline ? Math.max(0, originalMonths - next.months) : 0;
  if (baseline && interestSaved <= 0 && monthsSaved <= 0) return null;
  return {
    extraNow,
    extraMonthly,
    newEmi,
    originalMonths,
    newMonths: next.months,
    monthsSaved,
    originalInterest,
    newInterest: Math.round(newInterest),
    interestSaved,
    makesClosable: !baseline,
  };
}

export function extraEmiInterestSaving(loan: Loan): LoanWhatIfSaving | null {
  if (loan.outstanding <= 0 || loan.emi <= 0) return null;
  const extraNow = Math.min(loan.emi, loan.outstanding);
  return compareLoanPayoff(loan, extraNow, 0, loan.emi, Math.max(0, loan.outstanding - extraNow));
}

export function emiIncreaseInterestSaving(loan: Loan, percent: number): LoanWhatIfSaving | null {
  if (loan.outstanding <= 0 || loan.emi <= 0 || percent <= 0) return null;
  const newEmi = Math.round(loan.emi * (1 + percent / 100));
  if (newEmi <= loan.emi) return null;
  return compareLoanPayoff(loan, 0, newEmi - loan.emi, newEmi, loan.outstanding);
}

/* ---------------- emergency fund ---------------- */
export const EF_TARGET_MONTHS: Record<EmploymentType, number> = {
  Salaried: 6,
  "Business Owner": 12,
  Freelancer: 12, // 9-12 range, we target the safer 12
  Retired: 12,
};

export const EF_RULE_LABEL: Record<EmploymentType, string> = {
  Salaried: "6 months of expenses",
  "Business Owner": "12 months of expenses",
  Freelancer: "9–12 months of expenses",
  Retired: "12 months of expenses",
};

const NON_ESSENTIAL = ["Entertainment", "Dining Out", "Travel"];

// Essential monthly expenses: profile override, else derived recurring essentials + EMIs
export function essentialMonthlyExpenses(d: FinanceData): number {
  if (d.profile.monthlyEssentialExpenses > 0) return d.profile.monthlyEssentialExpenses;
  const essentials = d.expenses
    .filter((e) => e.recurring && !NON_ESSENTIAL.includes(e.category))
    .reduce((s, e) => s + e.amount, 0);
  return essentials + monthlyEMI(d);
}

export interface EmergencyFundResult {
  employmentType: EmploymentType;
  targetMonths: number;
  monthlyEssential: number;
  recommendedTarget: number;
  inflationAdjustedTarget: number;
  currentBalance: number;
  liquidAssets: number;
  totalAvailable: number;
  coverageMonths: number;
  progress: number; // 0-100
  shortfall: number;
  monthlyContribution: number;
  monthsToComplete: number;
  completionDate: Date | null;
  safetyScore: number; // 0-100
  status: "Red" | "Yellow" | "Green";
}

export function emergencyFund(d: FinanceData): EmergencyFundResult {
  const employmentType = d.profile.employmentType;
  const targetMonths = EF_TARGET_MONTHS[employmentType];
  const monthlyEssential = essentialMonthlyExpenses(d);
  const recommendedTarget = monthlyEssential * targetMonths;
  const inflationAdjustedTarget = recommendedTarget * (1 + d.profile.inflationRate / 100);
  const currentBalance = d.profile.emergencyFund;
  const liquidAssets = d.profile.liquidAssets;
  const totalAvailable = currentBalance + liquidAssets;
  const coverageMonths = monthlyEssential > 0 ? totalAvailable / monthlyEssential : 0;
  const progress = recommendedTarget > 0 ? Math.min(100, (totalAvailable / recommendedTarget) * 100) : 0;
  const shortfall = Math.max(0, recommendedTarget - totalAvailable);
  const monthlyContribution = d.profile.emergencyMonthlyContribution;
  const monthsToComplete = shortfall > 0 && monthlyContribution > 0 ? Math.ceil(shortfall / monthlyContribution) : 0;
  let completionDate: Date | null = null;
  if (shortfall > 0 && monthsToComplete > 0) {
    completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsToComplete);
  }
  const safetyScore = Math.round(Math.min(100, (coverageMonths / targetMonths) * 100));
  const status: EmergencyFundResult["status"] =
    coverageMonths >= targetMonths ? "Green" : coverageMonths >= 3 ? "Yellow" : "Red";

  return {
    employmentType,
    targetMonths,
    monthlyEssential,
    recommendedTarget,
    inflationAdjustedTarget,
    currentBalance,
    liquidAssets,
    totalAvailable,
    coverageMonths,
    progress,
    shortfall,
    monthlyContribution,
    monthsToComplete,
    completionDate,
    safetyScore,
    status,
  };
}

export interface EFAlert {
  level: "danger" | "warning" | "info";
  message: string;
}

export function emergencyFundAlerts(d: FinanceData): EFAlert[] {
  const ef = emergencyFund(d);
  const alerts: EFAlert[] = [];
  if (ef.totalAvailable <= 0) {
    alerts.push({ level: "danger", message: "Emergency fund depleted — start rebuilding immediately." });
  } else if (ef.coverageMonths < 3) {
    alerts.push({ level: "danger", message: `Emergency fund critically low at ${ef.coverageMonths.toFixed(1)} months (below 3-month threshold).` });
  } else if (ef.coverageMonths < ef.targetMonths) {
    alerts.push({ level: "warning", message: `Emergency fund below target — ${ef.coverageMonths.toFixed(1)} of ${ef.targetMonths} months covered.` });
  }
  if (ef.totalAvailable > 0 && ef.totalAvailable < ef.inflationAdjustedTarget) {
    alerts.push({ level: "info", message: `Inflation-adjusted target increased to ${formatCurrency(ef.inflationAdjustedTarget, d.profile.currency, true)} — top up to keep pace.` });
  }
  return alerts;
}

export function emergencyFundRecommendations(d: FinanceData): Recommendation[] {
  const ef = emergencyFund(d);
  const recs: Recommendation[] = [];
  const surplus = monthlySavings(d);

  if (ef.status === "Red") {
    recs.push({
      title: "Emergency fund is critically low",
      detail: `You have only ${ef.coverageMonths.toFixed(1)} months of cover. Pause high-risk investments and redirect cash until you reach at least 3 months.`,
      impact: "High",
      category: "Emergency Fund",
      basis: [fromData("Your emergency fund and expenses"), assumed("3-month minimum")],
    });
  }
  if (ef.shortfall > 0 && surplus > 0) {
    const suggested = Math.round(surplus * 0.2);
    recs.push({
      title: `Allocate 20% of surplus (${formatCurrency(suggested, d.profile.currency)}/mo)`,
      detail: `Routing 20% of your monthly surplus toward the emergency fund accelerates progress without straining your budget.`,
      impact: "Medium",
      category: "Emergency Fund",
      basis: [fromData("Your monthly surplus"), assumed("20% share")],
    });
  }
  if (ef.monthsToComplete > 0) {
    recs.push({
      title: `Target reachable in ${ef.monthsToComplete} months`,
      detail: `At ${formatCurrency(ef.monthlyContribution, d.profile.currency)}/mo you'll close the ${formatCurrency(ef.shortfall, d.profile.currency, true)} shortfall by ${ef.completionDate?.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}.`,
      impact: "Medium",
      category: "Emergency Fund",
    });
  }
  if (ef.status === "Green") {
    recs.push({
      title: "Emergency fund fully funded",
      detail: `Great work — you have ${ef.coverageMonths.toFixed(1)} months covered. Keep it in liquid instruments and shift fresh surplus to growth investments.`,
      impact: "Low",
      category: "Emergency Fund",
    });
  }
  return recs;
}

/* ---------------- daily expense tracker ---------------- */
function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface DailySummary {
  today: number;
  week: number;
  month: number;
  budget: number;
  remaining: number;
  budgetUsedPct: number;
  avgPerDay: number;
}

export function dailySummary(d: FinanceData): DailySummary {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfDay(new Date(now.getTime() - 6 * 86400000));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let today = 0, week = 0, month = 0;
  d.dailyExpenses.forEach((e) => {
    const t = new Date(e.date);
    if (t >= todayStart) today += e.amount;
    if (t >= weekStart) week += e.amount;
    if (t >= monthStart) month += e.amount;
  });
  const budget = d.profile.dailyBudget;
  const remaining = budget - month;
  const budgetUsedPct = budget > 0 ? Math.min(100, (month / budget) * 100) : 0;
  const daysElapsed = now.getDate();
  const avgPerDay = daysElapsed > 0 ? month / daysElapsed : 0;
  return { today, week, month, budget, remaining, budgetUsedPct, avgPerDay };
}

export function dailyByCategory(d: FinanceData, sinceDays = 30): { name: string; value: number }[] {
  const since = startOfDay(new Date(Date.now() - (sinceDays - 1) * 86400000));
  const map = new Map<string, number>();
  d.dailyExpenses
    .filter((e) => new Date(e.date) >= since)
    .forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function dailyTrend(d: FinanceData, days = 14): { day: string; amount: number }[] {
  const out: { day: string; amount: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = startOfDay(new Date(Date.now() - i * 86400000));
    const dayEnd = new Date(dayStart.getTime() + 86400000);
    const amount = d.dailyExpenses
      .filter((e) => {
        const t = new Date(e.date);
        return t >= dayStart && t < dayEnd;
      })
      .reduce((s, e) => s + e.amount, 0);
    out.push({ day: dayStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), amount });
  }
  return out;
}

/* ---------------- AI financial coach (rule -> personalised insight) ---------------- */
export interface CoachInsight {
  rule: string;
  status: "good" | "warning" | "bad";
  message: string;
}

export function coachInsights(d: FinanceData): CoachInsight[] {
  const out: CoachInsight[] = [];
  const readiness = dataReadiness(d);
  if (!readiness.ready) {
    return [
      {
        rule: "Personalised guidance",
        status: "warning",
        message: `Add ${readiness.missing.join(" and ")} to unlock guidance based on your own numbers.`,
      },
    ];
  }
  const income = monthlyIncome(d);
  const annualIncome = income * 12;
  const ef = emergencyFund(d);
  const dti = debtToIncome(d);
  const ins = analyzeInsurance(d);
  const equityValue = d.investments
    .filter((i) => ["Stocks", "Mutual Funds", "Crypto"].includes(i.type))
    .reduce((s, i) => s + i.currentValue, 0);
  const equityPct = totalInvestments(d) > 0 ? (equityValue / totalInvestments(d)) * 100 : 0;
  const recommendedEquity = Math.max(0, 100 - d.profile.age);
  const annualExpenses = (monthlyExpenses(d) + monthlyEMI(d)) * 12;
  const freedomCorpus = annualExpenses * 25;
  const sr = savingsRate(d);

  // Emergency fund (6X rule)
  out.push({
    rule: "6X Emergency Fund Rule",
    status: ef.coverageMonths >= ef.targetMonths ? "good" : ef.coverageMonths >= 3 ? "warning" : "bad",
    message:
      ef.coverageMonths >= ef.targetMonths
        ? `Your emergency fund covers ${ef.coverageMonths.toFixed(1)} months — at or above your ${ef.targetMonths}-month target. Well protected.`
        : `Your emergency fund covers ${ef.coverageMonths.toFixed(1)} of ${ef.targetMonths} months. See Goals for your target and next steps.`,
  });

  // Housing / EMI rule
  out.push({
    rule: "Housing / EMI Rule",
    status: dti <= 40 ? "good" : "bad",
    message:
      dti <= 40
        ? `Your loan EMIs are ${dti.toFixed(0)}% of income — within the recommended 40% limit.`
        : `Your loan EMIs are ${dti.toFixed(0)}% of income, which exceeds the recommended 40% limit. Avoid new loans and prioritise prepayment.`,
  });

  // 100 minus age rule
  out.push({
    rule: "100 Minus Age Rule",
    status: Math.abs(equityPct - recommendedEquity) <= 15 ? "good" : "warning",
    message: `At age ${d.profile.age}, the rule suggests ~${recommendedEquity}% in equity. Your equity allocation is ${equityPct.toFixed(0)}%. ${equityPct < recommendedEquity ? "Consider increasing equity for long-term growth." : equityPct > recommendedEquity ? "You're more aggressive than the rule — ensure it matches your risk appetite." : "Nicely balanced."}`,
  });

  // Life insurance rule
  out.push({
    rule: "Life Insurance Rule",
    status: ins.termGap === 0 ? "good" : "bad",
    message:
      ins.termGap === 0
        ? `Your term cover of ${formatCurrency(ins.currentTermCover, d.profile.currency, true)} meets your target of ${formatCurrency(ins.recommendedTermCover, d.profile.currency, true)}.`
        : `Your term cover target is ${formatCurrency(ins.recommendedTermCover, d.profile.currency, true)} (${termCoverMultiple(d)}× income plus loans). You currently have ${formatCurrency(ins.currentTermCover, d.profile.currency, true)}.`,
  });

  // 20X freedom rule
  const corpus = totalInvestments(d);
  out.push({
    rule: "20X Annual Expense Rule",
    status: corpus >= freedomCorpus ? "good" : corpus >= freedomCorpus * 0.5 ? "warning" : "bad",
    message: `Financial freedom needs ~${formatCurrency(freedomCorpus, d.profile.currency, true)} (25x annual expenses). Your investment corpus is ${formatCurrency(corpus, d.profile.currency, true)} — ${((corpus / Math.max(freedomCorpus, 1)) * 100).toFixed(0)}% of the way there.`,
  });

  // 50-30-20 rule
  out.push({
    rule: "50-30-20 Rule",
    status: sr >= 20 ? "good" : "warning",
    message:
      sr >= 20
        ? `You save ${sr.toFixed(0)}% of income — meeting the 20% savings target of the 50-30-20 rule.`
        : `You save ${sr.toFixed(0)}% of income, below the 20% target. Trim wants to lift savings toward 20%.`,
  });

  return out;
}
