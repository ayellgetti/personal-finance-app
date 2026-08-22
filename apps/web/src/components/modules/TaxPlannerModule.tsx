import { useCallback, useEffect, useMemo, useState } from "react";
import { Landmark, Percent, Sparkles, Wallet } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatPercent } from "@/lib/finance/calculations";
import {
  compareTaxPlans,
  currencySymbol,
  fetchTaxCatalog,
  listTaxScenarios,
  removeTaxScenario,
  saveTaxScenario,
  taxApiError,
  taxDeductionAmountsOf,
  taxDeductionsForYear,
  taxFinancialYears,
  taxRegimesAllowing,
  type TaxComparison,
  type TaxComparisonColumnKey,
  type TaxComparisonRowKind,
  type TaxCountry,
  type TaxDeductionAmounts,
  type TaxDeductionCode,
  type TaxScenario,
} from "@/lib/finance/tax-remote";
import { Panel, EmptyState } from "./shared";

function AmountInput({
  value,
  onChange,
  prefix,
  ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {prefix ? <span className="text-sm text-muted-foreground">{prefix}</span> : null}
      <Input
        type="number"
        min={0}
        aria-label={ariaLabel}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
    </div>
  );
}

const ROW_STYLES: Record<TaxComparisonRowKind, string> = {
  income: "font-medium",
  exemption: "",
  section: "bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground",
  deduction: "",
  subtotal: "bg-muted/30 font-medium",
  tax: "",
  total: "border-t-2 border-border font-display font-bold",
};

export function TaxPlannerModule() {
  const [countries, setCountries] = useState<TaxCountry[]>([]);
  const [countryCode, setCountryCode] = useState("IN");
  const [financialYear, setFinancialYear] = useState("");
  const [grossSalary, setGrossSalary] = useState(1_200_000);
  const [otherIncome, setOtherIncome] = useState(0);
  const [actual, setActual] = useState<TaxDeductionAmounts>({});
  const [planned, setPlanned] = useState<TaxDeductionAmounts>({});
  const [comparison, setComparison] = useState<TaxComparison | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<TaxComparisonColumnKey | null>(null);
  const [scenarios, setScenarios] = useState<TaxScenario[]>([]);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");

  const country = countries.find((item) => item.code === countryCode);
  const years = useMemo(() => taxFinancialYears(country), [country]);
  const year = years.find((item) => item.financialYear === financialYear);
  const symbol = currencySymbol(year?.regimes[0]?.currency ?? country?.currency ?? "INR");
  const deductions = useMemo(() => taxDeductionsForYear(year), [year]);

  const plannedAmount = useCallback(
    (code: TaxDeductionCode) => planned[code] ?? actual[code] ?? 0,
    [planned, actual],
  );

  useEffect(() => {
    void Promise.all([fetchTaxCatalog(), listTaxScenarios()])
      .then(([catalog, saved]) => {
        setCountries(catalog);
        setScenarios(saved);
        const first = catalog[0];
        if (first) {
          setCountryCode(first.code);
          setFinancialYear(taxFinancialYears(first)[0]?.financialYear ?? "");
        }
      })
      .catch((error) => toast.error(taxApiError(error)));
  }, []);

  useEffect(() => {
    if (years.length === 0) return;
    if (years.some((item) => item.financialYear === financialYear)) return;
    setFinancialYear(years[0].financialYear);
  }, [years, financialYear]);

  // The sheet is the primary output, so keep it in step with the inputs.
  useEffect(() => {
    if (!financialYear || grossSalary <= 0) {
      setComparison(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void compareTaxPlans({
        countryCode,
        financialYear,
        grossSalary,
        otherIncome,
        ...actual,
        planned,
      })
        .then((next) => {
          if (!cancelled) setComparison(next);
        })
        .catch((error) => {
          if (!cancelled) toast.error(taxApiError(error));
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [countryCode, financialYear, grossSalary, otherIncome, actual, planned]);

  const activeColumn = useMemo(() => {
    if (!comparison) return undefined;
    const key = selectedColumn ?? comparison.bestColumnKey;
    return (
      comparison.columns.find((column) => column.key === key) ?? comparison.columns[0]
    );
  }, [comparison, selectedColumn]);

  const maxOutPlanned = () => {
    const next: TaxDeductionAmounts = { ...planned };
    for (const deduction of deductions) {
      const salaryCap =
        deduction.salaryCapRate != null ? grossSalary * deduction.salaryCapRate : undefined;
      const cap = deduction.cap ?? salaryCap;
      if (cap != null) {
        next[deduction.code] = Math.round(cap);
      }
    }
    setPlanned(next);
  };

  const save = async () => {
    if (!activeColumn) return;
    setBusy(true);
    try {
      const amounts = activeColumn.key === "planner" ? { ...actual, ...planned } : actual;
      const scenario = await saveTaxScenario({
        countryCode,
        regimeCode: activeColumn.regimeCode,
        grossSalary,
        otherIncome,
        ...amounts,
        title: title.trim() || undefined,
      });
      setScenarios((current) => [scenario, ...current]);
      toast.success("Tax scenario saved");
    } catch (error) {
      toast.error(taxApiError(error));
    } finally {
      setBusy(false);
    }
  };

  const loadScenario = (scenario: TaxScenario) => {
    setCountryCode(scenario.countryCode);
    setFinancialYear(scenario.financialYear);
    setGrossSalary(scenario.input.grossSalary ?? 0);
    setOtherIncome(scenario.input.otherIncome ?? 0);
    setActual(taxDeductionAmountsOf(scenario.input));
    setPlanned({});
    setSelectedColumn(null);
    setTitle(scenario.title);
  };

  const slabs = activeColumn?.result.slabs.filter((slab) => slab.taxableInSlab > 0) ?? [];
  const baseTotal = comparison?.columns[0]?.result.totalTax;
  const saving =
    comparison && baseTotal != null ? baseTotal - comparison.bestTotalTax : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Income" className="lg:col-span-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
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
              <Label>Financial year</Label>
              <Select value={financialYear} onValueChange={setFinancialYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((item) => (
                    <SelectItem key={item.financialYear} value={item.financialYear}>
                      FY {item.financialYear} · AY {item.assessmentYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gross salary / employment income</Label>
              <AmountInput
                ariaLabel="Gross salary"
                value={grossSalary}
                onChange={setGrossSalary}
                prefix={symbol}
              />
            </div>
            <div className="space-y-2">
              <Label>Other taxable income</Label>
              <AmountInput
                ariaLabel="Other taxable income"
                value={otherIncome}
                onChange={setOtherIncome}
                prefix={symbol}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Every regime available for the year is computed automatically. Enter deductions
              below to see what each one is worth.
            </p>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Computation of Income"
          action={
            comparison && saving > 0 ? (
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                Save {formatCurrency(saving, symbol)} on{" "}
                {comparison.columns.find((column) => column.key === comparison.bestColumnKey)?.label}
              </span>
            ) : null
          }
        >
          {!comparison ? (
            <EmptyState message="Enter your income to compare the regimes side by side" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[13rem]">Computation of Income</TableHead>
                  {comparison.columns.map((column) => {
                    const isBest = column.key === comparison.bestColumnKey;
                    const isActive = column.key === activeColumn?.key;
                    return (
                      <TableHead key={column.key} className="whitespace-nowrap text-right">
                        <button
                          type="button"
                          title={`${column.regimeLabel} — show the breakdown`}
                          aria-pressed={isActive}
                          className={`whitespace-nowrap ${
                            isActive ? "font-semibold text-foreground" : ""
                          }`}
                          onClick={() => setSelectedColumn(column.key)}
                        >
                          {column.label}
                          {isBest ? (
                            <Sparkles
                              className="ml-1 inline h-3 w-3 text-success"
                              aria-label="Lowest tax"
                            />
                          ) : null}
                        </button>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.rows.map((row) => (
                  <TableRow key={row.key} className={ROW_STYLES[row.kind]}>
                    <TableCell
                      className={`py-2.5 ${row.kind === "deduction" ? "pl-8" : ""}`}
                    >
                      {row.label}
                    </TableCell>
                    {row.values.map((value, index) => {
                      const column = comparison.columns[index];
                      return (
                        <TableCell
                          key={column?.key ?? index}
                          className={`py-2.5 text-right tabular-nums ${
                            column?.key === activeColumn?.key ? "bg-primary/5" : ""
                          }`}
                        >
                          {value === null ? (
                            <span className="text-muted-foreground">--</span>
                          ) : (
                            formatCurrency(value, symbol)
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>

      <Panel
        title="Deductions and exemptions"
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={maxOutPlanned}>
              Max out planner
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => setPlanned({})}
            >
              Reset planner
            </Button>
          </div>
        }
      >
        {deductions.length === 0 ? (
          <EmptyState message="Pick a country and financial year to enter deductions" />
        ) : (
          <div className="space-y-3">
            <div className="hidden gap-4 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
              <span>Section</span>
              <span>Actual</span>
              <span>With planner</span>
            </div>
            {deductions.map((deduction) => {
              const allowedIn = taxRegimesAllowing(year, deduction.code);
              return (
                <div
                  key={deduction.code}
                  className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[minmax(0,1fr)_10rem_10rem] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{deduction.label}</p>
                    {deduction.hint ? (
                      <p className="text-xs text-muted-foreground">{deduction.hint}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Counts in: {allowedIn.map((regime) => regime.label).join(", ")}
                    </p>
                  </div>
                  <AmountInput
                    ariaLabel={`${deduction.label} actual`}
                    value={actual[deduction.code] ?? 0}
                    onChange={(value) =>
                      setActual((current) => ({ ...current, [deduction.code]: value }))
                    }
                    prefix={symbol}
                  />
                  <AmountInput
                    ariaLabel={`${deduction.label} with planner`}
                    value={plannedAmount(deduction.code)}
                    onChange={(value) =>
                      setPlanned((current) => ({ ...current, [deduction.code]: value }))
                    }
                    prefix={symbol}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {activeColumn ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Taxable income"
              value={formatCurrency(activeColumn.result.taxableIncome, symbol, true)}
              icon={Wallet}
              accent="default"
            />
            <StatCard
              label="Total tax"
              value={formatCurrency(activeColumn.result.totalTax, symbol, true)}
              icon={Landmark}
              accent="danger"
            />
            <StatCard
              label="Effective rate"
              value={formatPercent(activeColumn.result.effectiveRate)}
              icon={Percent}
              accent="gold"
            />
            <StatCard
              label="Monthly take-home"
              value={formatCurrency(activeColumn.result.takeHomeMonthly, symbol)}
              icon={Wallet}
              accent="primary"
            />
          </div>

          <Panel title={`${activeColumn.label} · ${activeColumn.regimeLabel}`}>
            <div className="space-y-2">
              {slabs.map((slab) => (
                <div
                  key={`${slab.from}-${slab.to}`}
                  className="flex justify-between rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {formatCurrency(slab.from, symbol)} –{" "}
                    {slab.to == null ? "above" : formatCurrency(slab.to, symbol)} ·{" "}
                    {(slab.rate * 100).toFixed(0)}%
                  </span>
                  <span className="font-medium">{formatCurrency(slab.tax, symbol)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[14rem] flex-1 space-y-2">
                <Label>Scenario title</Label>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={`FY ${financialYear} ${activeColumn.label}`}
                />
              </div>
              <Button
                variant="secondary"
                className="rounded-xl"
                disabled={busy}
                onClick={() => void save()}
              >
                Save scenario
              </Button>
            </div>
            {activeColumn.result.notes.length > 0 ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {activeColumn.result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            <p className="mt-4 text-xs text-muted-foreground">
              Estimate only — not a filing product. Confirm with current law or a tax
              professional before you act.
            </p>
          </Panel>
        </div>
      ) : null}

      <Panel title="Saved scenarios">
        {scenarios.length === 0 ? (
          <EmptyState message="Save an estimate to compare later" />
        ) : (
          <div className="space-y-3">
            {scenarios.map((scenario) => {
              const cur = currencySymbol(scenario.result.currency);
              return (
                <div
                  key={scenario.id}
                  className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{scenario.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {scenario.countryCode} · {scenario.financialYear} · tax{" "}
                      {formatCurrency(scenario.result.totalTax, cur)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => loadScenario(scenario)}
                    >
                      Load
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-danger"
                      onClick={() => {
                        void removeTaxScenario(scenario.id)
                          .then(() =>
                            setScenarios((current) =>
                              current.filter((item) => item.id !== scenario.id),
                            ),
                          )
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
