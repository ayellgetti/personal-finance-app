import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Columns3,
  History,
  LayoutGrid,
  List,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VIEW_ICONS: Record<string, LucideIcon> = {
  list: List,
  cards: LayoutGrid,
  board: Columns3,
  month: CalendarDays,
  timeline: History,
  day: Calendar,
  week: CalendarRange,
};

export function ViewSwitch<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex h-11 shrink-0 items-center rounded-full border border-border bg-card p-0.5"
    >
      {options.map((option) => {
        const Icon = VIEW_ICONS[option.value] ?? List;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={selected}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-9 w-8 items-center justify-center rounded-full transition-colors tap-highlight-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

/** Round create control, matching the header plus. */
export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-glow)] transition-opacity tap-highlight-none hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
