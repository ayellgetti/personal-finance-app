import { type ReactNode, useState } from "react";
import { ChevronRight, LayoutGrid, List, Pencil, ShieldAlert, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ResourceStatus } from "@/lib/crm/store";

export function Field({
  id,
  label,
  error,
  children,
}: {
  id?: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function NativeSelect({
  id,
  value,
  onChange,
  children,
  className,
  "aria-label": ariaLabel,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}

export function ModuleStatus({
  sessionReady,
  allowed = true,
  status,
  errorMessage,
  empty,
  emptyLabel,
  onRetry,
  children,
}: {
  sessionReady: boolean;
  allowed?: boolean;
  status: ResourceStatus;
  errorMessage: string | null;
  empty: boolean;
  emptyLabel: string;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (!sessionReady || (allowed && (status === "idle" || status === "loading"))) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!allowed || status === "forbidden") {
    return (
      <Alert className="rounded-2xl">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>No access</AlertTitle>
        <AlertDescription>You do not have permission to view this module.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive" className="rounded-2xl">
        <AlertTitle>Unable to load</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{errorMessage ?? "Something went wrong."}</p>
          <Button type="button" className="rounded-xl" onClick={onRetry}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (empty) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return <>{children}</>;
}

export function ConfirmRemoveDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void Promise.resolve(onConfirm()).finally(() => setBusy(false));
            }}
          >
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-end gap-1">{children}</div>;
}

function IconAction({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn("h-8 w-8 rounded-xl", className)}
            aria-label={label}
            onClick={onClick}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function EditAction({
  onClick,
  label = "Edit",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <IconAction label={label} onClick={onClick} className={className}>
      <Pencil className="h-4 w-4" />
    </IconAction>
  );
}

export function RemoveAction({
  onClick,
  label = "Remove",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <IconAction
      label={label}
      onClick={onClick}
      className={cn("text-destructive hover:text-destructive", className)}
    >
      <Trash2 className="h-4 w-4" />
    </IconAction>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  new: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  contacted: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  qualified: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  discussion: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  quotation_sent: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  negotiation: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  schedule_meeting: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  closed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  booked: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  lead: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  client: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  vendor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  employee: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  inactive: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  INCOME: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  EXPENSE: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  refunded: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  todo: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  in_review: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

// ─── ModulePage ───────────────────────────────────────────────────────────────

export function ModulePage({
  crumb,
  actions,
  toolbar,
  view,
  onViewChange,
  viewOptions,
  children,
}: {
  /** Module name shown after "Sales CRM /" */
  crumb: string;
  /** Primary action buttons (e.g. Add contact) */
  actions?: ReactNode;
  /** Search / filter controls shown below the breadcrumb row */
  toolbar?: ReactNode;
  /** Currently active view key — supply to show the view toggle */
  view?: string;
  /** Called when user clicks a view toggle button */
  onViewChange?: (v: string) => void;
  /** Custom view options; defaults to [table, card] when view is provided */
  viewOptions?: { key: string; label: string; icon: ReactNode }[];
  children: ReactNode;
}) {
  const defaultViews: { key: string; label: string; icon: ReactNode }[] = [
    { key: "table", label: "Table view", icon: <List className="h-4 w-4" /> },
    { key: "card", label: "Card view", icon: <LayoutGrid className="h-4 w-4" /> },
  ];
  const options = viewOptions ?? defaultViews;

  return (
    <div className="space-y-4">
      {/* breadcrumb + controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1" aria-label="Breadcrumb">
          <span className="text-sm text-muted-foreground">Sales CRM</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold">{crumb}</span>
        </nav>

        <div className="flex items-center gap-2">
          {view !== undefined && onViewChange && (
            <div className="flex items-center gap-0.5 rounded-lg border p-1">
              {options.map((opt) => (
                <Button
                  key={opt.key}
                  type="button"
                  size="icon"
                  variant={view === opt.key ? "secondary" : "ghost"}
                  className="h-7 w-7"
                  aria-label={opt.label}
                  onClick={() => onViewChange(opt.key)}
                >
                  {opt.icon}
                </Button>
              ))}
            </div>
          )}
          {actions}
        </div>
      </div>

      {/* filter / search toolbar */}
      {toolbar ? <div className="flex flex-wrap items-end gap-3">{toolbar}</div> : null}

      {/* content */}
      {children}
    </div>
  );
}
