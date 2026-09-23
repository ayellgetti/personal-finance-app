import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Columns,
  Eye,
  History,
  LayoutGrid,
  List,
  Pencil,
  ShieldAlert,
  Trash2,
} from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ResourceStatus } from "@/lib/crm/store";

export function Field({
  id,
  label,
  error,
  children,
  className,
}: {
  id?: string;
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
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

export type SearchableOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

/** Options of one subheading; an empty name renders the options without a heading. */
export type SearchableGroup = {
  name: string;
  options: readonly SearchableOption[];
};

/** Select for long option lists: the field doubles as a filter over the options. */
export function SearchableSelect({
  id,
  value,
  onChange,
  groups,
  placeholder,
  emptyLabel = "No matching items",
  className,
  "aria-label": ariaLabel,
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  groups: readonly SearchableGroup[];
  placeholder: string;
  emptyLabel?: string;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  const fallbackId = useId();
  const listId = `${id ?? fallbackId}-listbox`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [box, setBox] = useState<{ top: number; left: number; width: number; maxHeight: number }>();
  const listRef = useRef<HTMLUListElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    for (const group of groups) {
      const match = group.options.find((option) => option.value === value);
      if (match) return match.label;
    }
    return value;
  }, [groups, value]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows: { group: string; option: SearchableOption }[] = [];
    for (const group of groups) {
      for (const option of group.options) {
        if (needle && !option.label.toLowerCase().includes(needle)) continue;
        rows.push({ group: group.name, option });
      }
    }
    return rows;
  }, [groups, query]);

  /** The list floats over the page so a table's scroll container cannot clip it. */
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const field = fieldRef.current?.getBoundingClientRect();
      if (!field) return;
      const below = window.innerHeight - field.bottom - 8;
      const above = field.top - 8;
      const upwards = below < 180 && above > below;
      const maxHeight = Math.max(120, Math.min(256, upwards ? above : below));
      setBox({
        top: upwards ? field.top - maxHeight - 4 : field.bottom + 4,
        left: field.left,
        width: field.width,
        maxHeight,
      });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelectorAll('[role="option"]')[activeIndex];
    if (active instanceof HTMLElement && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, open]);

  const firstEnabled = (from: number, step: number) => {
    for (let index = from; index >= 0 && index < matches.length; index += step) {
      if (!matches[index]?.option.disabled) return index;
    }
    return -1;
  };

  const openList = () => {
    if (disabled || open) return;
    setQuery("");
    setActiveIndex(Math.max(0, firstEnabled(0, 1)));
    setOpen(true);
  };

  const closeList = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (option: SearchableOption) => {
    if (option.disabled) return;
    onChange(option.value);
    closeList();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeList();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = firstEnabled(activeIndex + step, step);
      if (next >= 0) setActiveIndex(next);
      return;
    }
    if (event.key === "Enter" && open) {
      const match = matches[activeIndex];
      if (match) {
        event.preventDefault();
        select(match.option);
      }
      return;
    }
    if (event.key === "Tab" && open) closeList();
  };

  return (
    <div
      ref={fieldRef}
      className="relative"
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        closeList();
      }}
    >
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[activeIndex] ? `${listId}-option-${activeIndex}` : undefined}
        disabled={disabled}
        placeholder={placeholder}
        value={open ? query : selectedLabel}
        onFocus={openList}
        onClick={openList}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      />
      {value && !disabled ? (
        <button
          type="button"
          aria-label={ariaLabel ? `Clear ${ariaLabel}` : "Clear selection"}
          onClick={() => {
            onChange("");
            closeList();
          }}
          className="absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground print:hidden"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : (
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground print:hidden"
        />
      )}
      {open && box
        ? createPortal(
            <ul
              id={listId}
              ref={listRef}
              role="listbox"
              aria-label={ariaLabel ? `${ariaLabel} options` : undefined}
              style={{
                top: box.top,
                left: box.left,
                minWidth: Math.max(box.width, 240),
                maxHeight: box.maxHeight,
              }}
              className="fixed z-50 overflow-y-auto rounded-md border border-input bg-popover py-1 text-sm shadow-lg print:hidden"
            >
              {matches.length === 0 ? (
                <li role="presentation" className="px-3 py-2 text-muted-foreground">
                  {emptyLabel}
                </li>
              ) : (
                matches.map((match, index) => {
                  const heading = match.group && match.group !== matches[index - 1]?.group;
                  return (
                    <li key={`${match.group}-${match.option.value}`} role="presentation">
                      {heading ? (
                        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {match.group}
                        </p>
                      ) : null}
                      <div
                        id={`${listId}-option-${index}`}
                        role="option"
                        aria-selected={match.option.value === value}
                        aria-disabled={match.option.disabled || undefined}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => {
                          if (!match.option.disabled) setActiveIndex(index);
                        }}
                        onClick={() => select(match.option)}
                        className={cn(
                          "cursor-pointer px-3 py-1.5",
                          index === activeIndex && "bg-accent text-accent-foreground",
                          match.option.disabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        {match.option.label}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>,
            document.body,
          )
        : null}
    </div>
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

export function SideSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onSubmit,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: (event: FormEvent) => void;
  className?: string;
}) {
  const body = (
    <>
      <SheetHeader className="space-y-1 border-b px-6 py-5 pr-12 text-left">
        <SheetTitle>{title}</SheetTitle>
        {description ? (
          <SheetDescription>{description}</SheetDescription>
        ) : (
          <SheetDescription className="sr-only">{title}</SheetDescription>
        )}
      </SheetHeader>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">{children}</div>
      {footer ? (
        <div className="flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>
      ) : null}
    </>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn("flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg", className)}
      >
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
            {body}
          </form>
        ) : (
          body
        )}
      </SheetContent>
    </Sheet>
  );
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

export function IconAction({
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

export function ViewAction({
  onClick,
  label = "View",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <IconAction label={label} onClick={onClick} className={className}>
      <Eye className="h-4 w-4" />
    </IconAction>
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
  morning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  evening: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  full_day: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
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

export type ModuleViewOption = {
  key: string;
  label: string;
  shortLabel: string;
  icon: ReactNode;
};

/** Shared view toggle presets so every module labels its views the same way. */
export const MODULE_VIEWS = {
  table: { key: "table", label: "Table view", shortLabel: "Table", icon: <List className="h-4 w-4" /> },
  card: { key: "card", label: "Card view", shortLabel: "Cards", icon: <LayoutGrid className="h-4 w-4" /> },
  calendar: {
    key: "calendar",
    label: "Calendar view",
    shortLabel: "Calendar",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  kanban: { key: "kanban", label: "Kanban view", shortLabel: "Kanban", icon: <Columns className="h-4 w-4" /> },
  timeline: {
    key: "timeline",
    label: "Timeline view",
    shortLabel: "Timeline",
    icon: <History className="h-4 w-4" />,
  },
} satisfies Record<string, ModuleViewOption>;

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
  viewOptions?: ModuleViewOption[];
  children: ReactNode;
}) {
  const options = viewOptions ?? [MODULE_VIEWS.table, MODULE_VIEWS.card];

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
                  size="sm"
                  variant={view === opt.key ? "secondary" : "ghost"}
                  className="h-7 gap-1.5 px-2.5 text-xs"
                  aria-label={opt.label}
                  onClick={() => onViewChange(opt.key)}
                >
                  {opt.icon}
                  <span>{opt.shortLabel}</span>
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

export function SheetTabList({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-1 rounded-lg border p-1" role="tablist" aria-label={label}>
      {children}
    </div>
  );
}

export function SheetTabButton<T extends string>({
  id,
  selected,
  onSelect,
  children,
}: {
  id: T;
  selected: boolean;
  onSelect: (id: T) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={cn(
        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium",
        selected ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
      onClick={() => onSelect(id)}
    >
      {children}
    </button>
  );
}
