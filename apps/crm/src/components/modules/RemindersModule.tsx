import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReminderFields } from "@/components/modules/ReminderFields";
import {
  ConfirmRemoveDialog,
  EditAction,
  MODULE_VIEWS,
  ModulePage,
  ModuleStatus,
  RemoveAction,
  RowActions,
  SideSheet,
} from "@/components/modules/shared";
import { formatDateTime, formatTime, toLocalDateKey } from "@/lib/crm/display";
import {
  EMPTY_REMINDER,
  reminderFormForDay,
  reminderFormFromRecord,
  toReminderInput,
  validateReminder,
  type ReminderFormState,
} from "@/lib/crm/reminder";
import { cn } from "@/lib/utils";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CrmCalendarEvent } from "@/types/crm";

type ViewMode = "table" | "card" | "calendar";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_CELL_ITEM_LIMIT = 3;

const VIEW_OPTIONS = [MODULE_VIEWS.table, MODULE_VIEWS.card, MODULE_VIEWS.calendar];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7));
}

function monthGrid(month: Date): Date[] {
  const start = startOfWeek(new Date(month.getFullYear(), month.getMonth(), 1));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function dayKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function ContactLink({
  contactId,
  name,
  onOpen,
}: {
  contactId: string | null;
  name: string;
  onOpen: (contactId: string) => void;
}) {
  if (!contactId) return <span>—</span>;
  return (
    <button
      type="button"
      className="text-left text-sm font-medium text-primary underline-offset-2 hover:underline"
      onClick={() => onOpen(contactId)}
    >
      {name}
    </button>
  );
}

function ReminderActions({
  reminder,
  onEdit,
  onRemove,
}: {
  reminder: CrmCalendarEvent;
  onEdit: (reminder: CrmCalendarEvent) => void;
  onRemove: (id: string) => void;
}) {
  const crm = useCrm();
  return (
    <RowActions>
      {crm.hasPermission(CRM_PERMISSIONS.calendarUpdate) ? (
        <EditAction onClick={() => onEdit(reminder)} />
      ) : null}
      {crm.hasPermission(CRM_PERMISSIONS.calendarDelete) ? (
        <RemoveAction onClick={() => onRemove(reminder.id)} />
      ) : null}
    </RowActions>
  );
}

function ReminderTable({
  items,
  contactName,
  onOpenContact,
  onEdit,
  onRemove,
}: {
  items: CrmCalendarEvent[];
  contactName: (id: string | null) => string;
  onOpenContact: (contactId: string) => void;
  onEdit: (reminder: CrmCalendarEvent) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Remind at</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((reminder) => (
            <TableRow key={reminder.id}>
              <TableCell className="font-medium">{reminder.title}</TableCell>
              <TableCell>{formatDateTime(reminder.startsAt)}</TableCell>
              <TableCell>
                <ContactLink
                  contactId={reminder.contactId}
                  name={contactName(reminder.contactId)}
                  onOpen={onOpenContact}
                />
              </TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {reminder.notes ?? "—"}
              </TableCell>
              <TableCell>
                <ReminderActions reminder={reminder} onEdit={onEdit} onRemove={onRemove} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReminderCards({
  items,
  contactName,
  onOpenContact,
  onEdit,
  onRemove,
}: {
  items: CrmCalendarEvent[];
  contactName: (id: string | null) => string;
  onOpenContact: (contactId: string) => void;
  onEdit: (reminder: CrmCalendarEvent) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((reminder) => (
        <Card key={reminder.id} className="rounded-2xl shadow-[var(--shadow-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base leading-snug">{reminder.title}</CardTitle>
            <CardDescription>{formatDateTime(reminder.startsAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Contact: </span>
              <ContactLink
                contactId={reminder.contactId}
                name={contactName(reminder.contactId)}
                onOpen={onOpenContact}
              />
            </p>
            {reminder.notes ? (
              <p className="line-clamp-3 text-sm text-muted-foreground">{reminder.notes}</p>
            ) : null}
            <ReminderActions reminder={reminder} onEdit={onEdit} onRemove={onRemove} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReminderCalendarView({
  items,
  cursor,
  canAdd,
  onSelectDay,
  onOpen,
}: {
  items: CrmCalendarEvent[];
  cursor: Date;
  canAdd: boolean;
  onSelectDay: (day: Date) => void;
  onOpen: (reminder: CrmCalendarEvent) => void;
}) {
  const cells = useMemo(() => monthGrid(cursor), [cursor]);
  const todayKey = dayKey(new Date());
  const byDay = useMemo(() => {
    const grouped = new Map<string, CrmCalendarEvent[]>();
    for (const item of items) {
      const key = dayKey(new Date(item.startsAt));
      const list = grouped.get(key) ?? [];
      list.push(item);
      grouped.set(key, list);
    }
    for (const list of grouped.values()) {
      list.sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
    }
    return grouped;
  }, [items]);

  return (
    <div className="rounded-2xl border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
        {WEEKDAYS.map((day) => (
          <div key={day} className="px-0.5 py-2 sm:px-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const key = dayKey(day);
          const dayItems = byDay.get(key) ?? [];
          const shown = dayItems.slice(0, MONTH_CELL_ITEM_LIMIT);
          const hiddenCount = dayItems.length - shown.length;
          const outside = day.getMonth() !== cursor.getMonth();
          const isToday = key === todayKey;
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[4.5rem] border-b border-r p-1 text-left align-top sm:min-h-[7.5rem] sm:p-2",
                outside && "bg-muted/30 text-muted-foreground",
                isToday && "bg-primary/5",
                canAdd && "cursor-pointer",
              )}
              onClick={(event) => {
                if (!canAdd) return;
                if ((event.target as HTMLElement).closest("button")) return;
                onSelectDay(day);
              }}
            >
              <p className={cn("mb-1 text-[11px] font-semibold sm:text-xs", isToday && "text-primary")}>
                {day.getDate()}
              </p>
              <div className="space-y-0.5 sm:space-y-1">
                {shown.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="block w-full truncate rounded-md bg-sky-100 px-1 py-0.5 text-left text-[10px] leading-tight text-sky-900 sm:px-1.5 sm:py-1 sm:text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(item);
                    }}
                  >
                    <span className="opacity-70">{formatTime(item.startsAt)} </span>
                    {item.title}
                  </button>
                ))}
                {hiddenCount > 0 ? (
                  <p className="truncate px-1 text-[10px] text-muted-foreground sm:px-1.5 sm:text-xs">
                    +{hiddenCount} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RemindersModule({
  onOpenContact,
  createOnDate,
  onCreateOpened,
}: {
  onOpenContact: (contactId: string) => void;
  createOnDate?: string | null;
  onCreateOpened?: () => void;
}) {
  const crm = useCrm();
  const sessionReady = crm.status === "ready";
  const allowed = crm.hasPermission(CRM_PERMISSIONS.calendarRead);
  const canLinkContact = crm.hasPermission(CRM_PERMISSIONS.contactsRead);
  const canAdd = crm.hasPermission(CRM_PERMISSIONS.calendarCreate);
  const [view, setView] = useState<ViewMode>("table");
  const [cursor, setCursor] = useState(() => new Date());
  const [form, setForm] = useState<ReminderFormState>(EMPTY_REMINDER);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<CrmCalendarEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => {
    void crm.loadReminders({ limit: 100 });
    if (canLinkContact) void crm.loadContacts({ limit: 100 });
  };

  useEffect(() => {
    if (sessionReady && allowed) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionReady, allowed, canLinkContact]);

  const openCreate = (dateKey?: string) => {
    setEditing(null);
    const day = dateKey ? new Date(`${dateKey}T00:00:00`) : new Date();
    setForm(reminderFormForDay(Number.isNaN(day.getTime()) ? new Date() : day));
    setErrors({});
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!createOnDate) return;
    openCreate(createOnDate);
    onCreateOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createOnDate]);

  const openEdit = (event: CrmCalendarEvent) => {
    setEditing(event);
    setForm(
      reminderFormFromRecord({
        title: event.title,
        notes: event.notes,
        at: event.startsAt,
        contactId: event.contactId,
      }),
    );
    setErrors({});
    setSheetOpen(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateReminder(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    try {
      const input = toReminderInput(form);
      if (editing) await crm.updateCalendarEvent(editing.id, input);
      else await crm.createCalendarEvent(input);
      setSheetOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setBusy(false);
    }
  };

  const contactName = (id: string | null) =>
    id ? (crm.contacts.items.find((contact) => contact.id === id)?.name ?? id) : "—";

  const monthItems = useMemo(() => {
    const month = cursor.getMonth();
    const year = cursor.getFullYear();
    return crm.reminders.items.filter((item) => {
      const at = new Date(item.startsAt);
      return at.getMonth() === month && at.getFullYear() === year;
    });
  }, [crm.reminders.items, cursor]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <ModulePage
      crumb="Reminders"
      view={view}
      onViewChange={(next) => setView(next as ViewMode)}
      viewOptions={VIEW_OPTIONS}
      actions={
        canAdd ? (
          <Button type="button" className="rounded-xl" onClick={() => openCreate()}>
            Add reminder
          </Button>
        ) : null
      }
      toolbar={
        view === "calendar" ? (
          <div className="flex w-full items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-xl"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-xl"
              aria-label="Next month"
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <p className="min-w-0 flex-1 truncate font-display text-base font-semibold sm:text-lg">
              {monthLabel}
            </p>
            <Button type="button" variant="outline" className="shrink-0 rounded-xl" onClick={() => setCursor(new Date())}>
              Today
            </Button>
          </div>
        ) : null
      }
    >
      <ModuleStatus
        sessionReady={sessionReady}
        allowed={allowed}
        status={crm.reminders.status}
        errorMessage={crm.reminders.errorMessage}
        empty={view === "calendar" ? false : crm.reminders.items.length === 0}
        emptyLabel="No reminders yet"
        onRetry={reload}
      >
        {view === "table" ? (
          <ReminderTable
            items={crm.reminders.items}
            contactName={contactName}
            onOpenContact={onOpenContact}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        ) : null}
        {view === "card" ? (
          <ReminderCards
            items={crm.reminders.items}
            contactName={contactName}
            onOpenContact={onOpenContact}
            onEdit={openEdit}
            onRemove={setRemoveId}
          />
        ) : null}
        {view === "calendar" ? (
          <>
            <ReminderCalendarView
              items={crm.reminders.items}
              cursor={cursor}
              canAdd={canAdd}
              onSelectDay={(day) => openCreate(toLocalDateKey(day))}
              onOpen={openEdit}
            />
            {monthItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reminders this month</p>
            ) : null}
          </>
        ) : null}
      </ModuleStatus>

      <SideSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit reminder" : "Add reminder"}
        description="A short title, optional description, and when to be reminded. Link a contact if this is about someone."
        onSubmit={onSubmit}
        footer={
          <Button type="submit" className="rounded-xl" disabled={busy}>
            {editing ? "Save" : "Create"}
          </Button>
        }
      >
        <ReminderFields
          form={form}
          errors={errors}
          contacts={crm.contacts.items}
          showContact={canLinkContact}
          onChange={setForm}
        />
      </SideSheet>

      <ConfirmRemoveDialog
        open={Boolean(removeId)}
        title="Remove reminder"
        description="This reminder will be hidden from the calendar and this list."
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          if (!removeId) return;
          void crm.removeCalendarEvent(removeId).finally(() => setRemoveId(null));
        }}
      />
    </ModulePage>
  );
}
