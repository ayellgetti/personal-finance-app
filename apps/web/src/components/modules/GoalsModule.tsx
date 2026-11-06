import { useFinance, newId } from "@/lib/finance/store";
import {
  analyzeGoal,
  goalFixes,
  formatCurrency,
  formatPercent,
  goalProjectionSchedule,
} from "@/lib/finance/calculations";
import { FIRE_GOAL_DESCRIPTIONS, EMERGENCY_FUND_GOAL_ID, FireGoalType, Goal, Priority, USER_GOAL_TYPES } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, EmptyState, Badge, EditButton, ActionTooltip } from "./shared";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trash2, Target } from "lucide-react";
import { EmergencyFundModule } from "./EmergencyFundModule";
import { QuickAddDialog } from "./QuickTypePicker";
import { GoalQuickAdd } from "./GoalQuickAdd";
import { ProjectionScheduleDialog } from "./ProjectionScheduleDialog";

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

function goalFields(goal: Goal | undefined, currency: string): FieldDef[] {
  return [
    { name: "name", label: "Goal Name", type: "text", span: 2, defaultValue: goal?.name ?? "" },
    { name: "type", label: "Goal Type", type: "select", options: USER_GOAL_TYPES, optionDescriptions: FIRE_GOAL_DESCRIPTIONS, span: 2, defaultValue: goal?.type ?? USER_GOAL_TYPES[0] },
    { name: "targetAmount", label: "Target Amount", type: "number", prefix: currency, defaultValue: goal?.targetAmount ?? 0 },
    { name: "currentSaved", label: "Already Saved", type: "number", prefix: currency, defaultValue: goal?.currentSaved ?? 0 },
    { name: "targetDate", label: "Target Date", type: "date", defaultValue: goal?.targetDate ?? new Date(Date.now() + 5 * 31536000000).toISOString().slice(0, 10) },
    { name: "priority", label: "Priority", type: "select", options: PRIORITIES, defaultValue: goal?.priority ?? PRIORITIES[0] },
  ];
}

export function GoalsModule() {
  const { data, addItem, updateItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const lifeGoals = data.goals;
  const isEmergencyGoal = (goal: Goal) =>
    goal.id === EMERGENCY_FUND_GOAL_ID || goal.type === "Emergency Fund";

  const addGoal = (
    <QuickAddDialog
      title="Quick Goal Entry"
      description="Pick a goal type, then add as many milestones as you need before closing."
      triggerLabel="Add Goal"
    >
      <GoalQuickAdd currency={cur} onAdd={(goal) => addItem("goals", { id: newId(), ...goal })} />
    </QuickAddDialog>
  );

  return (
    <div className="space-y-8">
      <EmergencyFundModule />

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Life Goals</h3>
            <p className="text-sm text-muted-foreground">Add home, education, retirement and other milestones</p>
          </div>
          {addGoal}
        </div>

        {lifeGoals.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {lifeGoals.map((g) => {
              const a = analyzeGoal(data, g);
              const fixes = goalFixes(data, g);
              const progress = Math.min(100, (g.currentSaved / g.targetAmount) * 100);
              const tone: "success" | "gold" | "danger" =
                a.status === "On Track" ? "success" : a.status === "At Risk" ? "gold" : "danger";
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
                        {g.type in FIRE_GOAL_DESCRIPTIONS && (
                          <p className="mt-1 max-w-xs text-xs text-muted-foreground">{FIRE_GOAL_DESCRIPTIONS[g.type as FireGoalType]}</p>
                        )}
                      </div>
                    </div>
                    {!isEmergencyGoal(g) && (
                      <div className="flex items-center">
                        <EntityDialog
                          title="Edit Goal"
                          fields={goalFields(g, cur)}
                          trigger={<EditButton />}
                          onSubmit={(v) => updateItem("goals", g.id, v)}
                        />
                        <ActionTooltip label="Delete">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete"
                            className="text-muted-foreground hover:text-danger"
                            onClick={() => removeItem("goals", g.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </ActionTooltip>
                      </div>
                    )}
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
                  {fixes ? (
                    <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3 text-sm">
                      <p className="font-medium">How to get this back on track</p>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted-foreground">
                        {fixes.extraMonthlyNeeded > 0 ? (
                          <li>
                            Set aside {formatCurrency(fixes.monthlyNeeded, cur)}/month. Your surplus is {formatCurrency(fixes.monthlyAvailable, cur)}, so find{" "}
                            <span className="font-medium text-foreground">{formatCurrency(fixes.extraMonthlyNeeded, cur)}</span> more.
                          </li>
                        ) : (
                          <li>Set aside {formatCurrency(fixes.monthlyNeeded, cur)}/month. Your surplus already covers it.</li>
                        )}
                        {fixes.laterDate ? (
                          <li>
                            Or move the date to{" "}
                            <span className="font-medium text-foreground">
                              {fixes.laterDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                            </span>{" "}
                            and your current surplus is enough.
                          </li>
                        ) : (
                          <li>Free up monthly cash first; with no surplus, moving the date does not help.</li>
                        )}
                        <li>
                          Or lower the target to about{" "}
                          <span className="font-medium text-foreground">{formatCurrency(fixes.affordableTarget, cur, true)}</span> in today&apos;s money.
                        </li>
                      </ul>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Assumes an 11% annual return and {formatPercent(data.profile.inflationRate)} inflation.
                      </p>
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={tone}>{a.status}</Badge>
                    <ProjectionScheduleDialog
                      name={g.name}
                      description={`Funding path using the required monthly contribution, an assumed 11% annual return, and ${formatPercent(data.profile.inflationRate)} inflation.`}
                      rows={goalProjectionSchedule(data, g)}
                      currency={cur}
                    />
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
