import { type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bottomSheetFillClass } from "@/components/ui/sheet-frame";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** Shared chrome for the bottom-sheet create forms. */
export function FormSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  busy,
  onSubmit,
  children,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={bottomSheetFillClass}
      >
        <form onSubmit={onSubmit} className="mx-auto flex min-h-0 w-full max-w-tablet flex-1 flex-col">
          <SheetHeader className="shrink-0 space-y-1 border-b border-border bg-background px-4 pb-3 pr-16 pt-4 text-left">
            <SheetTitle className="font-display text-lg">{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>

          <div className="shrink-0 border-t border-border bg-background px-4 py-3">
            <Button type="submit" className="h-12 w-full rounded-xl text-base" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {submitLabel}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
