import { useEffect, useMemo, useState } from "react";
import { Calculator, Landmark, Percent, Wallet } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatPercent } from "@/lib/finance/calculations";
import {
  currencySymbol,
  fetchTaxCatalog,
  listTaxScenarios,
  previewTaxPlan,
  removeTaxScenario,
  saveTaxScenario,
  taxApiError,
  type TaxCountry,
  type TaxPlanInput,
  type TaxPlanResult,
  type TaxScenario,
} from "@/lib/finance/tax-remote";
import { Panel, EmptyState } from "./shared";

const emptyInput: TaxPlanInput = {
  countryCode: "IN",
  regimeCode: "in_new_fy2025_26",
  grossSalary: 1_200_000,
  otherIncome: 0,
  section80C: 0,
  section80D: 0,
  hraExemption: 0,
  homeLoanInterest: 0,
  nps80Ccd: 0,
  employerNps80Ccd2: 0,
  otherDeductions: 0,
};

function Field({
  label,
  value,
  onChange,
  prefix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        {prefix ? <span className="text-sm text-muted-foreground">{prefix}</span> : null}
        <Input
          type="number"
          min={0}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TaxPlannerModule() {
  const [countries, setCountries] = useState<TaxCountry[]>([]);
  const [input, setInput] = useState<TaxPlanInput>(emptyInput);
  const [result, setResult] = useState<TaxPlanResult | null>(null);
  const [scenarios, setScenarios] = useState<TaxScenario[]>([]);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");

  const country = countries.find((item) => item.code === input.countryCode);
  const regimes = useMemo(() => country?.regimes ?? [], [country]);
  const regime = regimes.find((item) => item.code === input.regimeCode);
  const symbol = currencySymbol(regime?.currency ?? country?.currency ?? "INR");
  const deductions = regime?.deductions ?? [];

  const setField = <K extends keyof TaxPlanInput>(key: K, value: TaxPlanInput[K]) => {
    setInput((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    void Promise.all([fetchTaxCatalog(), listTaxScenarios()])
      .then(([catalog, saved]) => {
        setCountries(catalog);
        setScenarios(saved);
        const first = catalog[0]?.regimes[0];
        if (first) {
          setInput((current) => ({
            ...current,
            countryCode: first.countryCode,
            regimeCode: first.code,
          }));
        }
      })
      .catch((error) => toast.error(taxApiError(error)));
  }, []);

  useEffect(() => {
    if (!country) return;
    if (regimes.some((item) => item.code === input.regimeCode)) return;
    const next = regimes[0];
    if (next) setField("regimeCode", next.code);
  }, [country, input.regimeCode, regimes]);

  const runPreview = async () => {
    setBusy(true);
    try {
      const next = await previewTaxPlan(input);
      setResult(next);
    } catch (error) {
      toast.error(taxApiError(error));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const scenario = await saveTaxScenario({ ...input, title: title.trim() || undefined });
      setScenarios((current) => [scenario, ...current]);
      setResult(scenario.result);
      toast.success("Tax scenario saved");
    } catch (error) {
      toast.error(taxApiError(error));
    } finally {
      setBusy(false);
    }
  };

  const comparison = useMemo(() => {
    if (!result) return [];
    return result.slabs.filter((slab) => slab.taxableInSlab > 0);
  }, [result]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Income and country" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={input.countryCode} onValueChange={(value) => setField("countryCode", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Regime / year</Label>
              <Select value={input.regimeCode} onValueChange={(value) => setField("regimeCode", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regimes.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Gross salary / employment income" value={input.grossSalary} onChange={(value) => setField("grossSalary", value)} prefix={symbol} />
            <Field label="Other taxable income" value={input.otherIncome} onChange={(value) => setField("otherIncome", value)} prefix={symbol} />
            {regime ? (
              <p className="text-xs text-muted-foreground">
                Standard deduction of {formatCurrency(regime.standardDeduction, symbol)} is applied automatically.
              </p>
            ) : null}
            {deductions.map((deduction) => (
              <Field
                key={deduction.code}
                label={deduction.label}
                hint={deduction.hint}
                value={(input[deduction.code] as number | undefined) ?? 0}
                onChange={(value) => setField(deduction.code, value)}
                prefix={symbol}
              />
            ))}
            <div className="space-y-2">
              <Label>Scenario title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="FY 2025-26 new regime" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-xl" disabled={busy} onClick={() => void runPreview()}>
                <Calculator className="h-4 w-4" /> Estimate
              </Button>
              <Button variant="secondary" className="rounded-xl" disabled={busy} onClick={() => void save()}>
                Save scenario
              </Button>
            </div>
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          {result ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard label="Taxable income" value={formatCurrency(result.taxableIncome, symbol, true)} icon={Wallet} accent="default" />
                <StatCard label="Total tax" value={formatCurrency(result.totalTax, symbol, true)} icon={Landmark} accent="danger" />
                <StatCard label="Effective rate" value={formatPercent(result.effectiveRate)} icon={Percent} accent="gold" />
                <StatCard label="Monthly take-home" value={formatCurrency(result.takeHomeMonthly, symbol)} icon={Wallet} accent="primary" />
              </div>
              <Panel title={`${result.financialYear} · AY ${result.assessmentYear}`}>
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <p>Gross income <span className="float-right font-medium">{formatCurrency(result.grossIncome, symbol)}</span></p>
                  <p>Standard deduction <span className="float-right font-medium">{formatCurrency(result.standardDeduction, symbol)}</span></p>
                  <p>Other deductions <span className="float-right font-medium">{formatCurrency(result.chapterViaDeductions, symbol)}</span></p>
                  <p>Rebate <span className="float-right font-medium">{formatCurrency(result.rebate, symbol)}</span></p>
                  <p>Cess <span className="float-right font-medium">{formatCurrency(result.cess, symbol)}</span></p>
                  <p>Annual take-home <span className="float-right font-medium">{formatCurrency(result.takeHomeAnnual, symbol)}</span></p>
                </div>
                <div className="mt-4 space-y-2">
                  {comparison.map((slab) => (
                    <div key={`${slab.from}-${slab.to}`} className="flex justify-between rounded-xl border border-border px-3 py-2 text-sm">
                      <span>
                        {formatCurrency(slab.from, symbol)} – {slab.to == null ? "above" : formatCurrency(slab.to, symbol)} · {(slab.rate * 100).toFixed(0)}%
                      </span>
                      <span className="font-medium">{formatCurrency(slab.tax, symbol)}</span>
                    </div>
                  ))}
                </div>
                {result.notes.length > 0 ? (
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {result.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-4 text-xs text-muted-foreground">
                  Estimate only — not a filing product. Confirm with current law or a tax professional before you act.
                </p>
              </Panel>
            </>
          ) : (
            <Panel title="Estimate">
              <EmptyState message="Choose a country and regime, then run Estimate to see slabs, rebate, and take-home." />
            </Panel>
          )}
        </div>
      </div>

      <Panel title="Saved scenarios">
        {scenarios.length === 0 ? (
          <EmptyState message="Save an estimate to compare later" />
        ) : (
          <div className="space-y-3">
            {scenarios.map((scenario) => {
              const cur = currencySymbol(scenario.result.currency);
              return (
                <div key={scenario.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{scenario.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {scenario.countryCode} · {scenario.financialYear} · tax {formatCurrency(scenario.result.totalTax, cur)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setInput({ ...emptyInput, ...scenario.input, countryCode: scenario.countryCode, regimeCode: scenario.regimeCode });
                        setResult(scenario.result);
                        setTitle(scenario.title);
                      }}
                    >
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-danger"
                      onClick={() => {
                        void removeTaxScenario(scenario.id)
                          .then(() => setScenarios((current) => current.filter((item) => item.id !== scenario.id)))
                          .catch((error) => toast.error(taxApiError(error)));
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
