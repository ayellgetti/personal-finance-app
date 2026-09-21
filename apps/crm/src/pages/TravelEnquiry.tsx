import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  PublicEnquiryField,
  PublicEnquiryShell,
  publicEnquiryInputClass,
  publicEnquirySelectClass,
} from "@/components/PublicEnquiryForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/modules/shared";
import { ApiError } from "@/lib/api";
import {
  TRAVEL_ACCOMMODATION,
  TRAVEL_BUDGETS,
  TRAVEL_CLASSES,
  TRAVEL_DESTINATIONS,
  TRAVEL_SOURCES,
  TRAVEL_TRIP_TYPES,
} from "@/lib/crm/travel-enquiry";
import { MOBILE_PATTERN } from "@/lib/crm/display";
import { submitPublicEnquiry } from "@/lib/crm/remote";

type FormState = {
  name: string;
  mobile: string;
  tripType: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  travelerCount: string;
  source: string;
  budget: string;
  travelClass: string;
  accommodation: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  mobile: "",
  tripType: "",
  destination: "",
  departureDate: "",
  returnDate: "",
  travelerCount: "",
  source: "",
  budget: "",
  travelClass: "",
  accommodation: "",
  notes: "",
};

const inputClass = `${publicEnquiryInputClass} focus-visible:ring-sky-400`;
const selectClass = publicEnquirySelectClass;

export default function TravelEnquiry() {
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
    if (!form.tripType) next.tripType = "Select a trip type";
    if (!form.destination) next.destination = "Select a destination";
    if (!form.departureDate) next.departureDate = "Departure date is required";
    if (form.returnDate && form.departureDate && form.returnDate < form.departureDate) {
      next.returnDate = "Return date must be on or after departure";
    }
    const travelers = Number(form.travelerCount);
    if (!Number.isInteger(travelers) || travelers < 1) {
      next.travelerCount = "Enter the number of travelers";
    }
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
        kind: "travel",
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        tripType: form.tripType,
        destination: form.destination,
        departureDate: form.departureDate,
        returnDate: form.returnDate || undefined,
        travelerCount: Number(form.travelerCount),
        source: form.source,
        budget: form.budget || undefined,
        travelClass: form.travelClass || undefined,
        accommodation: form.accommodation || undefined,
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
    <PublicEnquiryShell
      title="Quick Travel Enquiry*"
      description="Fill in traveler and trip details, then choose a package and travel class."
      titleClass="text-sky-800"
      borderClass="border-sky-100"
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <PublicEnquiryField id="customer-name" label="Customer name" required accentClass="text-sky-600" error={errors.name}>
            <Input
              id="customer-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
              className={inputClass}
              autoComplete="name"
            />
          </PublicEnquiryField>
          <PublicEnquiryField id="phone-number" label="Phone number" required accentClass="text-sky-600" error={errors.mobile}>
            <Input
              id="phone-number"
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              placeholder="9876543210"
              inputMode="tel"
              className={inputClass}
              autoComplete="tel"
            />
          </PublicEnquiryField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <PublicEnquiryField id="trip-type" label="Trip type" required accentClass="text-sky-600" error={errors.tripType}>
            <NativeSelect
              id="trip-type"
              value={form.tripType}
              onChange={(value) => set("tripType", value)}
              className={selectClass}
            >
              <option value="">Select trip type</option>
              {TRAVEL_TRIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </NativeSelect>
          </PublicEnquiryField>
          <PublicEnquiryField id="destination" label="Destination" required accentClass="text-sky-600" error={errors.destination}>
            <NativeSelect
              id="destination"
              value={form.destination}
              onChange={(value) => set("destination", value)}
              className={selectClass}
            >
              <option value="">Select destination</option>
              {TRAVEL_DESTINATIONS.map((destination) => (
                <option key={destination} value={destination}>
                  {destination}
                </option>
              ))}
            </NativeSelect>
          </PublicEnquiryField>
          <PublicEnquiryField id="departure-date" label="Departure date" required accentClass="text-sky-600" error={errors.departureDate}>
            <Input
              id="departure-date"
              type="date"
              value={form.departureDate}
              onChange={(e) => set("departureDate", e.target.value)}
              className={inputClass}
            />
          </PublicEnquiryField>
          <PublicEnquiryField id="return-date" label="Return date" error={errors.returnDate}>
            <Input
              id="return-date"
              type="date"
              value={form.returnDate}
              onChange={(e) => set("returnDate", e.target.value)}
              className={inputClass}
            />
          </PublicEnquiryField>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <PublicEnquiryField id="traveler-count" label="Number of travelers" required accentClass="text-sky-600" error={errors.travelerCount}>
            <Input
              id="traveler-count"
              type="number"
              min={1}
              value={form.travelerCount}
              onChange={(e) => set("travelerCount", e.target.value)}
              placeholder="2"
              className={inputClass}
            />
          </PublicEnquiryField>
          <PublicEnquiryField id="source" label="How did they find us?" required accentClass="text-sky-600" error={errors.source}>
            <NativeSelect
              id="source"
              value={form.source}
              onChange={(value) => set("source", value)}
              className={selectClass}
            >
              <option value="">Select source</option>
              {TRAVEL_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </NativeSelect>
          </PublicEnquiryField>
          <PublicEnquiryField id="budget" label="Approximate budget">
            <NativeSelect
              id="budget"
              value={form.budget}
              onChange={(value) => set("budget", value)}
              className={selectClass}
            >
              <option value="">Select budget range</option>
              {TRAVEL_BUDGETS.map((budget) => (
                <option key={budget} value={budget}>
                  {budget}
                </option>
              ))}
            </NativeSelect>
          </PublicEnquiryField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <PublicEnquiryField id="travel-class" label="Travel class">
            <NativeSelect
              id="travel-class"
              value={form.travelClass}
              onChange={(value) => set("travelClass", value)}
              className={selectClass}
            >
              <option value="">Select travel class</option>
              {TRAVEL_CLASSES.map((travelClass) => (
                <option key={travelClass} value={travelClass}>
                  {travelClass}
                </option>
              ))}
            </NativeSelect>
          </PublicEnquiryField>
          <PublicEnquiryField id="accommodation" label="Accommodation">
            <NativeSelect
              id="accommodation"
              value={form.accommodation}
              onChange={(value) => set("accommodation", value)}
              className={selectClass}
            >
              <option value="">Select accommodation</option>
              {TRAVEL_ACCOMMODATION.map((stay) => (
                <option key={stay} value={stay}>
                  {stay}
                </option>
              ))}
            </NativeSelect>
          </PublicEnquiryField>
        </div>

        <PublicEnquiryField id="notes" label="Notes">
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any extra details for the travel team"
            className="min-h-[96px] rounded-2xl border-stone-200 bg-stone-50 px-4 text-stone-800"
          />
        </PublicEnquiryField>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={busy}
            className="h-11 rounded-full bg-sky-600 px-8 font-semibold text-white hover:bg-sky-700"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit enquiry
          </Button>
        </div>
      </form>
    </PublicEnquiryShell>
  );
}
