import { useFinance, newId } from "@/lib/finance/store";
import { formatCurrency, analyzeGoal } from "@/lib/finance/calculations";
import { EMERGENCY_FUND_GOAL_ID, Priority, USER_GOAL_TYPES } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, EmptyState, Badge } from "./shared";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Target } from "lucide-react";
import { EmergencyFundModule } from "./EmergencyFundModule";

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

export function GoalsModule() {
  const { data, addItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const lifeGoals = data.goals.filter((g) => g.id !== EMERGENCY_FUND_GOAL_ID && g.type !== "Emergency Fund");

  const fields: FieldDef[] = [
    { name: "name", label: "Goal Name", type: "text", span: 2 },
    { name: "type", label: "Goal Type", type: "select", options: USER_GOAL_TYPES, span: 2 },
    { name: "targetAmount", label: "Target Amount", type: "number", prefix: cur },
    { name: "currentSaved", label: "Already Saved", type: "number", prefix: cur },
    { name: "targetDate", label: "Target Date", type: "date", defaultValue: new Date(Date.now() + 5 * 31536000000).toISOString().slice(0, 10) },
    { name: "priority", label: "Priority", type: "select", options: PRIORITIES },
  ];

  return (
    <div className="space-y-8">
      <EmergencyFundModule />

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Life Goals</h3>
            <p className="text-sm text-muted-foreground">Add home, education, retirement and other milestones</p>
          </div>
          <EntityDialog title="Add Goal" fields={fields} triggerLabel="Add Goal" onSubmit={(v) => addItem("goals", { id: newId(), ...v } as any)} />
        </div>

        {lifeGoals.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {lifeGoals.map((g) => {
              const a = analyzeGoal(data, g);
              const progress = Math.min(100, (g.currentSaved / g.targetAmount) * 100);
              const tone = a.status === "On Track" ? "success" : a.status === "At Risk" ? "gold" : "danger";
              return (
                <div key={g.id} className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-display font-semibold">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.type} · by {new Date(g.targetDate).getFullYear()}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-danger" onClick={() => removeItem("goals", g.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatCurrency(g.currentSaved, cur, true)} of {formatCurrency(g.targetAmount, cur, true)}</span>
                    <Badge tone={g.priority === "High" ? "danger" : g.priority === "Medium" ? "gold" : "muted"}>{g.priority}</Badge>
                  </div>
                  <Progress value={progress} className="mt-2 h-2.5" />

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Need</p>
                      <p className="font-semibold">{formatCurrency(a.monthlyRequired, cur)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Infl. Target</p>
                      <p className="font-semibold">{formatCurrency(a.inflationAdjustedTarget, cur, true)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Probability</p>
                      <p className={`font-semibold ${tone === "success" ? "text-success" : tone === "gold" ? "text-accent" : "text-danger"}`}>{a.probability}%</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Badge tone={tone as any}>{a.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <Panel><EmptyState message="Add your first life goal — emergency fund is already set up above" /></Panel>}
      </div>
    </div>
  );
}
