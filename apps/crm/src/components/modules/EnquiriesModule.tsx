import { DragEvent, FormEvent, useEffect, useState } from "react";
import { Columns, LayoutGrid, List } from "lucide-react";
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
  Field,
  ModuleStatus,
  NativeSelect,
  RowActions,
} from "@/components/modules/shared";
import {
  ENQUIRY_STATUS_LABELS,
  contactTypeOptions,
  enquirySourceOptions,
  enquiryStatusOptions,
  formatDateTime,
} from "@/lib/crm/display";
import { createContact, listFollowUps } from "@/lib/crm/remote";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_ENQUIRY_STATUSES,
  CRM_PERMISSIONS,
  type CreateEnquiryInput,
  type CrmContactType,
  type CrmEnquiry,
  type CrmEnquiryStatus,
  type CrmFollowUp,
} from "@/types/crm";

type ViewMode = "table" | "card" | "kanban";

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
  onConfirm: (closedReason?: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const isClosing = newStage === "closed";
  const [closedMode, setClosedMode] = useState<ClosedReasonMode>("booked");
  const [lostText, setLostText] = useState("");

  const closedReason = isClosing
    ? closedMode === "booked" ? "Booked" : `Lost: ${lostText.trim()}`
    : undefined;
  const canConfirm = !isClosing || closedMode === "booked" || lostText.trim().length > 0;

  const handle = async () => {
    setBusy(true);
    try {
      await onConfirm(closedReason);
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
            {isClosing ? "Close Enquiry" : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
}: {
  enquiry: CrmEnquiry | null;
  contactName: (id: string) => string;
  onClose: () => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onMove: (enquiry: CrmEnquiry, stage: CrmEnquiryStatus) => void;
  onRemove: (id: string) => void;
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
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "closed" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => { void crm.convertEnquiry(enquiry.id); onClose(); }}
                  >
                    Convert
                  </Button>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => { onEdit(enquiry); onClose(); }}
                  >
                    Edit
                  </Button>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => { onRemove(enquiry.id); onClose(); }}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>

              <hr className="border-border" />

              {/* Follow-up history */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Follow-up history ({followUps.length})
                </p>
                {fuLoading ? (
                  <p className="text-xs text-muted-foreground">Loading…</p>
                ) : followUps.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No follow-up activity yet.</p>
                ) : (
                  <ol className="space-y-3">
                    {followUps.map((fu) => (
                      <li key={fu.id} className="relative border-l-2 border-muted pl-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {ENQUIRY_STATUS_LABELS[fu.stage]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDateTime(fu.dueAt)}</span>
                        </div>
                        {fu.notes ? (
                          <p className="mt-1 text-sm text-muted-foreground">{fu.notes}</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
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
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.contactMode === "existing") {
    if (!form.contactId) errors.contactId = "Select an existing contact";
  } else {
    if (!form.newName.trim()) errors.newName = "Name is required";
    if (!form.newMobile.trim()) errors.newMobile = "Mobile is required";
  }
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.source.trim()) errors.source = "Source is required";
  return errors;
}

function toEnquiryInput(contactId: string, form: FormState): CreateEnquiryInput {
  return {
    contactId,
    title: form.title.trim(),
    source: form.source.trim(),
    status: form.status,
    notes: form.notes.trim() || null,
  };
}

// ─── Table view ───────────────────────────────────────────────────────────────

function EnquiryTable({
  items,
  contactName,
  onView,
  onEdit,
  onRemove,
}: {
  items: CrmEnquiry[];
  contactName: (id: string) => string;
  onView: (enquiry: CrmEnquiry) => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onRemove: (id: string) => void;
}) {
  const crm = useCrm();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Source</TableHead>
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
            <TableCell><StageBadge status={enquiry.status} /></TableCell>
            <TableCell>
              <RowActions>
                <Button type="button" size="sm" variant="ghost" className="rounded-xl" onClick={() => onView(enquiry)}>
                  View
                </Button>
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "closed" ? (
                  <Button type="button" size="sm" className="rounded-xl" onClick={() => void crm.convertEnquiry(enquiry.id)}>
                    Convert
                  </Button>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                  <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onEdit(enquiry)}>
                    Edit
                  </Button>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                  <Button type="button" size="sm" variant="destructive" className="rounded-xl" onClick={() => onRemove(enquiry.id)}>
                    Remove
                  </Button>
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
}: {
  items: CrmEnquiry[];
  contactName: (id: string) => string;
  onView: (enquiry: CrmEnquiry) => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onRemove: (id: string) => void;
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
            <RowActions>
              {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "closed" ? (
                <Button type="button" size="sm" className="rounded-xl" onClick={() => void crm.convertEnquiry(enquiry.id)}>
                  Convert
                </Button>
              ) : null}
              {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => onEdit(enquiry)}>
                  Edit
                </Button>
              ) : null}
              {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                <Button type="button" size="sm" variant="destructive" className="rounded-xl" onClick={() => onRemove(enquiry.id)}>
                  Remove
                </Button>
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
}: {
  items: CrmEnquiry[];
  contactName: (id: string) => string;
  onView: (enquiry: CrmEnquiry) => void;
  onEdit: (enquiry: CrmEnquiry) => void;
  onRemove: (id: string) => void;
  onMove: (enquiry: CrmEnquiry, stage: CrmEnquiryStatus) => void;
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
    <div className="overflow-x-auto pb-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${CRM_ENQUIRY_STATUSES.length}, minmax(220px, 1fr))` }}>
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
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 rounded-lg px-2 text-xs"
                        onClick={() => onView(enquiry)}
                      >
                        View
                      </Button>
                      {crm.hasPermission(CRM_PERMISSIONS.enquiriesConvert) && enquiry.status !== "closed" ? (
                        <Button
                          type="button"
                          size="sm"
                          className="h-6 rounded-lg px-2 text-xs"
                          onClick={() => void crm.convertEnquiry(enquiry.id)}
                        >
                          Convert
                        </Button>
                      ) : null}
                      {crm.hasPermission(CRM_PERMISSIONS.enquiriesUpdate) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 rounded-lg px-2 text-xs"
                          onClick={() => onEdit(enquiry)}
                        >
                          Edit
                        </Button>
                      ) : null}
                      {crm.hasPermission(CRM_PERMISSIONS.enquiriesDelete) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 rounded-lg px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => onRemove(enquiry.id)}
                        >
                          Remove
                        </Button>
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

export function EnquiriesModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.enquiriesRead);
  const [view, setView] = useState<ViewMode>("kanban");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmEnquiry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [viewingEnquiry, setViewingEnquiry] = useState<CrmEnquiry | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    enquiry: CrmEnquiry;
    newStage: CrmEnquiryStatus;
  } | null>(null);
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

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setErrors({});
    setDialogOpen(true);
  };

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
    });
    setErrors({});
    setDialogOpen(true);
  };

  const requestMove = (enquiry: CrmEnquiry, newStage: CrmEnquiryStatus) => {
    if (enquiry.status === newStage) return;
    setPendingMove({ enquiry, newStage });
  };

  const confirmMove = async (closedReason?: string) => {
    if (!pendingMove) return;
    const { enquiry, newStage } = pendingMove;
    setPendingMove(null);
    try {
      await crm.updateEnquiry(enquiry.id, {
        status: newStage,
        ...(closedReason ? { closedReason } : {}),
      });
      // Refresh detail sheet if open for this enquiry
      if (viewingEnquiry?.id === enquiry.id) {
        setViewingEnquiry((prev) => prev ? { ...prev, status: newStage, closedReason: closedReason ?? prev.closedReason } : null);
      }
      // Auto-log follow-up history entry
      if (crm.hasPermission(CRM_PERMISSIONS.followUpsCreate)) {
        await crm.createFollowUp({
          enquiryId: enquiry.id,
          stage: newStage,
          dueAt: new Date().toISOString(),
          notes: closedReason
            ? `Closed – ${closedReason}`
            : `Moved to ${ENQUIRY_STATUS_LABELS[newStage]}`,
        });
      }
    } catch {
      // errors toasted in store
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
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
      setDialogOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          {view !== "kanban" ? (
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
          ) : null}
          {/* View toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border p-1">
            <Button
              type="button"
              size="icon"
              variant={view === "table" ? "secondary" : "ghost"}
              className="h-7 w-7"
              aria-label="Table view"
              onClick={() => setView("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={view === "card" ? "secondary" : "ghost"}
              className="h-7 w-7"
              aria-label="Card view"
              onClick={() => setView("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={view === "kanban" ? "secondary" : "ghost"}
              className="h-7 w-7"
              aria-label="Kanban view"
              onClick={() => setView("kanban")}
            >
              <Columns className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {crm.hasPermission(CRM_PERMISSIONS.enquiriesCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add enquiry
          </Button>
        ) : null}
      </div>

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
          />
        ) : view === "card" ? (
          <EnquiryCards
            items={crm.enquiries.items}
            contactName={contactName}
            onView={setViewingEnquiry}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        ) : (
          <EnquiryKanban
            items={crm.enquiries.items}
            contactName={contactName}
            onView={setViewingEnquiry}
            onEdit={openEdit}
            onRemove={(id) => setRemoveId(id)}
            onMove={requestMove}
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

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit enquiry" : "Add enquiry"}</DialogTitle>
            </DialogHeader>
            {/* ─ Contact section ─ */}
            {!editing ? (
              <>
                {/* Mode toggle */}
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
            <Field id="enquiry-notes" label="Notes">
              <Textarea
                id="enquiry-notes"
                value={form.notes}
                onChange={(e) => setForm((cur) => ({ ...cur, notes: e.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <DialogFooter>
              <Button type="submit" className="rounded-xl" disabled={busy}>
                {editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
