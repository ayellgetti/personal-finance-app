import { useEffect, useState, type FormEvent } from "react";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { EmptyState, ErrorState, LoadingState } from "@/components/PageState";
import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/store";
import { formatInr, formatPercent, formatUpdated } from "@/lib/finance/format";
import {
  fetchAdvisorReport,
  listStatements,
  previewCalculator,
  sendAdvisorMessage,
  type AdvisorReport,
  uploadStatement,
} from "@/lib/finance/remote";
import { saveFinancialProfile } from "@/lib/finance/remote";
import { useFinance } from "@/lib/finance/store";
import type { FinancialProfile } from "@/types/finance";

export function AdvisorPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [source, setSource] = useState<string>("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string>();

  const load = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdvisorReport(refresh);
      setReport(result.advice);
      setSource(result.source);
      setGeneratedAt(result.generatedAt ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Advisor is temporarily unavailable");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading && !report) return <LoadingState label="Preparing your personalised advice…" />;
  if (error && !report) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Guidance from your recorded plan</p>
          <h2 className="font-display text-2xl font-bold">AI Advisor</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {source ? `${source} · ` : ""}{formatUpdated(generatedAt)}
          </p>
        </div>
        <Button type="button" size="icon" variant="outline" disabled={loading} onClick={() => void load(true)} aria-label="Refresh advice">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>
      {error ? <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      {report ? (
        <>
          <SectionCard title={report.summaryReport.headline || "Your plan"}>{report.executiveSummary}</SectionCard>
          <SectionCard title="What to do next" tone="neutral">
            <div className="space-y-3">
              {report.planOfAction.slice(0, 5).map((action) => (
                <div key={`${action.priority}-${action.action}`} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold">{action.priority}. {action.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{action.rationale}</p>
                  {action.monthlyAmount != null ? <p className="mt-1 text-xs font-semibold text-primary">{formatInr(action.monthlyAmount)}/month</p> : null}
                </div>
              ))}
            </div>
          </SectionCard>
          {report.riskWarnings.length ? (
            <SectionCard title="Risks to review" tone="neutral">
              {report.riskWarnings.map((risk) => (
                <div key={risk.title} className="mb-3 last:mb-0">
                  <p className="text-sm font-semibold">{risk.title}</p>
                  <p className="text-xs text-muted-foreground">{risk.detail}</p>
                </div>
              ))}
            </SectionCard>
          ) : null}
          <p className="text-xs leading-relaxed text-muted-foreground">{report.disclaimer}</p>
        </>
      ) : null}

      <SectionCard title="Ask a follow-up" tone="neutral">
        {user?.isPaid ? (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const text = message.trim();
              if (!text) return;
              setChatBusy(true);
              setReply("");
              try {
                const result = await sendAdvisorMessage(text, conversationId);
                setConversationId(result.conversationId);
                setReply(result.message);
                setMessage("");
              } catch (cause) {
                toast.error(cause instanceof Error ? cause.message : "Unable to send message");
              } finally {
                setChatBusy(false);
              }
            }}
          >
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask about debt, goals, investing, or cash flow…" />
            <Button type="submit" className="w-full" disabled={chatBusy || !message.trim()}>
              {chatBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Ask advisor
            </Button>
            {reply ? <p className="whitespace-pre-wrap rounded-xl bg-secondary p-3 text-sm leading-relaxed">{reply}</p> : null}
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Advisor chat is available on a paid account. Your planner report remains available above.</p>
        )}
      </SectionCard>
    </div>
  );
}

const DEFAULT_PROFILE: FinancialProfile = {
  retirementAge: 60,
  dependents: 0,
  inflationRate: 6,
  employmentType: "Salaried",
  currency: "₹",
  familyMembers: [],
};

export function ProfilePage() {
  const { user, logout, updateAccount } = useAuth();
  const finance = useFinance();
  const [profile, setProfile] = useState<FinancialProfile>(finance.profile ?? DEFAULT_PROFILE);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (finance.profile) setProfile(finance.profile);
  }, [finance.profile]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const account = await updateAccount({ firstName, lastName });
      if (!account.ok) throw new Error(account.error);
      await saveFinancialProfile(profile);
      await finance.refresh();
      toast.success("Profile saved");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Unable to save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <h2 className="font-display text-2xl font-bold">Profile</h2>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <SectionCard title="Account" tone="neutral">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
          </div>
        </SectionCard>
        <SectionCard title="Planning assumptions" tone="neutral">
          <div className="space-y-3">
            <div className="space-y-2"><Label htmlFor="retirementAge">Retirement age</Label><Input id="retirementAge" type="number" min={30} max={90} value={profile.retirementAge} onChange={(e) => setProfile((p) => ({ ...p, retirementAge: Number(e.target.value) }))} /></div>
            <div className="space-y-2"><Label htmlFor="inflationRate">Inflation assumption (%)</Label><Input id="inflationRate" type="number" min={0} max={30} step="0.1" value={profile.inflationRate} onChange={(e) => setProfile((p) => ({ ...p, inflationRate: Number(e.target.value) }))} /></div>
            <div className="space-y-2"><Label htmlFor="employmentType">Employment type</Label><Input id="employmentType" value={profile.employmentType} onChange={(e) => setProfile((p) => ({ ...p, employmentType: e.target.value as FinancialProfile["employmentType"] }))} /></div>
          </div>
        </SectionCard>
        <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save profile</Button>
      </form>
      <Button type="button" variant="outline" className="w-full" onClick={() => void logout()}>Sign out</Button>
    </div>
  );
}

export function SetupPage() {
  const { completeQuickSetup } = useAuth();
  const finance = useFinance();
  const steps = [
    ["Profile", Boolean(finance.profile), "/profile"],
    ["Income and expenses", finance.budgets.length > 0, "/my-plan"],
    ["Loans", finance.loans.length > 0, "/my-plan/loans"],
    ["Investments", finance.investments.length > 0, "/wealth/investments"],
    ["Insurance", finance.insurances.length > 0, "/my-plan/insurance"],
    ["Goals", finance.goals.length > 0, "/goals"],
  ] as const;
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Quick Setup</h2>
      <p className="text-sm text-muted-foreground">Complete only what applies now. You can return at any time.</p>
      {steps.map(([label, done, to], index) => (
        <Link key={label} to={to} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className={done ? "flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground" : "flex h-8 w-8 items-center justify-center rounded-full bg-secondary"}>{done ? "✓" : index + 1}</span>
          <span className="font-medium">{label}</span>
        </Link>
      ))}
      <Button
        type="button"
        className="w-full"
        onClick={async () => {
          const result = await completeQuickSetup();
          if (result.ok) toast.success("Setup progress saved");
          else toast.error(result.error);
        }}
      >
        Mark setup complete
      </Button>
    </div>
  );
}

export function StatementsPage() {
  const [items, setItems] = useState<Array<{ id: string; title?: string; fileName?: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    try {
      const result = await listStatements();
      setItems(result.items);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load statements");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, []);
  if (loading) return <LoadingState label="Loading statement analyses…" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  return (
    <div className="space-y-3">
      <h2 className="font-display text-2xl font-bold">Statement Analyzer</h2>
      <Label
        htmlFor="statement-file"
        className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-dashed border-primary bg-primary/5 px-4 text-sm font-semibold text-primary"
      >
        {uploading ? "Analyzing statement…" : "Upload bank statement"}
      </Label>
      <Input
        id="statement-file"
        type="file"
        className="sr-only"
        accept=".pdf,.csv,.xlsx,.xls,.txt"
        disabled={uploading}
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            await uploadStatement(file, "bank");
            toast.success("Statement analyzed");
            await load();
          } catch (cause) {
            toast.error(cause instanceof Error ? cause.message : "Unable to analyze statement");
          } finally {
            setUploading(false);
            event.target.value = "";
          }
        }}
      />
      <p className="text-xs text-muted-foreground">PDF, CSV, Excel, and text files are parsed by the existing server analyzer.</p>
      {items.length ? items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
          <p className="font-semibold">{item.title || item.fileName || "Statement"}</p>
          <p className="text-xs text-muted-foreground">{formatUpdated(item.createdAt)}</p>
        </div>
      )) : <EmptyState label="No analyzed statements yet." />}
    </div>
  );
}

export function TaxPage() {
  const [income, setIncome] = useState(1200000);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Tax Planner</h2>
      <p className="text-sm text-muted-foreground">Tax estimates depend on the selected financial year and API catalog. They are not tax-filing advice.</p>
      <div className="space-y-2"><Label htmlFor="tax-income">Annual income</Label><Input id="tax-income" type="number" min={0} value={income} onChange={(e) => setIncome(Number(e.target.value))} /></div>
      <Button disabled={busy} onClick={async () => {
        setBusy(true);
        try {
          const comparison = await api<Record<string, unknown>>("/api/tax/compare", {
            method: "POST",
            body: {
              countryCode: "IN",
              financialYear: "2025-26",
              grossSalary: income,
              otherIncome: 0,
            },
          });
          setResult(comparison);
        } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Unable to calculate tax"); }
        finally { setBusy(false); }
      }}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Compare regimes</Button>
      {result ? <pre className="overflow-auto rounded-xl bg-secondary p-3 text-xs">{JSON.stringify(result, null, 2)}</pre> : null}
    </div>
  );
}

export function CalculatorsPage() {
  const [amount, setAmount] = useState(100000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Investment Calculator</h2>
      <div className="space-y-2"><Label htmlFor="calc-amount">Lump sum</Label><Input id="calc-amount" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
      <div className="space-y-2"><Label htmlFor="calc-rate">Expected annual return (%)</Label><Input id="calc-rate" type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
      <div className="space-y-2"><Label htmlFor="calc-years">Years</Label><Input id="calc-years" type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} /></div>
      <Button onClick={async () => {
        try { setResult(await previewCalculator("lumpsum", { principal: amount, annualRatePct: rate, years })); }
        catch (cause) { toast.error(cause instanceof Error ? cause.message : "Unable to calculate"); }
      }}>Calculate projection</Button>
      {result ? <pre className="overflow-auto rounded-xl bg-secondary p-3 text-xs">{JSON.stringify(result, null, 2)}</pre> : null}
    </div>
  );
}

export function ReportPage() {
  const { planner, loading, error, refresh } = useFinance();
  if (loading) return <LoadingState label="Loading report…" />;
  if (error) return <ErrorState message={error} onRetry={() => void refresh()} />;
  if (!planner) return <EmptyState label="There is not enough information for a report yet." />;
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold">Summary Report</h2>
      <SectionCard title="Cash flow"><div className="grid grid-cols-2 gap-2"><p>Income<br/><strong>{formatInr(planner.cashflow.income)}</strong></p><p>Surplus<br/><strong>{formatInr(planner.cashflow.surplus)}</strong></p></div></SectionCard>
      <SectionCard title="Net worth" tone="neutral"><p className="text-2xl font-bold">{formatInr(planner.netWorth.netExcludingProperty)}</p><p className="text-xs text-muted-foreground">Recorded investments minus recorded liabilities; property is excluded unless supported by stored data.</p></SectionCard>
      <SectionCard title="Debt plan" tone="neutral">{planner.liabilityPlan.avalanche.length ? planner.liabilityPlan.avalanche.map((loan) => <div key={loan.label} className="mb-3"><p className="font-semibold">{loan.label} · {formatPercent(loan.roi)}</p><p className="text-xs text-muted-foreground">{loan.action}</p></div>) : <EmptyState label="No loans are recorded." />}</SectionCard>
    </div>
  );
}

export function StaticLearningPage({ kind }: { kind: "course" | "learn" }) {
  const lessons = kind === "course"
    ? ["Build your financial foundation", "Control cash flow and debt", "Grow wealth consistently", "Plan financial freedom"]
    : ["Emergency funds", "Insurance basics", "Debt avalanche", "SIP and compounding", "Retirement assumptions"];
  return <div className="space-y-4"><h2 className="font-display text-2xl font-bold">{kind === "course" ? "Freedom Course" : "Learning Hub"}</h2><p className="text-sm text-muted-foreground">Educational content only; projections and examples are not guaranteed outcomes.</p>{lessons.map((lesson, index) => <div key={lesson} className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-semibold text-primary">LESSON {index + 1}</p><p className="mt-1 font-semibold">{lesson}</p></div>)}</div>;
}
