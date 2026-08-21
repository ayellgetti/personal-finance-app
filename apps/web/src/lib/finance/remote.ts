import { api, ApiError } from "@/lib/api";
import type { StoredUser } from "@/lib/auth/session";
import { getAccessToken, getRefreshToken } from "@/lib/auth/store";
import {
  EmploymentType,
  Expense,
  ExpenseCategory,
  Goal,
  GoalType,
  Income,
  IncomeType,
  Investment,
  InvestmentType,
  Loan,
  LoanType,
} from "@/types/finance";

type Paginated<T> = { items: T[] };

type ApiLoan = {
  id: string;
  title: string | null;
  type: string;
  principalPendingAmount: number;
  roi: number;
  remainingMonths: number;
  emiAmount: number;
  emiDay: number;
};

type ApiBudget = {
  id: string;
  type: string;
  subcategory: string;
  title: string;
  amount: number;
  monthDay: number | null;
  weekDay: number | null;
  repeatCount: number | null;
};

type ApiInvestment = {
  id: string;
  subcategory: string;
  title: string | null;
  accumulatedAmount: number;
  roi: number;
  remainingMonths: number;
  investmentAmount: number;
};

type ApiGoal = {
  id: string;
  category: string;
  subcategory?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingYears: number;
  targetYear: number;
};

const LOAN_TYPES: LoanType[] = [
  "Home Loan",
  "Personal Loan",
  "Business Loan",
  "Vehicle Loan",
  "Education Loan",
];

const LOAN_EMI_SUBCATEGORIES = new Set([
  "housing_loan",
  "housing_addon_loan",
  "personal_loan",
]);

const INCOME_TYPES: Record<string, IncomeType> = {
  salary: "Salary",
  rental: "Rental Income",
  dividend: "Dividend Income",
  freelance: "Freelancing Income",
  freelancing: "Freelancing Income",
  interest: "Interest Income",
  business: "Business Income",
};

const EXPENSE_CATEGORIES: Record<string, ExpenseCategory> = {
  rent: "House Rent / EMI",
  electricity_bill: "Electricity Bill",
  water_bill: "Water Bill",
  internet_bill: "Internet",
  mobile_bill: "Mobile",
  groceries: "Groceries",
  gas_bill: "Fuel",
  fuel: "Fuel",
  transportation: "Transportation",
  child_education: "School Fees",
  dining_out: "Dining Out",
  travel: "Travel",
  medical: "Medical",
  entertainment: "Entertainment",
};

const INVESTMENT_TYPES: Record<string, InvestmentType> = {
  fd: "Fixed Deposits",
  ppf: "PPF",
  nps: "NPS",
  epf: "EPF",
  mf: "Mutual Funds",
  stocks: "Stocks",
  gold: "Gold",
};

const GOAL_TYPES: Record<string, GoalType> = {
  emergency: "Emergency Fund",
  emergency_fund: "Emergency Fund",
  education: "Child Education",
  marriage: "Child Marriage",
  retirement: "Retirement",
  lean_fire: "Lean FIRE",
  fat_fire: "Fat FIRE",
  coast_fire: "Coast FIRE",
  full_fire: "Fat FIRE",
  wealth_fire: "Coast FIRE",
  home: "Dream Home",
  car: "Dream Car",
  vacation: "International Vacation",
  business: "Business Expansion",
};

const INCOME_SUBCATEGORIES: Record<IncomeType, string> = {
  Salary: "salary",
  "Business Income": "business",
  "Rental Income": "rental",
  "Dividend Income": "dividend",
  "Freelancing Income": "freelance",
  "Interest Income": "interest",
  "Other Income": "other",
};

const EXPENSE_SUBCATEGORIES: Record<ExpenseCategory, string> = {
  "House Rent / EMI": "rent",
  "Electricity Bill": "electricity_bill",
  "Water Bill": "water_bill",
  Internet: "internet_bill",
  Mobile: "mobile_bill",
  Groceries: "groceries",
  Fuel: "fuel",
  Transportation: "transportation",
  "LIC Premium": "lic_premium",
  "School Fees": "child_education",
  Entertainment: "entertainment",
  "Dining Out": "dining_out",
  Travel: "travel",
  Medical: "medical",
  Other: "other",
};

const INVESTMENT_SUBCATEGORIES: Record<InvestmentType, string> = {
  "Mutual Funds": "mf",
  Stocks: "stocks",
  Bonds: "bonds",
  "Fixed Deposits": "fd",
  PPF: "ppf",
  EPF: "epf",
  NPS: "nps",
  Gold: "gold",
  "Real Estate": "real_estate",
  Crypto: "crypto",
  Other: "other",
};

export type RemoteFinancialProfile = {
  retirementAge: number;
  dependents: number;
  inflationRate: number;
  employmentType: EmploymentType;
  currency: string;
};

export type RemoteFinance = {
  profile: RemoteFinancialProfile | null;
  incomes: Income[];
  expenses: Expense[];
  loans: Loan[];
  investments: Investment[];
  goals: Goal[];
};

function isSignedIn() {
  return Boolean(getAccessToken() || getRefreshToken());
}

async function listItems<T>(path: string): Promise<T[]> {
  if (!isSignedIn()) return [];
  try {
    const result = await api<Paginated<T>>(path);
    return result.items ?? [];
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw error;
    return [];
  }
}

function asLoanType(value: string): LoanType {
  return LOAN_TYPES.includes(value as LoanType) ? (value as LoanType) : "Personal Loan";
}

export function mapLoan(loan: ApiLoan, prepaymentAllowed = true): Loan {
  return {
    id: loan.id,
    name: loan.title?.trim() || loan.type || "Loan",
    type: asLoanType(loan.type),
    outstanding: loan.principalPendingAmount,
    interestRate: loan.roi,
    emi: loan.emiAmount,
    remainingTenure: loan.remainingMonths,
    emiDay: loan.emiDay,
    prepaymentAllowed,
  };
}

export function mapBudgetToIncome(budget: ApiBudget): Income {
  return {
    id: budget.id,
    name: budget.title,
    type: INCOME_TYPES[budget.subcategory] ?? "Other Income",
    monthlyAmount: budget.amount,
    growthRate: 0,
    startDate: new Date().toISOString().slice(0, 10),
  };
}

export function mapBudgetToExpense(budget: ApiBudget): Expense {
  return {
    id: budget.id,
    name: budget.title,
    category: EXPENSE_CATEGORIES[budget.subcategory] ?? "Other",
    amount: budget.amount,
    recurring: budget.monthDay != null || budget.weekDay != null || budget.repeatCount != null,
    date: new Date().toISOString().slice(0, 10),
  };
}

export function mapInvestment(item: ApiInvestment): Investment {
  return {
    id: item.id,
    name: item.title?.trim() || item.subcategory.toUpperCase(),
    type: INVESTMENT_TYPES[item.subcategory] ?? "Other",
    currentValue: item.accumulatedAmount,
    monthlySip: item.investmentAmount,
    expectedReturn: item.roi,
    horizon: Math.max(1, Math.round(item.remainingMonths / 12)),
  };
}

export function mapGoal(goal: ApiGoal): Goal {
  return {
    id: goal.id,
    name: goal.title,
    type:
      GOAL_TYPES[goal.subcategory ?? ""] ??
      GOAL_TYPES[goal.category] ??
      "Custom Goal",
    targetAmount: goal.targetAmount,
    currentSaved: goal.currentAmount,
    targetDate: `${goal.targetYear}-01-01`,
    priority: "High",
  };
}

export async function fetchAccountUser(): Promise<StoredUser | null> {
  if (!isSignedIn()) return null;
  const result = await api<{ user: StoredUser }>("/api/users/me");
  return result.user ?? null;
}

function asEmploymentType(value: string | undefined): EmploymentType {
  return value === "Business Owner" || value === "Freelancer" || value === "Retired" || value === "Salaried"
    ? value
    : "Salaried";
}

export function mapFinancialProfile(input: {
  retirementAge: number;
  dependents: number;
  inflationRate: number;
  employmentType: string;
  currency: string;
}): RemoteFinancialProfile {
  return {
    retirementAge: input.retirementAge,
    dependents: input.dependents,
    inflationRate: input.inflationRate,
    employmentType: asEmploymentType(input.employmentType),
    currency: input.currency || "₹",
  };
}

export async function fetchRemoteFinancialProfile(): Promise<RemoteFinancialProfile | null> {
  if (!isSignedIn()) return null;
  const result = await api<{ financialProfile: Parameters<typeof mapFinancialProfile>[0] }>("/api/financial-profile");
  return result.financialProfile ? mapFinancialProfile(result.financialProfile) : null;
}

export async function upsertRemoteFinancialProfile(
  input: RemoteFinancialProfile,
): Promise<RemoteFinancialProfile> {
  if (!isSignedIn()) throw new Error("Not signed in");
  const result = await api<{ financialProfile: Parameters<typeof mapFinancialProfile>[0] }>("/api/financial-profile", {
    method: "PUT",
    body: input,
  });
  return mapFinancialProfile(result.financialProfile);
}

export async function fetchRemoteFinance(): Promise<RemoteFinance> {
  const empty: RemoteFinance = {
    profile: null,
    incomes: [],
    expenses: [],
    loans: [],
    investments: [],
    goals: [],
  };
  if (!isSignedIn()) return empty;

  const [loans, budgets, investments, goals, profile] = await Promise.all([
    listItems<ApiLoan>("/api/loans?limit=100"),
    listItems<ApiBudget>("/api/budgets?limit=100"),
    listItems<ApiInvestment>("/api/investments?limit=100"),
    listItems<ApiGoal>("/api/goals?limit=100"),
    fetchRemoteFinancialProfile().catch(() => null),
  ]);

  return {
    profile,
    loans: loans.map((loan) => mapLoan(loan)),
    incomes: budgets.filter((b) => b.type === "income").map(mapBudgetToIncome),
    expenses: budgets
      .filter((b) => b.type === "expense" && !LOAN_EMI_SUBCATEGORIES.has(b.subcategory))
      .map(mapBudgetToExpense),
    investments: investments.map(mapInvestment),
    goals: goals.map(mapGoal),
  };
}

export function loanToApiBody(input: Loan) {
  return {
    title: input.name?.trim() || null,
    type: input.type,
    principalPendingAmount: Number(input.outstanding) || 0,
    roi: Number(input.interestRate) || 0,
    remainingMonths: Number(input.remainingTenure) || 0,
    emiAmount: Number(input.emi) || 0,
    emiDay: Number(input.emiDay) || 5,
  };
}

export async function createRemoteLoan(input: Loan): Promise<Loan> {
  if (!isSignedIn()) throw new Error("Not signed in");
  const result = await api<{ loan: ApiLoan }>("/api/loans", {
    method: "POST",
    body: loanToApiBody(input),
  });
  return mapLoan(result.loan, input.prepaymentAllowed);
}

export async function updateRemoteLoan(id: string, input: Loan): Promise<Loan> {
  if (!isSignedIn()) throw new Error("Not signed in");
  const result = await api<{ loan: ApiLoan }>(`/api/loans/${id}`, {
    method: "PATCH",
    body: loanToApiBody(input),
  });
  return mapLoan(result.loan, input.prepaymentAllowed);
}

export async function removeRemoteLoan(id: string): Promise<void> {
  if (!isSignedIn()) throw new Error("Not signed in");
  await api("/api/loans/remove", {
    method: "POST",
    body: { id },
  });
}

export async function createRemoteIncome(input: Income): Promise<Income> {
  if (!isSignedIn()) throw new Error("Not signed in");
  const result = await api<{ budget: ApiBudget }>("/api/budgets", {
    method: "POST",
    body: {
      type: "income",
      category: "income",
      subcategory: INCOME_SUBCATEGORIES[input.type] ?? "other",
      title: input.name.trim() || "Income",
      amount: Number(input.monthlyAmount) || 0,
      monthDay: 1,
    },
  });
  return mapBudgetToIncome(result.budget);
}

export async function createRemoteExpense(input: Expense): Promise<Expense> {
  if (!isSignedIn()) throw new Error("Not signed in");
  const result = await api<{ budget: ApiBudget }>("/api/budgets", {
    method: "POST",
    body: {
      type: "expense",
      category: "expense",
      subcategory: EXPENSE_SUBCATEGORIES[input.category] ?? "other",
      title: input.name.trim() || "Expense",
      amount: Number(input.amount) || 0,
      monthDay: input.recurring ? 1 : null,
    },
  });
  return mapBudgetToExpense(result.budget);
}

export async function removeRemoteBudget(id: string): Promise<void> {
  if (!isSignedIn()) throw new Error("Not signed in");
  await api("/api/budgets/remove", {
    method: "POST",
    body: { id },
  });
}

export async function createRemoteInvestment(input: Investment): Promise<Investment> {
  if (!isSignedIn()) throw new Error("Not signed in");
  const result = await api<{ investment: ApiInvestment }>("/api/investments", {
    method: "POST",
    body: {
      category: "investment",
      subcategory: INVESTMENT_SUBCATEGORIES[input.type] ?? "other",
      title: input.name.trim() || "Investment",
      accumulatedAmount: Number(input.currentValue) || 0,
      roi: Number(input.expectedReturn) || 0,
      remainingMonths: Math.min(600, Math.max(1, Math.round(Number(input.horizon) || 1) * 12)),
      investmentAmount: Number(input.monthlySip) || 0,
      monthDay: 1,
    },
  });
  return mapInvestment(result.investment);
}

export async function removeRemoteInvestment(id: string): Promise<void> {
  if (!isSignedIn()) throw new Error("Not signed in");
  await api("/api/investments/remove", {
    method: "POST",
    body: { id },
  });
}

const GOAL_API_IDENTITY: Record<GoalType, { category: string; subcategory: string }> = {
  "Emergency Fund": { category: "emergency", subcategory: "emergency_fund" },
  "Lean FIRE": { category: "retirement", subcategory: "lean_fire" },
  "Fat FIRE": { category: "retirement", subcategory: "fat_fire" },
  "Coast FIRE": { category: "retirement", subcategory: "coast_fire" },
  "Dream Home": { category: "home", subcategory: "dream_home" },
  "Dream Car": { category: "car", subcategory: "dream_car" },
  "Child Education": { category: "education", subcategory: "child_education" },
  "Child Marriage": { category: "marriage", subcategory: "child_marriage" },
  Retirement: { category: "retirement", subcategory: "retirement" },
  "International Vacation": { category: "vacation", subcategory: "international_vacation" },
  "Business Expansion": { category: "business", subcategory: "business_expansion" },
  "Custom Goal": { category: "custom", subcategory: "custom" },
};

function goalToApiBody(input: Goal) {
  const targetYear = new Date(input.targetDate).getFullYear();
  const safeTargetYear = Number.isFinite(targetYear)
    ? targetYear
    : new Date().getFullYear() + 1;
  return {
    ...GOAL_API_IDENTITY[input.type],
    title: input.name.trim() || input.type,
    targetAmount: Number(input.targetAmount) || 0,
    currentAmount: Number(input.currentSaved) || 0,
    remainingYears: Math.max(0, safeTargetYear - new Date().getFullYear()),
    targetYear: safeTargetYear,
  };
}

export async function createRemoteGoal(input: Goal): Promise<Goal> {
  if (!isSignedIn()) throw new Error("Not signed in");
  const result = await api<{ goal: ApiGoal }>("/api/goals", {
    method: "POST",
    body: goalToApiBody(input),
  });
  return mapGoal(result.goal);
}

export async function updateRemoteGoal(id: string, input: Goal): Promise<Goal> {
  if (!isSignedIn()) throw new Error("Not signed in");
  const result = await api<{ goal: ApiGoal }>(`/api/goals/${id}`, {
    method: "PATCH",
    body: goalToApiBody(input),
  });
  return mapGoal(result.goal);
}

export async function removeRemoteGoal(id: string): Promise<void> {
  if (!isSignedIn()) throw new Error("Not signed in");
  await api("/api/goals/remove", {
    method: "POST",
    body: { id },
  });
}
