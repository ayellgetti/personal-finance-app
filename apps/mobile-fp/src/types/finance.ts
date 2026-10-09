export type Budget = {
  id: string;
  type: "income" | "expense";
  category: string;
  subcategory: string;
  title: string;
  amount: number;
  monthDay: number | null;
  weekDay: number | null;
  repeatCount: number | null;
};

export type Loan = {
  id: string;
  title: string | null;
  type: string;
  principalPendingAmount: number;
  roi: number;
  remainingMonths: number;
  emiAmount: number;
  emiDay: number;
};

export type Investment = {
  id: string;
  category: string;
  subcategory: string;
  title: string | null;
  accumulatedAmount: number;
  roi: number;
  remainingMonths: number;
  investmentAmount: number;
  monthDay: number;
  onHold?: boolean;
};

export type Insurance = {
  id: string;
  title: string | null;
  type: string;
  coverageAmount: number;
  annualPremium: number;
  expiryDate: string;
};

export type Goal = {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  description?: string | null;
  targetAmount: number;
  currentAmount: number;
  remainingYears: number;
  targetYear: number;
};

export type FinancialProfile = {
  retirementAge: number;
  dependents: number;
  inflationRate: number;
  employmentType: "Salaried" | "Business Owner" | "Freelancer" | "Retired";
  currency: string;
  familyMembers: Array<{
    name: string;
    relationship: "Spouse" | "Child" | "Parent" | "Sibling" | "Other";
    dob: string;
    gender: "female" | "male" | "other";
    occupation: string;
  }>;
};

export type PlannerReport = {
  generatedAt: string;
  cashflow: {
    income: number;
    salary: number;
    rental: number;
    livingExpenses: number;
    loanEmis: number;
    investments: number;
    totalOutflow: number;
    surplus: number;
    savingsRatePct: number | null;
    discretionary: number;
    incomeRecorded: boolean;
    sipsOnHold: boolean;
    pausedSip: number;
    outflowLines: Array<{
      bucket: "emi" | "living" | "sip";
      label: string;
      amount: number;
      note: string | null;
    }>;
  };
  netWorth: {
    investmentCorpus: number;
    liabilities: number;
    netExcludingProperty: number;
    remainingInterestEstimate: number;
  };
  goals: {
    fireType: string | null;
    fireTarget: number;
    fireCorpus: number;
    fireProgressPct: number;
    allGoalsTarget: number;
    projectedCorpusAtFireYear: number;
    fireGap: number;
    items: Array<{
      category: string;
      subcategory: string;
      targetAmount: number;
      currentAmount: number;
      remainingYears: number;
      targetYear: number;
    }>;
    emergencyFund: {
      targetAmount: number;
      currentAmount: number;
      remainingYears: number;
      targetYear: number;
    } | null;
  };
  liabilityPlan: {
    avalanche: Array<{
      label: string;
      roi: number;
      principal: number;
      emi: number;
      remainingMonths: number;
      action: string;
    }>;
  };
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    title: string;
    detail: string;
  }>;
};

export type FinanceSnapshot = {
  budgets: Budget[];
  loans: Loan[];
  investments: Investment[];
  insurances: Insurance[];
  goals: Goal[];
  profile: FinancialProfile | null;
  planner: PlannerReport | null;
};
