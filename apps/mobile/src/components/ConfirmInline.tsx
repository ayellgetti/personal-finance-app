import { Button } from "@/components/ui/button";

/** In-page destructive confirmation; a native confirm() dialog is easy to dismiss by accident on a phone. */
export function ConfirmInline({
  message,
  confirmLabel = "Remove",
  busy,
  onCancel,
  onConfirm,
}: {
  message: string;
  confirmLabel?: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div role="alertdialog" aria-label={message} className="space-y-3 rounded-2xl border border-destructive/40 bg-card p-3">
      <p className="text-sm">{message}</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" className="h-11 flex-1 rounded-xl" disabled={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
