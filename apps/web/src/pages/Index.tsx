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
import { ForecastEngine } from "@/components/modules/ForecastEngine";
import { AIAdvisor } from "@/components/modules/AIAdvisor";
import { LearningHubModule } from "@/components/modules/LearningHubModule";
import { ReportModule } from "@/components/modules/ReportModule";
import { useAuth } from "@/lib/auth/store";
import { toast } from "sonner";

const META: Record<ViewId, { title: string; description: string }> = {
  dashboard: { title: "Net Worth Dashboard", description: "Your complete financial picture at a glance" },
  setup: { title: "Quick Setup", description: "Add all your financial details in one guided flow" },
  profile: { title: "Profile", description: "Manage your account and financial persona" },
  income: { title: "Income Management", description: "Track every source of money coming in" },
  expenses: { title: "Expense Management", description: "Understand where your money goes" },
  daily: { title: "Daily Expense Tracker", description: "Log spending and stay on budget every day" },
  loans: { title: "Loan Management", description: "Debt overview, ratios and payoff strategy" },
  investments: { title: "Investment Management", description: "Portfolio, allocation and growth projections" },
  insurance: { title: "Insurance Management", description: "Coverage adequacy and protection gaps" },
  goals: { title: "Goals", description: "Emergency fund and the milestones you are saving toward" },
  freedom: { title: "Financial Freedom Calculator", description: "When can you retire and live free?" },
  forecast: { title: "Smart Forecast Engine", description: "Project wealth across market scenarios" },
  advisor: { title: "AI Financial Advisor", description: "Personalised, actionable recommendations" },
  learn: { title: "Financial Learning Hub", description: "Learn concepts, then apply them to your money" },
  report: { title: "Summary Report", description: "Generate a downloadable executive report" },
};

const Index = () => {
  const { user, completeQuickSetup } = useAuth();
  const setupDone = user?.quickStep === 1;
  const [view, setView] = useState<ViewId>(() => (setupDone ? "dashboard" : "setup"));

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

  const selectView = (id: ViewId) => {
    if (id === "setup" && setupDone) return;
    setView(id);
  };

  const visibleView = setupDone && view === "setup" ? "dashboard" : view;

  return (
    <AppLayout active={visibleView} onSelect={selectView} title={META[visibleView].title} description={META[visibleView].description}>
      <div key={visibleView} className="animate-fade-in">
        {visibleView === "dashboard" && <Dashboard onNavigate={selectView} />}
        {visibleView === "setup" && <SetupWizard onDone={() => void finishSetup(true)} onSkip={() => void finishSetup(true)} />}
        {visibleView === "profile" && <ProfileModule />}
        {visibleView === "income" && <IncomeModule />}
        {visibleView === "expenses" && <ExpenseModule />}
        {visibleView === "daily" && <DailyExpenseModule />}
        {visibleView === "loans" && <LoanModule />}
        {visibleView === "investments" && <InvestmentModule />}
        {visibleView === "insurance" && <InsuranceModule />}
        {visibleView === "goals" && <GoalsModule />}
        {visibleView === "freedom" && <FreedomCalculator />}
        {visibleView === "forecast" && <ForecastEngine />}
        {visibleView === "advisor" && <AIAdvisor />}
        {visibleView === "learn" && <LearningHubModule />}
        {visibleView === "report" && <ReportModule />}
      </div>
    </AppLayout>
  );
};

export default Index;
