import { useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, formatDateTime, humanize } from "@/lib/mobile/format";
import { buildLeadTimeline } from "@/lib/mobile/lead-timeline";
import { fetchContactDetail, listFollowUps, removeEnquiry, updateEnquiry } from "@/lib/mobile/remote";
import { cn } from "@/lib/utils";
import {
  CRM_ENQUIRY_STATUSES,
  CRM_PERMISSIONS,
  type CrmEnquiry,
  type CrmEnquiryStatus,
  type CrmFollowUp,
} from "@/types/crm";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

export function EnquiryDetailSheet({
  enquiry,
  permissions,
  onClose,
  onChanged,
  onEdit,
  onFollow,
  onConvert,
}: {
  enquiry: CrmEnquiry | null;
  permissions: readonly string[];
  onClose: () => void;
  onChanged: () => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onFollow: (enquiry: CrmEnquiry) => void;
  onConvert: (enquiry: CrmEnquiry) => void;
}) {
  const [contactName, setContactName] = useState("");
  const [followUps, setFollowUps] = useState<CrmFollowUp[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const [closeReason, setCloseReason] = useState("");

  const canUpdate = permissions.includes(CRM_PERMISSIONS.enquiriesUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.enquiriesDelete);
  const canConvert = permissions.includes(CRM_PERMISSIONS.enquiriesConvert);
  const canFollow = permissions.includes(CRM_PERMISSIONS.followUpsCreate);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canReadFollowUps = permissions.includes(CRM_PERMISSIONS.followUpsRead);

  useEffect(() => {
    setConfirmRemove(false);
    setPendingClose(false);
    setCloseReason("");
    if (!enquiry) {
      setContactName("");
      setFollowUps([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        if (canReadContacts) {
          const detail = await fetchContactDetail(enquiry.contactId);
          if (cancelled) return;
          setContactName(detail.contact.name);
          setFollowUps(detail.enquiries.find((item) => item.id === enquiry.id)?.followUps ?? []);
          return;
        }
        if (canReadFollowUps) {
          const page = await listFollowUps({ enquiryId: enquiry.id, limit: 100 });
          if (cancelled) return;
          setFollowUps(page.items);
        }
      } catch {
        if (!cancelled) {
          setContactName("");
          setFollowUps([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enquiry, canReadContacts, canReadFollowUps]);

  const changeStatus = async (next: CrmEnquiryStatus) => {
    if (!enquiry || next === enquiry.status) return;
    if (next === "closed" && !closeReason.trim()) return;
    setBusy(true);
    try {
      await updateEnquiry(enquiry.id, {
        status: next,
        closedReason: next === "closed" ? closeReason.trim() : undefined,
      });
      toast.success("Enquiry updated");
      onClose();
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update enquiry");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!enquiry) return;
    setBusy(true);
    try {
      await removeEnquiry(enquiry.id);
      toast.success("Enquiry removed");
      onClose();
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove enquiry");
    } finally {
      setBusy(false);
    }
  };

  const timeline = enquiry ? buildLeadTimeline(enquiry, followUps) : [];
  const openEnquiry = enquiry && enquiry.status !== "closed" ? enquiry : null;

  return (
    <Sheet open={Boolean(enquiry)} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl p-0 pb-safe">
        {enquiry ? (
          <div className="mx-auto w-full max-w-tablet">
            <SheetHeader className="border-b border-border px-5 py-4 text-left">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0 space-y-1">
                  <SheetTitle className="text-lg leading-snug">{enquiry.title}</SheetTitle>
                  <SheetDescription>{contactName || "Enquiry"}</SheetDescription>
                </div>
                <Badge variant="secondary" className="shrink-0 rounded-full">
                  {humanize(enquiry.status)}
                </Badge>
              </div>
            </SheetHeader>

            <div className="space-y-5 px-5 py-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Source" value={enquiry.source || "—"} />
                <Fact label="Due date" value={formatDate(enquiry.dueDate)} />
                <Fact label="Next follow-up" value={formatDate(enquiry.nextFollowupDate)} />
                {enquiry.closedReason ? (
                  <div className="col-span-2">
                    <Fact label="Close reason" value={enquiry.closedReason} />
                  </div>
                ) : null}
              </dl>

              {canUpdate && enquiry.status !== "closed" ? (
                <div className="space-y-2">
                  <Label htmlFor="enquiry-stage" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Move stage
                  </Label>
                  <Select
                    value={pendingClose ? "closed" : enquiry.status}
                    disabled={busy}
                    onValueChange={(next) => {
                      if (next === "closed") {
                        setPendingClose(true);
                        setCloseReason("");
                        return;
                      }
                      setPendingClose(false);
                      void changeStatus(next as CrmEnquiryStatus);
                    }}
                  >
                    <SelectTrigger id="enquiry-stage" className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRM_ENQUIRY_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {humanize(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pendingClose ? (
                    <div className="space-y-2">
                      <Label htmlFor="enquiry-close-reason">Close reason</Label>
                      <div className="flex gap-2">
                        <Input
                          id="enquiry-close-reason"
                          value={closeReason}
                          onChange={(event) => setCloseReason(event.target.value)}
                          placeholder="Why is this enquiry closing?"
                          className="h-11 rounded-xl text-base"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 shrink-0 rounded-xl"
                          disabled={busy || !closeReason.trim()}
                          onClick={() => void changeStatus("closed")}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {confirmRemove ? (
                <div className="space-y-3 rounded-2xl border border-border p-3">
                  <p className="text-sm">Remove this enquiry? A booking with a paid payment cannot be removed.</p>
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
                  {canFollow && openEnquiry ? (
                    <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onFollow(enquiry)}>
                      <CalendarPlus className="h-4 w-4" aria-hidden /> Add follow-up
                    </Button>
                  ) : null}
                  {canConvert && openEnquiry ? (
                    <Button type="button" size="sm" className="rounded-xl" onClick={() => onConvert(enquiry)}>
                      <CheckCircle2 className="h-4 w-4" aria-hidden /> Convert
                    </Button>
                  ) : null}
                  {canUpdate ? (
                    <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-xl" aria-label="Edit" onClick={() => onEdit(enquiry)}>
                      <Pencil className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-xl text-destructive" aria-label="Remove" onClick={() => setConfirmRemove(true)}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                </div>
              )}

              <hr className="border-border" />

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
                {loading ? <p className="text-xs text-muted-foreground">Loading…</p> : null}
                {!loading && timeline.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No timeline activity yet.</p>
                ) : (
                  <ol>
                    {timeline.map((event, index) => (
                      <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < timeline.length - 1 ? (
                          <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />
                        ) : null}
                        <span
                          className={cn(
                            "relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-background",
                            event.overdue ? "bg-destructive" : "bg-primary",
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(event.at)}</p>
                          {event.notes ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.notes}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
