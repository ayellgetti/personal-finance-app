import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared list card: title on the left, the main figure on the right,
 * supporting text under the title, and the status badge under the figure.
 */
export function ListRow({
  title,
  detail,
  value,
  badge,
  accentClassName,
  onClick,
}: {
  title: string;
  detail?: string | null;
  value?: string | null;
  badge?: ReactNode;
  accentClassName?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "w-full rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-[var(--shadow-card)]",
    accentClassName && "border-l-4",
    accentClassName,
    onClick && "transition-colors hover:bg-secondary tap-highlight-none",
  );
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">{title}</p>
        {detail ? <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      {value || badge ? (
        <div className="flex max-w-[45%] shrink-0 flex-col items-end gap-1">
          {value ? <span className="text-right text-base font-semibold tabular-nums">{value}</span> : null}
          {badge}
        </div>
      ) : null}
    </div>
  );

  if (!onClick) return <div className={className}>{body}</div>;

  return (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
