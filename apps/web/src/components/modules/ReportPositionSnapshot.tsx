import type { FinanceData } from "@/types/finance";
import {
  formatCurrency,
  formatPercent,
  positionSnapshot,
  type CoverShare,
  type GoalAnalysis,
  type HealthScore,
  type FIResult,
} from "@/lib/finance/calculations";
import { HealthGauge } from "./HealthGauge";

function Meter({
  label,
  value,
  max,
  formatted,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  formatted: string;
  tone: "primary" | "danger" | "success" | "accent";
}) {
  const width = max > 0 ? Math.min(100, (Math.abs(value) / max) * 100) : 0;
  const bar =
    tone === "primary"
      ? "bg-primary"
      : tone === "danger"
        ? "bg-danger"
        : tone === "success"
          ? "bg-success"
          : "bg-accent";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">{formatted}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function CoverRow({ row, currency }: { row: CoverShare; currency: string }) {
  const tone = row.percent >= 70 ? "bg-success" : row.percent >= 35 ? "bg-accent" : "bg-danger";
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium">{row.name}</p>
        <p className="shrink-0 text-sm font-semibold tabular-nums">{formatPercent(Math.min(row.percent, 999))}</p>
      </div>
      {row.extra ? <p className="mt-0.5 text-xs text-muted-foreground">{row.extra}</p> : null}
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, row.percent))}%` }} />
      </div>
      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
        {formatCurrency(row.funded, currency, true)} of {formatCurrency(row.target, currency, true)}
      </p>
    </div>
  );
}

export function ReportPositionSnapshot({
  data,
  currency,
  fi,
  hs,
  goals,
}: {
  data: FinanceData;
  currency: string;
  fi: FIResult;
  hs: HealthScore;
  goals: Array<{ g: { id: string; name: string }; a: GoalAnalysis }>;
}) {
  const snap = positionSnapshot(
    data,
    goals.map((row) => row.a),
  );
  const mixTotal = snap.assets + snap.liabilities;
  const cashMax = Math.max(snap.income, snap.spend, 1);
  const balance = Math.max(snap.assets, snap.liabilities, 1);

  return (
    <div className="mt-5 space-y-4 border-t border-border/70 pt-5">
      <div className="grid gap-4 xl:grid-cols-3">
        <section className="min-w-0 rounded-xl border border-border bg-background/40 p-4">
          <h4 className="font-display text-sm font-semibold">Assets vs liabilities</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Net worth {formatCurrency(snap.netWorth, currency, true)}
          </p>
          {mixTotal > 0 ? (
            <div
              className="mt-3 grid h-2.5 overflow-hidden rounded-full"
              style={{
                gridTemplateColumns: `${Math.max(snap.assets, 0.01)}fr ${Math.max(snap.liabilities, 0.01)}fr`,
              }}
              aria-label={`Balance mix: assets ${formatPercent(snap.assets / mixTotal * 100)}, liabilities ${formatPercent(snap.liabilities / mixTotal * 100)}`}
            >
              <div className="bg-primary" />
              <div className="bg-danger" />
            </div>
          ) : (
            <div className="mt-3 h-2.5 rounded-full bg-muted" />
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> Assets
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-danger" /> Liabilities
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <Meter label="Assets" value={snap.assets} max={balance} formatted={formatCurrency(snap.assets, currency, true)} tone="primary" />
            <Meter
              label="Liabilities"
              value={snap.liabilities}
              max={balance}
              formatted={formatCurrency(snap.liabilities, currency, true)}
              tone="danger"
            />
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-background/40 p-4">
          <h4 className="font-display text-sm font-semibold">Monthly cashflow</h4>
          <p className={`mt-1 text-xs ${snap.surplus < 0 ? "text-danger" : "text-muted-foreground"}`}>
            Surplus {formatCurrency(snap.surplus, currency)}
          </p>
          <div className="mt-4 space-y-3">
            <Meter label="Income" value={snap.income} max={cashMax} formatted={formatCurrency(snap.income, currency)} tone="primary" />
            <Meter label="Spending + EMI" value={snap.spend} max={cashMax} formatted={formatCurrency(snap.spend, currency)} tone="accent" />
            <div>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="text-muted-foreground">Debt-to-income</span>
                <span className="shrink-0 font-semibold tabular-nums">{formatPercent(snap.dti)}</span>
              </div>
              <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${snap.dti < 35 ? "bg-success" : "bg-danger"}`}
                  style={{ width: `${Math.min(100, snap.dti)}%` }}
                />
                <div className="absolute top-0 h-full w-px bg-foreground/40" style={{ left: "35%" }} title="Healthy under 35%" />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Line marks the 35% healthy ceiling</p>
            </div>
            <Meter
              label="Credit utilization"
              value={snap.utilization}
              max={100}
              formatted={formatPercent(snap.utilization)}
              tone={snap.utilization <= 30 ? "success" : "danger"}
            />
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-border bg-background/40 p-4">
          <h4 className="font-display text-sm font-semibold">Health & freedom</h4>
          <div className="mt-3 flex justify-center">
            <HealthGauge score={hs} size={120} />
          </div>
          <div className="mt-4">
            <CoverRow
              row={{
                id: "freedom-cover",
                name: "Freedom cover",
                extra: "Today's corpus vs 25x annual outflow",
                percent: snap.freedomCover,
                funded: snap.corpus,
                target: snap.freedomTarget,
              }}
              currency={currency}
            />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Projected at retirement {formatCurrency(fi.projectedCorpus, currency, true)} vs need{" "}
              {formatCurrency(fi.fiNumber, currency, true)}. Freedom date {fi.fiDate.getFullYear()} ({fi.yearsRemaining}y).
            </p>
          </div>
        </section>
      </div>

      <section className="min-w-0 rounded-xl border border-border bg-background/40 p-4">
        <h4 className="font-display text-sm font-semibold">Goal & cover mix</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          How much of each target is funded today, plus term and health cover vs the recommended amount.
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            {snap.goals.length ? (
              snap.goals.map((row) => <CoverRow key={row.id} row={row} currency={currency} />)
            ) : (
              <p className="text-sm text-muted-foreground">No goals added yet.</p>
            )}
          </div>
          <div className="space-y-4">
            <CoverRow row={snap.termCover} currency={currency} />
            <CoverRow row={snap.healthCover} currency={currency} />
          </div>
        </div>
      </section>
    </div>
  );
}
