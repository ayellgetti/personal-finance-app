import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeSelect, SideSheet } from "@/components/modules/shared";
import {
  localInputToIso,
  paymentModeOptions,
} from "@/lib/crm/display";
import {
  EMPTY_REMINDER,
  toReminderInput,
  validateReminder,
  type ReminderFormState,
} from "@/lib/crm/reminder";
import { useCrm } from "@/lib/crm/store";
import type {
  CrmPaymentMode,
  CrmPaymentReferenceType,
} from "@/types/crm";

export type PaymentActionTarget = {
  referenceType: CrmPaymentReferenceType;
  referenceId: string;
  enquiryId: string | null;
  label: string;
};

export type ReminderActionTarget = {
  contactId: string | null;
  enquiryId: string | null;
  label: string;
};

export type FollowUpActionTarget = {
  enquiryId: string;
  label: string;
};

function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nextHour(now = new Date()): string {
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  return toDateTimeLocal(next);
}

export function ContextActions({
  onPay,
  onRemind,
  onFollow,
}: {
  onPay?: () => void;
  onRemind?: () => void;
  onFollow?: () => void;
}) {
  if (!onPay && !onRemind && !onFollow) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {onPay ? (
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={onPay}>
          Add payment
        </Button>
      ) : null}
      {onRemind ? (
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={onRemind}>
          Add reminder
        </Button>
      ) : null}
      {onFollow ? (
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={onFollow}>
          Add follow-up
        </Button>
      ) : null}
    </div>
  );
}

export function QuickPaymentSheet({
  target,
  onClose,
}: {
  target: PaymentActionTarget | null;
  onClose: () => void;
}) {
  const crm = useCrm();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<CrmPaymentMode>("UPI");
  const [paidAt, setPaidAt] = useState(() => toDateTimeLocal(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    setAmount("");
    setMode("UPI");
    setPaidAt(toDateTimeLocal(new Date()));
    setError(null);
  }, [target]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!target) return;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!paidAt) {
      setError("Date and time are required");
      return;
    }
    setBusy(true);
    try {
      await crm.createPayment({
        referenceType: target.referenceType,
        referenceId: target.referenceId,
        enquiryId: target.enquiryId,
        amount: parsedAmount,
        type: "INCOME",
        mode,
        status: "paid",
        paidAt: localInputToIso(paidAt),
      });
      onClose();
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet
      open={Boolean(target)}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Add payment"
      description={target?.label}
      onSubmit={onSubmit}
      footer={<Button type="submit" className="rounded-xl" disabled={busy}>Add payment</Button>}
    >
      <Field id="quick-payment-amount" label="Amount" error={error ?? undefined}>
        <Input
          id="quick-payment-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="rounded-xl"
        />
      </Field>
      <Field id="quick-payment-mode" label="Mode">
        <NativeSelect
          id="quick-payment-mode"
          value={mode}
          onChange={(value) => setMode(value as CrmPaymentMode)}
        >
          {paymentModeOptions()}
        </NativeSelect>
      </Field>
      <Field id="quick-payment-paid-at" label="Date and time">
        <Input
          id="quick-payment-paid-at"
          type="datetime-local"
          value={paidAt}
          onChange={(event) => setPaidAt(event.target.value)}
          className="rounded-xl"
        />
      </Field>
    </SideSheet>
  );
}

export function QuickReminderSheet({
  target,
  onClose,
}: {
  target: ReminderActionTarget | null;
  onClose: () => void;
}) {
  const crm = useCrm();
  const [form, setForm] = useState<ReminderFormState>(EMPTY_REMINDER);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    setForm({ ...EMPTY_REMINDER, remindAt: nextHour(), contactId: target.contactId ?? "" });
    setErrors({});
  }, [target]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!target) return;
    const nextErrors = validateReminder(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      await crm.createCalendarEvent({
        ...toReminderInput(form),
        enquiryId: target.enquiryId,
      });
      onClose();
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet
      open={Boolean(target)}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Add reminder"
      description={target?.label}
      onSubmit={onSubmit}
      footer={<Button type="submit" className="rounded-xl" disabled={busy}>Add reminder</Button>}
    >
      <Field id="quick-reminder-title" label="Title" error={errors.title}>
        <Input
          id="quick-reminder-title"
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          className="rounded-xl"
        />
      </Field>
      <Field id="quick-reminder-at" label="Date and time" error={errors.remindAt}>
        <Input
          id="quick-reminder-at"
          type="datetime-local"
          value={form.remindAt}
          onChange={(event) => setForm((current) => ({ ...current, remindAt: event.target.value }))}
          className="rounded-xl"
        />
      </Field>
      <Field id="quick-reminder-notes" label="Notes">
        <Textarea
          id="quick-reminder-notes"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          className="rounded-xl"
        />
      </Field>
    </SideSheet>
  );
}

export function QuickFollowUpSheet({
  target,
  onClose,
}: {
  target: FollowUpActionTarget | null;
  onClose: () => void;
}) {
  const crm = useCrm();
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    setNextFollowupDate(nextHour());
    setNotes("");
    setError(null);
  }, [target]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!target) return;
    if (!nextFollowupDate) {
      setError("Next follow-up date is required");
      return;
    }
    setBusy(true);
    try {
      await crm.createFollowUp({
        enquiryId: target.enquiryId,
        stage: "closed",
        dueAt: new Date().toISOString(),
        nextFollowupDate: localInputToIso(nextFollowupDate),
        notes: notes.trim() || null,
      });
      onClose();
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet
      open={Boolean(target)}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title="Add follow-up"
      description={target ? `${target.label} · Booked` : undefined}
      onSubmit={onSubmit}
      footer={<Button type="submit" className="rounded-xl" disabled={busy}>Add follow-up</Button>}
    >
      <Field id="context-followup-next" label="Next follow-up date & time" error={error ?? undefined}>
        <Input
          id="context-followup-next"
          type="datetime-local"
          value={nextFollowupDate}
          onChange={(event) => setNextFollowupDate(event.target.value)}
          className="rounded-xl"
        />
      </Field>
      <Field id="context-followup-notes" label="Notes">
        <Textarea
          id="context-followup-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="rounded-xl"
        />
      </Field>
    </SideSheet>
  );
}
