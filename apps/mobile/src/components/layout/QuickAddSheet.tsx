import { Bell, FolderPlus, PhoneCall, UserPlus, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CRM_PERMISSIONS } from "@/types/crm";

type QuickAction = {
  label: string;
  hint: string;
  icon: typeof UserPlus;
  /** Target pages open their create form when `new=1` is present. */
  to: string;
  permission: string;
};

const ACTIONS: QuickAction[] = [
  {
    label: "New contact",
    hint: "Add a lead, client, or vendor",
    icon: UserPlus,
    to: "/contacts?new=1",
    permission: CRM_PERMISSIONS.contactsCreate,
  },
  {
    label: "New enquiry",
    hint: "Start a sales case",
    icon: FolderPlus,
    to: "/enquiries?new=1",
    permission: CRM_PERMISSIONS.enquiriesCreate,
  },
  {
    label: "New follow-up",
    hint: "Log the next action",
    icon: PhoneCall,
    to: "/follow-ups?new=1",
    permission: CRM_PERMISSIONS.followUpsCreate,
  },
  {
    label: "Add payment",
    hint: "Record money in or out",
    icon: Wallet,
    to: "/payments?new=1",
    permission: CRM_PERMISSIONS.paymentsCreate,
  },
  {
    label: "Add reminder",
    hint: "Block a slot on the calendar",
    icon: Bell,
    to: "/calendar?new=1",
    permission: CRM_PERMISSIONS.calendarCreate,
  },
];

export function QuickAddSheet({
  open,
  onOpenChange,
  permissions,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  permissions: readonly string[];
}) {
  const navigate = useNavigate();
  const actions = ACTIONS.filter((action) => permissions.includes(action.permission));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-safe pt-5">
        <SheetHeader className="px-1 text-left">
          <SheetTitle className="font-display text-lg">Create</SheetTitle>
          <SheetDescription>Pick what you want to add.</SheetDescription>
        </SheetHeader>

        <div className="mx-auto mt-4 flex w-full max-w-tablet flex-col gap-2 pb-4">
          {actions.map((action) => {
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

          {actions.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
              Your role cannot create records.
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
