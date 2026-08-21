export type ID = string;

export type IncomeType =
  | "Salary"
  | "Business Income"
  | "Rental Income"
  | "Dividend Income"
  | "Freelancing Income"
  | "Interest Income"
  | "Other Income";

export interface Income {
  id: ID;
  name: string;
  type: IncomeType;
  monthlyAmount: number;
  growthRate: number; // % annual
  startDate: string;
}

export type ExpenseCategory =
  | "House Rent / EMI"
  | "Electricity Bill"
  | "Water Bill"
  | "Internet"
  | "Mobile"
  | "Groceries"
  | "Fuel"
  | "Transportation"
  | "LIC Premium"
  | "School Fees"
  | "Entertainment"
  | "Dining Out"
  | "Travel"
  | "Medical"
  | "Other";

export interface Expense {
  id: ID;
  name: string;
  category: ExpenseCategory;
  amount: number;
  recurring: boolean; // true = monthly recurring, false = one-time
  date: string;
}

export type LoanType =
  | "Home Loan"
  | "Personal Loan"
  | "Business Loan"
  | "Vehicle Loan"
  | "Education Loan";

export interface Loan {
  id: ID;
  name: string;
  type: LoanType;
  outstanding: number;
  interestRate: number; // % annual
  emi: number;
  remainingTenure: number; // months
  emiDay: number; // day of the month EMI is due (1–31)
  prepaymentAllowed: boolean;
}

export type InvestmentType =
  | "Mutual Funds"
  | "Stocks"
  | "Bonds"
  | "Fixed Deposits"
  | "PPF"
  | "EPF"
  | "NPS"
  | "Gold"
  | "Real Estate"
  | "Crypto"
  | "Other";

export interface Investment {
  id: ID;
  name: string;
  type: InvestmentType;
  currentValue: number;
  monthlySip: number;
  expectedReturn: number; // % annual
  horizon: number; // years
}

export type InsuranceType =
  | "Term Insurance"
  | "Health Insurance"
  | "Car Insurance"
  | "Bike Insurance"
  | "Home Insurance";

export interface Insurance {
  id: ID;
  name: string;
  type: InsuranceType;
  coverage: number;
  annualPremium: number;
  expiryDate: string;
}

export type GoalType =
  | "Emergency Fund"
  | "Lean FIRE"
  | "Fat FIRE"
  | "Coast FIRE"
  | "Dream Home"
  | "Dream Car"
  | "Child Education"
  | "Child Marriage"
  | "Retirement"
  | "International Vacation"
  | "Business Expansion"
  | "Custom Goal";

export const EMERGENCY_FUND_GOAL_ID = "emergency-fund";
export const FIRE_GOAL_TYPES = [
  "Lean FIRE",
  "Fat FIRE",
  "Coast FIRE",
] as const satisfies readonly GoalType[];
export const USER_GOAL_TYPES: GoalType[] = [
  ...FIRE_GOAL_TYPES,
  "Emergency Fund",
  "Dream Home",
  "Dream Car",
  "Child Education",
  "Child Marriage",
  "Retirement",
  "International Vacation",
  "Business Expansion",
  "Custom Goal",
];

export type Priority = "High" | "Medium" | "Low";

export interface Goal {
  id: ID;
  name: string;
  type: GoalType;
  targetAmount: number;
  targetDate: string;
  priority: Priority;
  currentSaved: number;
}

export type EmploymentType = "Salaried" | "Business Owner" | "Freelancer" | "Retired";

export interface Profile {
  name: string;
  age: number;
  retirementAge: number;
  currency: string;
  inflationRate: number; // %
  emergencyFund: number;
  dependents: number;
  employmentType: EmploymentType;
  monthlyEssentialExpenses: number; // 0 = auto-derive from expenses
  liquidAssets: number; // FD, liquid funds available for emergencies
  emergencyMonthlyContribution: number; // planned monthly top-up
  dailyBudget: number; // monthly budget for daily spending tracker
}

export type DailyCategory =
  | "Food"
  | "Fuel"
  | "Shopping"
  | "Transport"
  | "Bills"
  | "Entertainment"
  | "Medical"
  | "Other";

export interface DailyExpense {
  id: ID;
  amount: number;
  category: DailyCategory;
  notes: string;
  date: string; // ISO datetime
}

export interface FinanceData {
  profile: Profile;
  incomes: Income[];
  expenses: Expense[];
  loans: Loan[];
  investments: Investment[];
  insurances: Insurance[];
  goals: Goal[];
  dailyExpenses: DailyExpense[];
}

export type Scenario = "Conservative" | "Moderate" | "Aggressive";
