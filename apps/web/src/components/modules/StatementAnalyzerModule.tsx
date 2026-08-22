import { useEffect, useMemo, useState } from "react";
import { Landmark, Smartphone, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/finance/calculations";
import {
  STATEMENT_CATEGORY_LABELS,
  analyzeStatementFile,
  analyzeStatementText,
  listStatementImports,
  listStatementLines,
  removeStatementImport,
  statementApiError,
  updateStatementLineCategory,
  type StatementCategory,
  type StatementImport,
  type StatementLine,
  type StatementSourceType,
} from "@/lib/finance/statement-remote";
import { Panel, EmptyState } from "./shared";

const CATEGORIES = Object.keys(STATEMENT_CATEGORY_LABELS) as StatementCategory[];

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function StatementAnalyzerModule() {
  const [sourceType, setSourceType] = useState<StatementSourceType>("bank");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [imports, setImports] = useState<StatementImport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [lockedFile, setLockedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");

  const selected = useMemo(
    () => imports.find((item) => item.id === selectedId) ?? null,
    [imports, selectedId],
  );

  const loadList = async () => {
    setLoadingList(true);
    try {
      const items = await listStatementImports();
      setImports(items);
      setSelectedId((current) => current ?? items[0]?.id ?? null);
    } catch (error) {
      toast.error(statementApiError(error));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadList();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setLines([]);
      return;
    }
    void listStatementLines(selectedId)
      .then(setLines)
      .catch((error) => toast.error(statementApiError(error)));
  }, [selectedId]);

  const settle = async (created: StatementImport) => {
    toast.success(`Parsed ${created.lineCount} transactions`);
    setLockedFile(null);
    setPassword("");
    await loadList();
    setSelectedId(created.id);
  };

  const analyzeFile = async (file: File, filePassword?: string) => {
    setBusy(true);
    try {
      await settle(await analyzeStatementFile(sourceType, file, filePassword));
    } catch (error) {
      const message = statementApiError(error);
      if (/password/i.test(message)) {
        setLockedFile(file);
      }
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const analyzeText = async () => {
    setBusy(true);
    try {
      await settle(await analyzeStatementText(sourceType, text));
      setText("");
    } catch (error) {
      toast.error(statementApiError(error));
    } finally {
      setBusy(false);
    }
  };

  const recategorize = async (line: StatementLine, category: StatementCategory) => {
    try {
      const updated = await updateStatementLineCategory(line.importId, line.id, category);
      setLines((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      toast.error(statementApiError(error));
    }
  };

  const remove = async (id: string) => {
    try {
      await removeStatementImport(id);
      const next = imports.filter((item) => item.id !== id);
      setImports(next);
      setSelectedId(next[0]?.id ?? null);
    } catch (error) {
      toast.error(statementApiError(error));
    }
  };

  const summary = selected?.summary;

  return (
    <div className="space-y-6">
      <Panel title="Import a statement">
        <p className="mb-4 text-sm text-muted-foreground">
          Upload a bank statement as PDF, CSV or Excel, or a PhonePe / GPay / UPI export, or paste SMS text. Files are parsed and discarded; only categorized lines are stored.
        </p>
        <Tabs value={sourceType} onValueChange={(value) => setSourceType(value as StatementSourceType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="bank" className="gap-2">
              <Landmark className="h-4 w-4" /> Bank statement
            </TabsTrigger>
            <TabsTrigger value="phone" className="gap-2">
              <Smartphone className="h-4 w-4" /> Phone / UPI
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="statement-file">PDF, CSV, Excel or text file</Label>
            <Input
              id="statement-file"
              type="file"
              accept=".pdf,.csv,.txt,.tsv,.xls,.xlsx,application/pdf,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void analyzeFile(file);
                event.target.value = "";
              }}
            />
            {lockedFile ? (
              <div className="space-y-2 rounded-xl border border-border bg-background/40 p-3">
                <Label htmlFor="statement-password">Password for {lockedFile.name}</Label>
                <Input
                  id="statement-password"
                  type="password"
                  autoComplete="off"
                  value={password}
                  disabled={busy}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button
                  className="rounded-xl"
                  disabled={busy || password.length === 0}
                  onClick={() => void analyzeFile(lockedFile, password)}
                >
                  <Upload className="h-4 w-4" /> Unlock and analyze
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Any bank layout with a date, description and debit/credit or amount column. Scanned PDFs without selectable text are not supported.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="statement-text">Or paste CSV / SMS</Label>
            <Textarea
              id="statement-text"
              className="min-h-[120px]"
              placeholder="Date,Narration,Withdrawal Amt,Deposit Amt&#10;01/04/2025,UPI-SWIGGY,450,&#10;02/04/2025,SALARY NEFT,,85000"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <Button className="rounded-xl" disabled={busy || text.trim().length === 0} onClick={() => void analyzeText()}>
              <Upload className="h-4 w-4" /> Analyze text
            </Button>
          </div>
        </div>
      </Panel>

      {selected && summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Credits" value={formatCurrency(summary.creditTotal, "₹", true)} icon={FileSpreadsheet} accent="primary" />
          <StatCard label="Debits" value={formatCurrency(summary.debitTotal, "₹", true)} icon={Landmark} accent="danger" />
          <StatCard label="Net" value={formatCurrency(summary.net, "₹", true)} icon={Smartphone} accent="gold" />
          <StatCard label="Transactions" value={String(selected.lineCount)} icon={Upload} accent="default" />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Saved analyses" className="lg:col-span-1">
          {loadingList ? (
            <EmptyState message="Loading statements…" />
          ) : imports.length === 0 ? (
            <EmptyState message="No statements yet" />
          ) : (
            <div className="space-y-2">
              {imports.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                    item.id === selectedId ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="font-semibold capitalize">{item.sourceType} · {item.fileName ?? "Pasted text"}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.lineCount} lines · {formatDate(item.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Category mix"
          className="lg:col-span-2"
          action={
            selected ? (
              <Button variant="ghost" className="text-danger" onClick={() => void remove(selected.id)}>
                Delete
              </Button>
            ) : null
          }
        >
          {!summary?.byCategory.length ? (
            <EmptyState message="Analyze a statement to see spending by category" />
          ) : (
            <div className="space-y-2">
              {summary.byCategory.map((row) => (
                <div key={row.category} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2 text-sm">
                  <span>{STATEMENT_CATEGORY_LABELS[row.category]}</span>
                  <span className="font-medium">
                    {row.debit > 0 ? `−${formatCurrency(row.debit, "₹")}` : `+${formatCurrency(row.credit, "₹")}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Transactions">
        {lines.length === 0 ? (
          <EmptyState message="No lines to show" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Description</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-t border-border">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(line.postedOn)}</td>
                    <td className="py-2 pr-3">
                      <p className="max-w-md truncate">{line.description}</p>
                      {line.merchant ? <p className="text-xs text-muted-foreground">{line.merchant}</p> : null}
                    </td>
                    <td className="py-2 pr-3">
                      <Select
                        value={line.category}
                        onValueChange={(value) => void recategorize(line, value as StatementCategory)}
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {STATEMENT_CATEGORY_LABELS[category]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className={`py-2 text-right font-medium ${line.direction === "debit" ? "text-danger" : "text-primary"}`}>
                      {line.direction === "debit" ? "−" : "+"}
                      {formatCurrency(line.amount, "₹")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
