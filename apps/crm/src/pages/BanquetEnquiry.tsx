import { FormEvent, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/modules/shared";
import { ApiError } from "@/lib/api";
import {
  BANQUET_BUDGETS,
  BANQUET_DECORATIONS,
  BANQUET_EVENT_TYPES,
  BANQUET_MENUS,
  BANQUET_SOURCES,
  BANQUET_TIME_SLOTS,
  BANQUET_VENUES,
} from "@/lib/crm/banquet-enquiry";
import { EVENT_SLOT_LABELS, MOBILE_PATTERN } from "@/lib/crm/display";
import { submitPublicEnquiry } from "@/lib/crm/remote";
import type { CrmEventSlot } from "@/types/crm";

type FormState = {
  name: string;
  mobile: string;
  eventType: string;
  eventDate: string;
  timeSlot: string;
  guestCount: string;
  venue: string;
  source: string;
  budget: string;
  menu: string;
  decoration: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  mobile: "",
  eventType: "",
  eventDate: "",
  timeSlot: "",
  guestCount: "",
  venue: "",
  source: "",
  budget: "",
  menu: "",
  decoration: "",
  notes: "",
};

function Field({
  id,
  label,
  required,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="text-sm font-medium text-stone-700">
        {label}
        {required ? <span className="text-amber-600">*</span> : null}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputClass =
  "h-11 rounded-full border-stone-200 bg-stone-50 px-4 text-stone-800 placeholder:text-stone-400 focus-visible:ring-amber-400";
const selectClass =
  "h-11 rounded-full border-stone-200 bg-stone-50 px-4 text-stone-800";

export default function BanquetEnquiry() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [busy, setBusy] = useState(false);

  const set = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Customer name is required";
    if (!MOBILE_PATTERN.test(form.mobile.trim())) next.mobile = "Enter a valid phone number";
    if (!form.eventType) next.eventType = "Select an event type";
    if (!form.eventDate) next.eventDate = "Event date is required";
    if (!form.timeSlot) next.timeSlot = "Select a time slot";
    const guests = Number(form.guestCount);
    if (!Number.isInteger(guests) || guests < 1) next.guestCount = "Enter the number of guests";
    if (!form.source) next.source = "Tell us how you found us";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await submitPublicEnquiry({
        kind: "banquet",
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        eventType: form.eventType,
        eventDate: form.eventDate,
        timeSlot: form.timeSlot as CrmEventSlot,
        guestCount: Number(form.guestCount),
        source: form.source,
        venue: form.venue || undefined,
        budget: form.budget || undefined,
        menu: form.menu || undefined,
        decoration: form.decoration || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success("Enquiry submitted. Our team will contact you shortly.");
      setForm(EMPTY_FORM);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not submit the enquiry";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf8f3] px-4 py-10 text-stone-800">
      <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-amber-100 bg-white p-6 shadow-[0_16px_48px_-24px_rgba(120,90,40,0.35)] sm:p-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-amber-700 sm:text-3xl">
          Quick Event Enquiry<span className="text-amber-600">*</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-500">
          Fill in customer and event details, then choose a menu package and time slot.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="customer-name" label="Customer name" required error={errors.name}>
              <Input
                id="customer-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Full name"
                className={inputClass}
                autoComplete="name"
              />
            </Field>
            <Field id="phone-number" label="Phone number" required error={errors.mobile}>
              <Input
                id="phone-number"
                value={form.mobile}
                onChange={(e) => set("mobile", e.target.value)}
                placeholder="9876543210"
                inputMode="tel"
                className={inputClass}
                autoComplete="tel"
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="event-type" label="Event type" required error={errors.eventType}>
              <NativeSelect
                id="event-type"
                value={form.eventType}
                onChange={(value) => set("eventType", value)}
                className={selectClass}
              >
                <option value="">Select event</option>
                {BANQUET_EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="event-date" label="Event date" required error={errors.eventDate}>
              <Input
                id="event-date"
                type="date"
                value={form.eventDate}
                onChange={(e) => set("eventDate", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field id="time-slot" label="Time slot" required error={errors.timeSlot}>
              <NativeSelect
                id="time-slot"
                value={form.timeSlot}
                onChange={(value) => set("timeSlot", value)}
                className={selectClass}
              >
                <option value="">Select time slot</option>
                {BANQUET_TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {EVENT_SLOT_LABELS[slot]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="guest-count" label="Number of guests" required error={errors.guestCount}>
              <Input
                id="guest-count"
                type="number"
                min={1}
                value={form.guestCount}
                onChange={(e) => set("guestCount", e.target.value)}
                placeholder="100"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <Field id="venue" label="Venue">
              <NativeSelect
                id="venue"
                value={form.venue}
                onChange={(value) => set("venue", value)}
                className={selectClass}
              >
                <option value="">Select venue</option>
                {BANQUET_VENUES.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="source" label="How did they find us?" required error={errors.source}>
              <NativeSelect
                id="source"
                value={form.source}
                onChange={(value) => set("source", value)}
                className={selectClass}
              >
                <option value="">Select source</option>
                {BANQUET_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="budget" label="Approximate budget">
              <NativeSelect
                id="budget"
                value={form.budget}
                onChange={(value) => set("budget", value)}
                className={selectClass}
              >
                <option value="">Select budget range</option>
                {BANQUET_BUDGETS.map((budget) => (
                  <option key={budget} value={budget}>
                    {budget}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="menu" label="Menu">
              <NativeSelect
                id="menu"
                value={form.menu}
                onChange={(value) => set("menu", value)}
                className={selectClass}
              >
                <option value="">Select menu package</option>
                {BANQUET_MENUS.map((menu) => (
                  <option key={menu} value={menu}>
                    {menu}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field id="decoration" label="Decoration">
              <NativeSelect
                id="decoration"
                value={form.decoration}
                onChange={(value) => set("decoration", value)}
                className={selectClass}
              >
                <option value="">Select decoration option</option>
                {BANQUET_DECORATIONS.map((decoration) => (
                  <option key={decoration} value={decoration}>
                    {decoration}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field id="notes" label="Notes">
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any extra details for the banquet team"
              className="min-h-[96px] rounded-2xl border-stone-200 bg-stone-50 px-4 text-stone-800"
            />
          </Field>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={busy}
              className="h-11 rounded-full bg-amber-400 px-8 font-semibold text-stone-900 hover:bg-amber-500"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit enquiry
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
