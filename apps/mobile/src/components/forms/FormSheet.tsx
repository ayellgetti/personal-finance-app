import { type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl pb-safe">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-tablet space-y-4 pb-4">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-lg">{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          {children}

          <Button type="submit" className="h-12 w-full rounded-xl text-base" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {submitLabel}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
