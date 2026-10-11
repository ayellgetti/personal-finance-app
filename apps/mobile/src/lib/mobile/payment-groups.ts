import type { CrmPayment, CrmPaymentReferenceType, CrmPaymentStatus } from "@/types/crm";

export type PaymentGroup = {
  key: string;
  referenceType: CrmPaymentReferenceType;
  referenceId: string;
  bookingId: string | null;
  currency: string;
  payments: CrmPayment[];
  latest: CrmPayment;
  net: number;
  paidAt: string | null;
  status: CrmPaymentStatus | "mixed";
};

function paidTime(value: string | null): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

/** One total per payee, booking, and currency. Payments with no booking stay on their own row for that payee. */
export function groupPayments(payments: readonly CrmPayment[], dayOf?: (payment: CrmPayment) => string): PaymentGroup[] {
  const buckets = new Map<string, CrmPayment[]>();
  for (const payment of payments) {
    const day = dayOf ? dayOf(payment) : "";
    const key = `${day}|${payment.referenceType}|${payment.referenceId}|${payment.bookingId ?? ""}|${payment.currency}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(payment);
    else buckets.set(key, [payment]);
  }

  return [...buckets.entries()].map(([key, items]) => {
    const latest = items.reduce((current, payment) =>
      paidTime(payment.paidAt) >= paidTime(current.paidAt) ? payment : current,
    );
    const net = items.reduce(
      (sum, payment) => sum + (payment.type === "EXPENSE" ? -payment.amount : payment.amount),
      0,
    );
    const statuses = new Set(items.map((payment) => payment.status));
    return {
      key,
      referenceType: latest.referenceType,
      referenceId: latest.referenceId,
      bookingId: latest.bookingId ?? null,
      currency: latest.currency,
      payments: items,
      latest,
      net,
      paidAt: latest.paidAt,
      status: statuses.size === 1 ? latest.status : "mixed",
    };
  });
}
