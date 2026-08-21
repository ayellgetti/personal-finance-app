import {
  EMERGENCY_FUND_CATEGORY,
  EMERGENCY_FUND_SUBCATEGORY,
} from "../goal/goal.constants";

const LOAN_BUDGET_SUBCATEGORIES = new Set([
  "housing_loan",
  "housing_addon_loan",
  "personal_loan",
]);

export type PlannerBudget = {
  id: string;
  type: string;
  subcategory: string;
  title: string;
  amount: number;
  monthDay: number | null;
  weekDay: number | null;
  repeatCount: number | null;
};

export type PlannerLoan = {
  id: string;
  title: string | null;
  type: string;
  principalPendingAmount: number;
  roi: number;
  remainingMonths: number;
  emiAmount: number;
  emiDay: number;
};

export type PlannerInvestment = {
  id: string;
  subcategory: string;
  title: string | null;
  accumulatedAmount: number;
  roi: number;
  remainingMonths: number;
  investmentAmount: number;
  monthDay: number;
  onHold: boolean;
};

export type PlannerGoal = {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingYears: number;
  targetYear: number;
};

export type PlannerRecommendation = {
  priority: "high" | "medium" | "low";
  title: string;
  detail: string;
};

export type PlannerOutflowLine = {
  bucket: "emi" | "living" | "sip";
  label: string;
  amount: number;
  note: string | null;
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
    outflowLines: PlannerOutflowLine[];
  };
  netWorth: {
    investmentCorpus: number;
    liabilities: number;
    netExcludingProperty: number;
    remainingInterestEstimate: number;
  };
  goals: {
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
      category: string;
      subcategory: string;
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
      remainingInterestEstimate: number;
      action: string;
    }>;
    scheduledEmiByYear: Array<{ year: number; monthlyEmi: number }>;
    avalancheEmiByYear: Array<{ year: number; monthlyEmi: number }>;
    surplusEmiByYear: Array<{ year: number; monthlyEmi: number }>;
    debtFreeMonthScheduled: number;
    debtFreeMonthAvalanche: number;
    debtFreeMonthWithSurplus: number;
    surplusApplied: number;
    scenarios: Array<{
      id: "scheduled" | "recycle" | "surplus";
      label: string;
      monthlyExtra: number;
      debtFreeMonth: number;
      monthsSavedVsScheduled: number;
      estimatedInterestPaid: number;
      interestSavedVsScheduled: number;
      totalPaid: number;
    }>;
    investmentResumeMilestone: {
      trigger: string;
      estimatedMonth: number;
      monthlyAmount: number;
    };
  };
  recommendations: PlannerRecommendation[];
};

function monthlyBudgetAmount(budget: PlannerBudget): number {
  if (budget.weekDay && budget.repeatCount && budget.repeatCount > 1) {
    return budget.amount * budget.repeatCount;
  }
  return budget.amount;
}

function loanLabel(loan: PlannerLoan, index: number): string {
  if (loan.title?.trim()) {
    return loan.title.trim();
  }
  if (loan.type?.trim()) {
    return loan.type.trim();
  }
  if (loan.roi === 0) {
    return "Interest-free personal";
  }
  if (loan.roi >= 10) {
    return `Personal ${loan.roi}%`;
  }
  if (loan.emiDay === 10 && loan.roi < 8) {
    return loan.principalPendingAmount > 3_000_000 ? "Housing" : "Housing addon";
  }
  return `Loan ${index + 1}`;
}

function remainingInterest(loan: PlannerLoan): number {
  return Math.max(0, loan.emiAmount * loan.remainingMonths - loan.principalPendingAmount);
}

type SimLoan = {
  id: string;
  label: string;
  principal: number;
  roi: number;
  emi: number;
  remainingMonths: number;
  skipPrepay: boolean;
};

function cloneLoans(loans: PlannerLoan[]): SimLoan[] {
  return loans.map((loan, index) => ({
    id: loan.id,
    label: loanLabel(loan, index),
    principal: loan.principalPendingAmount,
    roi: loan.roi,
    emi: loan.emiAmount,
    remainingMonths: loan.remainingMonths,
    skipPrepay: loan.roi === 0,
  }));
}

function simulateEmiPath(
  loans: PlannerLoan[],
  recycle: boolean,
  surplusPerMonth = 0,
  months = 180,
) {
  const state = cloneLoans(loans);
  const byYear = new Map<number, number>();
  const payoffMonths = new Map<string, number>();
  let extraMonthly = 0;
  let debtFreeMonth = months;
  let interestPaid = 0;
  let totalPaid = 0;

  for (let month = 1; month <= months; month += 1) {
    let paid = 0;

    for (const loan of state) {
      if (loan.principal <= 0) {
        continue;
      }
      const scheduled = loan.emi;
      const interest = loan.principal * (loan.roi / 100 / 12);
      interestPaid += interest;
      loan.principal += interest;
      const payment = Math.min(scheduled, loan.principal);
      loan.principal = Math.max(0, loan.principal - payment);
      loan.remainingMonths = Math.max(0, loan.remainingMonths - 1);
      paid += payment;
      totalPaid += payment;
      if (loan.principal <= 1 || loan.remainingMonths <= 0) {
        extraMonthly += scheduled;
        payoffMonths.set(loan.id, month);
        loan.principal = 0;
        loan.remainingMonths = 0;
        loan.emi = 0;
      }
    }

    let prepayPool = recycle ? extraMonthly + surplusPerMonth : 0;

    while (prepayPool > 0) {
      const target = state
        .filter((loan) => loan.principal > 0 && !loan.skipPrepay)
        .sort((a, b) => b.roi - a.roi)[0];
      if (!target) {
        break;
      }
      const extra = Math.min(prepayPool, target.principal);
      target.principal -= extra;
      prepayPool -= extra;
      paid += extra;
      totalPaid += extra;
      if (target.principal <= 1) {
        extraMonthly += target.emi;
        payoffMonths.set(target.id, month);
        target.principal = 0;
        target.remainingMonths = 0;
        target.emi = 0;
      }
    }

    const year = Math.ceil(month / 12);
    if (!byYear.has(year)) {
      byYear.set(year, Math.round(paid));
    }

    if (state.every((loan) => loan.principal <= 0)) {
      debtFreeMonth = month;
      break;
    }
  }

  return {
    byYear: [...byYear.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, monthlyEmi]) => ({ year, monthlyEmi })),
    debtFreeMonth,
    interestPaid: Math.round(interestPaid),
    totalPaid: Math.round(totalPaid),
    payoffMonths: Object.fromEntries(payoffMonths),
  };
}

function projectCorpus(
  investments: PlannerInvestment[],
  years: number,
): number {
  const corpus0 = investments.reduce((sum, item) => sum + item.accumulatedAmount, 0);
  const sip = investments
    .filter((item) => !item.onHold)
    .reduce((sum, item) => sum + item.investmentAmount, 0);
  const weight = investments.reduce(
    (sum, item) => sum + item.accumulatedAmount * item.roi,
    0,
  );
  const blendedRoi = corpus0 > 0 ? weight / corpus0 / 100 : 0.08;
  let corpus = corpus0;
  for (let year = 0; year < years; year += 1) {
    corpus = corpus * (1 + blendedRoi) + sip * 12;
  }
  return Math.round(corpus);
}

export function buildPlannerReport(input: {
  budgets: PlannerBudget[];
  loans: PlannerLoan[];
  investments: PlannerInvestment[];
  goals: PlannerGoal[];
}): PlannerReport {
  const incomeItems = input.budgets.filter(
    (budget) => budget.type === "income" || budget.subcategory === "salary" || budget.subcategory === "rental",
  );
  const expenseBudgets = input.budgets.filter(
    (budget) =>
      budget.type !== "income" &&
      budget.subcategory !== "salary" &&
      budget.subcategory !== "rental" &&
      !LOAN_BUDGET_SUBCATEGORIES.has(budget.subcategory),
  );
  const living = expenseBudgets.reduce(
    (sum, budget) => sum + monthlyBudgetAmount(budget),
    0,
  );
  const income = incomeItems.reduce(
    (sum, budget) => sum + monthlyBudgetAmount(budget),
    0,
  );
  const salary = incomeItems
    .filter((budget) => budget.subcategory === "salary")
    .reduce((sum, budget) => sum + monthlyBudgetAmount(budget), 0);
  const rental = incomeItems
    .filter((budget) => budget.subcategory === "rental")
    .reduce((sum, budget) => sum + monthlyBudgetAmount(budget), 0);
  const loanEmis = input.loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  const pausedSip = input.investments
    .filter((item) => item.onHold)
    .reduce((sum, item) => sum + item.investmentAmount, 0);
  const sip = input.investments
    .filter((item) => !item.onHold)
    .reduce((sum, item) => sum + item.investmentAmount, 0);
  const sipsOnHold = pausedSip > 0 && sip === 0;
  const discretionary = expenseBudgets
    .filter((budget) => ["dining_out", "travel"].includes(budget.subcategory))
    .reduce((sum, budget) => sum + monthlyBudgetAmount(budget), 0);
  const totalOutflow = living + loanEmis + sip;
  const surplus = income - totalOutflow;
  const incomeRecorded = income > 0;
  const savingsRatePct = incomeRecorded
    ? Math.round((surplus / income) * 1000) / 10
    : null;
  const outflowLines: PlannerOutflowLine[] = [
    ...input.loans.map((loan, index) => ({
      bucket: "emi" as const,
      label: loanLabel(loan, index),
      amount: Math.round(loan.emiAmount),
      note: `${loan.roi}% · ${loan.remainingMonths} mo left`,
    })),
    ...expenseBudgets.map((budget) => ({
      bucket: "living" as const,
      label: budget.title,
      amount: Math.round(monthlyBudgetAmount(budget)),
      note:
        budget.weekDay && budget.repeatCount && budget.repeatCount > 1
          ? `${budget.repeatCount} × ₹${Math.round(budget.amount).toLocaleString("en-IN")}`
          : null,
    })),
    ...input.investments
      .filter((item) => item.investmentAmount > 0 && !item.onHold)
      .map((item) => ({
        bucket: "sip" as const,
        label: item.title?.trim() || item.subcategory.toUpperCase(),
        amount: Math.round(item.investmentAmount),
        note: item.subcategory.toUpperCase(),
      })),
  ].sort((a, b) => b.amount - a.amount);

  const corpus = input.investments.reduce((sum, item) => sum + item.accumulatedAmount, 0);
  const liabilities = input.loans.reduce((sum, loan) => sum + loan.principalPendingAmount, 0);
  const interest = input.loans.reduce((sum, loan) => sum + remainingInterest(loan), 0);

  const fireGoal = input.goals.find((goal) => goal.category === "retirement");
  const emergencyFundGoal = input.goals.find(
    (goal) =>
      goal.category === EMERGENCY_FUND_CATEGORY ||
      goal.subcategory === EMERGENCY_FUND_SUBCATEGORY,
  );
  const goalItems = input.goals.map((goal) => ({
    category: goal.category,
    subcategory: goal.subcategory,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    remainingYears: goal.remainingYears,
    targetYear: goal.targetYear,
  }));
  const fireTarget = fireGoal?.targetAmount ?? 0;
  const fireYears = fireGoal?.remainingYears ?? 11;
  const allGoalsTarget = input.goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const projected = projectCorpus(input.investments, fireYears);

  const avalanche = [...input.loans]
    .sort((a, b) => b.roi - a.roi)
    .map((loan, index) => {
      const skip = loan.roi === 0;
      return {
        label: loanLabel(loan, index),
        roi: loan.roi,
        principal: loan.principalPendingAmount,
        emi: loan.emiAmount,
        remainingMonths: loan.remainingMonths,
        remainingInterestEstimate: Math.round(remainingInterest(loan)),
        action: skip
          ? "Do not prepay. Redirect this EMI when the term ends."
          : loan.roi >= 10
            ? "Avalanche target. Send every freed rupee here first."
            : "Keep the EMI. Prepay only after double-digit personal loans are gone.",
      };
    });

  const surplusApplied = Math.max(0, Math.round(surplus));
  const scheduled = simulateEmiPath(input.loans, false);
  const recycled = simulateEmiPath(input.loans, true);
  const withSurplus = simulateEmiPath(input.loans, true, surplusApplied);
  const scenarios: PlannerReport["liabilityPlan"]["scenarios"] = [
    {
      id: "scheduled",
      label: "Scheduled minimum EMIs",
      monthlyExtra: 0,
      debtFreeMonth: scheduled.debtFreeMonth,
      monthsSavedVsScheduled: 0,
      estimatedInterestPaid: scheduled.interestPaid,
      interestSavedVsScheduled: 0,
      totalPaid: scheduled.totalPaid,
    },
    {
      id: "recycle",
      label: "Recycle finished EMIs",
      monthlyExtra: 0,
      debtFreeMonth: recycled.debtFreeMonth,
      monthsSavedVsScheduled: Math.max(
        0,
        scheduled.debtFreeMonth - recycled.debtFreeMonth,
      ),
      estimatedInterestPaid: recycled.interestPaid,
      interestSavedVsScheduled: Math.max(
        0,
        scheduled.interestPaid - recycled.interestPaid,
      ),
      totalPaid: recycled.totalPaid,
    },
    {
      id: "surplus",
      label: "Recycle EMIs plus monthly surplus",
      monthlyExtra: surplusApplied,
      debtFreeMonth: withSurplus.debtFreeMonth,
      monthsSavedVsScheduled: Math.max(
        0,
        scheduled.debtFreeMonth - withSurplus.debtFreeMonth,
      ),
      estimatedInterestPaid: withSurplus.interestPaid,
      interestSavedVsScheduled: Math.max(
        0,
        scheduled.interestPaid - withSurplus.interestPaid,
      ),
      totalPaid: withSurplus.totalPaid,
    },
  ];
  const resumeLoan = [...input.loans].sort((a, b) => b.roi - a.roi)[0];
  const resumeMonth = resumeLoan
    ? (withSurplus.payoffMonths[resumeLoan.id] ?? withSurplus.debtFreeMonth)
    : 0;
  const investmentResumeMilestone = {
    trigger: resumeLoan
      ? `After the ${resumeLoan.roi}% highest-rate loan is cleared`
      : "No active debt; investments can be reviewed now",
    estimatedMonth: resumeMonth,
    monthlyAmount: Math.round(pausedSip),
  };

  const recommendations: PlannerRecommendation[] = [];

  if (!incomeRecorded) {
    recommendations.push({
      priority: "high",
      title: "Income is missing from the model",
      detail:
        "Salary or business profit is not stored yet, so savings rate and FIRE feasibility cannot be certified. Add income before treating surplus as investable.",
    });
  } else if (surplus < 0) {
    recommendations.push({
      priority: "high",
      title: "Monthly cashflow is negative",
      detail: `Recorded income is ₹${Math.round(income).toLocaleString("en-IN")} against committed outflow of ₹${Math.round(totalOutflow).toLocaleString("en-IN")}. Close the ₹${Math.round(Math.abs(surplus)).toLocaleString("en-IN")} gap before treating SIPs or extra EMI as surplus. Loan EMIs alone are ₹${Math.round(loanEmis).toLocaleString("en-IN")}.`,
    });
    if (rental > 0) {
      recommendations.push({
        priority: "medium",
        title: "Rental income is already working",
        detail:
          "The two rental lines more than cover the rent expense. Trim living costs or the remaining personal EMI before extra housing prepayments.",
      });
    }
  } else {
    recommendations.push({
      priority: "high",
      title: "Send surplus at the highest-rate loan first",
      detail: `After living costs, EMIs, and SIPs, about ₹${Math.round(surplus).toLocaleString("en-IN")} is left. Point it at the highest-rate remaining loan, not housing.`,
    });
  }

  const highestRateLoan = [...input.loans].sort((a, b) => b.roi - a.roi)[0];
  const expensiveLoans = input.loans.filter((loan) => loan.roi >= 10);
  const zeroRoiLoans = input.loans.filter((loan) => loan.roi === 0);
  const personalLoans = input.loans.filter((loan) => loan.roi >= 10 || loan.roi === 0);
  const hasBusinessExpense = expenseBudgets.some(
    (budget) => budget.subcategory === "business_expenses",
  );

  recommendations.push(
    ...(zeroRoiLoans.length
      ? [
          {
            priority: "high" as const,
            title: "Do not prepay the 0% personal loan",
            detail:
              "That EMI is interest-free. Let it run, then point the whole EMI at the highest-rate remaining loan.",
          },
        ]
      : []),
    ...(expensiveLoans.length
      ? [
          {
            priority: "high" as const,
            title: `Avalanche the ${expensiveLoans.map((loan) => `${loan.roi}%`).join(" and ")} loan${expensiveLoans.length > 1 ? "s" : ""}`,
            detail:
              "These are the highest rates on the books. Killing them is the fastest way to shrink the EMI load.",
          },
        ]
      : highestRateLoan
        ? [
            {
              priority: "high" as const,
              title: `Avalanche the ${highestRateLoan.roi}% loan first`,
              detail:
                "Send every freed rupee to the highest remaining rate. Do not overpay cheaper housing until that EMI is gone.",
            },
          ]
        : []),
    {
      priority: "medium",
      title: personalLoans.length
        ? "Hold housing EMIs after personal debt"
        : "Keep housing EMIs; do not starve SIPs",
      detail:
        "Housing at 7.35% / 7.5% is likely cheaper than giving up equity. Keep paying scheduled EMIs.",
    },
    {
      priority: "medium",
      title: sipsOnHold
        ? "SIPs are on hold"
        : "Keep PPF, EPF, and NPS running",
      detail: sipsOnHold
        ? `PPF, NPS, and EPF contributions of ₹${Math.round(pausedSip).toLocaleString("en-IN")} / month are paused. Corpus still compounds. Resume SIPs after the highest-rate personal loan is gone, or FIRE stays corpus-only.`
        : "Monthly SIPs are the only compounding engine on record. Pausing them to overpay cheap housing slows FIRE more than it helps.",
    },
    ...(hasBusinessExpense
      ? [
          {
            priority: "medium" as const,
            title: "Review business expenses",
            detail: highestRateLoan
              ? `Business spend is a large living-cost line. If it is cost of earning, keep it; if it is leak, that cash should hit the ${highestRateLoan.roi}% loan.`
              : "Business spend is a large living-cost line. If it is leak, that cash should go to SIPs or housing prepay.",
          },
        ]
      : []),
    {
      priority: "low",
      title: "Record house value",
      detail:
        "Net worth excluding property is deeply negative because the home asset is not on the books. Add property value to see true equity.",
    },
  );

  if (discretionary > 0) {
    recommendations.push({
      priority: "low",
      title: "Discretionary spend is optional fuel",
      detail: highestRateLoan
        ? `Dining out and travel can be redirected for a few months to accelerate the ${highestRateLoan.roi}% payoff without touching housing or SIPs.`
        : "Dining out and travel can be redirected for a few months without touching housing or SIPs.",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    cashflow: {
      income: Math.round(income),
      salary: Math.round(salary),
      rental: Math.round(rental),
      livingExpenses: Math.round(living),
      loanEmis: Math.round(loanEmis),
      investments: Math.round(sip),
      totalOutflow: Math.round(totalOutflow),
      surplus: Math.round(surplus),
      savingsRatePct,
      discretionary: Math.round(discretionary),
      incomeRecorded,
      sipsOnHold,
      pausedSip: Math.round(pausedSip),
      outflowLines,
    },
    netWorth: {
      investmentCorpus: Math.round(corpus),
      liabilities: Math.round(liabilities),
      netExcludingProperty: Math.round(corpus - liabilities),
      remainingInterestEstimate: Math.round(interest),
    },
    goals: {
      fireTarget,
      fireCorpus: Math.round(corpus),
      fireProgressPct: fireTarget ? Math.round((corpus / fireTarget) * 1000) / 10 : 0,
      allGoalsTarget,
      projectedCorpusAtFireYear: projected,
      fireGap: Math.max(0, fireTarget - projected),
      items: goalItems,
      emergencyFund: emergencyFundGoal
        ? {
            category: EMERGENCY_FUND_CATEGORY,
            subcategory: EMERGENCY_FUND_SUBCATEGORY,
            targetAmount: emergencyFundGoal.targetAmount,
            currentAmount: emergencyFundGoal.currentAmount,
            remainingYears: emergencyFundGoal.remainingYears,
            targetYear: emergencyFundGoal.targetYear,
          }
        : null,
    },
    liabilityPlan: {
      avalanche,
      scheduledEmiByYear: scheduled.byYear,
      avalancheEmiByYear: recycled.byYear,
      surplusEmiByYear: withSurplus.byYear,
      debtFreeMonthScheduled: scheduled.debtFreeMonth,
      debtFreeMonthAvalanche: recycled.debtFreeMonth,
      debtFreeMonthWithSurplus: withSurplus.debtFreeMonth,
      surplusApplied,
      scenarios,
      investmentResumeMilestone,
    },
    recommendations,
  };
}
