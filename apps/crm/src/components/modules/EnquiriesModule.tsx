import { DragEvent, FormEvent, useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmRemoveDialog,
  EditAction,
  Field,
  IconAction,
  MODULE_VIEWS,
  ModulePage,
  ModuleStatus,
  NativeSelect,
  RemoveAction,
  RowActions,
  SideSheet,
} from "@/components/modules/shared";
import { DatePicker } from "@/components/modules/DatePicker";
import { LeadTimeline } from "@/components/modules/LeadTimeline";
import { BookingFields, ConvertToBookedSheet } from "@/components/modules/ConvertToBookedSheet";
import { EMPTY_BOOKING, toBookingInput, validateBooking, type BookingFormState } from "@/lib/crm/booking";
import {
  ENQUIRY_STATUS_LABELS,
  contactTypeOptions,
  enquirySourceOptions,
  enquiryStatusOptions,
  formatDate,
  isoToLocalDateInput,
  isoToLocalInput,
  isLocalDateKeyOnOrAfterToday,
  localDateInputToIso,
  localInputToIso,
} from "@/lib/crm/display";
import { createContact, listFollowUps } from "@/lib/crm/remote";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_ENQUIRY_STATUSES,
  CRM_PERMISSIONS,
  type ConvertEnquiryInput,
  type CreateEnquiryInput,
  type CrmContactType,
  type CrmEnquiry,
  type CrmEnquiryStatus,
  type CrmFollowUp,
} from "@/types/crm";

type ViewMode = "table" | "card" | "kanban";

const VIEW_OPTIONS = [MODULE_VIEWS.table, MODULE_VIEWS.card, MODULE_VIEWS.kanban];

// ─── Closed-reason helpers ────────────────────────────────────────────────────

type ClosedReasonMode = "booked" | "lost";

function ClosedReasonForm({
  mode,
  lostText,
  onModeChange,
  onLostTextChange,
}: {
  mode: ClosedReasonMode;
  lostText: string;
  onModeChange: (mode: ClosedReasonMode) => void;
  onLostTextChange: (text: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Close reason</p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "booked" ? "default" : "outline"}
          className="rounded-xl"
          onClick={() => onModeChange("booked")}
        >
          Booked
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "lost" ? "default" : "outline"}
          className="rounded-xl"
          onClick={() => onModeChange("lost")}
        >
          Lost
        </Button>
      </div>
      {mode === "lost" ? (
        <Input
          placeholder="Reason for losing…"
          value={lostText}
          onChange={(e) => onLostTextChange(e.target.value)}
          className="rounded-xl"
          autoFocus
        />
      ) : null}
    </div>
  );
}

// ─── Stage-move confirmation dialog ──────────────────────────────────────────

function StageMoveDialog({
  enquiry,
  newStage,
  onCancel,
  onConfirm,
}: {
  enquiry: CrmEnquiry;
  newStage: CrmEnquiryStatus;
  onCancel: () => void;
  onConfirm: (closedReason?: string, booking?: ConvertEnquiryInput) => Promise<void>;
}) {
  const crm = useCrm();
  const [busy, setBusy] = useState(false);
  const isClosing = newStage === "closed";
  const [closedMode, setClosedMode] = useState<ClosedReasonMode>("booked");
  const [lostText, setLostText] = useState("");
  const [booking, setBooking] = useState<BookingFormState>(EMPTY_BOOKING);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const canConvert = crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert);
  const bookedConvert = isClosing && closedMode === "booked" && canConvert;

  const closedReason = isClosing
    ? closedMode === "booked" ? "Booked" : `Lost: ${lostText.trim()}`
    : undefined;
  const canConfirm = !isClosing || closedMode === "booked" || lostText.trim().length > 0;

  const handle = async () => {
    if (bookedConvert) {
      const nextErrors = validateBooking(booking);
      setBookingErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }
    setBusy(true);
    try {
      await onConfirm(closedReason, bookedConvert ? toBookingInput(booking) : undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to {ENQUIRY_STATUS_LABELS[newStage]}</DialogTitle>
          <DialogDescription>
            <span className="font-medium">{enquiry.title}</span> will move from{" "}
            <span className="font-medium">{ENQUIRY_STATUS_LABELS[enquiry.status]}</span> to{" "}
            <span className="font-medium">{ENQUIRY_STATUS_LABELS[newStage]}</span>.
            {isClosing ? " This is a terminal stage." : ""}
          </DialogDescription>
        </DialogHeader>
        {isClosing ? (
          <ClosedReasonForm
            mode={closedMode}
            lostText={lostText}
            onModeChange={setClosedMode}
            onLostTextChange={setLostText}
          />
        ) : null}
        {bookedConvert ? (
          <BookingFields form={booking} errors={bookingErrors} onChange={setBooking} />
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={busy || !canConfirm}
            onClick={handle}
          >
            {isClosing ? (bookedConvert ? "Convert to booked" : "Close Enquiry") : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quick follow-up dialog ───────────────────────────────────────────────────

function QuickFollowUpDialog({
  enquiry,
  contactName,
  onCancel,
  onConfirm,
}: {
  enquiry: CrmEnquiry;
  contactName: (id: string) => string;
  onCancel: () => void;
  onConfirm: (nextFollowupDate: string, notes: string) => Promise<void>;
}) {
  const [nextFollowupDate, setNextFollowupDate] = useState(() => isoToLocalInput(enquiry.nextFollowupDate));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (!nextFollowupDate) {
      setError("Next follow-up date is required");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onConfirm(localInputToIso(nextFollowupDate), notes.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      title="Add follow-up"
      description={
        <>
          <span className="font-medium text-foreground">{enquiry.title}</span> · {contactName(enquiry.contactId)}
        </>
      }
      onSubmit={(event) => {
        event.preventDefault();
        void handle();
      }}
      footer={
        <>
          <Button type="button" variant="outline" className="rounded-xl" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={busy}>
            Save
          </Button>
        </>
      }
    >
      <Field id="quick-followup-next" label="Next follow-up date & time" error={error ?? undefined}>
        <Input
          id="quick-followup-next"
          type="datetime-local"
          value={nextFollowupDate}
          onChange={(event) => setNextFollowupDate(event.target.value)}
          className="rounded-xl"
          autoFocus
        />
      </Field>
      <Field id="quick-followup-notes" label="Notes">
        <Textarea
          id="quick-followup-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="rounded-xl"
        />
      </Field>
    </SideSheet>
  );
}

// ─── Detail sheet ─────────────────────────────────────────────────────────────

function EnquiryDetailSheet({
  enquiry,
  contactName,
  onClose,
  onEdit,
  onMove,
  onRemove,
  onFollow,
  onConvert,
}: {
  enquiry: CrmEnquiry | null;
  contactName: (id: string) => string;
  onClose: () => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onMove: (enquiry: CrmEnquiry, stage: CrmEnquiryStatus) => void;
  onRemove: (id: string) => void;
  onFollow: (enquiry: CrmEnquiry) => void;
  onConvert: (enquiry: CrmEnquiry) => void;
}) {
  const crm = useCrm();
  const [followUps, setFollowUps] = useState<CrmFollowUp[]>([]);
  const [fuLoading, setFuLoading] = useState(false);

  useEffect(() => {
    if (!enquiry) { setFollowUps([]); return; }
    setFuLoading(true);
    listFollowUps({ enquiryId: enquiry.id, limit: 100 })
      .then((res) => setFollowUps(res.items))
      .catch(() => setFollowUps([]))
      .finally(() => setFuLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiry?.id]);

  return (
    <Sheet open={Boolean(enquiry)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        {enquiry ? (
          <>
            {/* Header */}
            <SheetHeader className="border-b px-6 py-5">
              <div className="flex items-start justify-between gap-3 pr-6">
                <div className="space-y-1">
                  <SheetTitle className="text-lg leading-snug">{enquiry.title}</SheetTitle>
                  <SheetDescription className="text-sm">
                    {contactName(enquiry.contactId)}
                  </SheetDescription>
                </div>
                <StageBadge status={enquiry.status} />
              </div>
            </SheetHeader>

            {/* Body */}
            <div className="flex-1 space-y-6 px-6 py-5">
              {/* Key facts */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Source</dt>
                  <dd className="mt-0.5 font-medium">{enquiry.source}</dd>
                </div>
                {enquiry.closedReason ? (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Close reason</dt>
                    <dd className="mt-0.5 font-medium">{enquiry.closedReason}</dd>
                  </div>
                ) : null}
                {enquiry.notes ? (
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Notes</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">{enquiry.notes}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs text-muted-foreground">Due date</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(enquiry.dueDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Next follow-up</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(enquiry.nextFollowupDate)}</dd>
                </div>
              </dl>

              {/* Stage move (if not closed) */}
              {enquiry.status !== "closed" && crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Move stage</p>
                  <NativeSelect
                    value={enquiry.status}
                    onChange={(value) => {
                      if (value !== enquiry.status) onMove(enquiry, value as CrmEnquiryStatus);
                    }}
                  >
                    {CRM_ENQUIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>{ENQUIRY_STATUS_LABELS[s]}</option>
                    ))}
                  </NativeSelect>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {crm.hasPermission(CRM_PERMISSIONS.followUpsCreate) && enquiry.status !== "closed" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => { onFollow(enquiry); onClose(); }}
                  >
                    <CalendarPlus className="mr-1 h-4 w-4" /> Add follow-up
                  </Button>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "closed" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => { onConvert(enquiry); onClose(); }}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Convert
                  </Button>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                  <EditAction onClick={() => { onEdit(enquiry); onClose(); }} />
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                  <RemoveAction onClick={() => { onRemove(enquiry.id); onClose(); }} />
                ) : null}
              </div>

              <hr className="border-border" />

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Timeline
                </p>
                {fuLoading ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : (
                  <LeadTimeline enquiry={enquiry} followUps={followUps} />
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ─── Stage badge ─────────────────────────────────────────────────────────────

function StageBadge({ status }: { status: CrmEnquiryStatus }) {
  return (
    <Badge variant={status !== "closed" ? "secondary" : "outline"}>
      {ENQUIRY_STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  // Contact: pick existing or create inline
  contactMode: "existing" | "new";
  contactId: string;
  newName: string;
  newMobile: string;
  newType: CrmContactType;
  // Enquiry fields
  title: string;
  source: string;
  status: CrmEnquiryStatus;
  notes: string;
  dueDate: string;
};

const EMPTY: FormState = {
  contactMode: "new",
  contactId: "",
  newName: "",
  newMobile: "",
  newType: "lead",
  title: "",
  source: "",
  status: "new",
  notes: "",
  dueDate: "",
};

function validate(form: FormState, allowedPastDueDate?: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.contactMode === "existing") {
    if (!form.contactId) errors.contactId = "Select an existing contact";
  } else {
    if (!form.newName.trim()) errors.newName = "Name is required";
    if (!form.newMobile.trim()) errors.newMobile = "Mobile is required";
  }
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.source.trim()) errors.source = "Source is required";
  if (!form.dueDate) errors.dueDate = "Due date is required";
  else if (!isLocalDateKeyOnOrAfterToday(form.dueDate) && form.dueDate !== allowedPastDueDate) {
    errors.dueDate = "Due date must be today or in the future";
  }
  return errors;
}

function toEnquiryInput(contactId: string, form: FormState): CreateEnquiryInput {
  return {
    contactId,
    title: form.title.trim(),
    source: form.source.trim(),
    status: form.status,
    notes: form.notes.trim() || null,
    dueDate: localDateInputToIso(form.dueDate),
  };
}

// ─── Table view ───────────────────────────────────────────────────────────────

function EnquiryTable({
  items,
  contactName,
  onView,
  onEdit,
  onRemove,
  onFollow,
  onConvert,
}: {
  items: CrmEnquiry[];
  contactName: (id: string) => string;
  onView: (enquiry: CrmEnquiry) => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onRemove: (id: string) => void;
  onFollow: (enquiry: CrmEnquiry) => void;
  onConvert: (enquiry: CrmEnquiry) => void;
}) {
  const crm = useCrm();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((enquiry) => (
          <TableRow key={enquiry.id} className={cn(enquiry.status === "closed" && "opacity-60")}>
            <TableCell>
              <button
                type="button"
                className="font-medium underline-offset-2 hover:underline text-left"
                onClick={() => onView(enquiry)}
              >
                {enquiry.title}
              </button>
            </TableCell>
            <TableCell>{contactName(enquiry.contactId)}</TableCell>
            <TableCell>{enquiry.source}</TableCell>
            <TableCell>{formatDate(enquiry.dueDate)}</TableCell>
            <TableCell><StageBadge status={enquiry.status} /></TableCell>
            <TableCell>
              <RowActions>
                <IconAction label="View" onClick={() => onView(enquiry)}>
                  <Eye className="h-4 w-4" />
                </IconAction>
                {crm.hasPermission(CRM_PERMISSIONS.followUpsCreate) && enquiry.status !== "closed" ? (
                  <IconAction label="Add follow-up" onClick={() => onFollow(enquiry)}>
                    <CalendarPlus className="h-4 w-4" />
                  </IconAction>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "closed" ? (
                  <IconAction
                    label="Convert"
                    className="text-primary hover:text-primary"
                    onClick={() => onConvert(enquiry)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </IconAction>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                  <EditAction onClick={() => onEdit(enquiry)} />
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                  <RemoveAction onClick={() => onRemove(enquiry.id)} />
                ) : null}
              </RowActions>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ─── Card view ────────────────────────────────────────────────────────────────

function EnquiryCards({
  items,
  contactName,
  onView,
  onEdit,
  onRemove,
  onFollow,
  onConvert,
}: {
  items: CrmEnquiry[];
  contactName: (id: string) => string;
  onView: (enquiry: CrmEnquiry) => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onRemove: (id: string) => void;
  onFollow: (enquiry: CrmEnquiry) => void;
  onConvert: (enquiry: CrmEnquiry) => void;
}) {
  const crm = useCrm();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((enquiry) => (
        <Card
          key={enquiry.id}
          className={cn(
            "rounded-2xl shadow-[var(--shadow-card)] cursor-pointer transition-shadow hover:shadow-md",
            enquiry.status === "closed" && "opacity-70",
          )}
          onClick={() => onView(enquiry)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base leading-snug">{enquiry.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{contactName(enquiry.contactId)}</p>
          </CardHeader>
          <CardContent className="space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <StageBadge status={enquiry.status} />
            </div>
            {enquiry.closedReason ? (
              <p className="text-xs text-muted-foreground">Reason: {enquiry.closedReason}</p>
            ) : null}
            {enquiry.notes ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">{enquiry.notes}</p>
            ) : null}
            {enquiry.dueDate ? (
              <p className="text-xs text-muted-foreground">Due {formatDate(enquiry.dueDate)}</p>
            ) : null}
            <RowActions>
              <IconAction label="View" onClick={() => onView(enquiry)}>
                <Eye className="h-4 w-4" />
              </IconAction>
              {crm.hasPermission(CRM_PERMISSIONS.followUpsCreate) && enquiry.status !== "closed" ? (
                <IconAction label="Add follow-up" onClick={() => onFollow(enquiry)}>
                  <CalendarPlus className="h-4 w-4" />
                </IconAction>
              ) : null}
              {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "closed" ? (
                <IconAction
                  label="Convert"
                  className="text-primary hover:text-primary"
                  onClick={() => onConvert(enquiry)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </IconAction>
              ) : null}
              {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                <EditAction onClick={() => onEdit(enquiry)} />
              ) : null}
              {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                <RemoveAction onClick={() => onRemove(enquiry.id)} />
              ) : null}
            </RowActions>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Kanban view ──────────────────────────────────────────────────────────────
// Matches TasksModule style: Card columns, draggable task-style cards inside.

function EnquiryKanban({
  items,
  contactName,
  onView,
  onEdit,
  onRemove,
  onMove,
  onFollow,
  onConvert,
}: {
  items: CrmEnquiry[];
  contactName: (id: string) => string;
  onView: (enquiry: CrmEnquiry) => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onRemove: (id: string) => void;
  onMove: (enquiry: CrmEnquiry, stage: CrmEnquiryStatus) => void;
  onFollow: (enquiry: CrmEnquiry) => void;
  onConvert: (enquiry: CrmEnquiry) => void;
}) {
  const crm = useCrm();
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<CrmEnquiryStatus | null>(null);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, stage: CrmEnquiryStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(stage);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, stage: CrmEnquiryStatus) => {
    e.preventDefault();
    setDropTarget(null);
    if (!dragId) return;
    const enquiry = items.find((item) => item.id === dragId);
    if (enquiry && enquiry.status !== stage) {
      onMove(enquiry, stage);
    }
    setDragId(null);
  };

  const handleDragEnd = () => {
    setDragId(null);
    setDropTarget(null);
  };

  return (
    <div className="pb-4">
      {/* 4 columns per row up to xl (so 8 stages wrap into 2 rows of 4); a single row on xl+ screens */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
        {CRM_ENQUIRY_STATUSES.map((stage) => {
          const columnItems = items.filter((e) => e.status === stage);
          const isDragTarget = dropTarget === stage && dragId !== null;
          const draggingFromThis = dragId
            ? items.find((i) => i.id === dragId)?.status === stage
            : false;

          return (
            <Card
              key={stage}
              className={cn(
                "rounded-2xl shadow-[var(--shadow-card)] transition-colors",
                isDragTarget && !draggingFromThis && "ring-2 ring-primary/40 bg-primary/5",
              )}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => handleDrop(e, stage)}
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold">
                  {ENQUIRY_STATUS_LABELS[stage]}{" "}
                  <span className="font-normal text-muted-foreground">({columnItems.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-3 min-h-[60px]">
                {columnItems.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, enquiry.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "rounded-xl border bg-background p-3 shadow-sm cursor-grab select-none transition-opacity",
                      dragId === enquiry.id && "opacity-40 cursor-grabbing",
                    )}
                  >
                    {/* Title — click opens detail sheet */}
                    <button
                      type="button"
                      className="w-full text-left font-medium text-sm leading-snug hover:underline underline-offset-2"
                      onClick={() => onView(enquiry)}
                    >
                      {enquiry.title}
                    </button>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {contactName(enquiry.contactId)}
                    </p>
                    {enquiry.closedReason ? (
                      <p className="mt-0.5 text-xs italic text-muted-foreground">{enquiry.closedReason}</p>
                    ) : null}
                    {enquiry.dueDate ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">Due {formatDate(enquiry.dueDate)}</p>
                    ) : null}
                    {/* Stage select — triggers confirm dialog */}
                    {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                      <div className="mt-2">
                        <NativeSelect
                          aria-label={`Stage for ${enquiry.title}`}
                          value={enquiry.status}
                          onChange={(value) => {
                            if (value !== enquiry.status) onMove(enquiry, value as CrmEnquiryStatus);
                          }}
                        >
                          {CRM_ENQUIRY_STATUSES.map((s) => (
                            <option key={s} value={s}>{ENQUIRY_STATUS_LABELS[s]}</option>
                          ))}
                        </NativeSelect>
                      </div>
                    ) : null}
                    {/* Action buttons */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <IconAction className="h-7 w-7" label="View" onClick={() => onView(enquiry)}>
                        <Eye className="h-4 w-4" />
                      </IconAction>
                      {crm.hasPermission(CRM_PERMISSIONS.followUpsCreate) && enquiry.status !== "closed" ? (
                        <IconAction className="h-7 w-7" label="Add follow-up" onClick={() => onFollow(enquiry)}>
                          <CalendarPlus className="h-4 w-4" />
                        </IconAction>
                      ) : null}
                      {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "closed" ? (
                        <IconAction
                          className="h-7 w-7 text-primary hover:text-primary"
                          label="Convert"
                          onClick={() => onConvert(enquiry)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </IconAction>
                      ) : null}
                      {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                        <EditAction className="h-7 w-7" onClick={() => onEdit(enquiry)} />
                      ) : null}
                      {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                        <RemoveAction className="h-7 w-7" onClick={() => onRemove(enquiry.id)} />
                      ) : null}
                    </div>
                  </div>
                ))}
                {columnItems.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    {isDragTarget ? "Drop here" : "Empty"}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Module ───────────────────────────────────────────────────────────────────

export function EnquiriesModule({
  createOnDate,
  onCreateOpened,
}: {
  createOnDate?: string | null;
  onCreateOpened?: () => void;
}) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.enquiriesRead);
  const [view, setView] = useState<ViewMode>("kanban");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmEnquiry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [viewingEnquiry, setViewingEnquiry] = useState<CrmEnquiry | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    enquiry: CrmEnquiry;
    newStage: CrmEnquiryStatus;
  } | null>(null);
  const [followingEnquiry, setFollowingEnquiry] = useState<CrmEnquiry | null>(null);
  const [convertingEnquiry, setConvertingEnquiry] = useState<CrmEnquiry | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    if (view === "kanban") {
      void crm.loadEnquiries({ limit: 500 });
    } else {
      void crm.loadEnquiries({
        status: statusFilter ? (statusFilter as CrmEnquiryStatus) : undefined,
      });
    }
    if (crm.hasPermission(CRM_PERMISSIONS.contactsRead)) void crm.loadContacts({ limit: 100 });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, statusFilter, view]);

  const contactName = (contactId: string) =>
    crm.contacts.items.find((c) => c.id === contactId)?.name ?? contactId;

  const openCreate = (dueDate = "") => {
    setEditing(null);
    setForm({ ...EMPTY, dueDate });
    setErrors({});
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!createOnDate) return;
    openCreate(createOnDate);
    onCreateOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOnDate]);

  const openEdit = (enquiry: CrmEnquiry) => {
    setEditing(enquiry);
    setForm({
      contactMode: "existing",
      contactId: enquiry.contactId,
      newName: "",
      newMobile: "",
      newType: "lead",
      title: enquiry.title,
      source: enquiry.source,
      status: enquiry.status,
      notes: enquiry.notes ?? "",
      dueDate: isoToLocalDateInput(enquiry.dueDate),
    });
    setErrors({});
    setSheetOpen(true);
  };

  const confirmFollowUp = async (nextFollowupDate: string, notes: string) => {
    if (!followingEnquiry) return;
    try {
      await crm.createFollowUp({
        enquiryId: followingEnquiry.id,
        stage: followingEnquiry.status,
        dueAt: new Date().toISOString(),
        nextFollowupDate,
        notes: notes || null,
      });
      setFollowingEnquiry(null);
    } catch {
      // toast handled in store
    }
  };

  const requestMove = (enquiry: CrmEnquiry, newStage: CrmEnquiryStatus) => {
    if (enquiry.status === newStage) return;
    setPendingMove({ enquiry, newStage });
  };

  const confirmMove = async (closedReason?: string, booking?: ConvertEnquiryInput) => {
    if (!pendingMove) return;
    const { enquiry, newStage } = pendingMove;
    setPendingMove(null);
    try {
      if (closedReason === "Booked" && booking) {
        await crm.convertEnquiry(enquiry.id, booking);
      } else {
        await crm.updateEnquiry(enquiry.id, {
          status: newStage,
          ...(closedReason ? { closedReason } : {}),
        });
      }
      if (viewingEnquiry?.id === enquiry.id) {
        setViewingEnquiry((prev) => prev ? { ...prev, status: closedReason === "Booked" ? "closed" : newStage, closedReason: closedReason ?? prev.closedReason } : null);
      }
    } catch {
      // errors toasted in store
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form, editing ? isoToLocalDateInput(editing.dueDate) : undefined);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      let contactId = form.contactId;
      if (!editing && form.contactMode === "new") {
        const newContact = await createContact({
          name: form.newName.trim(),
          mobile: form.newMobile.trim(),
          type: form.newType,
        });
        contactId = newContact.id;
        // Refresh contacts list so the new contact shows up elsewhere
        void crm.loadContacts({ limit: 100 });
      }
      const input = toEnquiryInput(contactId, form);
      if (editing) await crm.updateEnquiry(editing.id, input);
      else await crm.createEnquiry(input);
      setSheetOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModulePage
      crumb="Enquiries"
      view={view}
      onViewChange={(next) => setView(next as ViewMode)}
      viewOptions={VIEW_OPTIONS}
      actions={
        crm.hasPermission(CRM_PERMISSIONS.enquiriesCreate) ? (
          <Button type="button" className="rounded-xl" onClick={() => openCreate()}>
            Add enquiry
          </Button>
        ) : null
      }
      toolbar={
        view !== "kanban" ? (
          <Field id="enquiry-status-filter" label="Stage">
            <NativeSelect
              id="enquiry-status-filter"
              aria-label="Stage"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <option value="">All stages</option>
              {enquiryStatusOptions()}
            </NativeSelect>
          </Field>
        ) : null
      }
    >
      {/* Content */}
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.enquiries.status}
        errorMessage={crm.enquiries.errorMessage}
        empty={crm.enquiries.items.length === 0}
        emptyLabel="No enquiries yet"
        onRetry={reload}
      >
        {view === "table" ? (
          <EnquiryTable
            items={crm.enquiries.items}
            contactName={contactName}
            onView={setViewingEnquiry}
            onEdit={openEdit}
            onRemove={setRemoveId}
            onFollow={setFollowingEnquiry}
            onConvert={setConvertingEnquiry}
          />
        ) : view === "card" ? (
          <EnquiryCards
            items={crm.enquiries.items}
            contactName={contactName}
            onView={setViewingEnquiry}
            onEdit={openEdit}
            onRemove={setRemoveId}
            onFollow={setFollowingEnquiry}
            onConvert={setConvertingEnquiry}
          />
        ) : (
          <EnquiryKanban
            items={crm.enquiries.items}
            contactName={contactName}
            onView={setViewingEnquiry}
            onEdit={openEdit}
            onRemove={(id) => setRemoveId(id)}
            onMove={requestMove}
            onFollow={setFollowingEnquiry}
            onConvert={setConvertingEnquiry}
          />
        )}
      </ModuleStatus>

      {/* Detail sheet */}
      <EnquiryDetailSheet
        enquiry={viewingEnquiry}
        contactName={contactName}
        onClose={() => setViewingEnquiry(null)}
        onEdit={openEdit}
        onMove={requestMove}
        onRemove={setRemoveId}
        onFollow={setFollowingEnquiry}
        onConvert={setConvertingEnquiry}
      />

      {/* Stage-move confirmation dialog */}
      {pendingMove ? (
        <StageMoveDialog
          enquiry={pendingMove.enquiry}
          newStage={pendingMove.newStage}
          onCancel={() => setPendingMove(null)}
          onConfirm={confirmMove}
        />
      ) : null}

      {/* Quick follow-up dialog */}
      {followingEnquiry ? (
        <QuickFollowUpDialog
          enquiry={followingEnquiry}
          contactName={contactName}
          onCancel={() => setFollowingEnquiry(null)}
          onConfirm={confirmFollowUp}
        />
      ) : null}

      <ConvertToBookedSheet
        enquiry={convertingEnquiry}
        onClose={() => setConvertingEnquiry(null)}
      />

      {/* Create / Edit sheet */}
      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit enquiry" : "Add enquiry"}
        onSubmit={onSubmit}
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            {editing ? "Save" : "Create"}
          </Button>
        }
      >
        {!editing ? (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Contact</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={form.contactMode === "existing" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setForm((cur) => ({ ...cur, contactMode: "existing" }))}
                >
                  Existing contact
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.contactMode === "new" ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setForm((cur) => ({ ...cur, contactMode: "new" }))}
                >
                  + New contact
                </Button>
              </div>
            </div>
            {form.contactMode === "existing" ? (
              <Field id="enquiry-contact" label="" error={errors.contactId}>
                <NativeSelect
                  id="enquiry-contact"
                  value={form.contactId}
                  onChange={(value) => setForm((cur) => ({ ...cur, contactId: value }))}
                >
                  <option value="">Select contact</option>
                  {crm.contacts.items.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </NativeSelect>
              </Field>
            ) : (
              <div className="space-y-3 rounded-xl border p-3">
                <Field id="new-contact-name" label="Full name" error={errors.newName}>
                  <Input
                    id="new-contact-name"
                    value={form.newName}
                    onChange={(e) => setForm((cur) => ({ ...cur, newName: e.target.value }))}
                    placeholder="e.g. Priya Sharma"
                    className="rounded-xl"
                    autoFocus
                  />
                </Field>
                <Field id="new-contact-mobile" label="Mobile" error={errors.newMobile}>
                  <Input
                    id="new-contact-mobile"
                    value={form.newMobile}
                    onChange={(e) => setForm((cur) => ({ ...cur, newMobile: e.target.value }))}
                    placeholder="+91 98765 43210"
                    className="rounded-xl"
                  />
                </Field>
                <Field id="new-contact-type" label="Contact type">
                  <NativeSelect
                    id="new-contact-type"
                    value={form.newType}
                    onChange={(value) => setForm((cur) => ({ ...cur, newType: value as CrmContactType }))}
                  >
                    {contactTypeOptions()}
                  </NativeSelect>
                </Field>
              </div>
            )}
          </>
        ) : (
          <Field id="enquiry-contact" label="Contact" error={errors.contactId}>
            <NativeSelect
              id="enquiry-contact"
              value={form.contactId}
              onChange={(value) => setForm((cur) => ({ ...cur, contactId: value }))}
            >
              <option value="">Select contact</option>
              {crm.contacts.items.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </NativeSelect>
          </Field>
        )}
        <Field id="enquiry-title" label="Title" error={errors.title}>
          <Input
            id="enquiry-title"
            value={form.title}
            onChange={(e) => setForm((cur) => ({ ...cur, title: e.target.value }))}
            className="rounded-xl"
          />
        </Field>
        <Field id="enquiry-source" label="How did they find us?" error={errors.source}>
          <NativeSelect
            id="enquiry-source"
            value={form.source}
            onChange={(value) => setForm((cur) => ({ ...cur, source: value }))}
          >
            <option value="">Select source</option>
            {enquirySourceOptions()}
          </NativeSelect>
        </Field>
        <Field id="enquiry-status" label="Stage">
          <NativeSelect
            id="enquiry-status"
            value={form.status}
            onChange={(value) => setForm((cur) => ({ ...cur, status: value as CrmEnquiryStatus }))}
          >
            {enquiryStatusOptions()}
          </NativeSelect>
        </Field>
        <Field id="enquiry-due-date" label="Due date" error={errors.dueDate}>
          <DatePicker
            key={editing?.id ?? "new"}
            id="enquiry-due-date"
            value={form.dueDate}
            onChange={(value) => setForm((cur) => ({ ...cur, dueDate: value }))}
          />
        </Field>
        <Field id="enquiry-notes" label="Notes">
          <Textarea
            id="enquiry-notes"
            value={form.notes}
            onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
            className="rounded-xl"
          />
        </Field>
      </SideSheet>

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove enquiry"
        description="This enquiry will be hidden from the pipeline."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeEnquiry(removeId).finally(() => setRemoveId(null));
        }}
      />
    </ModulePage>
  );
}
