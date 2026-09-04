import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmRemoveDialog,
  Field,
  ModuleStatus,
} from "@/components/modules/shared";
import { formatDateTime, isoToLocalInput, localInputToIso } from "@/lib/crm/display";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CreateCalendarEventInput, type CrmCalendarItem } from "@/types/crm";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KIND_LABELS: Record<CrmCalendarItem["kind"], string> = {
  followup: "Follow-up",
  task: "Task",
  event: "Event",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const weekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - weekday);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type FormState = {
  title: string;
  startsAt: string;
  endsAt: string;
  notes: string;
};

const EMPTY: FormState = { title: "", startsAt: "", endsAt: "", notes: "" };

function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Title is required";
  if (!form.startsAt) errors.startsAt = "Start is required";
  if (!form.endsAt) errors.endsAt = "End is required";
  if (form.startsAt && form.endsAt && new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
    errors.endsAt = "End must be after start";
  }
  return errors;
}

function toInput(form: FormState): CreateCalendarEventInput {
  return {
    title: form.title.trim(),
    startsAt: localInputToIso(form.startsAt),
    endsAt: localInputToIso(form.endsAt),
    notes: form.notes.trim() || null,
  };
}

export function CalendarModule() {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.calendarRead);
  const [cursor, setCursor] = useState(() => new Date());
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detail, setDetail] = useState<CrmCalendarItem | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const range = useMemo(() => {
    const from = startOfDay(cells[0] ?? cursor);
    const last = cells[cells.length - 1] ?? cursor;
    const to = new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [cells, cursor]);

  useEffect(() => {
    if (sessionReady && allowed) void crm.loadCalendar(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, range.from, range.to]);

  const byDay = useMemo(() => {
    const grouped = new Map<string, CrmCalendarItem[]>();
    for (const item of crm.calendar.items) {
      const key = dayKey(new Date(item.at));
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    }
    return grouped;
  }, [crm.calendar.items]);

  const openCreate = (day?: Date) => {
    const start = day ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0) : new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setForm({
      title: "",
      startsAt: isoToLocalInput(start.toISOString()),
      endsAt: isoToLocalInput(end.toISOString()),
      notes: "",
    });
    setErrors({});
    setDialogOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      await crm.createCalendarEvent(toInput(form));
      setDialogOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            Previous
          </Button>
          <p className="min-w-[10rem] text-center font-display text-lg font-semibold">{monthLabel}</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            Next
          </Button>
        </div>
        {crm.hasPermission(CRM_PERMISSIONS.calendarCreate) ? (
          <Button type="button" className="rounded-xl" onClick={() => openCreate()}>
            Add event
          </Button>
        ) : null}
      </div>

      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.calendar.status}
        errorMessage={crm.calendar.errorMessage}
        empty={false}
        emptyLabel=""
        onRetry={() => void crm.loadCalendar(range)}
      >
        <div className="overflow-x-auto rounded-2xl border">
          <div className="grid min-w-[640px] grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid min-w-[640px] grid-cols-7">
            {cells.map((day) => {
              const items = byDay.get(dayKey(day)) ?? [];
              const outside = day.getMonth() !== cursor.getMonth();
              const canCreate = crm.hasPermission(CRM_PERMISSIONS.calendarCreate);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[7.5rem] border-b border-r p-2 text-left align-top",
                    outside && "bg-muted/30 text-muted-foreground",
                    canCreate && "cursor-pointer",
                  )}
                  onClick={(event) => {
                    if (!canCreate) return;
                    if ((event.target as HTMLElement).closest("button")) return;
                    openCreate(day);
                  }}
                >
                  <p className="mb-1 text-xs font-semibold">{day.getDate()}</p>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <button
                        key={`${item.kind}-${item.id}`}
                        type="button"
                        className="block w-full truncate rounded-md bg-primary/10 px-1.5 py-1 text-left text-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDetail(item);
                        }}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {crm.calendar.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No calendar items this month</p>
        ) : null}
      </ModuleStatus>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add event</DialogTitle>
            </DialogHeader>
            <Field id="event-title" label="Title" error={errors.title}>
              <Input
                id="event-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="event-start" label="Starts" error={errors.startsAt}>
              <Input
                id="event-start"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="event-end" label="Ends" error={errors.endsAt}>
              <Input
                id="event-end"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <Field id="event-notes" label="Notes">
              <Textarea
                id="event-notes"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="rounded-xl"
              />
            </Field>
            <DialogFooter>
              <Button type="submit" className="rounded-xl" disabled={busy}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent>
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle>{detail.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Type:</span> {KIND_LABELS[detail.kind]}
                </p>
                <p>
                  <span className="font-medium">Starts:</span> {formatDateTime(detail.at)}
                </p>
                {detail.endsAt ? (
                  <p>
                    <span className="font-medium">Ends:</span> {formatDateTime(detail.endsAt)}
                  </p>
                ) : null}
              </div>
              {detail.kind === "event" && crm.hasPermission(CRM_PERMISSIONS.calendarDelete) ? (
                <DialogFooter>
                  <Button type="button" variant="destructive" className="rounded-xl" onClick={() => setRemoveId(detail.id)}>
                    Remove event
                  </Button>
                </DialogFooter>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove event"
        description="This standalone meeting will be hidden from the calendar."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeCalendarEvent(removeId).finally(() => {
            setRemoveId(null);
            setDetail(null);
          });
        }}
      />
    </div>
  );
}
