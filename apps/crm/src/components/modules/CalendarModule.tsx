import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmRemoveDialog,
  Field,
  ModulePage,
  ModuleStatus,
  RemoveAction,
  SideSheet,
} from "@/components/modules/shared";
import { ClientViewSheet } from "@/components/modules/ClientViewSheet";
import { formatDate, formatDateTime, isoToLocalInput, localInputToIso, toLocalDateKey } from "@/lib/crm/display";
import { listClients } from "@/lib/crm/remote";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CreateCalendarEventInput,
  type CrmCalendarItem,
  type CrmClient,
} from "@/types/crm";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KIND_LABELS: Record<CrmCalendarItem["kind"], string> = {
  task: "Task",
  event: "Event",
  booking: "Booked",
};

export type CalendarCreateTarget = "enquiries" | "clients" | "payments";

const CREATE_TARGETS: { target: CalendarCreateTarget; label: string; permission: string }[] = [
  { target: "enquiries", label: "Add enquiry", permission: CRM_PERMISSIONS.enquiriesCreate },
  { target: "clients", label: "Add booking", permission: CRM_PERMISSIONS.clientsCreate },
  { target: "payments", label: "Add payment", permission: CRM_PERMISSIONS.paymentsCreate },
];

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

function matchBookedClient(clients: CrmClient[], item: CrmCalendarItem): CrmClient | null {
  const byEnquiry = item.enquiryId
    ? clients.find((client) => client.convertedFromEnquiryId === item.enquiryId)
    : undefined;
  const byContact = item.contactId
    ? clients.find((client) => client.contactId === item.contactId)
    : undefined;
  return byEnquiry ?? byContact ?? null;
}

function toInput(form: FormState): CreateCalendarEventInput {
  return {
    title: form.title.trim(),
    startsAt: localInputToIso(form.startsAt),
    endsAt: localInputToIso(form.endsAt),
    notes: form.notes.trim() || null,
  };
}

export function CalendarModule({
  onOpenContact,
  onOpenPayments,
  onCreateFor,
}: {
  onOpenContact: (contactId: string) => void;
  onOpenPayments: (clientId: string) => void;
  onCreateFor?: (target: CalendarCreateTarget, date: string) => void;
}) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.calendarRead);
  const [cursor, setCursor] = useState(() => new Date());
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detail, setDetail] = useState<CrmCalendarItem | null>(null);
  const [viewingClient, setViewingClient] = useState<CrmClient | null>(null);
  const [removeTarget, setRemoveTarget] = useState<CrmCalendarItem | null>(null);
  const [createDay, setCreateDay] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);

  const createTargets = CREATE_TARGETS.filter((option) => crm.hasPermission(option.permission));
  const canPickDay = Boolean(onCreateFor) && createTargets.length > 0;

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

  const openItem = (item: CrmCalendarItem) => {
    if (item.kind !== "booking" || !crm.hasPermission(CRM_PERMISSIONS.clientsRead)) {
      setDetail(item);
      return;
    }
    void listClients({ limit: 100 })
      .then((page) => {
        const client = matchBookedClient(page.items, item);
        if (client) setViewingClient(client);
        else setDetail(item);
      })
      .catch(() => setDetail(item));
  };

  const openCreate = () => {
    const start = new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setForm({
      title: "",
      startsAt: isoToLocalInput(start.toISOString()),
      endsAt: isoToLocalInput(end.toISOString()),
      notes: "",
    });
    setErrors({});
    setSheetOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      await crm.createCalendarEvent(toInput(form));
      setSheetOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <ModulePage
      crumb="Calendar"
      toolbar={
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
      }
      actions={
        crm.hasPermission(CRM_PERMISSIONS.calendarCreate) ? (
          <Button type="button" className="rounded-xl" onClick={() => openCreate()}>
            Add event
          </Button>
        ) : null
      }
    >
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
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "min-h-[7.5rem] border-b border-r p-2 text-left align-top",
                    outside && "bg-muted/30 text-muted-foreground",
                    canPickDay && "cursor-pointer",
                  )}
                  onClick={(event) => {
                    if (!canPickDay) return;
                    if ((event.target as HTMLElement).closest("button")) return;
                    setCreateDay(day);
                  }}
                >
                  <p className="mb-1 text-xs font-semibold">{day.getDate()}</p>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <button
                        key={`${item.kind}-${item.id}`}
                        type="button"
                        className={cn(
                          "block w-full truncate rounded-md px-1.5 py-1 text-left text-xs",
                          item.kind === "booking"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-primary/10",
                        )}
                        onClick={(event) => {
                          event.stopPropagation();
                          openItem(item);
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

      <Dialog
        open={Boolean(createDay)}
        onOpenChange={(open) => {
          if (!open) setCreateDay(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{createDay ? formatDate(createDay.toISOString()) : "Add"}</DialogTitle>
            <DialogDescription>Pick what to add. The form opens in its own tab.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {createTargets.map((option) => (
              <Button
                key={option.target}
                type="button"
                variant="outline"
                className="justify-start rounded-xl"
                onClick={() => {
                  if (!createDay) return;
                  const date = toLocalDateKey(createDay);
                  setCreateDay(null);
                  onCreateFor?.(option.target, date);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Add event"
        onSubmit={onSubmit}
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            Create
          </Button>
        }
      >
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
      </SideSheet>

      <SideSheet
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title={detail?.title ?? "Event"}
        footer={
          detail && detail.kind !== "task" && crm.hasPermission(CRM_PERMISSIONS.calendarDelete) ? (
            <RemoveAction
              label={detail.kind === "booking" ? "Remove booking" : "Remove event"}
              onClick={() => setRemoveTarget(detail)}
            />
          ) : null
        }
      >
        {detail ? (
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
        ) : null}
      </SideSheet>

      <ClientViewSheet
        client={viewingClient}
        onClose={() => setViewingClient(null)}
        onOpenContact={(contactId) => {
          setViewingClient(null);
          onOpenContact(contactId);
        }}
        onOpenPayments={(clientId) => {
          setViewingClient(null);
          onOpenPayments(clientId);
        }}
      />

      <ConfirmRemoveDialog
        open={Boolean(removeTarget)}
        title={removeTarget?.kind === "booking" ? "Remove booking" : "Remove event"}
        description={
          removeTarget?.kind === "booking"
            ? "The enquiry linked to this booking is removed with it. A booking with a paid payment cannot be removed."
            : "This standalone meeting will be hidden from the calendar."
        }
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          void crm.removeCalendarEvent(removeTarget.id).finally(() => {
            setRemoveTarget(null);
            setDetail(null);
          });
        }}
      />
    </ModulePage>
  );
}
