import { Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AdvisorQuota } from "@/lib/finance/advisor";

const PERKS = [
  "Unlimited AI plan refreshes",
  "A fresh plan every time your numbers change",
  "Priority generation when the advisor is busy",
];

export function AdvisorPaywallDialog({
  open,
  onOpenChange,
  quota,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota?: AdvisorQuota;
}) {
  const included = quota?.limit ?? 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogTitle className="font-display text-xl">
            You have used your free AI refresh
          </DialogTitle>
          <DialogDescription>
            Every account includes {included} manual {included === 1 ? "refresh" : "refreshes"} of
            the AI plan. Upgrade to keep regenerating it whenever you want.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-2">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <p className="rounded-xl border border-border bg-background/40 p-3 text-sm text-muted-foreground">
          Your saved plan stays available, and it still updates automatically when your income,
          expenses, loans, or goals change.
        </p>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button className="rounded-xl" disabled>
            Upgrade — coming soon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
