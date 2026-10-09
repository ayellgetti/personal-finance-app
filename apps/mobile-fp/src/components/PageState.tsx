import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function ForbiddenState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <ShieldAlert className="h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">Your role cannot view {label}.</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm text-muted-foreground">{message ?? "Something went wrong."}</p>
      <Button type="button" variant="outline" className="rounded-xl" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{label}</p>;
}
