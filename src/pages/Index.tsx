import { useState } from "react";
import { AppLayout, ViewId } from "@/components/layout/AppLayout";
import { SetupWizard } from "@/components/modules/SetupWizard";
import { Dashboard } from "@/components/modules/Dashboard";
import { IncomeModule } from "@/components/modules/IncomeModule";
import { ExpenseModule } from "@/components/modules/ExpenseModule";
import { DailyExpenseModule } from "@/components/modules/DailyExpenseModule";
import { LoanModule } from "@/components/modules/LoanModule";
import { InvestmentModule } from "@/components/modules/InvestmentModule";
import { InsuranceModule } from "@/components/modules/InsuranceModule";
import { EmergencyFundModule } from "@/components/modules/EmergencyFundModule";
import { GoalsModule } from "@/components/modules/GoalsModule";
import { FreedomCalculator } from "@/components/modules/FreedomCalculator";
import { ForecastEngine } from "@/components/modules/ForecastEngine";
import { AIAdvisor } from "@/components/modules/AIAdvisor";
import { LearningHubModule } from "@/components/modules/LearningHubModule";
import { ReportModule } from "@/components/modules/ReportModule";
import { useFinance } from "@/lib/finance/store";
import { generateReport } from "@/lib/finance/pdfReport";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Settings2, RotateCcw, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const META: Record<ViewId, { title: string; description: string }> = {
  dashboard: { title: "Net Worth Dashboard", description: "Your complete financial picture at a glance" },
  setup: { title: "Quick Setup", description: "Add all your financial details in one guided flow" },
  income: { title: "Income Management", description: "Track every source of money coming in" },
  expenses: { title: "Expense Management", description: "Understand where your money goes" },
  daily: { title: "Daily Expense Tracker", description: "Log spending and stay on budget every day" },
  loans: { title: "Loan Management", description: "Debt overview, ratios and payoff strategy" },
  investments: { title: "Investment Management", description: "Portfolio, allocation and growth projections" },
  insurance: { title: "Insurance Management", description: "Coverage adequacy and protection gaps" },
  emergency: { title: "Emergency Fund Planner", description: "Build a safety net for life's surprises" },
  goals: { title: "Goal Planning", description: "Plan and track your life's biggest milestones" },
  freedom: { title: "Financial Freedom Calculator", description: "When can you retire and live free?" },
  forecast: { title: "Smart Forecast Engine", description: "Project wealth across market scenarios" },
  advisor: { title: "AI Financial Advisor", description: "Personalised, actionable recommendations" },
  learn: { title: "Financial Learning Hub", description: "Learn concepts, then apply them to your money" },
  report: { title: "Summary Report", description: "Generate a downloadable executive report" },
};

const ONBOARD_KEY = "ffp-onboarded";

const Index = () => {
  const [view, setView] = useState<ViewId>(() =>
    typeof window !== "undefined" && !localStorage.getItem(ONBOARD_KEY) ? "setup" : "dashboard",
  );
  const { data, resetToSample, clearAll } = useFinance();
  const meta = META[view];

  const finishSetup = () => {
    localStorage.setItem(ONBOARD_KEY, "1");
    setView("dashboard");
  };

  const downloadPdf = () => {
    try { generateReport(data); toast.success("Report downloaded as PDF"); }
    catch { toast.error("Could not generate report"); }
  };

  const actions = (
    <>
      <Button variant="outline" className="hidden gap-2 rounded-xl sm:flex" onClick={downloadPdf}>
        <Download className="h-4 w-4" /> Report
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings2 className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={downloadPdf}><FileText className="mr-2 h-4 w-4" /> Download PDF Report</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => { resetToSample(); toast.success("Sample data restored"); }}>
            <RotateCcw className="mr-2 h-4 w-4" /> Load Sample Data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { clearAll(); toast.success("All data cleared"); }} className="text-danger focus:text-danger">
            <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <AppLayout active={view} onSelect={setView} title={meta.title} description={meta.description} actions={actions}>
      <div key={view} className="animate-fade-in">
        {view === "dashboard" && <Dashboard onNavigate={setView} />}
        {view === "setup" && <SetupWizard onDone={finishSetup} />}
        {view === "income" && <IncomeModule />}
        {view === "expenses" && <ExpenseModule />}
        {view === "daily" && <DailyExpenseModule />}
        {view === "loans" && <LoanModule />}
        {view === "investments" && <InvestmentModule />}
        {view === "insurance" && <InsuranceModule />}
        {view === "emergency" && <EmergencyFundModule />}
        {view === "goals" && <GoalsModule />}
        {view === "freedom" && <FreedomCalculator />}
        {view === "forecast" && <ForecastEngine />}
        {view === "advisor" && <AIAdvisor />}
        {view === "learn" && <LearningHubModule />}
        {view === "report" && <ReportModule />}
      </div>
    </AppLayout>
  );
};

export default Index;
