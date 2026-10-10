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
  valueClassName,
  onClick,
  footer,
}: {
  title: string;
  detail?: ReactNode;
  value?: string | null;
  badge?: ReactNode;
  accentClassName?: string;
  valueClassName?: string;
  onClick?: () => void;
  footer?: ReactNode;
}) {
  const shell = cn(
    "w-full rounded-2xl border border-border bg-card text-left shadow-[var(--shadow-card)]",
    accentClassName && "border-l-4",
    accentClassName,
    onClick && !footer && "transition-colors hover:bg-secondary tap-highlight-none",
    !footer && "px-4 py-3",
  );
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">{title}</p>
        {detail ? <p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      {value || badge ? (
        <div className="flex max-w-[45%] shrink-0 flex-col items-end gap-1">
          {value ? (
            <span className={cn("text-right text-base font-semibold tabular-nums", valueClassName)}>{value}</span>
          ) : null}
          {badge}
        </div>
      ) : null}
    </div>
  );

  if (footer) {
    return (
      <div className={shell}>
        {onClick ? (
          <button type="button" onClick={onClick} className="w-full px-4 py-3 text-left transition-colors hover:bg-secondary tap-highlight-none">
            {body}
          </button>
        ) : (
          <div className="px-4 py-3">{body}</div>
        )}
        <div className="border-t border-border px-4 py-2">{footer}</div>
      </div>
    );
  }

  if (!onClick) return <div className={shell}>{body}</div>;

  return (
    <button type="button" onClick={onClick} className={shell}>
      {body}
    </button>
  );
}
