import type { FinanceData } from "@/types/finance";
import {
  dataReadiness,
  healthScore,
  monthlyExpenses,
  monthlyIncome,
  netWorth,
  totalAssets,
  totalLiabilities,
} from "./calculations";

export interface CheckInInput {
  month: string; // YYYY-MM
  netWorth: number;
  assets: number;
  liabilities: number;
  monthlyIncome: number;
  monthlyExpense: number;
  healthScore: number;
}

export interface CheckIn extends CheckInInput {
  id: string;
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/** The five numbers a check-in records, taken from the user's saved data. Null until there is enough data. */
export function buildCheckIn(data: FinanceData, now = new Date()): CheckInInput | null {
  if (!dataReadiness(data).ready) return null;
  return {
    month: monthKey(now),
    netWorth: Math.round(netWorth(data)),
    assets: Math.round(totalAssets(data)),
    liabilities: Math.round(totalLiabilities(data)),
    monthlyIncome: Math.round(monthlyIncome(data)),
    monthlyExpense: Math.round(monthlyExpenses(data)),
    healthScore: healthScore(data).total,
  };
}

/** History sorted oldest to newest, for charts. */
export function chronological(history: CheckIn[]): CheckIn[] {
  return [...history].sort((a, b) => a.month.localeCompare(b.month));
}

export interface Milestone {
  label: string;
  /** Month the milestone was first reached, or null while it is still ahead. */
  reachedIn: string | null;
}

const MILESTONES: { label: string; reached: (c: CheckIn) => boolean }[] = [
  { label: "First ₹1 L net worth", reached: (c) => c.netWorth >= 100_000 },
  { label: "₹10 L net worth", reached: (c) => c.netWorth >= 1_000_000 },
  { label: "Health score 50 or more", reached: (c) => c.healthScore >= 50 },
  { label: "Health score 75 or more", reached: (c) => c.healthScore >= 75 },
];

export function milestones(history: CheckIn[]): Milestone[] {
  const ordered = chronological(history);
  return MILESTONES.map(({ label, reached }) => ({
    label,
    reachedIn: ordered.find(reached)?.month ?? null,
  }));
}

export interface YearOverYear {
  from: CheckIn;
  to: CheckIn;
  netWorthChange: number;
  scoreChange: number;
}

/** Latest check-in against the same month a year earlier; null when that month was not recorded. */
export function yearOverYear(history: CheckIn[]): YearOverYear | null {
  const ordered = chronological(history);
  const to = ordered[ordered.length - 1];
  if (!to) return null;
  const [year, month] = to.month.split("-");
  const from = ordered.find((c) => c.month === `${Number(year) - 1}-${month}`);
  if (!from) return null;
  return { from, to, netWorthChange: to.netWorth - from.netWorth, scoreChange: to.healthScore - from.healthScore };
}

/** True when the current month has no check-in yet. */
export function checkInDue(history: CheckIn[], now = new Date()): boolean {
  return !history.some((c) => c.month === monthKey(now));
}
