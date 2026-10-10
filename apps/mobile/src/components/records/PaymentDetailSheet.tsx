import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatMoney, humanize, paymentTypeClass, personLine } from "@/lib/mobile/format";
import { removePayment } from "@/lib/mobile/remote";
import type { CrmPayment } from "@/types/crm";

export function PaymentDetailSheet({
  payment,
  payee,
  mobile,
  canUpdate,
  canDelete,
  canCreate,
  onClose,
  onEdit,
  onAdd,
  onRemind,
  onFollow,
  onRemoved,
}: {
  payment: CrmPayment | null;
  payee: string;
  mobile: string | null;
  canUpdate: boolean;
  canDelete: boolean;
  canCreate: boolean;
  onClose: () => void;
  onEdit: (payment: CrmPayment) => void;
  onAdd: (payment: CrmPayment) => void;
  onRemind?: (payment: CrmPayment) => void;
  onFollow?: (payment: CrmPayment) => void;
  onRemoved: () => void;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    if (!payment) return;
    setBusy(true);
    try {
      await removePayment(payment.id);
      toast.success("Payment removed");
      setConfirmRemove(false);
      onClose();
      onRemoved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={Boolean(payment)}
      onOpenChange={(next) => {
        if (!next) {
          setConfirmRemove(false);
          onClose();
        }
      }}
    >
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl pb-safe">
        {payment ? (
          <div className="mx-auto w-full max-w-tablet space-y-4 pb-4">
            <SheetHeader className="text-left">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0 space-y-1">
                  <SheetTitle className={`font-display text-lg ${paymentTypeClass(payment.type)}`}>
                    {formatMoney(payment.amount, payment.currency)}
                  </SheetTitle>
                  <SheetDescription>{personLine(payee, mobile)}</SheetDescription>
                </div>
                <Badge variant={payment.status === "paid" ? "default" : "secondary"} className="shrink-0 rounded-full">
                  {humanize(payment.status)}
                </Badge>
              </div>
            </SheetHeader>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="mt-0.5 text-sm font-medium">{payee}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Mobile</dt>
                <dd className="mt-0.5 text-sm font-medium">{mobile || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className={`mt-0.5 text-sm font-medium ${paymentTypeClass(payment.type)}`}>
                  {payment.type === "EXPENSE" ? "Expense" : "Income"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Mode</dt>
                <dd className="mt-0.5 text-sm font-medium">{humanize(payment.mode)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Paid at</dt>
                <dd className="mt-0.5 text-sm font-medium">{formatDate(payment.paidAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reference</dt>
                <dd className="mt-0.5 break-words text-sm font-medium">{payment.reference || "—"}</dd>
              </div>
            </dl>
            {confirmRemove ? (
              <div className="space-y-3 rounded-2xl border border-border p-3">
                <p className="text-sm">Remove this payment?</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="rounded-xl" disabled={busy} onClick={() => setConfirmRemove(false)}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" className="rounded-xl" disabled={busy} onClick={() => void remove()}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {canCreate ? (
                  <Button type="button" size="sm" className="rounded-xl" onClick={() => onAdd(payment)}>
                    Add payment
                  </Button>
                ) : null}
                {onRemind ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onRemind(payment)}>
                    Add reminder
                  </Button>
                ) : null}
                {onFollow ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onFollow(payment)}>
                    Add follow-up
                  </Button>
                ) : null}
                {canUpdate ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onEdit(payment)}>
                    Edit
                  </Button>
                ) : null}
                {canDelete ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl text-destructive" onClick={() => setConfirmRemove(true)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
