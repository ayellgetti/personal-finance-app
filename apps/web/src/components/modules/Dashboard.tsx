import { useFinance } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, totalAssets, totalLiabilities, netWorth, monthlySavings,
  savingsRate, debtToIncome, monthlyIncome, monthlyExpenses, monthlyEMI, monthlySIP,
  assetAllocation, forecastNetWorth, healthScore, financialFreedom,
  incomeDistribution, expenseDistribution, positionSnapshot, generateRecommendations,
  scenarioSummary, emergencyFund, creditUtilization, analyzeGoal,
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
  Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, Legend, LineChart, Line, ComposedChart, ReferenceLine,
} from "recharts";

function CoverBar({
  label,
  extra,
  percent,
  value,
}: {
  label: string;
  extra?: string;
  percent: number;
  value: string;
}) {
  const tone = percent >= 70 ? "bg-success" : percent >= 35 ? "bg-accent" : "bg-danger";
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">{value}</span>
      </div>
      {extra ? <p className="mt-0.5 text-[11px] text-muted-foreground">{extra}</p> : null}
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
      </div>
    </div>
  );
}

function HealthRow({ label, score, detail }: { label: string; score: number; detail: string }) {
  const tone = score >= 70 ? "bg-success" : score >= 35 ? "bg-accent" : "bg-danger";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">{score}/100</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{detail}</p>
    </div>
  );
}

export function Dashboard({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { data } = useFinance();
  const cur = data.profile.currency;
  const nw = netWorth(data);
  const forecast = forecastNetWorth(data, "Moderate").slice(0, 16);
  const start = forecast[0];
  const end = forecast[forecast.length - 1];
  const alloc = assetAllocation(data);
  const hs = healthScore(data);
  const fi = financialFreedom(data);
  const surplus = monthlySavings(data);
  const sr = savingsRate(data);
  const dti = debtToIncome(data);

  const cashflow = [
    { name: "Income", value: monthlyIncome(data) },
    { name: "Expenses", value: monthlyExpenses(data) },
    { name: "EMIs", value: monthlyEMI(data) },
    { name: "Surplus", value: surplus },
  ];
  const sip = monthlySIP(data);
  const incomes = incomeDistribution(data).slice(0, 4);
  const spends = expenseDistribution(data).slice(0, 4);
  const snap = positionSnapshot(data, data.goals.map((goal) => analyzeGoal(data, goal)));
  const ef = emergencyFund(data);
  const recs = generateRecommendations(data).slice(0, 3);
  const scenarios = scenarioSummary(data);
  const scenarioMax = Math.max(...scenarios.flatMap((row) => [Math.abs(row.y5), Math.abs(row.y10)]), 1);
  const dues = [...data.loans]
    .filter((loan) => loan.emi > 0)
    .sort((a, b) => a.emiDay - b.emiDay)
    .slice(0, 4);
  const util = creditUtilization(data);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-foreground/70">Total Net Worth</p>
            <p className="mt-1 font-display text-4xl font-bold md:text-5xl">{formatCurrency(nw, cur)}</p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              {formatCurrency(totalAssets(data), cur, true)} assets · {formatCurrency(totalLiabilities(data), cur, true)} liabilities
            </p>
            <p className="mt-3 max-w-xl text-sm text-primary-foreground/75">
              {nw < 0
                ? "Liabilities are larger than investments plus emergency cash, so net worth starts below zero."
                : "Assets already exceed loans and cards. The gap is what you would keep if every debt were settled today."}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Assets" value={formatCurrency(totalAssets(data), cur, true)} icon={Gem} accent="primary" />
        <StatCard label="Liabilities" value={formatCurrency(totalLiabilities(data), cur, true)} icon={Landmark} accent="danger" />
        <StatCard label="Net Worth" value={formatCurrency(nw, cur, true)} icon={Wallet} accent="gold" />
        <StatCard label="Monthly Savings" value={formatCurrency(surplus, cur)} icon={PiggyBank} accent="primary" />
        <StatCard label="Savings Rate" value={formatPercent(sr)} sub={sr >= 25 ? "Strong" : "Improve"} trend={sr >= 25 ? "up" : "down"} icon={Percent} accent="default" />
        <StatCard label="Debt Ratio" value={formatPercent(dti)} sub={dti < 35 ? "Healthy" : "High"} trend={dti < 35 ? "up" : "down"} icon={TrendingDown} accent="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Projected net worth (Moderate)">
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
            Starts at today&apos;s investments plus emergency cash, minus loans. Each year, SIPs keep investing at your
            stated returns (Moderate = no extra boost) and EMIs reduce loan balances. Card dues stay flat. This is not leftover
            salary — it can rise even when monthly surplus is negative.
          </p>
          {start && end ? (
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <p className="text-[11px] text-muted-foreground">Today ({start.year})</p>
                <p className="mt-1 font-display text-lg font-semibold">{formatCurrency(start.netWorth, cur, true)}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <p className="text-[11px] text-muted-foreground">In {end.year}</p>
                <p className="mt-1 font-display text-lg font-semibold">{formatCurrency(end.netWorth, cur, true)}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/40 p-3">
                <p className="text-[11px] text-muted-foreground">Debt now → then</p>
                <p className="mt-1 font-display text-lg font-semibold">
                  {formatCurrency(start.debt, cur, true)} → {formatCurrency(end.debt, cur, true)}
                </p>
              </div>
            </div>
          ) : null}
          {surplus < 0 ? (
            <p className="mb-3 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              Monthly surplus is {formatCurrency(surplus, cur)}. The line still assumes SIPs and EMIs continue, so treat it as
              an investment/loan path, not extra cash you can invest.
            </p>
          ) : null}
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={forecast}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="year" interval={2} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [formatCurrency(v, cur, true), name]}
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="netWorth" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#nwGrad)" name="Net worth" />
              <Line type="monotone" dataKey="debt" stroke="hsl(var(--danger))" strokeWidth={2} dot={false} name="Debt" />
              <Line type="monotone" dataKey="assets" stroke="hsl(var(--chart-2))" strokeWidth={1.5} strokeDasharray="5 4" dot={false} name="Assets" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Financial health score">
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Weighted 0–100 check: emergency fund 25%, savings rate 25%, debt ratio 20%, diversification 15%, term cover 15%.
            A 0 means that check failed, not that the amount is zero.
          </p>
          <div className="flex flex-col items-center">
            <HealthGauge score={hs} size={140} />
            <div className="mt-4 w-full space-y-3">
              {hs.components.map((c) => (
                <HealthRow key={c.label} label={c.label} score={c.score} detail={c.detail} />
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full rounded-xl" onClick={() => onNavigate("advisor")}>
              View AI Recommendations
            </Button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Asset allocation">
          <p className="mb-3 text-xs text-muted-foreground">How today&apos;s investment corpus is split by type.</p>
          {alloc.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={alloc} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {alloc.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur, true)} />
                <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Add investments to see the mix.</p>
          )}
        </Panel>

        <Panel title="Monthly cashflow">
          <p className="mb-3 text-xs text-muted-foreground">
            Income vs recurring expenses, EMIs, and what is left (surplus can sit below the line).
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={55} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur)} cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {cashflow.map((c, i) => (
                  <Cell
                    key={i}
                    fill={
                      c.name === "Surplus"
                        ? c.value >= 0
                          ? "hsl(var(--success))"
                          : "hsl(var(--danger))"
                        : c.name === "Income"
                          ? "hsl(var(--primary))"
                          : "hsl(var(--chart-3))"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Debt paydown">
          <p className="mb-3 text-xs text-muted-foreground">
            Loan balances fall as EMIs are paid. Credit-card outstanding is held constant in this model.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="year" interval={2} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={55} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur, true)} />
              <Line type="monotone" dataKey="debt" stroke="hsl(var(--danger))" strokeWidth={2.5} dot={false} name="Debt" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="This month">
          <p className="mb-4 text-xs text-muted-foreground">Where income and spending actually come from, plus SIPs you already committed.</p>
          <div className="space-y-3">
            {incomes.length ? (
              incomes.map((row) => (
                <CoverBar
                  key={row.id}
                  label={row.name}
                  extra={row.extra}
                  percent={row.percent}
                  value={formatCurrency(row.amount, cur)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Add income sources to see the split.</p>
            )}
          </div>
          <div className="mt-4 space-y-3 border-t border-border/70 pt-4">
            {spends.length ? (
              spends.map((row) => (
                <CoverBar
                  key={row.id}
                  label={row.name}
                  extra={row.extra}
                  percent={row.percent}
                  value={formatCurrency(row.amount, cur)}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recurring expenses or EMIs yet.</p>
            )}
          </div>
          <div className="mt-4 rounded-xl border border-border bg-background/40 p-3 text-xs">
            <p className="flex justify-between gap-3">
              <span className="text-muted-foreground">Monthly SIPs</span>
              <span className="font-semibold">{formatCurrency(sip, cur)}</span>
            </p>
            <p className="mt-1 flex justify-between gap-3">
              <span className="text-muted-foreground">Surplus after SIPs</span>
              <span className={`font-semibold ${surplus - sip < 0 ? "text-danger" : "text-success"}`}>
                {formatCurrency(surplus - sip, cur)}
              </span>
            </p>
          </div>
        </Panel>

        <Panel title="Safety & freedom">
          <p className="mb-4 text-xs text-muted-foreground">Cash buffer, corpus vs 25× annual outflow, and protection gaps.</p>
          <div className="space-y-4">
            <CoverBar
              label="Emergency fund"
              extra={`${ef.coverageMonths.toFixed(1)} of ${ef.targetMonths} months · ${ef.status}`}
              percent={ef.progress}
              value={formatCurrency(ef.totalAvailable, cur, true)}
            />
            <CoverBar
              label="Freedom cover"
              extra={`${fi.fiDate.getFullYear()} · ${fi.yearsRemaining}y left`}
              percent={snap.freedomCover}
              value={formatPercent(Math.min(snap.freedomCover, 999))}
            />
            <CoverBar
              label={snap.termCover.name}
              extra={snap.termCover.extra}
              percent={snap.termCover.percent}
              value={formatPercent(Math.min(snap.termCover.percent, 999))}
            />
            <CoverBar
              label="Credit utilization"
              extra={util <= 30 ? "Keep this under 30%" : "High — cards are eating cashflow"}
              percent={util}
              value={formatPercent(util)}
            />
          </div>
          {dues.length ? (
            <div className="mt-4 border-t border-border/70 pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">EMI dates this month</p>
              <div className="space-y-2">
                {dues.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">{loan.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Day {loan.emiDay} · {formatCurrency(loan.emi, cur)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel
          title="Focus next"
          action={
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => onNavigate("advisor")}>
              All tips
            </Button>
          }
        >
          <p className="mb-4 text-xs text-muted-foreground">Highest-impact moves from the numbers you already saved.</p>
          <div className="space-y-3">
            {recs.length ? (
              recs.map((rec) => (
                <div key={rec.title} className="rounded-xl border border-border bg-background/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">{rec.impact}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rec.detail}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Your checks look clear. Keep SIPs and reviews going.</p>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Goal progress"
          action={
            <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => onNavigate("goals")}>
              Open goals
            </Button>
          }
        >
          <p className="mb-4 text-xs text-muted-foreground">How much of each inflation-adjusted target is funded today.</p>
          <div className="space-y-4">
            {snap.goals.length ? (
              snap.goals
                .slice()
                .sort((a, b) => a.percent - b.percent)
                .slice(0, 4)
                .map((row) => (
                  <CoverBar
                    key={row.id}
                    label={row.name}
                    extra={`${row.extra} · ${formatCurrency(row.funded, cur, true)} of ${formatCurrency(row.target, cur, true)}`}
                    percent={row.percent}
                    value={formatPercent(Math.min(row.percent, 999))}
                  />
                ))
            ) : (
              <p className="text-sm text-muted-foreground">Add a goal to track coverage here.</p>
            )}
          </div>
        </Panel>

        <Panel title="If markets vary">
          <p className="mb-4 text-xs text-muted-foreground">
            Same SIPs and EMIs, three return assumptions. Conservative is 3% below your stated rates, Aggressive is 3% above.
          </p>
          <div className="space-y-4">
            {scenarios.map((row) => (
              <div key={row.scenario}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{row.scenario}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    5y {formatCurrency(row.y5, cur, true)} · 10y {formatCurrency(row.y10, cur, true)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, (Math.abs(row.y10) / scenarioMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
