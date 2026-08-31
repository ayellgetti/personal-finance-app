import { useFinance, newId } from "@/lib/finance/store";
import {
  formatCurrency,
  formatPercent,
  creditUtilization,
  totalCreditCardOutstanding,
  totalCreditLimit,
  monthlyCreditCardDue,
} from "@/lib/finance/calculations";
import { CreditCard, CREDIT_CARD_NETWORKS } from "@/types/finance";
import { EntityDialog, FieldDef } from "@/components/EntityDialog";
import { Panel, ItemRow, EmptyState, Badge, EditButton } from "./shared";
import { StatCard } from "@/components/StatCard";
import { CalendarClock, CreditCard as CreditCardIcon, Percent, Wallet } from "lucide-react";

function cardFields(card?: CreditCard, currency?: string): FieldDef[] {
  return [
    { name: "name", label: "Card Name", type: "text", span: 2, defaultValue: card?.name ?? "" },
    {
      name: "network",
      label: "Network",
      type: "select",
      options: CREDIT_CARD_NETWORKS,
      span: 2,
      defaultValue: card?.network ?? "Visa",
    },
    { name: "creditLimit", label: "Credit Limit", type: "number", prefix: currency, defaultValue: card?.creditLimit ?? 0 },
    { name: "outstanding", label: "Outstanding", type: "number", prefix: currency, defaultValue: card?.outstanding ?? 0 },
    { name: "interestRate", label: "Interest Rate (%)", type: "number", defaultValue: card?.interestRate ?? 0 },
    { name: "minimumDue", label: "Minimum Due", type: "number", prefix: currency, defaultValue: card?.minimumDue ?? 0 },
    { name: "dueDay", label: "Due Day of Month", type: "number", span: 2, defaultValue: card?.dueDay ?? 5 },
  ];
}

function utilizationTone(pct: number): "success" | "gold" | "danger" {
  if (pct <= 30) return "success";
  if (pct <= 70) return "gold";
  return "danger";
}

export function CreditCardModule() {
  const { data, loading, addItem, updateItem, removeItem } = useFinance();
  const cur = data.profile.currency;
  const outstanding = totalCreditCardOutstanding(data);
  const limit = totalCreditLimit(data);
  const usedPct = creditUtilization(data);
  const addCard = (
    <EntityDialog
      title="Add Credit Card"
      fields={cardFields(undefined, cur)}
      triggerLabel="Add Card"
      onSubmit={(v) =>
        addItem("creditCards", {
          id: newId(),
          name: String(v.name || "Credit Card"),
          network: CREDIT_CARD_NETWORKS.find((item) => item === v.network) ?? "Other",
          creditLimit: Number(v.creditLimit) || 0,
          outstanding: Number(v.outstanding) || 0,
          interestRate: Number(v.interestRate) || 0,
          dueDay: Math.min(31, Math.max(1, Number(v.dueDay) || 5)),
          minimumDue: Number(v.minimumDue) || 0,
        })
      }
    />
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outstanding" value={formatCurrency(outstanding, cur, true)} icon={Wallet} accent="danger" />
        <StatCard label="Total Limit" value={formatCurrency(limit, cur, true)} icon={CreditCardIcon} accent="primary" />
        <StatCard
          label="Utilization"
          value={formatPercent(usedPct)}
          sub={usedPct <= 30 ? "Healthy" : usedPct <= 70 ? "Watch" : "High"}
          trend={usedPct <= 30 ? "up" : "down"}
          icon={Percent}
          accent={usedPct <= 30 ? "primary" : "danger"}
        />
        <StatCard label="Minimum due" value={formatCurrency(monthlyCreditCardDue(data), cur)} icon={CalendarClock} accent="gold" />
      </div>

      <Panel title="Cards" action={addCard}>
        <div className="space-y-3">
          {loading ? (
            <EmptyState message="Loading credit cards…" />
          ) : data.creditCards.length ? (
            data.creditCards.map((card) => {
              const pct = card.creditLimit > 0 ? (card.outstanding / card.creditLimit) * 100 : 0;
              return (
                <ItemRow
                  key={card.id}
                  title={card.name}
                  subtitle={`${card.network} · Due on day ${card.dueDay}`}
                  badge={<Badge tone={utilizationTone(pct)}>{formatPercent(pct)} used</Badge>}
                  values={[
                    { label: "Min due", value: formatCurrency(card.minimumDue, cur) },
                    { label: "Limit", value: formatCurrency(card.creditLimit, cur, true) },
                    { label: "Outstanding", value: formatCurrency(card.outstanding, cur, true), emphasis: true },
                  ]}
                  actions={
                    <EntityDialog
                      title="Edit Credit Card"
                      fields={cardFields(card, cur)}
                      trigger={<EditButton />}
                      onSubmit={(v) => updateItem("creditCards", card.id, v)}
                    />
                  }
                  onDelete={() => removeItem("creditCards", card.id)}
                />
              );
            })
          ) : (
            <EmptyState message="Add your first credit card" />
          )}
        </div>
      </Panel>
    </div>
  );
}
