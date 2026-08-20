import { useFinance } from "@/lib/finance/store";
import { healthScore } from "@/lib/finance/calculations";
import { useAdvisorReport } from "@/lib/finance/advisor";
import { AdvisorPlanOfAction } from "./AdvisorOutput";
import { Panel } from "./shared";
import { HealthGauge } from "./HealthGauge";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";

export function AIAdvisor() {
  const { data } = useFinance();
  const hs = healthScore(data);
  const query = useAdvisorReport(data);
  const advice = query.data?.advice;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-[var(--shadow-elevated)] md:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/15 backdrop-blur-sm">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">AI Financial Advisor</h2>
              <p className="text-sm text-primary-foreground/80">
                Plan of action from the combined rule engine and OpenAI advisor prompt.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => void query.regenerate()}
            disabled={query.isRegenerating}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${query.isRegenerating ? "animate-spin" : ""}`} />
            {query.isRegenerating ? "Generating…" : "Refresh plan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Health Snapshot" className="lg:col-span-1">
          <div className="flex flex-col items-center">
            <HealthGauge score={hs} />
            <div className="mt-4 w-full space-y-3">
              {hs.components.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="text-muted-foreground">{c.score}/100</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${c.score}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          {query.isError && (
            <Panel>
              <p className="text-sm text-danger">Could not generate a plan. Check that you are signed in, then try again.</p>
            </Panel>
          )}
          {query.isLoading && (
            <Panel>
              <p className="text-sm text-muted-foreground">Building your plan of action…</p>
            </Panel>
          )}
          {advice && <AdvisorPlanOfAction advice={advice} currency={data.profile.currency} />}
        </div>
      </div>
    </div>
  );
}
