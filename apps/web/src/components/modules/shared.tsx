import { forwardRef, ComponentPropsWithoutRef, ReactNode } from "react";
import { Trash2, Inbox, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary-glow))",
  "hsl(var(--accent))",
  "hsl(200 60% 60%)",
  "hsl(280 50% 65%)",
  "hsl(150 50% 55%)",
  "hsl(20 70% 60%)",
];

export const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.75rem",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "var(--shadow-card)",
  fontSize: "0.8rem",
};

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h3 className="font-display text-base font-semibold">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function ItemRow({
  title,
  subtitle,
  badge,
  values,
  actions,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  values: { label: string; value: string; emphasis?: boolean }[];
  actions?: ReactNode;
  onDelete?: () => void;
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold">{title}</p>
          {badge}
        </div>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-5">
        {values.map((v) => (
          <div key={v.label} className="text-right">
            <p className="text-xs text-muted-foreground">{v.label}</p>
            <p className={v.emphasis ? "font-display font-bold" : "font-medium"}>{v.value}</p>
          </div>
        ))}
        <div className="flex items-center">
          {actions}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground opacity-60 transition hover:text-danger hover:opacity-100"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const EditButton = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof Button>>(
  function EditButton(props, ref) {
    return (
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        aria-label="Edit"
        className="text-muted-foreground opacity-60 transition hover:text-foreground hover:opacity-100"
        {...props}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    );
  },
);

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "primary" | "gold" | "danger" | "success" }) {
  const tones: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    gold: "bg-accent/15 text-accent",
    danger: "bg-danger/10 text-danger",
    success: "bg-success/10 text-success",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
