import { useFinance } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, totalAssets, totalLiabilities, netWorth, monthlySavings,
  savingsRate, debtToIncome, monthlyIncome, monthlyExpenses, monthlyEMI,
  assetAllocation, forecastNetWorth, healthScore, financialFreedom,
} from "@/lib/finance/calculations";
import { StatCard } from "@/components/StatCard";
import { Panel, CHART_COLORS, tooltipStyle } from "./shared";
import { HealthGauge } from "./HealthGauge";
import { ViewId } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Wallet, Landmark, Gem, PiggyBank, Percent, TrendingDown, Rocket, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend, LineChart, Line,
} from "recharts";

export function Dashboard({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { data } = useFinance();
  const cur = data.profile.currency;
  const nw = netWorth(data);
  const forecast = forecastNetWorth(data, "Moderate").slice(0, 16);
  const alloc = assetAllocation(data);
  const hs = healthScore(data);
  const fi = financialFreedom(data);

  const incomeVsExpense = [
    { name: "Income", Income: monthlyIncome(data), Expense: 0 },
    { name: "Spending", Income: 0, Expense: monthlyExpenses(data) + monthlyEMI(data) },
  ];
  const cashflow = [
    { name: "Income", value: monthlyIncome(data) },
    { name: "Expenses", value: monthlyExpenses(data) },
    { name: "EMIs", value: monthlyEMI(data) },
    { name: "Surplus", value: monthlySavings(data) },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-foreground/70">Total Net Worth</p>
            <p className="mt-1 font-display text-4xl font-bold md:text-5xl">{formatCurrency(nw, cur)}</p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              {formatCurrency(totalAssets(data), cur, true)} assets · {formatCurrency(totalLiabilities(data), cur, true)} liabilities
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl bg-background/10 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5" />
              <div>
                <p className="text-xs text-primary-foreground/70">Financial Freedom by</p>
                <p className="font-display text-xl font-bold">{fi.fiDate.getFullYear()} · {fi.yearsRemaining}y left</p>
              </div>
            </div>
            <Button variant="secondary" className="rounded-xl" onClick={() => onNavigate("freedom")}>
              Open Freedom Calculator <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Assets" value={formatCurrency(totalAssets(data), cur, true)} icon={Gem} accent="primary" />
        <StatCard label="Liabilities" value={formatCurrency(totalLiabilities(data), cur, true)} icon={Landmark} accent="danger" />
        <StatCard label="Net Worth" value={formatCurrency(nw, cur, true)} icon={Wallet} accent="gold" />
        <StatCard label="Monthly Savings" value={formatCurrency(monthlySavings(data), cur)} icon={PiggyBank} accent="primary" />
        <StatCard label="Savings Rate" value={formatPercent(savingsRate(data))} sub={savingsRate(data) >= 25 ? "Strong" : "Improve"} trend={savingsRate(data) >= 25 ? "up" : "down"} icon={Percent} accent="default" />
        <StatCard label="Debt Ratio" value={formatPercent(debtToIncome(data))} sub={debtToIncome(data) < 35 ? "Healthy" : "High"} trend={debtToIncome(data) < 35 ? "up" : "down"} icon={TrendingDown} accent="danger" />
      </div>

      {/* Net worth growth + health */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Projected Net Worth Growth (Moderate)">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur, true)} />
              <Area type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#nwGrad)" name="Net Worth" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Financial Health Score">
          <div className="flex flex-col items-center">
            <HealthGauge score={hs} />
            <div className="mt-4 w-full space-y-2">
              {hs.components.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-semibold">{c.score}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => onNavigate("advisor")}>
              View AI Recommendations
            </Button>
          </div>
        </Panel>
      </div>

      {/* Allocation, cashflow, debt */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Asset Allocation">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={alloc} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {alloc.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur, true)} />
              <Legend wrapperStyle={{ fontSize: "0.65rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Monthly Cashflow">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={55} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur)} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {cashflow.map((c, i) => (
                  <Cell key={i} fill={c.name === "Surplus" ? "hsl(var(--success))" : c.name === "Income" ? "hsl(var(--primary))" : "hsl(var(--chart-3))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Debt Reduction Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={55} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur, true)} />
              <Line type="monotone" dataKey="debt" stroke="hsl(var(--danger))" strokeWidth={2.5} dot={false} name="Debt" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
