import { useEffect, useState } from "react";
import { AppLayout, ViewId } from "@/components/layout/AppLayout";
import { SetupWizard } from "@/components/modules/SetupWizard";
import { ProfileModule } from "@/components/modules/ProfileModule";
import { Dashboard } from "@/components/modules/Dashboard";
import { IncomeModule } from "@/components/modules/IncomeModule";
import { ExpenseModule } from "@/components/modules/ExpenseModule";
import { DailyExpenseModule } from "@/components/modules/DailyExpenseModule";
import { LoanModule } from "@/components/modules/LoanModule";
import { InvestmentModule } from "@/components/modules/InvestmentModule";
import { InsuranceModule } from "@/components/modules/InsuranceModule";
import { GoalsModule } from "@/components/modules/GoalsModule";
import { FreedomCalculator } from "@/components/modules/FreedomCalculator";
import { AIAdvisor } from "@/components/modules/AIAdvisor";
import { LearningHubModule } from "@/components/modules/LearningHubModule";
import { ReportModule } from "@/components/modules/ReportModule";
import { StatementAnalyzerModule } from "@/components/modules/StatementAnalyzerModule";
import { TaxPlannerModule } from "@/components/modules/TaxPlannerModule";
import { CalculatorsModule } from "@/components/modules/CalculatorsModule";
import { CreditCardModule } from "@/components/modules/CreditCardModule";
import type { CalculatorType } from "@/lib/finance/calculator-remote";
import { useAuth } from "@/lib/auth/store";
import { toast } from "sonner";

const META: Record<ViewId, { title: string; description: string }> = {
  dashboard: { title: "Net Worth Dashboard", description: "Your complete financial picture at a glance" },
  setup: { title: "Quick Setup", description: "Add all your financial details in one guided flow" },
  profile: { title: "Profile", description: "Manage your account and financial persona" },
  income: { title: "Income Management", description: "Track every source of money coming in" },
  expenses: { title: "Expense Management", description: "Understand where your money goes" },
  daily: { title: "Budget Tracker", description: "Log spending and stay on budget every day" },
  loans: { title: "Loan Management", description: "Debt overview, ratios and payoff strategy" },
  creditCards: { title: "Credit Card", description: "Limits, outstanding balances and utilization" },
  investments: { title: "Investment Management", description: "Portfolio, allocation and growth projections" },
  insurance: { title: "Insurance Management", description: "Coverage adequacy and protection gaps" },
  goals: { title: "Goals", description: "Emergency fund and the milestones you are saving toward" },
  statements: { title: "Statement Analyzer", description: "Bank and phone/UPI statements, categorized automatically" },
  tax: { title: "Tax Calculator", description: "Country-wise slabs — India old/new regime, plus US and UK estimates" },
  calculators: { title: "Financial Calculators", description: "Run, save and revisit financial what-if scenarios" },
  freedom: { title: "Financial Freedom Calculator", description: "When can you retire and live free?" },
  advisor: { title: "AI Financial Advisor", description: "Personalised, actionable recommendations" },
  learn: { title: "Financial Learning Hub", description: "Learn concepts, then apply them to your money" },
  report: { title: "Summary Report", description: "AI summary and a downloadable executive report" },
};

const Index = () => {
  const { user, completeQuickSetup } = useAuth();
  const setupDone = user?.quickStep === 1;
  const [view, setView] = useState<ViewId>(() => (setupDone ? "dashboard" : "setup"));
  const [calculatorType, setCalculatorType] =
    useState<CalculatorType>("lumpsum");

  useEffect(() => {
    if (setupDone && view === "setup") setView("dashboard");
  }, [setupDone, view]);

  const finishSetup = async (completed: boolean) => {
    if (completed) {
      const result = await completeQuickSetup();
      if (result.ok === false) {
        toast.error(result.error);
        return;
      }
    }
    setView("dashboard");
  };

  const selectView = (id: ViewId, selectedCalculator?: CalculatorType) => {
    if (id === "setup" && setupDone) return;
    if (id === "calculators" && selectedCalculator) {
      setCalculatorType(selectedCalculator);
    }
    setView(id);
  };

  const visibleView = setupDone && view === "setup" ? "dashboard" : view;

  return (
    <AppLayout
      active={visibleView}
      activeCalculator={calculatorType}
      onSelect={selectView}
      title={META[visibleView].title}
      description={META[visibleView].description}
    >
      <div
        key={
          visibleView === "calculators"
            ? `${visibleView}-${calculatorType}`
            : visibleView
        }
        className="animate-fade-in"
      >
        {visibleView === "dashboard" && <Dashboard onNavigate={selectView} />}
        {visibleView === "setup" && <SetupWizard onDone={() => void finishSetup(true)} />}
        {visibleView === "profile" && <ProfileModule />}
        {visibleView === "income" && <IncomeModule />}
        {visibleView === "expenses" && <ExpenseModule />}
        {visibleView === "daily" && <DailyExpenseModule />}
        {visibleView === "loans" && <LoanModule />}
        {visibleView === "creditCards" && <CreditCardModule />}
        {visibleView === "investments" && <InvestmentModule />}
        {visibleView === "insurance" && <InsuranceModule />}
        {visibleView === "goals" && <GoalsModule />}
        {visibleView === "statements" && <StatementAnalyzerModule />}
        {visibleView === "tax" && <TaxPlannerModule />}
        {visibleView === "calculators" && (
          <CalculatorsModule initialType={calculatorType} />
        )}
        {visibleView === "freedom" && <FreedomCalculator />}
        {visibleView === "advisor" && <AIAdvisor />}
        {visibleView === "learn" && <LearningHubModule />}
        {visibleView === "report" && <ReportModule />}
      </div>
    </AppLayout>
  );
};

export default Index;
