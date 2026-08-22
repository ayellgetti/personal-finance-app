import { ReactNode, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronUp, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type QuickTypeTile<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
};

export function QuickAddDialog({
  title,
  description,
  triggerLabel,
  children,
}: {
  title: string;
  description: string;
  triggerLabel: string;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function QuickTypePicker<T extends string>({
  prompt,
  hint,
  items,
  extraItems,
  selected,
  onSelect,
}: {
  prompt: string;
  hint: string;
  items: readonly QuickTypeTile<T>[];
  extraItems?: readonly QuickTypeTile<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = extraItems && showAll ? [...items, ...extraItems] : [...items];
  const hasMore = Boolean(extraItems?.length);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">{prompt}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {visible.map((item) => {
          const Icon = item.icon;
          const active = selected === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              aria-pressed={active}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center transition",
                active
                  ? "border-primary bg-primary/5 shadow-[var(--shadow-card)]"
                  : "border-border hover:border-primary/50 hover:shadow-[var(--shadow-card)]",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll((s) => !s)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/40 p-3 text-center transition hover:border-primary/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-muted-foreground">
              {showAll ? <ChevronUp className="h-5 w-5" /> : <MoreHorizontal className="h-5 w-5" />}
            </span>
            <span className="text-xs font-medium">{showAll ? "Less" : "More"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
