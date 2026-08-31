import { useState } from "react";
import { useFinance } from "@/lib/finance/store";
import {
  formatCurrency, formatPercent, financialFreedom, portfolioFutureValue,
  fvLumpSum, defaultFreedomInputs, freedomTargets, freedomModeView,
  type FreedomInputs,
} from "@/lib/finance/calculations";
import {
  FREEDOM_MODES, FREEDOM_EXPENSE_MULTIPLES, FREEDOM_MODE_DESCRIPTIONS,
  type FreedomMode,
} from "@/types/finance";
import { Panel, tooltipStyle } from "./shared";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Rocket, Target, Flame, Wallet, Sparkles } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

type Overrides = Partial<Pick<FreedomInputs, "monthlyExpenses" | "coastAge" | "expectedReturn">>;

export function FreedomCalculator() {
  const { data, updateProfile } = useFinance();
  const cur = data.profile.currency;
  const [mode, setMode] = useState<FreedomMode>("FIRE");
  const [overrides, setOverrides] = useState<Overrides>({});

  const input: FreedomInputs = { ...defaultFreedomInputs(data), ...overrides };
  const targets = freedomTargets(input);
  const view = freedomModeView(data, input, mode);
  const passiveIncome = financialFreedom(data).passiveIncome;
  const targetYear = new Date().getFullYear() + view.yearsToTarget;

  const projection = Array.from({ length: targets.yearsToRetirement + 1 }, (_, y) => ({
    year: new Date().getFullYear() + y,
    corpus: portfolioFutureValue(data, y),
    target: targetAtYear(y),
  }));

  function targetAtYear(y: number) {
    if (mode === "Coast FIRE") {
      const yearsOfGrowthLeft = targets.yearsToRetirement - y;
      return targets.targets.FIRE / Math.pow(1 + input.expectedReturn / 100, yearsOfGrowthLeft);
    }
    const annual = fvLumpSum(targets.annualExpensesToday, input.inflationRate, y);
    return annual * FREEDOM_EXPENSE_MULTIPLES[mode];
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FREEDOM_MODES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all",
              mode === option
                ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)]"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <p className="font-display text-base font-bold">{option}</p>
            <p className="mt-1 font-display text-lg font-bold text-primary">
              {formatCurrency(targets.targets[option], cur, true)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{FREEDOM_MODE_DESCRIPTIONS[option]}</p>
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-foreground/70">{mode} Target Year</p>
            <p className="mt-1 font-display text-4xl font-bold">{targetYear}</p>
            <p className="text-sm text-primary-foreground/80">
              at age {view.targetAge} · {view.yearsToTarget} years to go
            </p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-foreground/70">Your {mode} Number</p>
            <p className="mt-1 font-display text-4xl font-bold">{formatCurrency(view.target, cur, true)}</p>
            <p className="text-sm text-primary-foreground/80">{FREEDOM_MODE_DESCRIPTIONS[mode]}</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-wider text-primary-foreground/70">Projected Coverage</p>
            <p className="mt-1 font-display text-4xl font-bold">{Math.round(view.progressPct)}%</p>
            <p className="text-sm text-primary-foreground/80">on current investments</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Annual Expenses Today" value={formatCurrency(targets.annualExpensesToday, cur, true)} icon={Flame} accent="danger" />
        <StatCard label={`Annual Expenses at ${input.retirementAge}`} value={formatCurrency(targets.annualExpensesAtRetirement, cur, true)} icon={Target} accent="gold" />
        <StatCard label="Passive Income (now)" value={formatCurrency(passiveIncome, cur)} icon={Wallet} accent="primary" />
        <StatCard label="Req. Monthly Investment" value={formatCurrency(view.requiredMonthlyInvestment, cur)} icon={Rocket} accent="primary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Your inputs" className="lg:col-span-1">
          <div className="space-y-4">
            <Field
              id="freedom-monthly-expense"
              label="Monthly Expense"
              value={input.monthlyExpenses}
              prefix={cur}
              hint="Prefilled from your expenses, EMIs and premiums. Edits here are a what-if and are not saved."
              onChange={(v) => setOverrides((o) => ({ ...o, monthlyExpenses: v }))}
            />
            <Field
              id="freedom-current-age"
              label="Current Age"
              value={input.currentAge}
              disabled
              hint="Taken from your date of birth."
            />
            <Field
              id="freedom-retirement-age"
              label="Retirement Age"
              value={input.retirementAge}
              onChange={(v) => updateProfile({ retirementAge: v })}
            />
            <Field
              id="freedom-inflation"
              label="Assumed Inflation Rate (%)"
              value={input.inflationRate}
              onChange={(v) => updateProfile({ inflationRate: v })}
            />
            <Field
              id="freedom-expected-return"
              label="Expected Return (%)"
              value={input.expectedReturn}
              hint="Used to compound your corpus toward the target."
              onChange={(v) => setOverrides((o) => ({ ...o, expectedReturn: v }))}
            />
            <Field
              id="freedom-coast-age"
              label="Desired Coast FIRE Age"
              value={input.coastAge}
              hint="The age by which you want to stop adding new investments."
              onChange={(v) => setOverrides((o) => ({ ...o, coastAge: v }))}
            />
          </div>
          <div className="mt-5 rounded-xl bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Projected corpus at age {view.targetAge}</span>
            </div>
            <p className="mt-1 font-display text-2xl font-bold">{formatCurrency(view.projectedCorpus, cur, true)}</p>
            <p className="text-xs text-muted-foreground">
              {view.shortfall === 0
                ? `On track to beat your ${mode} number 🎉`
                : `Shortfall of ${formatCurrency(view.shortfall, cur, true)} — invest ${formatCurrency(view.requiredMonthlyInvestment, cur)}/month at ${formatPercent(input.expectedReturn)} to close it`}
            </p>
          </div>
        </Panel>

        <Panel title={`Corpus vs ${mode} Target`} className="lg:col-span-2">
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
              <Area type="monotone" dataKey="target" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" fill="none" name={`${mode} Target`} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Your Corpus</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent" /> {mode} Target</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Field({
  id, label, value, onChange, prefix, disabled, hint,
}: {
  id: string;
  label: string;
  value: number;
  onChange?: (v: number) => void;
  prefix?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>}
        <Input
          id={id}
          type="number"
          value={value}
          className={prefix ? "pl-7" : ""}
          disabled={disabled}
          onChange={(e) => onChange?.(Number(e.target.value))}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
