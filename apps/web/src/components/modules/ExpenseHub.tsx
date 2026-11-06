import { useState } from "react";
import { useFinance } from "@/lib/finance/store";
import { dailySpentThisMonth, formatCurrency, monthlyExpenses } from "@/lib/finance/calculations";
import { StatCard } from "@/components/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RefreshCw, CalendarClock, Receipt } from "lucide-react";
import { ExpenseModule } from "./ExpenseModule";
import { DailyExpenseModule } from "./DailyExpenseModule";
import { StatementAnalyzerModule } from "./StatementAnalyzerModule";

export type ExpenseTab = "bills" | "daily" | "import";

/** One place for spending: monthly bills, the daily log and statement import, under one total. */
export function ExpenseHub({ initialTab = "bills" }: { initialTab?: ExpenseTab }) {
  const { data } = useFinance();
  const cur = data.profile.currency;
  const [tab, setTab] = useState<ExpenseTab>(initialTab);
  const bills = monthlyExpenses(data);
  const daily = dailySpentThisMonth(data.dailyExpenses);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly bills" value={formatCurrency(bills, cur)} icon={RefreshCw} accent="primary" />
        <StatCard label="Daily log this month" value={formatCurrency(daily, cur)} icon={CalendarClock} accent="gold" />
        <StatCard label="Spending this month" value={formatCurrency(bills + daily, cur)} sub="Bills + daily log" icon={Receipt} accent="danger" />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as ExpenseTab)}>
        <TabsList>
          <TabsTrigger value="bills">Monthly bills</TabsTrigger>
          <TabsTrigger value="daily">Daily log</TabsTrigger>
          <TabsTrigger value="import">Import statement</TabsTrigger>
        </TabsList>
        <TabsContent value="bills" className="mt-6"><ExpenseModule /></TabsContent>
        <TabsContent value="daily" className="mt-6"><DailyExpenseModule /></TabsContent>
        <TabsContent value="import" className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            Statement analysis shows where money went. It is for review only and is not added to the totals above.
          </p>
          <StatementAnalyzerModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}
