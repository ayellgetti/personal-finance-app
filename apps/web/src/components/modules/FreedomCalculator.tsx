import { useFinance } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, financialFreedom, monthlyIncome,
  totalInvestments, portfolioFutureValue,
} from "@/lib/finance/calculations";
import { Panel, tooltipStyle } from "./shared";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Target, Flame, CalendarCheck, Wallet, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

export function FreedomCalculator() {
  const { data, updateProfile } = useFinance();
  const cur = data.profile.currency;
  const fi = financialFreedom(data);
  const yearsToRetire = Math.max(1, data.profile.retirementAge - data.profile.age);

  const projection = Array.from({ length: yearsToRetire + 1 }, (_, y) => ({
    year: new Date().getFullYear() + y,
    corpus: portfolioFutureValue(data, y),
    target: fvTarget(data, y),
  }));

  function fvTarget(d: typeof data, y: number) {
    const annual = fi.currentAnnualExpenses * Math.pow(1 + d.profile.inflationRate / 100, y);
    return annual * 25;
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-foreground/70">Financial Freedom Date</p>
            <p className="mt-1 font-display text-4xl font-bold">{fi.fiDate.getFullYear()}</p>
            <p className="text-sm text-primary-foreground/80">{fi.yearsRemaining} years to go</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-foreground/70">Your FI Number</p>
            <p className="mt-1 font-display text-4xl font-bold">{formatCurrency(fi.fiNumber, cur, true)}</p>
            <p className="text-sm text-primary-foreground/80">25× retirement expenses</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-foreground/70">Probability Score</p>
            <p className="mt-1 font-display text-4xl font-bold">{fi.probabilityScore}%</p>
            <p className="text-sm text-primary-foreground/80">on current trajectory</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current Annual Expenses" value={formatCurrency(fi.currentAnnualExpenses, cur, true)} icon={Flame} accent="danger" />
        <StatCard label="Passive Income (now)" value={formatCurrency(fi.passiveIncome, cur)} icon={Wallet} accent="primary" />
        <StatCard label="Retirement Corpus Needed" value={formatCurrency(fi.retirementCorpus, cur, true)} icon={Target} accent="gold" />
        <StatCard label="Req. Monthly Investment" value={formatCurrency(fi.requiredMonthlyInvestment, cur)} icon={Rocket} accent="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Assumptions" className="lg:col-span-1">
          <div className="space-y-4">
            <Field label="Current Age" value={data.profile.age} onChange={(v) => updateProfile({ age: v })} />
            <Field label="Retirement Age" value={data.profile.retirementAge} onChange={(v) => updateProfile({ retirementAge: v })} />
            <Field label="Inflation Rate (%)" value={data.profile.inflationRate} onChange={(v) => updateProfile({ inflationRate: v })} />
            <Field label="Emergency Fund" value={data.profile.emergencyFund} onChange={(v) => updateProfile({ emergencyFund: v })} prefix={cur} />
          </div>
          <div className="mt-5 rounded-xl bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Projected corpus at retirement</span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold">{formatCurrency(fi.projectedCorpus, cur, true)}</p>
            <p className="text-xs text-muted-foreground">{fi.projectedCorpus >= fi.fiNumber ? "On track to beat your FI number 🎉" : `Shortfall of ${formatCurrency(fi.fiNumber - fi.projectedCorpus, cur, true)}`}</p>
          </div>
        </Panel>

        <Panel title="Corpus vs FI Target" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={projection}>
              <defs>
                <linearGradient id="corpusG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur, true)} />
              <Area type="monotone" dataKey="corpus" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#corpusG)" name="Your Corpus" />
              <Area type="monotone" dataKey="target" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" fill="none" name="FI Target" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Your Corpus</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> FI Target (inflation-adjusted)</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, prefix }: { label: string; value: number; onChange: (v: number) => void; prefix?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
        <Input type="number" value={value} className={prefix ? "pl-7" : ""} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
    </div>
  );
}
