import { Wallet } from "lucide-react";
import { AgendaItem } from "@/components/calendar/AgendaItem";
import { ListRow } from "@/components/ListRow";
import { RecordShortcuts } from "@/components/records/RecordShortcuts";
import { Badge } from "@/components/ui/badge";
import {
  MONTH_CATEGORIES,
  dayKey,
  filterMonthItems,
  type MonthCategory,
} from "@/lib/mobile/calendar";
import { formatMoney, humanize, matchesQuery, paymentTypeAccent, paymentTypeClass } from "@/lib/mobile/format";
import { cn } from "@/lib/utils";
import type { CrmCalendarItem, CrmPayment, CrmPaymentType } from "@/types/crm";

const TYPE_LABELS: Record<CrmPaymentType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
};

type MonthRow =
  | { kind: "item"; at: string; item: CrmCalendarItem }
  | { kind: "payment"; at: string; payment: CrmPayment };

function paymentMatches(payment: CrmPayment, query: string): boolean {
  return matchesQuery(
    query,
    formatMoney(payment.amount, payment.currency),
    payment.amount,
    payment.reference,
    payment.status,
    payment.mode,
    payment.type,
    humanize(payment.status),
    humanize(payment.mode),
    humanize(payment.type),
  );
}

function rowsFor(
  category: MonthCategory,
  items: readonly CrmCalendarItem[],
  payments: readonly CrmPayment[],
  query: string,
): MonthRow[] {
  const calendarRows: MonthRow[] =
    category === "payment"
      ? []
      : filterMonthItems(items, category).map((item) => ({ kind: "item", at: item.at, item }));
  const paymentRows: MonthRow[] =
    category === "all" || category === "payment"
      ? payments
          .filter((payment) => payment.paidAt && paymentMatches(payment, query))
          .map((payment) => ({ kind: "payment", at: payment.paidAt ?? "", payment }))
      : [];

  return [...calendarRows, ...paymentRows].sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

function dayHeading(at: string): string {
  return new Date(at).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function PaymentRow({
  payment,
  person,
  onOpen,
  onRemind,
  onFollow,
  enquiryId,
}: {
  payment: CrmPayment;
  person: { name: string; mobile: string | null } | null;
  onOpen?: () => void;
  onRemind?: () => void;
  onFollow?: () => void;
  enquiryId?: string | null;
}) {
  const linkedEnquiry = enquiryId ?? payment.enquiryId;
  const remind = onRemind && (person || linkedEnquiry) ? onRemind : undefined;
  const follow = onFollow && linkedEnquiry ? onFollow : undefined;
  const lead = [person?.mobile, person ? payment.reference : null].filter(Boolean).join(" · ");
  const mode = humanize(payment.mode);

  return (
    <ListRow
      title={person?.name || payment.reference || TYPE_LABELS[payment.type]}
      detail={
        <>
          {lead ? `${lead} · ` : null}
          <span className={paymentTypeClass(payment.type)}>{TYPE_LABELS[payment.type]}</span>
          {mode ? ` · ${mode}` : null}
        </>
      }
      value={formatMoney(payment.amount, payment.currency)}
      valueClassName={paymentTypeClass(payment.type)}
      accentClassName={paymentTypeAccent(payment.type)}
      onClick={onOpen}
      footer={remind || follow ? <RecordShortcuts onRemind={remind} onFollow={follow} /> : undefined}
      badge={
        <Badge
          variant="secondary"
          className={cn(
            "gap-1 rounded-lg border-0 text-[10px]",
            payment.type === "EXPENSE"
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
          )}
        >
          <Wallet className="h-3 w-3" aria-hidden />
          {humanize(payment.status)}
        </Badge>
      }
    />
  );
}

export function MonthCategories({
  category,
  onCategory,
  items,
  payments,
  query,
  showPayments,
  payeeFor,
  onOpenItem,
  onOpenPayment,
  onRemindItem,
  onFollowItem,
  onRemindPayment,
  onFollowPayment,
  enquiryIdFor,
}: {
  category: MonthCategory;
  onCategory: (next: MonthCategory) => void;
  items: readonly CrmCalendarItem[];
  payments: readonly CrmPayment[];
  query: string;
  showPayments: boolean;
  payeeFor?: (payment: CrmPayment) => { name: string; mobile: string | null } | null;
  onOpenItem?: (item: CrmCalendarItem) => void;
  onOpenPayment?: (payment: CrmPayment) => void;
  onRemindItem?: (item: CrmCalendarItem) => void;
  onFollowItem?: (item: CrmCalendarItem) => void;
  onRemindPayment?: (payment: CrmPayment) => void;
  onFollowPayment?: (payment: CrmPayment) => void;
  enquiryIdFor?: (payment: CrmPayment) => string | null;
}) {
  const tabs = MONTH_CATEGORIES.filter((tab) => showPayments || tab.id !== "payment");
  const rows = rowsFor(category, items, payments, query);
  const label = tabs.find((tab) => tab.id === category)?.label ?? "All";
  let previousDay = "";

  return (
    <section className="space-y-3" aria-label="This month">
      <div role="tablist" aria-label="Month categories" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={category === tab.id}
            onClick={() => onCategory(tab.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors tap-highlight-none",
              category === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">
          {category === "all" ? "Nothing scheduled this month." : `No ${label.toLowerCase()} this month.`}
        </p>
      ) : (
        <div role="tabpanel" className="space-y-2">
          {rows.map((row) => {
            const key = row.kind === "item" ? `${row.item.kind}-${row.item.id}` : `payment-${row.payment.id}`;
            const heading = dayKey(new Date(row.at));
            const showHeading = heading !== previousDay;
            previousDay = heading;

            return (
              <div key={key} className="space-y-2">
                {showHeading ? (
                  <h3 className="px-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {dayHeading(row.at)}
                  </h3>
                ) : null}
                {row.kind === "item" ? (
                  <AgendaItem
                    item={row.item}
                    onOpen={onOpenItem ? () => onOpenItem(row.item) : undefined}
                    onRemind={onRemindItem ? () => onRemindItem(row.item) : undefined}
                    onFollow={onFollowItem ? () => onFollowItem(row.item) : undefined}
                  />
                ) : (
                  <PaymentRow
                    payment={row.payment}
                    person={payeeFor?.(row.payment) ?? null}
                    onOpen={onOpenPayment ? () => onOpenPayment(row.payment) : undefined}
                    onRemind={onRemindPayment ? () => onRemindPayment(row.payment) : undefined}
                    onFollow={onFollowPayment ? () => onFollowPayment(row.payment) : undefined}
                    enquiryId={enquiryIdFor?.(row.payment)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
