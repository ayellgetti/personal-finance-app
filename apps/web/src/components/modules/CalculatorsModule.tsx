import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calculator, ChevronDown, Eye, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/finance/calculations";
import {
  amountToIndianRupeeWords,
  numberToIndianWords,
} from "@/lib/finance/number-words";
import { Panel, tooltipStyle } from "./shared";
import {
  calculatorApiError,
  listCalculatorScenarios,
  previewCalculator,
  removeCalculatorScenario,
  saveCalculatorScenario,
  updateCalculatorScenario,
  type CalculatorInput,
  type CalculatorResult,
  type CalculatorScenario,
  type CalculatorType,
  type DepreciationMethod,
} from "@/lib/finance/calculator-remote";

const TYPE_OPTIONS: Array<{
  type: CalculatorType;
  label: string;
  description: string;
}> = [
  { type: "lumpsum", label: "Lumpsum", description: "Project a one-time investment" },
  { type: "sip", label: "SIP", description: "Project fixed monthly investments" },
  {
    type: "step_up_sip",
    label: "Step Up SIP",
    description: "Increase a monthly SIP every year",
  },
  { type: "emi", label: "EMI", description: "Find EMI from principal and tenure" },
  {
    type: "loan",
    label: "Loan",
    description: "Amount, rate, and tenure; EMI is optional",
  },
  {
    type: "future",
    label: "Future Value",
    description: "Find the SIP needed for a target",
  },
  {
    type: "depreciation",
    label: "Depreciation",
    description: "Straight-line or written-down value",
  },
  {
    type: "currency",
    label: "Currency",
    description: "Convert INR using an entered exchange rate",
  },
  {
    type: "number_words",
    label: "Number to Words",
    description: "Write a number in the Indian numbering system",
  },
  {
    type: "bond_yield",
    label: "Bond Yield",
    description: "Calculate current yield and yield to maturity",
  },
  {
    type: "stock",
    label: "Stock",
    description: "Estimate stock profit, loss, and return",
  },
  {
    type: "irr",
    label: "IRR",
    description: "Calculate return from periodic cash flows",
  },
];

type Draft = {
  type: CalculatorType;
  title: string;
  principal: number;
  monthlyContribution: number;
  annualRatePct: number;
  years: number;
  annualStepUpPct: number;
  months: number;
  monthlyPayment: number;
  targetAmount: number;
  method: DepreciationMethod;
  cost: number;
  salvageValue: number;
  usefulLifeYears: number;
  ratePct: number;
  amount: number;
  exchangeRate: number;
  targetCurrency: string;
  numberValue: number;
  faceValue: number;
  marketPrice: number;
  annualCouponRatePct: number;
  yearsToMaturity: number;
  paymentsPerYear: number;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  dividends: number;
  fees: number;
  cashFlowsText: string;
};

const DEFAULT_DRAFT: Draft = {
  type: "lumpsum",
  title: "",
  principal: 100_000,
  monthlyContribution: 10_000,
  annualRatePct: 12,
  years: 10,
  annualStepUpPct: 10,
  months: 60,
  monthlyPayment: 20_000,
  targetAmount: 1_000_000,
  method: "straight_line",
  cost: 500_000,
  salvageValue: 50_000,
  usefulLifeYears: 5,
  ratePct: 20,
  amount: 100_000,
  exchangeRate: 0.012,
  targetCurrency: "USD",
  numberValue: 100_000,
  faceValue: 1_000,
  marketPrice: 950,
  annualCouponRatePct: 8,
  yearsToMaturity: 5,
  paymentsPerYear: 2,
  buyPrice: 100,
  sellPrice: 125,
  quantity: 100,
  dividends: 500,
  fees: 100,
  cashFlowsText: "-100000, 30000, 35000, 40000, 45000",
};

export type LoanCalculatorPreset = {
  title: string;
  principal: number;
  annualRatePct: number;
  months: number;
  monthlyPayment: number;
};

function initialDraft(
  type: CalculatorType,
  loanPreset?: LoanCalculatorPreset | null,
): Draft {
  return {
    ...DEFAULT_DRAFT,
    type,
    ...(type === "loan"
      ? {
          principal: 5_000_000,
          annualRatePct: 9,
          months: 240,
          years: 20,
          monthlyPayment: 0,
          ...(loanPreset ?? {}),
        }
      : {}),
  };
}

function parseCashFlows(value: string): number[] {
  const cashFlows = value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map(Number);
  if (cashFlows.length < 2 || cashFlows.some((cashFlow) => !Number.isFinite(cashFlow))) {
    throw new Error("Enter at least two valid cash flows separated by commas");
  }
  return cashFlows;
}

function buildInput(draft: Draft): CalculatorInput {
  switch (draft.type) {
    case "lumpsum":
      return {
        type: draft.type,
        principal: draft.principal,
        annualRatePct: draft.annualRatePct,
        years: draft.years,
      };
    case "sip":
      return {
        type: draft.type,
        monthlyContribution: draft.monthlyContribution,
        annualRatePct: draft.annualRatePct,
        years: draft.years,
      };
    case "step_up_sip":
      return {
        type: draft.type,
        monthlyContribution: draft.monthlyContribution,
        annualRatePct: draft.annualRatePct,
        years: draft.years,
        annualStepUpPct: draft.annualStepUpPct,
      };
    case "emi":
      return {
        type: draft.type,
        principal: draft.principal,
        annualRatePct: draft.annualRatePct,
        months: draft.months,
      };
    case "loan":
      return {
        type: draft.type,
        principal: draft.principal,
        annualRatePct: draft.annualRatePct,
        months: Math.round(draft.months),
        ...(draft.monthlyPayment > 0 ? { monthlyPayment: draft.monthlyPayment } : {}),
      };
    case "future":
      return {
        type: draft.type,
        targetAmount: draft.targetAmount,
        annualRatePct: draft.annualRatePct,
        years: draft.years,
      };
    case "depreciation":
      return {
        type: draft.type,
        method: draft.method,
        cost: draft.cost,
        salvageValue: draft.salvageValue,
        usefulLifeYears: draft.usefulLifeYears,
        ...(draft.method === "written_down_value" ? { ratePct: draft.ratePct } : {}),
      };
    case "currency":
      return {
        type: draft.type,
        amount: draft.amount,
        exchangeRate: draft.exchangeRate,
        targetCurrency: draft.targetCurrency,
      };
    case "number_words":
      return { type: draft.type, number: Math.round(draft.numberValue) };
    case "bond_yield":
      return {
        type: draft.type,
        faceValue: draft.faceValue,
        marketPrice: draft.marketPrice,
        annualCouponRatePct: draft.annualCouponRatePct,
        yearsToMaturity: draft.yearsToMaturity,
        paymentsPerYear:
          draft.paymentsPerYear === 1
            ? 1
            : draft.paymentsPerYear === 4
              ? 4
              : 2,
      };
    case "stock":
      return {
        type: draft.type,
        buyPrice: draft.buyPrice,
        sellPrice: draft.sellPrice,
        quantity: draft.quantity,
        dividends: draft.dividends,
        fees: draft.fees,
      };
    case "irr":
      return { type: draft.type, cashFlows: parseCashFlows(draft.cashFlowsText) };
  }
}

function draftFromScenario(scenario: CalculatorScenario): Draft {
  const input = scenario.input;
  const draft = { ...DEFAULT_DRAFT, type: input.type, title: scenario.title };
  switch (input.type) {
    case "lumpsum":
      return { ...draft, ...input };
    case "sip":
      return { ...draft, ...input };
    case "step_up_sip":
      return { ...draft, ...input };
    case "emi":
      return { ...draft, ...input };
    case "loan":
      return {
        ...draft,
        ...input,
        monthlyPayment: input.monthlyPayment ?? 0,
        months: input.months ?? draft.months,
      };
    case "future":
      return { ...draft, ...input };
    case "depreciation":
      return { ...draft, ...input, ratePct: input.ratePct ?? draft.ratePct };
    case "currency":
      return { ...draft, ...input };
    case "number_words":
      return { ...draft, numberValue: input.number };
    case "bond_yield":
      return { ...draft, ...input };
    case "stock":
      return { ...draft, ...input };
    case "irr":
      return { ...draft, cashFlowsText: input.cashFlows.join(", ") };
  }
}

const MONEY_KEYS = new Set([
  "investedAmount",
  "estimatedReturns",
  "futureValue",
  "finalMonthlyContribution",
  "principalAmount",
  "principal",
  "interest",
  "payment",
  "balance",
  "monthlyPayment",
  "scheduledMonthlyPayment",
  "totalPayment",
  "totalInterest",
  "targetAmount",
  "requiredMonthlySip",
  "cost",
  "salvageValue",
  "totalDepreciation",
  "bookValue",
  "depreciation",
  "closingBookValue",
  "sourceAmount",
  "convertedAmount",
  "marketPrice",
  "faceValue",
  "annualCoupon",
  "totalCouponIncome",
  "redemptionGainLoss",
  "couponIncome",
  "cumulativeCouponIncome",
  "redemptionValue",
  "purchaseCost",
  "grossProceeds",
  "dividends",
  "fees",
  "netProceeds",
  "netProfit",
  "breakEvenPrice",
  "marketValue",
  "cashIncome",
  "netValue",
  "cashFlow",
  "cumulativeCashFlow",
  "totalInflows",
  "totalOutflows",
  "netCashFlow",
]);

const PERCENT_KEYS = new Set([
  "currentYieldPct",
  "yieldToMaturityPct",
  "returnPct",
  "irrPct",
  "loanPaidToDatePct",
]);

function labelFor(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatValue(key: string, value: number) {
  if (PERCENT_KEYS.has(key)) {
    return `${new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
    }).format(value)}%`;
  }
  if (MONEY_KEYS.has(key)) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);
}

function wordsForValue(key: string, value: number) {
  if (!Number.isFinite(value)) {
    return "";
  }
  if (PERCENT_KEYS.has(key) || key === "exchangeRate") {
    return "";
  }
  if (MONEY_KEYS.has(key)) {
    return amountToIndianRupeeWords(value);
  }
  if (Math.abs(value - Math.round(value)) < 0.005) {
    return numberToIndianWords(value);
  }
  return "";
}

export function CalculatorsModule({
  initialType = "lumpsum",
  loanPreset,
}: {
  initialType?: CalculatorType;
  loanPreset?: LoanCalculatorPreset | null;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    initialDraft(initialType, loanPreset),
  );
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [scenarios, setScenarios] = useState<CalculatorScenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void refreshScenarios();
  }, []);

  useEffect(() => {
    if (draft.type !== "loan") {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const next = await previewCalculator({
            type: "loan",
            principal: draft.principal,
            annualRatePct: draft.annualRatePct,
            months: Math.round(draft.months),
            ...(draft.monthlyPayment > 0
              ? { monthlyPayment: draft.monthlyPayment }
              : {}),
          });
          if (!cancelled) {
            setResult(next);
          }
        } catch (error) {
          if (!cancelled) {
            setResult(null);
            toast.error(calculatorApiError(error));
          }
        }
      })();
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    draft.type,
    draft.principal,
    draft.annualRatePct,
    draft.months,
    draft.monthlyPayment,
  ]);

  async function refreshScenarios() {
    try {
      setScenarios(await listCalculatorScenarios());
    } catch (error) {
      toast.error(calculatorApiError(error));
    } finally {
      setLoading(false);
    }
  }

  function updateNumber(key: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [key]: Number(value) }));
  }

  async function runPreview() {
    setSubmitting(true);
    try {
      setResult(await previewCalculator(buildInput(draft)));
    } catch (error) {
      toast.error(calculatorApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const scenario = selectedId
        ? await updateCalculatorScenario(
            selectedId,
            draft.title,
            buildInput(draft),
          )
        : await saveCalculatorScenario(draft.title, buildInput(draft));
      setSelectedId(scenario.id);
      setDraft(draftFromScenario(scenario));
      setResult(scenario.result);
      await refreshScenarios();
      toast.success(selectedId ? "Calculation updated" : "Calculation saved");
    } catch (error) {
      toast.error(calculatorApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  function openScenario(scenario: CalculatorScenario) {
    setSelectedId(scenario.id);
    setDraft(draftFromScenario(scenario));
    setResult(scenario.result);
  }

  async function removeScenario(id: string) {
    try {
      await removeCalculatorScenario(id);
      if (selectedId === id) {
        setSelectedId(null);
        setResult(null);
      }
      await refreshScenarios();
      toast.success("Calculation removed");
    } catch (error) {
      toast.error(calculatorApiError(error));
    }
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void save(event)}>
      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.8fr)_minmax(0,1.2fr)] xl:items-start">
          <Panel title={TYPE_OPTIONS.find((item) => item.type === draft.type)?.label}>
            <TextField
              label="Calculation name (optional)"
              value={draft.title}
              onChange={(value) =>
                setDraft((current) => ({ ...current, title: value }))
              }
            />
            {draft.type === "loan" ? (
              <div className="mt-5">
                <LoanCalculatorFields draft={draft} setDraft={setDraft} />
              </div>
            ) : (
              <div className="mt-5 space-y-6">
                {renderFields(draft, updateNumber, setDraft)}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => void runPreview()}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {selectedId ? "Update saved calculation" : "Save calculation"}
              </Button>
              {selectedId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedId(null);
                    setDraft((current) => ({ ...current, title: "" }));
                  }}
                >
                  Save as new
                </Button>
              )}
            </div>
          </Panel>

          {result ? (
            (result.type === "loan" ? (
              <LoanResultPanel
                result={result}
                principal={draft.principal}
                showTable={false}
              />
            ) : (
              <ResultPanel result={result} showTable={false} />
            ))
          ) : (
            <Panel title="Calculation preview">
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
                <Calculator className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm font-medium">No preview yet</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Enter your values and select Preview to see summary cards,
                  pie charts, and bar charts.
                </p>
              </div>
            </Panel>
          )}
      </div>

      <Panel>
        <Accordion type="single" collapsible>
          <AccordionItem value="recent" className="border-0">
            <AccordionTrigger className="py-0 hover:no-underline">
              <span>
                Recent saved calculations
                {scenarios.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({scenarios.length})
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">
                  Loading calculations…
                </p>
              ) : scenarios.length === 0 ? (
                <div className="py-6 text-center">
                  <Calculator className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">
                    No saved calculations
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Preview a scenario, then save it for later.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className={`flex items-center gap-2 rounded-xl border p-3 ${
                        selectedId === scenario.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => openScenario(scenario)}
                      >
                        <p className="truncate text-sm font-semibold">
                          {scenario.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {
                            TYPE_OPTIONS.find(
                              (item) => item.type === scenario.type,
                            )?.label
                          }
                          {" · "}
                          {new Date(scenario.updatedAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </p>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${scenario.title}`}
                        onClick={() => void removeScenario(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Panel>

      {result?.schedule && result.schedule.length > 0 &&
        (result.type === "loan" ? (
          <LoanResultPanel
            result={result}
            principal={draft.principal}
            showPreview={false}
          />
        ) : (
          <ResultPanel result={result} showPreview={false} />
        ))}
    </form>
  );
}

function renderFields(
  draft: Draft,
  updateNumber: (key: keyof Draft, value: string) => void,
  setDraft: Dispatch<SetStateAction<Draft>>,
) {
  function slider(
    key: keyof Draft,
    label: string,
    min: number,
    max: number,
    step: number,
    minLabel: string,
    maxLabel: string,
    suffix?: string,
  ) {
    const value = draft[key];
    if (typeof value !== "number") {
      return null;
    }
    return (
      <SliderField
        key={key}
        id={`calculator-${key}`}
        label={label}
        value={value}
        min={min}
        max={max}
        step={step}
        minLabel={minLabel}
        maxLabel={maxLabel}
        suffix={suffix}
        required
        onChange={(next) =>
          setDraft((current) => ({ ...current, [key]: next }))
        }
      />
    );
  }

  const rate = slider(
    "annualRatePct",
    "Expected annual rate (%)",
    0,
    100,
    0.1,
    "0%",
    "100%",
    "%",
  );
  const years = slider(
    "years",
    "Time period (years)",
    1 / 12,
    100,
    1 / 12,
    "1 month",
    "100 years",
  );

  switch (draft.type) {
    case "lumpsum":
      return [
        slider("principal", "Investment amount", 10_000, 1_000_000_000, 10_000, "₹10K", "₹100 Cr", "₹"),
        rate,
        years,
      ];
    case "sip":
      return [
        slider("monthlyContribution", "Monthly SIP", 500, 1_000_000, 500, "₹500", "₹10L", "₹"),
        rate,
        years,
      ];
    case "step_up_sip":
      return [
        slider("monthlyContribution", "Starting monthly SIP", 500, 1_000_000, 500, "₹500", "₹10L", "₹"),
        slider("annualStepUpPct", "Annual step up (%)", 0, 100, 0.5, "0%", "100%", "%"),
        rate,
        years,
      ];
    case "emi":
      return [
        slider("principal", "Loan principal", 10_000, 1_000_000_000, 10_000, "₹10K", "₹100 Cr", "₹"),
        rate,
        slider("months", "Tenure (months)", 1, 1_200, 1, "1 month", "1,200 months"),
      ];
    case "loan":
      return [];
    case "future":
      return [
        slider("targetAmount", "Target amount", 10_000, 1_000_000_000, 10_000, "₹10K", "₹100 Cr", "₹"),
        rate,
        years,
      ];
    case "depreciation":
      return [
        <div key="method" className="space-y-2">
          <Label htmlFor="depreciation-method">Method</Label>
          <select
            id="depreciation-method"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={draft.method}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                method: event.target.value as DepreciationMethod,
              }))
            }
          >
            <option value="straight_line">Straight line</option>
            <option value="written_down_value">Written-down value</option>
          </select>
        </div>,
        slider("cost", "Asset cost", 1_000, 1_000_000_000, 1_000, "₹1K", "₹100 Cr", "₹"),
        slider("salvageValue", "Salvage value", 0, 1_000_000_000, 1_000, "₹0", "₹100 Cr", "₹"),
        slider("usefulLifeYears", "Useful life (years)", 1, 100, 1, "1 year", "100 years"),
        ...(draft.method === "written_down_value"
          ? [slider("ratePct", "Depreciation rate (%)", 0.1, 100, 0.1, "0.1%", "100%", "%")]
          : []),
      ];
    case "currency":
      return [
        slider("amount", "Amount in INR", 100, 1_000_000_000, 100, "₹100", "₹100 Cr", "₹"),
        <NumberField key="exchangeRate" label={`1 INR in ${draft.targetCurrency}`} value={draft.exchangeRate} min={0.000001} step="any" onChange={(value) => updateNumber("exchangeRate", value)} />,
        <div key="targetCurrency" className="space-y-2">
          <Label htmlFor="target-currency">Target currency</Label>
          <select
            id="target-currency"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={draft.targetCurrency}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                targetCurrency: event.target.value,
              }))
            }
          >
            {["USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY"].map(
              (currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ),
            )}
          </select>
        </div>,
      ];
    case "number_words":
      return [
        <NumberField key="numberValue" label="Number" value={draft.numberValue} min={0} max={999_999_999_999} step="1" onChange={(value) => updateNumber("numberValue", value)} />,
      ];
    case "bond_yield":
      return [
        slider("faceValue", "Face value", 100, 10_000_000, 100, "₹100", "₹1 Cr", "₹"),
        slider("marketPrice", "Market price", 100, 10_000_000, 100, "₹100", "₹1 Cr", "₹"),
        slider("annualCouponRatePct", "Annual coupon rate (%)", 0, 100, 0.1, "0%", "100%", "%"),
        slider("yearsToMaturity", "Years to maturity", 1 / 12, 100, 1 / 12, "1 month", "100 years"),
        <div key="paymentsPerYear" className="space-y-2">
          <Label htmlFor="coupon-frequency">Coupon frequency</Label>
          <select
            id="coupon-frequency"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={draft.paymentsPerYear}
            onChange={(event) => updateNumber("paymentsPerYear", event.target.value)}
          >
            <option value={1}>Annual</option>
            <option value={2}>Semi-annual</option>
            <option value={4}>Quarterly</option>
          </select>
        </div>,
      ];
    case "stock":
      return [
        slider("buyPrice", "Buy price per share", 0.01, 1_000_000, 0.01, "₹0.01", "₹10L", "₹"),
        slider("sellPrice", "Sell or current price per share", 0, 1_000_000, 0.01, "₹0", "₹10L", "₹"),
        slider("quantity", "Number of shares", 0.01, 1_000_000, 0.01, "0.01", "10L"),
        <NumberField key="dividends" label="Total dividends" value={draft.dividends} min={0} onChange={(value) => updateNumber("dividends", value)} />,
        <NumberField key="fees" label="Total fees" value={draft.fees} min={0} onChange={(value) => updateNumber("fees", value)} />,
      ];
    case "irr":
      return [
        <div key="cashFlows" className="space-y-2 sm:col-span-2">
          <Label htmlFor="cash-flows">Periodic cash flows</Label>
          <Textarea
            id="cash-flows"
            required
            rows={5}
            value={draft.cashFlowsText}
            placeholder="-100000, 30000, 35000, 40000, 45000"
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                cashFlowsText: event.target.value,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Enter comma-separated values at equal intervals. Start with a
            negative investment, followed by returns.
          </p>
        </div>,
      ];
  }
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = 0.01,
  max,
  step = "any",
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
}) {
  const id = label.toLowerCase().replace(/\W+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ResultPanel({
  result,
  showPreview = true,
  showTable = true,
}: {
  result: CalculatorResult;
  showPreview?: boolean;
  showTable?: boolean;
}) {
  const pieData = resultPieData(result);
  const showChart =
    result.schedule &&
    result.schedule.length > 0 &&
    result.type !== "currency";

  return (
    <Panel title={showPreview ? "Calculation preview" : "Detailed schedule"}>
      {showPreview && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(result.values).map(([key, value]) => {
          const words = wordsForValue(key, value);
          return (
          <div key={key} className="rounded-xl bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">{labelFor(key)}</p>
            <p className="mt-1 font-display text-xl font-bold">
              {formatValue(key, value)}
            </p>
            {words && (
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                {words}
              </p>
            )}
          </div>
          );
        })}
          </div>

      {result.textValues && (
        <div className="mt-5 grid gap-3">
          {Object.entries(result.textValues).map(([key, value]) => (
            <div key={key} className="rounded-xl border bg-muted/30 p-5">
              <p className="text-xs text-muted-foreground">{labelFor(key)}</p>
              <p className="mt-2 font-display text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

          {(pieData.length > 0 || showChart) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {pieData.length > 0 && (
            <div>
              <p className="mb-2 text-center text-sm font-medium">
                {resultChartTitles(result.type).pie}
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={index === 0 ? PRINCIPAL_COLOR : INTEREST_COLOR}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {showChart && (
          <ResultBarChart result={result} />
          )}
        </div>
          )}
        </>
      )}

      {showTable && result.schedule && result.schedule.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/60 text-left">
                {Object.keys(result.schedule[0] ?? {}).map((key) => (
                  <th key={key} className="px-3 py-2 font-medium">
                    {labelFor(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.schedule.map((row, index) => (
                <tr key={row.year ?? index} className="border-b last:border-0">
                  {Object.entries(row).map(([key, value]) => (
                    <td key={key} className="px-3 py-2">
                      {formatValue(key, value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPreview && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {result.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
    </Panel>
  );
}

function resultPieData(result: CalculatorResult) {
  if (result.type === "emi") {
    return [
      { name: "Principal", value: result.values.principalAmount ?? 0 },
      { name: "Interest", value: result.values.totalInterest ?? 0 },
    ];
  }
  if (result.type === "depreciation") {
    return [
      { name: "Closing book value", value: result.values.bookValue ?? 0 },
      { name: "Depreciation", value: result.values.totalDepreciation ?? 0 },
    ];
  }
  if (result.type === "bond_yield") {
    return [
      { name: "Purchase price", value: result.values.marketPrice ?? 0 },
      { name: "Coupon income", value: result.values.totalCouponIncome ?? 0 },
    ];
  }
  if (result.type === "stock") {
    return [
      { name: "Purchase cost", value: result.values.purchaseCost ?? 0 },
      { name: "Positive net profit", value: Math.max(0, result.values.netProfit ?? 0) },
    ];
  }
  if (result.type === "irr") {
    return [
      { name: "Total outflows", value: result.values.totalOutflows ?? 0 },
      { name: "Total inflows", value: result.values.totalInflows ?? 0 },
    ];
  }
  if (result.type === "currency" || result.type === "number_words") {
    return [];
  }
  return [
    { name: "Invested amount", value: result.values.investedAmount ?? 0 },
    { name: "Estimated returns", value: result.values.estimatedReturns ?? 0 },
  ];
}

function resultChartTitles(type: CalculatorType) {
  if (type === "emi") {
    return { pie: "Break-up of total payment", bar: "Yearly repayment" };
  }
  if (type === "depreciation") {
    return { pie: "Asset value break-up", bar: "Depreciation schedule" };
  }
  if (type === "bond_yield") {
    return { pie: "Price and coupon income", bar: "Coupon schedule" };
  }
  if (type === "stock") {
    return { pie: "Investment and profit", bar: "Position comparison" };
  }
  if (type === "irr") {
    return { pie: "Cash inflows and outflows", bar: "Cash-flow timeline" };
  }
  return { pie: "Investment break-up", bar: "Yearly growth" };
}

function ResultBarChart({ result }: { result: CalculatorResult }) {
  const schedule = result.schedule ?? [];
  const isEmi = result.type === "emi";
  const isDepreciation = result.type === "depreciation";
  const isBond = result.type === "bond_yield";
  const isStock = result.type === "stock";
  const isIrr = result.type === "irr";
  const firstBarKey = isEmi
    ? "principal"
    : isDepreciation
      ? "depreciation"
      : isBond
        ? "couponIncome"
        : isStock
          ? "marketValue"
          : isIrr
            ? "cashFlow"
            : "investedAmount";
  const secondBarKey = isEmi
    ? "interest"
    : isStock
      ? "cashIncome"
      : !isDepreciation && !isBond && !isIrr
        ? "estimatedReturns"
        : undefined;
  const lineKey = isEmi
    ? "balance"
    : isDepreciation
      ? "closingBookValue"
      : isBond
        ? "cumulativeCouponIncome"
        : isStock
          ? "netValue"
          : isIrr
            ? "cumulativeCashFlow"
            : "futureValue";
  const xAxisKey = isIrr ? "period" : isStock ? "stage" : "year";

  return (
    <div>
      <p className="mb-2 text-center text-sm font-medium">
        {resultChartTitles(result.type).bar}
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={schedule}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, "₹", true)}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend wrapperStyle={{ fontSize: "0.7rem" }} />
          <Bar
            dataKey={firstBarKey}
            name={labelFor(firstBarKey)}
            stackId={secondBarKey ? "total" : undefined}
            fill={PRINCIPAL_COLOR}
          />
          {secondBarKey && (
            <Bar
              dataKey={secondBarKey}
              name={labelFor(secondBarKey)}
              stackId="total"
              fill={INTEREST_COLOR}
            />
          )}
          <Line
            dataKey={lineKey}
            name={labelFor(lineKey)}
            type="monotone"
            stroke={BALANCE_COLOR}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

const LOAN_AMOUNT_MAX = 2_00_00_000;
const PRINCIPAL_COLOR = "hsl(142 55% 38%)";
const INTEREST_COLOR = "hsl(24 92% 54%)";
const BALANCE_COLOR = "hsl(338 72% 38%)";
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function LoanCalculatorFields({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
}) {
  const [tenureUnit, setTenureUnit] = useState<"years" | "months">(
    draft.months % 12 === 0 ? "years" : "months",
  );
  const tenureValue = tenureUnit === "years" ? draft.months / 12 : draft.months;
  const tenureMax = tenureUnit === "years" ? 30 : 360;

  function setTenure(value: number) {
    const months =
      tenureUnit === "years" ? Math.round(value * 12) : Math.round(value);
    const nextMonths = Math.min(1_200, Math.max(1, months));
    setDraft((current) => ({
      ...current,
      months: nextMonths,
      years: nextMonths / 12,
    }));
  }

  function switchUnit(next: "years" | "months") {
    setTenureUnit(next);
    if (next === "years") {
      const years = Math.max(1, Math.round(draft.months / 12));
      setDraft((current) => ({ ...current, months: years * 12, years }));
    }
  }

  return (
    <div className="space-y-6">
      <SliderField
        id="loan-amount"
        label="Loan amount"
        value={draft.principal}
        min={10_000}
        max={LOAN_AMOUNT_MAX}
        step={10_000}
        suffix="₹"
        minLabel="0"
        maxLabel="200L"
        required
        onChange={(value) => setDraft((current) => ({ ...current, principal: value }))}
      />
      <SliderField
        id="interest-rate"
        label="Interest rate"
        value={draft.annualRatePct}
        min={1}
        max={20}
        step={0.1}
        suffix="%"
        minLabel="1"
        maxLabel="20"
        required
        onChange={(value) =>
          setDraft((current) => ({ ...current, annualRatePct: value }))
        }
      />
      <SliderField
        id="loan-tenure"
        label="Loan tenure"
        value={tenureValue}
        min={1}
        max={tenureMax}
        step={1}
        minLabel={tenureUnit === "years" ? "1" : "1"}
        maxLabel={tenureUnit === "years" ? "30" : "360"}
        required
        extra={
          <div className="flex rounded-md border border-input p-0.5">
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs font-semibold ${
                tenureUnit === "years"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => switchUnit("years")}
            >
              Yr
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs font-semibold ${
                tenureUnit === "months"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
              onClick={() => switchUnit("months")}
            >
              Mo
            </button>
          </div>
        }
        onChange={setTenure}
      />
      <div className="space-y-2">
        <Label htmlFor="loan-emi">Monthly EMI (optional)</Label>
        <Input
          id="loan-emi"
          type="number"
          min={0}
          step="any"
          value={draft.monthlyPayment || ""}
          placeholder="Leave blank to calculate EMI"
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              monthlyPayment:
                event.target.value === "" ? 0 : Number(event.target.value),
            }))
          }
        />
        <p className="text-xs text-muted-foreground">
          Amount, interest rate, and tenure are required. EMI is calculated
          unless you enter one.
        </p>
      </div>
    </div>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  suffix,
  minLabel,
  maxLabel,
  required,
  extra,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  minLabel: string;
  maxLabel: string;
  required?: boolean;
  extra?: ReactNode;
  onChange: (value: number) => void;
}) {
  const sliderValue = Math.min(max, Math.max(min, value));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-center gap-2">
          {extra}
          <div className="relative">
            <Input
              id={id}
              type="number"
              min={min}
              max={max}
              step={step}
              required={required}
              value={value}
              className={suffix ? "w-36 pr-8" : "w-36"}
              onChange={(event) => onChange(Number(event.target.value))}
            />
            {suffix && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {suffix}
              </span>
            )}
          </div>
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[sliderValue]}
        onValueChange={(values) => {
          const next = values[0];
          if (next === undefined) {
            return;
          }
          onChange(next);
        }}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function LoanResultPanel({
  result,
  principal,
  showPreview = true,
  showTable = true,
}: {
  result: CalculatorResult;
  principal: number;
  showPreview?: boolean;
  showTable?: boolean;
}) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const startYear = new Date().getFullYear();
  const emi = result.values.monthlyPayment ?? 0;
  const totalInterest = result.values.totalInterest ?? 0;
  const totalPayment = result.values.totalPayment ?? 0;
  const pieData = [
    { name: "Principal loan amount", value: principal },
    { name: "Total interest", value: totalInterest },
  ];
  const chartData = useMemo(
    () =>
      (result.schedule ?? []).map((row) => ({
        year: startYear + (row.year ?? 1) - 1,
        principal: row.principal ?? 0,
        interest: row.interest ?? 0,
        balance: row.balance ?? 0,
      })),
    [result.schedule, startYear],
  );
  const monthsByYear = useMemo(() => {
    const grouped = new Map<number, Array<Record<string, number>>>();
    for (const row of result.monthlySchedule ?? []) {
      const year = row.year ?? 0;
      const list = grouped.get(year) ?? [];
      list.push(row);
      grouped.set(year, list);
    }
    return grouped;
  }, [result.monthlySchedule]);

  function toggleYear(year: number) {
    setExpandedYears((current) => {
      const next = new Set(current);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  }

  return (
    <Panel title={showPreview ? "Loan summary" : "Amortization schedule"}>
      {showPreview && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
        <div className="divide-y divide-dashed divide-border">
          <LoanStat
            label="Loan EMI"
            value={formatCurrency(emi)}
            words={amountToIndianRupeeWords(emi)}
          />
          <LoanStat
            label="Total interest payable"
            value={formatCurrency(totalInterest)}
            words={amountToIndianRupeeWords(totalInterest)}
          />
          <LoanStat
            label="Total payment (principal + interest)"
            value={formatCurrency(totalPayment)}
            words={amountToIndianRupeeWords(totalPayment)}
          />
        </div>
        <div>
          <p className="mb-2 text-center text-sm font-medium">
            Break-up of total payment
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                <Cell fill={PRINCIPAL_COLOR} />
                <Cell fill={INTEREST_COLOR} />
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
          </div>

          {chartData.length > 0 && (
            <div className="mt-8">
          <p className="mb-3 text-sm font-medium">Repayment chart</p>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="balance"
                tickFormatter={(value) => formatCurrency(value, "₹", true)}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="payment"
                orientation="right"
                tickFormatter={(value) => formatCurrency(value, "₹", true)}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar
                yAxisId="payment"
                dataKey="principal"
                name="Principal"
                stackId="pay"
                fill={PRINCIPAL_COLOR}
              />
              <Bar
                yAxisId="payment"
                dataKey="interest"
                name="Interest"
                stackId="pay"
                fill={INTEREST_COLOR}
              />
              <Line
                yAxisId="balance"
                dataKey="balance"
                name="Balance"
                type="monotone"
                stroke={BALANCE_COLOR}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {showTable && result.schedule && result.schedule.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs">
                <th className="bg-muted px-3 py-2 font-medium">Year</th>
                <th className="px-3 py-2 font-medium" style={{ background: "hsl(142 45% 90%)" }}>
                  Principal (A)
                </th>
                <th className="px-3 py-2 font-medium" style={{ background: "hsl(24 90% 90%)" }}>
                  Interest (B)
                </th>
                <th className="bg-muted px-3 py-2 font-medium">Total payment (A + B)</th>
                <th className="px-3 py-2 font-medium" style={{ background: "hsl(338 70% 92%)" }}>
                  Balance
                </th>
                <th className="bg-muted px-3 py-2 font-medium">Loan paid to date</th>
              </tr>
            </thead>
            <tbody>
              {result.schedule.map((row) => {
                const yearNumber = row.year ?? 0;
                const calendarYear = startYear + yearNumber - 1;
                const expanded = expandedYears.has(yearNumber);
                const monthRows = monthsByYear.get(yearNumber) ?? [];
                return (
                  <Fragment key={yearNumber}>
                    <tr className="border-b">
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-medium"
                          aria-expanded={expanded}
                          onClick={() => toggleYear(yearNumber)}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`}
                          />
                          {calendarYear}
                        </button>
                      </td>
                      <td className="px-3 py-2">{formatCurrency(row.principal ?? 0)}</td>
                      <td className="px-3 py-2">{formatCurrency(row.interest ?? 0)}</td>
                      <td className="px-3 py-2">{formatCurrency(row.totalPayment ?? 0)}</td>
                      <td className="px-3 py-2">{formatCurrency(row.balance ?? 0)}</td>
                      <td className="px-3 py-2">
                        {formatValue("loanPaidToDatePct", row.loanPaidToDatePct ?? 0)}
                      </td>
                    </tr>
                    {expanded &&
                      monthRows.map((monthRow) => {
                        const monthIndex = ((monthRow.month ?? 1) - 1) % 12;
                        return (
                          <tr key={monthRow.month} className="border-b bg-muted/30 text-muted-foreground">
                            <td className="px-3 py-1.5 pl-8">
                              {MONTH_NAMES[monthIndex]} {calendarYear}
                            </td>
                            <td className="px-3 py-1.5">
                              {formatCurrency(monthRow.principal ?? 0)}
                            </td>
                            <td className="px-3 py-1.5">
                              {formatCurrency(monthRow.interest ?? 0)}
                            </td>
                            <td className="px-3 py-1.5">
                              {formatCurrency(monthRow.payment ?? 0)}
                            </td>
                            <td className="px-3 py-1.5">
                              {formatCurrency(monthRow.balance ?? 0)}
                            </td>
                            <td className="px-3 py-1.5">
                              {formatValue("loanPaidToDatePct", monthRow.loanPaidToDatePct ?? 0)}
                            </td>
                          </tr>
                        );
                      })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showPreview && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {result.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
    </Panel>
  );
}

function LoanStat({
  label,
  value,
  words,
}: {
  label: string;
  value: string;
  words?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-right">
        <p className="font-display text-2xl font-bold">{value}</p>
        {words && (
          <p className="mt-1 max-w-xs text-xs leading-snug text-muted-foreground">
            {words}
          </p>
        )}
      </div>
    </div>
  );
}
