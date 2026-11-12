import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, Trash2 } from "lucide-react";
import { useFinance } from "@/lib/finance/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buildPlanSnapshot,
  shareUrl,
  SHARE_EXPIRY_OPTIONS,
  type PlanShare,
} from "@/lib/finance/plan-snapshot";
import { createPlanShare, listPlanShares, revokePlanShare } from "@/lib/finance/plan-share-remote";
import { Panel, EmptyState, ActionTooltip } from "./shared";

const MAX_LINKS = 5;

function when(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Create a read-only link to a snapshot of the plan, for a spouse or a CA. */
export function SharePlanPanel() {
  const { data } = useFinance();
  const [shares, setShares] = useState<PlanShare[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [busy, setBusy] = useState(false);
  // The link is shown once. Only its hash is stored, so a lost link has to be revoked and remade.
  const [fresh, setFresh] = useState<string | null>(null);

  const snapshot = buildPlanSnapshot(data);
  const full = shares.length >= MAX_LINKS;

  const load = useCallback(async () => {
    try {
      setShares(await listPlanShares());
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!snapshot) return;
    if (!label.trim()) {
      toast.error("Say who this is for, for example “For my CA”");
      return;
    }
    setBusy(true);
    try {
      const result = await createPlanShare({ label: label.trim(), expiresInDays: days, snapshot });
      setFresh(shareUrl(result.token, window.location.origin));
      setLabel("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the link");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it by hand.");
    }
  };

  const revoke = async (id: string) => {
    try {
      await revokePlanShare(id);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke the link");
    }
  };

  return (
    <Panel title="Share this plan">
      <p className="mb-4 text-sm text-muted-foreground">
        Give a spouse or your CA a read-only link. It shows a snapshot as of today, so later changes do not appear, and it expires on its own.
        Anyone with the link can read it, so send it only to people you trust.
      </p>

      {!snapshot ? (
        <EmptyState message="Add your income and expenses first, then you can share your plan." />
      ) : (
        <>
          <details className="mb-4 rounded-xl border border-border bg-background/40 p-3 text-sm">
            <summary className="cursor-pointer font-medium">What the link shows</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Net worth, assets, liabilities, monthly income and bills, savings rate</li>
              <li>Health score and what it is made of, emergency-fund months, insurance cover</li>
              <li>Your FIRE number and projection</li>
              <li>Your goals ({snapshot.goals.length}) by name, with progress. Check goal names before sharing.</li>
              <li>Up to five next steps</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              It never shows your name, email, date of birth, or the names of individual loans, cards, investments or policies.
            </p>
          </details>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="share-label">Who is this for?</Label>
              <Input
                id="share-label"
                value={label}
                maxLength={60}
                placeholder="For my CA"
                disabled={full || loadFailed}
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="share-days">Expires after</Label>
              <select
                id="share-days"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={days}
                disabled={full || loadFailed}
                onChange={(event) => setDays(Number(event.target.value) as 7 | 30 | 90)}
              >
                {SHARE_EXPIRY_OPTIONS.map((option) => (
                  <option key={option.days} value={option.days}>{option.label}</option>
                ))}
              </select>
            </div>
            <Button className="rounded-xl" disabled={busy || full || loadFailed} onClick={() => void create()}>
              <Link2 className="mr-2 h-4 w-4" /> Create link
            </Button>
          </div>
          {full ? <p className="mt-2 text-xs text-muted-foreground">You have {MAX_LINKS} live links. Revoke one to create another.</p> : null}
        </>
      )}

      {fresh ? (
        <div className="mt-4 rounded-xl border border-success/40 bg-success/5 p-3">
          <p className="text-sm font-medium">Your link is ready. Copy it now: it will not be shown again.</p>
          <div className="mt-2 flex gap-2">
            <Input readOnly aria-label="Share link" value={fresh} onFocus={(event) => event.currentTarget.select()} />
            <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => void copy(fresh)}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setFresh(null)}>
            I have copied it
          </Button>
        </div>
      ) : null}

      {loadFailed ? (
        <p role="alert" className="mt-4 text-xs font-medium text-danger">
          Could not load your links.{" "}
          <button type="button" className="underline" onClick={() => void load()}>Try again</button>
        </p>
      ) : shares.length === 0 ? (
        <div className="mt-4">
          <EmptyState message="No live links. Create one above." />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border/60">
          {shares.map((share) => (
            <li key={share.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{share.label}</span>
                <span className="block text-xs text-muted-foreground">
                  Expires {when(share.expiresAt)} · opened {share.viewCount} {share.viewCount === 1 ? "time" : "times"}
                </span>
              </span>
              <ActionTooltip label="Revoke">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-danger"
                  aria-label={`Revoke link for ${share.label}`}
                  onClick={() => void revoke(share.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ActionTooltip>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
