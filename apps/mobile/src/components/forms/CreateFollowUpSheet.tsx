import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { humanize, personLine, toDateInputValue } from "@/lib/mobile/format";
import { createFollowUp, listContacts, listEnquiries, updateEnquiry, updateFollowUp } from "@/lib/mobile/remote";
import { validateFollowUp } from "@/lib/mobile/validate";
import { useResource } from "@/lib/mobile/use-resource";
import { CRM_ENQUIRY_STATUSES, type CrmEnquiryStatus, type CrmFollowUp } from "@/types/crm";

/** A booking is a closed enquiry. Follow-ups from Booked or Payments stay on that outcome. */
const BOOKED_STAGES = [
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
] as const;

type BookedStage = (typeof BOOKED_STAGES)[number]["value"];

function toTimeInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateFollowUpSheet({
  open,
  onOpenChange,
  day,
  onCreated,
  enquiry,
  followUp = null,
  stageSet = "pipeline",
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  day: Date;
  onCreated: () => void;
  enquiry?: { id: string; title: string } | null;
  followUp?: CrmFollowUp | null;
  /** Booked and payment follow-ups can only be Booked or Closed, and need a next date. */
  stageSet?: "pipeline" | "booked";
}) {
  const [enquiryId, setEnquiryId] = useState("");
  const [heldEnquiry, setHeldEnquiry] = useState(enquiry ?? null);
  const [stage, setStage] = useState<CrmEnquiryStatus>("contacted");
  const [bookedStage, setBookedStage] = useState<BookedStage>("booked");
  const [dueDate, setDueDate] = useState(() => toDateInputValue(day));
  const [dueTime, setDueTime] = useState("10:00");
  const [nextDate, setNextDate] = useState(() => toDateInputValue(day));
  const [notes, setNotes] = useState("");
  const [closeReason, setCloseReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const loadEnquiries = useCallback(() => listEnquiries({ page: 1, limit: 50 }), []);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const enquiries = useResource(loadEnquiries, open && !enquiry);
  const contacts = useResource(loadContacts, open && !enquiry);

  useEffect(() => {
    if (enquiry) setHeldEnquiry(enquiry);
  }, [enquiry]);

  const shownEnquiry = enquiry ?? heldEnquiry;

  useEffect(() => {
    if (!open) return;
    const value = toDateInputValue(day);
    setDueDate(value);
    setNextDate(stageSet === "booked" ? "" : value);
    setDueTime("10:00");
    setBookedStage("booked");
    setCloseReason("");
    setErrors({});
    setNotes("");
    if (enquiry) setEnquiryId(enquiry.id);
    if (!followUp) return;
    const due = new Date(followUp.dueAt);
    setEnquiryId(followUp.enquiryId);
    setStage(followUp.stage);
    setDueDate(toDateInputValue(due));
    setDueTime(toTimeInputValue(due));
    setNextDate(followUp.nextFollowupDate ? toDateInputValue(new Date(followUp.nextFollowupDate)) : "");
    setNotes(followUp.notes ?? "");
  }, [open, day, enquiry, followUp, stageSet]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const outcomeReason = bookedStage === "booked" ? "Booked" : closeReason;
    const nextErrors = validateFollowUp({
      enquiryId,
      dueDate,
      dueTime,
      nextDate,
      notes,
      closedReason: outcomeReason,
      requireClosedReason: stageSet === "booked" && bookedStage === "closed",
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.enquiryId ?? nextErrors.nextFollowupDate ?? nextErrors.dueAt ?? nextErrors.closedReason ?? "Check the follow-up");
      return;
    }
    const dueAt = new Date(`${dueDate}T${dueTime}`);
    const nextAt = new Date(`${nextDate}T${dueTime}`);
    const input = {
      enquiryId,
      stage: stageSet === "booked" ? ("closed" as const) : stage,
      dueAt: dueAt.toISOString(),
      nextFollowupDate: nextAt.toISOString(),
      notes: notes.trim() || null,
    };
    setBusy(true);
    try {
      if (followUp) await updateFollowUp(followUp.id, input);
      else await createFollowUp(input);
      if (stageSet === "booked") {
        await updateEnquiry(enquiryId, { status: "closed", closedReason: outcomeReason.trim() });
      }
      toast.success(followUp ? "Follow-up updated" : "Follow-up logged");
      setEnquiryId("");
      setNotes("");
      setCloseReason("");
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log follow-up");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={followUp ? "Edit follow-up" : "New follow-up"}
      description={
        stageSet === "booked"
          ? "Booked and Closed both use the closed stage. Booked stores the reason Booked."
          : "Log the touchpoint and set the next one."
      }
      submitLabel={followUp ? "Save follow-up" : "Log follow-up"}
      busy={busy}
      onSubmit={onSubmit}
    >
      {shownEnquiry ? (
        <p className="text-sm text-muted-foreground">
          Enquiry: <span className="font-medium text-foreground">{shownEnquiry.title}</span>
        </p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="followup-enquiry">Enquiry</Label>
          <Select value={enquiryId} onValueChange={setEnquiryId}>
            <SelectTrigger id="followup-enquiry" className="h-11 rounded-xl">
              <SelectValue placeholder={enquiries.status === "loading" ? "Loading…" : "Pick an enquiry"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(enquiries.data?.items ?? []).map((item) => {
                const contact = contacts.data?.items.find((party) => party.id === item.contactId);
                const who = contact ? personLine(contact.name, contact.mobile) : null;
                return (
                  <SelectItem key={item.id} value={item.id}>
                    {who ? `${item.title} · ${who}` : item.title}
                  </SelectItem>
                );
              })}
            </SelectContent>
            </Select>
          {errors.enquiryId ? <p className="text-xs text-destructive">{errors.enquiryId}</p> : null}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="followup-stage">Stage</Label>
        <Select
          value={stageSet === "booked" ? bookedStage : stage}
          onValueChange={(next) => {
            if (stageSet === "booked") setBookedStage(next as BookedStage);
            else setStage(next as CrmEnquiryStatus);
          }}
        >
          <SelectTrigger id="followup-stage" className="h-11 rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stageSet === "booked"
              ? BOOKED_STAGES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              : CRM_ENQUIRY_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {humanize(value)}
                  </SelectItem>
                ))}
          </SelectContent>
        </Select>
      </div>
      {stageSet === "booked" && bookedStage === "closed" ? (
        <div className="space-y-2">
          <Label htmlFor="followup-close-reason">Close reason</Label>
          <Input
            id="followup-close-reason"
            value={closeReason}
            onChange={(event) => setCloseReason(event.target.value)}
            className="h-11 rounded-xl text-base"
          />
          {errors.closedReason ? <p className="text-xs text-destructive">{errors.closedReason}</p> : null}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="followup-due">Done on</Label>
          <Input
            id="followup-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 rounded-xl text-base"
            required
          />
          {errors.dueAt ? <p className="text-xs text-destructive">{errors.dueAt}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="followup-time">At</Label>
          <Input
            id="followup-time"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="h-11 rounded-xl text-base"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="followup-next">Next follow-up</Label>
        <Input
          id="followup-next"
          type="date"
          value={nextDate}
          onChange={(e) => setNextDate(e.target.value)}
          className="h-11 rounded-xl text-base"
          required
          aria-required={stageSet === "booked" ? true : undefined}
        />
        {errors.nextFollowupDate ? <p className="text-xs text-destructive">{errors.nextFollowupDate}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="followup-notes">Notes</Label>
        <Textarea
          id="followup-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl text-base"
          rows={3}
        />
      </div>
    </FormSheet>
  );
}
