import { FormEvent, useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  enquiryStatusOptions,
  formatDateTime,
  isoToLocalInput,
  localInputToIso,
} from "@/lib/crm/display";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_ENQUIRY_STATUSES,
  CRM_PERMISSIONS,
  type CreateFollowUpInput,
  type CrmEnquiryStatus,
  type CrmFollowUp,
} from "@/types/crm";

type ViewMode = "table" | "card";

// A follow-up is overdue when its scheduled date is in the past
function isOverdue(item: CrmFollowUp): boolean {
  return new Date(item.dueAt).getTime() < Date.now();
}

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  enquiryId: string;
  stage: CrmEnquiryStatus;
  dueAt: string;
  notes: string;
};

const EMPTY: FormState = {
  enquiryId: "",
  stage: "new",
  dueAt: "",
  notes: "",
};

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.enquiryId) errors.enquiryId = "Enquiry is required";
  if (!form.dueAt) errors.dueAt = "Date is required";
  return errors;
}

function toInput(form: FormState): CreateFollowUpInput {
  return {
    enquiryId: form.enquiryId,
    stage: form.stage,
    dueAt: localInputToIso(form.dueAt),
    notes: form.notes.trim() || null,
  };
}

// ─── Stage badge ─────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: CrmEnquiryStatus }) {
  return <Badge variant="secondary">{ENQUIRY_STATUS_LABELS[stage]}</Badge>;
}

// ─── Table view ───────────────────────────────────────────────────────────────

function FollowUpTable({
  items,
  enquiryTitle,
  onEdit,
  onRemove,
}: {
  items: CrmFollowUp[];
  enquiryTitle: (id: string) => string;
  onEdit: (item: CrmFollowUp) => void;
  onRemove: (id: string) => void;
}) {
  const crm = useCrm();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Enquiry</TableHead>
          <TableHead>Stage at time</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const overdue = isOverdue(item);
          return (
            <TableRow
              key={item.id}
              className={cn(overdue && "bg-destructive/10")}
              data-overdue={overdue ? "true" : undefined}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {formatDateTime(item.dueAt)}
                  {overdue ? (
                    <Badge variant="destructive">Overdue</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>{enquiryTitle(item.enquiryId)}</TableCell>
              <TableCell><StageBadge stage={item.stage} /></TableCell>
              <TableCell>{item.notes ?? "—"}</TableCell>
              <TableCell>
                <RowActions>
                  {crm.hasPermission(CRM_PERMISSIONS.followUpsUpdate) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </Button>
                  ) : null}
                  {crm.hasPermission(CRM_PERMISSIONS.followUpsDelete) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="rounded-xl"
                      onClick={() => onRemove(item.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </RowActions>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Card view ────────────────────────────────────────────────────────────────

function FollowUpCards({
  items,
  enquiryTitle,
  onEdit,
  onRemove,
}: {
  items: CrmFollowUp[];
  enquiryTitle: (id: string) => string;
  onEdit: (item: CrmFollowUp) => void;
  onRemove: (id: string) => void;
}) {
  const crm = useCrm();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const overdue = isOverdue(item);
        return (
          <Card
            key={item.id}
            className={cn(
              "rounded-2xl shadow-[var(--shadow-card)]",
              overdue && "border-destructive",
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-semibold">
                  {formatDateTime(item.dueAt)}
                </CardTitle>
                {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
              </div>
              <CardDescription>{enquiryTitle(item.enquiryId)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <StageBadge stage={item.stage} />
              {item.notes ? (
                <p className="line-clamp-3 text-xs text-muted-foreground">{item.notes}</p>
              ) : null}
              <RowActions>
                {crm.hasPermission(CRM_PERMISSIONS.followUpsUpdate) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </Button>
                ) : null}
                {crm.hasPermission(CRM_PERMISSIONS.followUpsDelete) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => onRemove(item.id)}
                  >
                    Remove
                  </Button>
                ) : null}
              </RowActions>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Module ───────────────────────────────────────────────────────────────────

export function FollowUpsModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.followUpsRead);
  const [view, setView] = useState<ViewMode>("table");
  const [enquiryFilter, setEnquiryFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmFollowUp | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadFollowUps({
      enquiryId: enquiryFilter || undefined,
      stage: stageFilter ? (stageFilter as CrmEnquiryStatus) : undefined,
    });
    if (crm.hasPermission(CRM_PERMISSIONS.enquiriesRead)) void crm.loadEnquiries({ limit: 200 });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, enquiryFilter, stageFilter]);

  const enquiryTitle = (id: string) =>
    crm.enquiries.items.find((e) => e.id === id)?.title ?? id;

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY,
      enquiryId: crm.enquiries.items[0]?.id ?? "",
      stage: crm.enquiries.items[0]?.status ?? "new",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (item: CrmFollowUp) => {
    setEditing(item);
    setForm({
      enquiryId: item.enquiryId,
      stage: item.stage,
      dueAt: isoToLocalInput(item.dueAt),
      notes: item.notes ?? "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  // When user picks an enquiry in the form, pre-fill stage from that enquiry's current stage
  const handleEnquiryChange = (id: string) => {
    const enquiry = crm.enquiries.items.find((e) => e.id === id);
    setForm((current) => ({
      ...current,
      enquiryId: id,
      stage: enquiry?.status ?? current.stage,
    }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      if (editing) await crm.updateFollowUp(editing.id, toInput(form));
      else await crm.createFollowUp(toInput(form));
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
          {/* Filter by enquiry */}
          <Field id="followup-enquiry-filter" label="Enquiry">
            <NativeSelect
              id="followup-enquiry-filter"
              aria-label="Enquiry"
              value={enquiryFilter}
              onChange={setEnquiryFilter}
            >
              <option value="">All enquiries</option>
              {crm.enquiries.items.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </NativeSelect>
          </Field>
          {/* Filter by stage */}
          <Field id="followup-stage-filter" label="Stage">
            <NativeSelect
              id="followup-stage-filter"
              aria-label="Stage"
              value={stageFilter}
              onChange={setStageFilter}
            >
              <option value="">All stages</option>
              {enquiryStatusOptions()}
            </NativeSelect>
          </Field>
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
          </div>
        </div>

        {crm.hasPermission(CRM_PERMISSIONS.followUpsCreate) ? (
          <Button type="button" className="rounded-xl" onClick={openCreate}>
            Add follow-up
          </Button>
        ) : null}
      </div>

      {/* Content */}
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.followUps.status}
        errorMessage={crm.followUps.errorMessage}
        empty={crm.followUps.items.length === 0}
        emptyLabel="No follow-ups yet"
        onRetry={reload}
      >
        {view === "table" ? (
          <FollowUpTable
            items={crm.followUps.items}
            enquiryTitle={enquiryTitle}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        ) : (
          <FollowUpCards
            items={crm.followUps.items}
            enquiryTitle={enquiryTitle}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        )}
      </ModuleStatus>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit follow-up" : "Add follow-up"}
              </DialogTitle>
            </DialogHeader>

            <Field id="followup-enquiry" label="Enquiry" error={errors.enquiryId}>
              <NativeSelect
                id="followup-enquiry"
                value={form.enquiryId}
                onChange={handleEnquiryChange}
              >
                <option value="">Select enquiry</option>
                {crm.enquiries.items.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} — {ENQUIRY_STATUS_LABELS[e.status]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field id="followup-stage" label="Stage at this point">
              <NativeSelect
                id="followup-stage"
                value={form.stage}
                onChange={(value) =>
                  setForm((current) => ({ ...current, stage: value as CrmEnquiryStatus }))
                }
              >
                {CRM_ENQUIRY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ENQUIRY_STATUS_LABELS[s]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field id="followup-due" label="Date / scheduled" error={errors.dueAt}>
              <Input
                id="followup-due"
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dueAt: event.target.value }))
                }
                className="rounded-xl"
              />
            </Field>

            <Field id="followup-notes" label="Notes">
              <Textarea
                id="followup-notes"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, notes: event.target.value }))
                }
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
        title="Remove follow-up"
        description="This follow-up will be hidden from the history."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeFollowUp(removeId).finally(() => setRemoveId(null));
        }}
      />
    </div>
  );
}
