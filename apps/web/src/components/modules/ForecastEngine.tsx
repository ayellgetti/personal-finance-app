import { useState } from "react";
import { useFinance } from "@/lib/finance/store";
import { formatCurrency, forecastNetWorth, scenarioSummary } from "@/lib/finance/calculations";
import { Scenario } from "@/types/finance";
import { Panel, tooltipStyle } from "./shared";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

const SCENARIOS: { id: Scenario; desc: string; tone: string }[] = [
  { id: "Conservative", desc: "Lower returns, cautious markets (−3%)", tone: "chart-2" },
  { id: "Moderate", desc: "Expected returns as planned", tone: "chart-1" },
  { id: "Aggressive", desc: "Strong markets, higher risk (+3%)", tone: "chart-3" },
];

export function ForecastEngine() {
  const { data } = useFinance();
  const cur = data.profile.currency;
  const [active, setActive] = useState<Scenario>("Moderate");
  const summary = scenarioSummary(data);

  const conservative = forecastNetWorth(data, "Conservative");
  const moderate = forecastNetWorth(data, "Moderate");
  const aggressive = forecastNetWorth(data, "Aggressive");
  const merged = moderate.map((m, i) => ({
    year: m.year,
    Conservative: conservative[i].netWorth,
    Moderate: m.netWorth,
    Aggressive: aggressive[i].netWorth,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {SCENARIOS.map((s) => {
          const sum = summary.find((x) => x.scenario === s.id)!;
          return (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                "rounded-2xl border p-5 text-left transition-all",
                active === s.id ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)]" : "border-border bg-card hover:border-primary/40",
              )}
            >
              <p className="font-display text-lg font-bold">{s.id}</p>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
              <div className="mt-4 space-y-1.5 text-sm">
                <Row label="In 5 years" value={formatCurrency(sum.y5, cur, true)} />
                <Row label="In 10 years" value={formatCurrency(sum.y10, cur, true)} />
                <Row label="In 20 years" value={formatCurrency(sum.y20, cur, true)} />
                <Row label="Retirement corpus" value={formatCurrency(sum.retirementCorpus, cur, true)} emphasis />
              </div>
            </button>
          );
        })}
      </div>

      <Panel title="Net Worth Forecast — All Scenarios">
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={merged}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tickFormatter={(v) => formatCurrency(v, cur, true)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={70} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v, cur, true)} />
            <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            <Line type="monotone" dataKey="Conservative" stroke="hsl(var(--chart-2))" strokeWidth={active === "Conservative" ? 3.5 : 1.5} dot={false} />
            <Line type="monotone" dataKey="Moderate" stroke="hsl(var(--chart-1))" strokeWidth={active === "Moderate" ? 3.5 : 1.5} dot={false} />
            <Line type="monotone" dataKey="Aggressive" stroke="hsl(var(--chart-3))" strokeWidth={active === "Aggressive" ? 3.5 : 1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasis ? "font-display font-bold text-primary" : "font-medium"}>{value}</span>
    </div>
  );
}
