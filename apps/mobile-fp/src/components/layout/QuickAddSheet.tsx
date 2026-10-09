import { Landmark, PiggyBank, Receipt, Target, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type QuickAction = {
  label: string;
  hint: string;
  icon: typeof Wallet;
  /** Target pages open their create form when `new=1` is present. */
  to: string;
};

const ACTIONS: QuickAction[] = [
  {
    label: "Income",
    hint: "Record monthly income",
    icon: Wallet,
    to: "/my-plan/income?new=1",
  },
  {
    label: "Expense",
    hint: "Record a recurring expense",
    icon: Receipt,
    to: "/my-plan/expenses?new=1",
  },
  {
    label: "Loan",
    hint: "Add a liability and EMI",
    icon: Landmark,
    to: "/my-plan/loans?new=1",
  },
  {
    label: "Goal",
    hint: "Create a financial milestone",
    icon: Target,
    to: "/goals?new=1",
  },
  {
    label: "Investment",
    hint: "Record an asset or SIP",
    icon: PiggyBank,
    to: "/wealth/investments?new=1",
  },
];

export function QuickAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-safe pt-5">
        <SheetHeader className="px-1 text-left">
          <SheetTitle className="font-display text-lg">Create</SheetTitle>
          <SheetDescription>Pick what you want to add.</SheetDescription>
        </SheetHeader>

        <div className="mx-auto mt-4 flex w-full max-w-tablet flex-col gap-2 pb-4">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.to}
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate(action.to);
                }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary tap-highlight-none"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{action.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{action.hint}</span>
                </span>
              </button>
            );
          })}

        </div>
      </SheetContent>
    </Sheet>
  );
}
