import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ContextActions } from "@/components/modules/ContextActionSheets";
import { EditAction, RemoveAction, StatusBadge } from "@/components/modules/shared";
import {
  PAYMENT_MODE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  formatDateTime,
  formatMoney,
  paymentTypeClass,
} from "@/lib/crm/display";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CrmPayment } from "@/types/crm";

export function PaymentDetailSheet({
  payment,
  payee,
  onClose,
  onEdit,
  onRemove,
  onPay,
  onRemind,
  onFollow,
}: {
  payment: CrmPayment | null;
  payee: string;
  onClose: () => void;
  onEdit: (payment: CrmPayment) => void;
  onRemove: (payment: CrmPayment) => void;
  onPay: (payment: CrmPayment) => void;
  onRemind: (payment: CrmPayment) => void;
  onFollow?: (payment: CrmPayment) => void;
}) {
  const crm = useCrm();
  return (
    <Sheet open={Boolean(payment)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {payment ? (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="space-y-1 pr-6">
                <SheetTitle className={cn("text-lg", paymentTypeClass(payment.type))}>
                  {formatMoney(payment.amount, payment.currency)}
                </SheetTitle>
                <SheetDescription>{payee}</SheetDescription>
              </div>
            </SheetHeader>
            <div className="flex-1 space-y-5 px-6 py-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="mt-0.5">
                    <StatusBadge status={payment.type} label={PAYMENT_TYPE_LABELS[payment.type]} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="mt-0.5">
                    <StatusBadge status={payment.status} label={PAYMENT_STATUS_LABELS[payment.status]} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Mode</dt>
                  <dd className="mt-0.5 font-medium">{PAYMENT_MODE_LABELS[payment.mode]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Paid at</dt>
                  <dd className="mt-0.5 font-medium">{formatDateTime(payment.paidAt)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Reference</dt>
                  <dd className="mt-0.5 font-medium">{payment.reference ?? "—"}</dd>
                </div>
              </dl>

              <ContextActions
                onPay={crm.hasPermission(CRM_PERMISSIONS.paymentsCreate) ? () => onPay(payment) : undefined}
                onRemind={crm.hasPermission(CRM_PERMISSIONS.calendarCreate) ? () => onRemind(payment) : undefined}
                onFollow={
                  onFollow && payment.enquiryId && crm.hasPermission(CRM_PERMISSIONS.followUpsCreate)
                    ? () => onFollow(payment)
                    : undefined
                }
              />

              <div className="flex flex-wrap gap-2">
                {crm.hasPermission(CRM_PERMISSIONS.paymentsUpdate) ? (
                  <EditAction onClick={() => onEdit(payment)} />
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.paymentsDelete) ? (
                  <RemoveAction onClick={() => onRemove(payment)} />
                ) : null}
                <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
