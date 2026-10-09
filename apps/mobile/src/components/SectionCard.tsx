import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card with a tinted header strip over a neutral body, used for the grouped
 * sections on Home and Profile.
 */
export function SectionCard({
  eyebrow,
  title,
  action,
  tone = "primary",
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  tone?: "primary" | "neutral";
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)]", className)}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 px-4 py-3",
          tone === "primary" ? "bg-gradient-wealth text-primary-foreground" : "bg-secondary text-foreground",
        )}
      >
        <div className="min-w-0">
          {eyebrow ? (
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.14em]",
                tone === "primary" ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {eyebrow}
            </p>
          ) : null}
          <h2 className="truncate font-display text-base font-bold">{title}</h2>
        </div>
        {action}
      </div>
      <div className="bg-card p-4">{children}</div>
    </section>
  );
}
