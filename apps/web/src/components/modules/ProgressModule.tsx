import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CheckCircle2, Circle } from "lucide-react";
import { useFinance } from "@/lib/finance/store";
import { formatCurrency } from "@/lib/finance/calculations";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { Wallet, Gauge, TrendingUp, Receipt } from "lucide-react";
import { Panel, EmptyState, tooltipStyle } from "./shared";
import { listCheckIns, saveCheckIn } from "@/lib/finance/check-in-remote";
import {
  buildCheckIn,
  checkInDue,
  chronological,
  formatMonthKey,
  milestones,
  monthKey,
  yearOverYear,
  type CheckIn,
} from "@/lib/finance/check-in";

function signed(value: number, cur: string) {
  return `${value >= 0 ? "+" : "−"}${formatCurrency(Math.abs(value), cur, true)}`;
}

export function ProgressModule() {
  const { data } = useFinance();
  const cur = data.profile.currency;
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const draft = buildCheckIn(data);

  const load = useCallback(async () => {
    try {
      setHistory(await listCheckIns(36));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load your history");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    // Rebuild at click time so a screen left open across a month change records the right month.
    const fresh = buildCheckIn(data);
    if (!fresh) return;
    setBusy(true);
    try {
      await saveCheckIn(fresh);
      toast.success(`Check-in saved for ${formatMonthKey(fresh.month)}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your check-in");
    } finally {
      setBusy(false);
    }
  };

  const ordered = chronological(history);
  const due = checkInDue(history);
  const yoy = yearOverYear(history);
  const thisMonth = monthKey();
  const saved = history.find((c) => c.month === thisMonth);

  return (
    <div className="space-y-6">
      <Panel title={`${formatMonthKey(thisMonth)} check-in`}>
        {!draft ? (
          <EmptyState message="Add your income and expenses first, then record a check-in here." />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {saved
                ? "You have checked in this month. Saving again replaces it with today's numbers."
                : "Sixty seconds: review these five numbers from your saved data, then save."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Net worth" value={formatCurrency(draft.netWorth, cur, true)} icon={Wallet} accent="gold" />
              <StatCard label="Monthly income" value={formatCurrency(draft.monthlyIncome, cur)} icon={TrendingUp} accent="primary" />
              <StatCard label="Monthly bills" value={formatCurrency(draft.monthlyExpense, cur)} icon={Receipt} accent="danger" />
              <StatCard label="Health score" value={`${draft.healthScore} / 100`} icon={Gauge} accent="default" />
            </div>
            <Button className="mt-4 rounded-xl" disabled={busy} onClick={() => void save()}>
              {saved ? "Update this month's check-in" : "Save check-in"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Out of date? Update your income, expenses or investments first; the numbers follow.
            </p>
          </>
        )}
      </Panel>

      {loaded && due && ordered.length > 0 ? (
        <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
          Your last check-in was {formatMonthKey(ordered[ordered.length - 1]!.month)}. Record this month to keep your trend going.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Net worth and health score over time">
          {ordered.length < 2 ? (
            <EmptyState message="Your trend appears after two monthly check-ins." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ordered.map((c) => ({ ...c, label: formatMonthKey(c.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="nw" tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
                <YAxis yAxisId="score" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line yAxisId="nw" type="monotone" dataKey="netWorth" name="Net worth" stroke="hsl(var(--primary))" strokeWidth={2.5} />
                <Line yAxisId="score" type="monotone" dataKey="healthScore" name="Health score" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {yoy ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Since {formatMonthKey(yoy.from.month)}: net worth {signed(yoy.netWorthChange, cur)}, health score{" "}
              {yoy.scoreChange >= 0 ? "+" : "−"}
              {Math.abs(yoy.scoreChange)}.
            </p>
          ) : null}
        </Panel>

        <Panel title="Milestones">
          <ul className="space-y-3">
            {milestones(history).map((m) => (
              <li key={m.label} className="flex items-start gap-2 text-sm">
                {m.reachedIn ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="Reached" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Not yet" />
                )}
                <span>
                  {m.label}
                  <span className="block text-xs text-muted-foreground">
                    {m.reachedIn ? `Reached ${formatMonthKey(m.reachedIn)}` : "Not yet"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Past check-ins">
        {history.length === 0 ? (
          <EmptyState message="No check-ins yet. Save your first one above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Month</th>
                  <th className="py-2 pr-4 font-medium">Net worth</th>
                  <th className="py-2 pr-4 font-medium">Income</th>
                  <th className="py-2 pr-4 font-medium">Bills</th>
                  <th className="py-2 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="py-2 pr-4">{formatMonthKey(c.month)}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatCurrency(c.netWorth, cur, true)}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatCurrency(c.monthlyIncome, cur, true)}</td>
                    <td className="py-2 pr-4 tabular-nums">{formatCurrency(c.monthlyExpense, cur, true)}</td>
                    <td className="py-2 tabular-nums">{c.healthScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
