import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, type FreedomInputs } from "@/lib/finance/calculations";
import type { FinanceData, FreedomMode } from "@/types/finance";
import {
  DEFAULT_RETIREMENT_ASSUMPTIONS,
  indiaRetirementView,
  type RetirementAssumptions,
} from "@/lib/finance/retirement-india";
import { Panel, EmptyState } from "./shared";

type NumericKey = Exclude<keyof RetirementAssumptions, "includeGratuity">;

const FIELDS: { key: NumericKey; label: string; hint: string }[] = [
  { key: "healthShare", label: "Healthcare share of spending (%)", hint: "Part of retirement spending that is medical." },
  { key: "healthInflation", label: "Healthcare inflation (%)", hint: "Usually above general inflation." },
  { key: "annuityRate", label: "Annuity rate on NPS (%)", hint: "NPS rules require 40% to buy an annuity." },
  { key: "epfReturn", label: "EPF return if blank (%)", hint: "Used only when a holding has no return entered." },
  { key: "ppfReturn", label: "PPF return if blank (%)", hint: "Used only when a holding has no return entered." },
  { key: "npsReturn", label: "NPS return if blank (%)", hint: "Used only when a holding has no return entered." },
];

/** Retirement the way Indian households actually fund it: EPF, PPF, NPS, gratuity and healthcare costs. */
export function IndiaRetirement({
  data,
  input,
  mode,
}: {
  data: FinanceData;
  input: FreedomInputs;
  mode: FreedomMode;
}) {
  const cur = data.profile.currency;
  const [assumptions, setAssumptions] = useState<RetirementAssumptions>(DEFAULT_RETIREMENT_ASSUMPTIONS);
  const view = indiaRetirementView(data, input, mode, assumptions);
  const set = (key: NumericKey, value: number) => setAssumptions((a) => ({ ...a, [key]: Math.max(0, value) }));

  return (
    <Panel title="Your number, the Indian way">
      <p className="mb-4 text-sm text-muted-foreground">
        The standard {mode === "Coast FIRE" ? "FIRE" : mode} number treats every rupee alike. This view counts where Indian retirement money
        actually sits, and that medical costs rise faster than prices. Every assumption below is yours to change.
      </p>

      {data.investments.length === 0 && view.gratuity === 0 ? (
        <EmptyState message="Add your EPF, PPF, NPS and other investments to see where your retirement money will come from." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 font-display text-sm font-semibold">Where it comes from at age {input.retirementAge}</h4>
            <table className="w-full text-sm">
              <tbody>
                {view.sources.map((source) => (
                  <tr key={source.group} className="border-t border-border/60 first:border-t-0">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-muted-foreground">{source.group}</th>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(source.value, cur, true)}</td>
                  </tr>
                ))}
                {view.gratuity > 0 && (
                  <tr className="border-t border-border/60">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-muted-foreground">Gratuity (estimate)</th>
                    <td className="py-2 text-right tabular-nums">{formatCurrency(view.gratuity, cur, true)}</td>
                  </tr>
                )}
                {view.npsAnnuityCorpus > 0 && (
                  <tr className="border-t border-border/60">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-muted-foreground">
                      Locked in an NPS annuity (not counted)
                    </th>
                    <td className="py-2 text-right tabular-nums">−{formatCurrency(view.npsAnnuityCorpus, cur, true)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-border font-semibold">
                  <th scope="row" className="py-2 pr-3 text-left">Counted corpus</th>
                  <td className="py-2 text-right tabular-nums">{formatCurrency(view.countedCorpus, cur, true)}</td>
                </tr>
              </tbody>
            </table>
            {view.annuityIncomePerYear > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                The NPS annuity pays about {formatCurrency(view.annuityIncomePerYear / 12, cur)}/month, which lowers the spending your corpus
                has to cover.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">Standard number</p>
              <p className="font-display text-xl font-semibold">{formatCurrency(view.genericTarget, cur, true)}</p>
              <p className="mt-3 text-xs text-muted-foreground">Indian-adjusted number</p>
              <p className="font-display text-2xl font-bold text-primary">{formatCurrency(view.indiaTarget, cur, true)}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Faster healthcare inflation adds {formatCurrency(view.healthcareExtra, cur, true)}; the NPS pension takes some off.
              </p>
            </div>
            <div className="rounded-xl bg-primary/5 p-4 text-sm">
              {view.shortfall === 0 ? (
                <p className="font-medium">Your counted corpus covers this number.</p>
              ) : (
                <p>
                  Shortfall of <span className="font-semibold">{formatCurrency(view.shortfall, cur, true)}</span>. Investing about{" "}
                  <span className="font-semibold">{formatCurrency(view.requiredMonthlyInvestment, cur)}</span> more each month at{" "}
                  {input.expectedReturn}% would close it.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-medium">Change the assumptions</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`ira-${field.key}`}>{field.label}</Label>
              <Input
                id={`ira-${field.key}`}
                type="number"
                step="0.05"
                min={0}
                value={assumptions[field.key]}
                onChange={(event) => set(field.key, Number(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            </div>
          ))}
          <div className="flex items-center gap-3 pt-6">
            <Switch
              id="ira-gratuity"
              checked={assumptions.includeGratuity}
              onCheckedChange={(checked) => setAssumptions((a) => ({ ...a, includeGratuity: checked }))}
            />
            <Label htmlFor="ira-gratuity">Count gratuity (salaried, 5+ years)</Label>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Assumption: basic pay is 40% of salary and your career started at 22, so gratuity follows the 15/26 formula, capped at ₹20 L.
          These defaults are rules of thumb. Have a SEBI-registered adviser confirm them before you rely on this number.
        </p>
      </details>
    </Panel>
  );
}
