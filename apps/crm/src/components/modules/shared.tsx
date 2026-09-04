import { type ReactNode, useState } from "react";
import { ShieldAlert } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ResourceStatus } from "@/lib/crm/store";

export function Field({
  id,
  label,
  error,
  children,
}: {
  id?: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
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
  return <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>;
}
