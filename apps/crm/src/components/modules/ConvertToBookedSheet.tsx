import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, NativeSelect, SideSheet } from "@/components/modules/shared";
import {
  applyBookingSlot,
  applyBookingStart,
  EMPTY_BOOKING,
  toBookingInput,
  validateBooking,
  type BookingFormState,
} from "@/lib/crm/booking";
import { eventSlotOptions, toLocalDateTimeMin } from "@/lib/crm/display";
import { useCrm } from "@/lib/crm/store";
import type { CrmEnquiry } from "@/types/crm";

export function BookingFields({
  form,
  errors,
  onChange,
}: {
  form: BookingFormState;
  errors: Record<string, string>;
  onChange: (next: BookingFormState) => void;
}) {
  return (
    <>
      <Field id="booking-start" label="Event start date & time" error={errors.startsAt}>
        <Input
          id="booking-start"
          type="datetime-local"
          min={toLocalDateTimeMin()}
          value={form.startsAt}
          onChange={(event) => onChange(applyBookingStart(form, event.target.value))}
          className="rounded-xl"
        />
      </Field>
      <Field id="booking-end" label="Event end date & time" error={errors.endsAt}>
        <Input
          id="booking-end"
          type="datetime-local"
          min={form.startsAt || toLocalDateTimeMin()}
          value={form.endsAt}
          onChange={(event) => onChange({ ...form, endsAt: event.target.value })}
          className="rounded-xl"
        />
      </Field>
      <Field id="booking-slot" label="Slot (optional)" error={errors.slot}>
        <NativeSelect
          id="booking-slot"
          aria-label="Slot"
          value={form.slot}
          onChange={(value) => onChange(applyBookingSlot(form, value as BookingFormState["slot"]))}
        >
          <option value="">No slot</option>
          {eventSlotOptions()}
        </NativeSelect>
        <p className="text-xs text-muted-foreground">
          Provide an end time or a slot. Morning 8am–4pm, evening 4pm–11pm, full day 8am–11pm IST.
        </p>
      </Field>
    </>
  );
}

export function ConvertToBookedSheet({
  enquiry,
  onClose,
}: {
  enquiry: CrmEnquiry | null;
  onClose: () => void;
}) {
  const crm = useCrm();
  const [form, setForm] = useState<BookingFormState>(EMPTY_BOOKING);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(EMPTY_BOOKING);
    setErrors({});
  }, [enquiry?.id]);

  const handleSubmit = async () => {
    const nextErrors = validateBooking(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !enquiry) return;
    setBusy(true);
    try {
      await crm.convertEnquiry(enquiry.id, toBookingInput(form));
      setForm(EMPTY_BOOKING);
      onClose();
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet
      open={Boolean(enquiry)}
      onOpenChange={(open) => {
        if (!open) {
          setForm(EMPTY_BOOKING);
          setErrors({});
          onClose();
        }
      }}
      title="Convert to booked"
      description={
        enquiry ? (
          <>
            Linked enquiry: <span className="font-medium text-foreground">{enquiry.title}</span>
          </>
        ) : null
      }
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
      footer={
        <>
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={busy}>
            Convert to booked
          </Button>
        </>
      }
    >
      <BookingFields form={form} errors={errors} onChange={setForm} />
    </SideSheet>
  );
}
