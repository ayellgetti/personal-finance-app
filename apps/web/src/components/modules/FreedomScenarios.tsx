import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatPercent, type FreedomInputs, type FreedomModeView } from "@/lib/finance/calculations";
import type { FreedomMode } from "@/types/finance";
import {
  compareRows,
  MAX_FREEDOM_SCENARIOS,
  toScenarioInput,
  type CompareKind,
  type FreedomScenario,
} from "@/lib/finance/freedom-scenarios";
import { listFreedomScenarios, removeFreedomScenario, saveFreedomScenario } from "@/lib/finance/freedom-scenarios-remote";
import { Panel, EmptyState, ActionTooltip } from "./shared";

function cell(kind: CompareKind, value: string | number, currency: string) {
  if (typeof value === "string") return value;
  if (kind === "money") return formatCurrency(value, currency, true);
  if (kind === "percent") return formatPercent(value);
  return String(value);
}

/** Save the current Freedom Calculator edit and compare up to three saved what-ifs with it. */
export function FreedomScenarios({
  mode,
  input,
  view,
  currency,
}: {
  mode: FreedomMode;
  input: FreedomInputs;
  view: FreedomModeView;
  currency: string;
}) {
  const [saved, setSaved] = useState<FreedomScenario[]>([]);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setSaved(await listFreedomScenarios());
      setLoadFailed(false);
    } catch {
      // Keep whatever is already shown and block saving, so the 3-item limit is not guessed at.
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const full = saved.length >= MAX_FREEDOM_SCENARIOS;
  const blocked = full || loadFailed;
  const current = toScenarioInput("Now", mode, input, view);

  const save = async () => {
    if (!title.trim()) {
      toast.error("Give this what-if a name, for example “Retire at 55”");
      return;
    }
    setBusy(true);
    try {
      await saveFreedomScenario(toScenarioInput(title, mode, input, view));
      setTitle("");
      toast.success("What-if saved");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this what-if");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await removeFreedomScenario(id);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove this what-if");
    }
  };

  return (
    <Panel title="Saved what-ifs">
      <p className="mb-4 text-sm text-muted-foreground">
        Try different ages and returns above, save the ones you want to keep, and compare up to {MAX_FREEDOM_SCENARIOS} side by side.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="whatif-title">Name this what-if</Label>
          <Input
            id="whatif-title"
            value={title}
            maxLength={60}
            placeholder="Retire at 55"
            disabled={blocked}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <Button className="rounded-xl" disabled={busy || blocked} onClick={() => void save()}>
          Save what-if
        </Button>
      </div>
      {loadFailed ? (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          Could not load your saved what-ifs.{" "}
          <button type="button" className="underline" onClick={() => void load()}>Try again</button>
        </p>
      ) : null}
      {full ? (
        <p className="mt-2 text-xs text-muted-foreground">
          You have {MAX_FREEDOM_SCENARIOS} saved. Delete one to save another.
        </p>
      ) : null}

      {saved.length === 0 ? (
        <div className="mt-4">
          <EmptyState message="Nothing saved yet. Change an input above, name it, and save." />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Compare</th>
                <th className="py-2 pr-4 font-medium">Current edit</th>
                {saved.map((scenario) => (
                  <th key={scenario.id} className="py-2 pr-4 font-medium">
                    <span className="inline-flex items-center gap-1">
                      {scenario.title}
                      <ActionTooltip label="Delete">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-danger"
                          aria-label={`Delete ${scenario.title}`}
                          onClick={() => void remove(scenario.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </ActionTooltip>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareRows(current, saved).map((row) => (
                <tr key={row.label} className="border-t border-border/60">
                  <th scope="row" className="py-2 pr-4 text-left font-medium text-muted-foreground">{row.label}</th>
                  {row.values.map((value, index) => (
                    <td key={index} className="py-2 pr-4 tabular-nums">{cell(row.kind, value, currency)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
