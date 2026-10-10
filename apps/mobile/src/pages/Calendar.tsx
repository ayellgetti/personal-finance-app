import { useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AgendaItem } from "@/components/calendar/AgendaItem";
import { CalendarItemSheet } from "@/components/calendar/CalendarItemSheet";
import { DaySheet } from "@/components/calendar/DaySheet";
import { MonthCategories } from "@/components/calendar/MonthCategories";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekList } from "@/components/calendar/WeekList";
import { ConvertEnquirySheet } from "@/components/forms/ConvertEnquirySheet";
import { CreateEnquirySheet } from "@/components/forms/CreateEnquirySheet";
import { CreateEventSheet } from "@/components/forms/CreateEventSheet";
import { CreateFollowUpSheet } from "@/components/forms/CreateFollowUpSheet";
import { CreatePaymentSheet } from "@/components/forms/CreatePaymentSheet";
import { CreateTaskSheet } from "@/components/forms/CreateTaskSheet";
import { EditClientSheet } from "@/components/forms/EditClientSheet";
import { QuickPaymentSheet } from "@/components/forms/QuickPaymentSheet";
import { QuickReminderSheet, type ReminderTarget } from "@/components/forms/QuickReminderSheet";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { ClientDetailSheet } from "@/components/records/ClientDetailSheet";
import { EnquiryDetailSheet } from "@/components/records/EnquiryDetailSheet";
import { PaymentDetailSheet } from "@/components/records/PaymentDetailSheet";
import { FilterSortBar, type FilterSection } from "@/components/FilterSortSheet";
import { Button } from "@/components/ui/button";
import {
  CALENDAR_VIEWS,
  CREATE_TARGETS,
  KIND_LABELS,
  MONTH_CATEGORIES,
  KIND_MARK_CLASSES,
  dayKey,
  groupByDay,
  itemsInMonth,
  monthBounds,
  rangeFor,
  rangeLabel,
  shiftCursor,
  startOfDay,
  visibleDays,
  type CalendarView,
  type CreateTarget,
  type MonthCategory,
} from "@/lib/mobile/calendar";
import { matchesQuery, personLine, toDateInputValue } from "@/lib/mobile/format";
import { compareText, compareTime, type SortOrder } from "@/lib/mobile/sort";
import { fetchEnquiry, listCalendar, listClients, listContacts, listPayments } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { useResource } from "@/lib/mobile/use-resource";
import { cn } from "@/lib/utils";
import {
  CRM_PERMISSIONS,
  type CrmCalendarItem,
  type CrmCalendarKind,
  type CrmClient,
  type CrmEnquiry,
  type CrmPayment,
  type CrmPaymentReferenceType,
} from "@/types/crm";

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

const LEGEND_KINDS: CrmCalendarKind[] = ["task", "event", "booking", "followup"];

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
      {LEGEND_KINDS.map((kind) => (
        <li key={kind} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className={KIND_MARK_CLASSES[kind]} aria-hidden />
          {KIND_LABELS[kind]}
        </li>
      ))}
    </ul>
  );
}

export default function Calendar() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.calendarRead);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [pickedDay, setPickedDay] = useState<Date | null>(null);
  const [category, setCategory] = useState<MonthCategory>("all");
  const [kind, setKind] = useState<CrmCalendarKind | "all">("all");
  const [sort, setSort] = useState<"time" | "title">("time");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [createFor, setCreateFor] = useState<{ target: CreateTarget; day: Date } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<CrmPayment | null>(null);
  const [editingPayment, setEditingPayment] = useState<CrmPayment | null>(null);
  const [paying, setPaying] = useState<{
    id: string;
    enquiryId: string | null;
    label: string;
    referenceType: CrmPaymentReferenceType;
  } | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<CrmEnquiry | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<CrmEnquiry | null>(null);
  const [following, setFollowing] = useState<{ id: string; title: string; stageSet?: "booked" } | null>(null);
  const [reminding, setReminding] = useState<ReminderTarget | null>(null);
  const [converting, setConverting] = useState<CrmEnquiry | null>(null);
  const [selectedClient, setSelectedClient] = useState<CrmClient | null>(null);
  const [editingClient, setEditingClient] = useState<CrmClient | null>(null);
  const [plainItem, setPlainItem] = useState<CrmCalendarItem | null>(null);

  const targets = useMemo(
    () =>
      CREATE_TARGETS.filter((option) => permissions.includes(option.permission)).map(
        (option) => option.target,
      ),
    [permissions],
  );

  // Add reminder in the header plus menu lands here with ?new=1.
  const [intentOpen, setIntentOpen] = useCreateIntent(targets.includes("reminder"));

  const days = useMemo(() => visibleDays(view, cursor), [view, cursor]);
  const range = useMemo(() => rangeFor(days, cursor), [days, cursor]);

  const canReadPayments = permissions.includes(CRM_PERMISSIONS.paymentsRead);
  const canCreatePayment = permissions.includes(CRM_PERMISSIONS.paymentsCreate);
  const canUpdatePayment = permissions.includes(CRM_PERMISSIONS.paymentsUpdate);
  const canDeletePayment = permissions.includes(CRM_PERMISSIONS.paymentsDelete);
  const canReadEnquiries = permissions.includes(CRM_PERMISSIONS.enquiriesRead);
  const canCreateReminder = permissions.includes(CRM_PERMISSIONS.calendarCreate);
  const canCreateFollowUp = permissions.includes(CRM_PERMISSIONS.followUpsCreate);
  const canReadClients = permissions.includes(CRM_PERMISSIONS.clientsRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canUpdateCalendar = permissions.includes(CRM_PERMISSIONS.calendarUpdate);
  const canDeleteCalendar = permissions.includes(CRM_PERMISSIONS.calendarDelete);
  const bounds = useMemo(() => monthBounds(cursor), [cursor]);
  const load = useCallback(async () => {
    const [calendar, payments] = await Promise.all([
      listCalendar(range),
      canReadPayments
        ? listPayments({ from: bounds.from, to: bounds.to, limit: 200 }).catch(() => null)
        : Promise.resolve(null),
    ]);
    return { items: calendar.items, payments: payments?.items ?? [] };
  }, [range, bounds, canReadPayments]);
  const feed = useResource(load, canRead, `${range.from}|${range.to}`);
  const loadClients = useCallback(() => listClients({ page: 1, limit: 100 }), []);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const clients = useResource(loadClients, canRead && canReadClients);
  const contacts = useResource(loadContacts, canRead && canReadContacts);
  const payeeFor = useCallback(
    (payment: CrmPayment) => {
      if (payment.referenceType === "vendor") {
        const vendor = contacts.data?.items.find((contact) => contact.id === payment.referenceId);
        return vendor ? { name: vendor.name, mobile: vendor.mobile } : null;
      }
      const client = clients.data?.items.find((item) => item.id === payment.referenceId);
      const contact = client
        ? contacts.data?.items.find((item) => item.id === client.contactId)
        : undefined;
      if (!contact && !client) return null;
      return { name: contact?.name || client?.billingName || "Booked", mobile: contact?.mobile ?? null };
    },
    [clients.data, contacts.data],
  );

  const openRecord = useCallback(
    async (item: CrmCalendarItem) => {
      setPickedDay(null);
      if (item.kind === "booking" && canReadClients) {
        let rows = clients.data?.items;
        if (!rows) {
          try {
            rows = (await listClients({ page: 1, limit: 100 })).items;
          } catch {
            rows = [];
          }
        }
        const match = rows.find((row) =>
          item.enquiryId
            ? row.convertedFromEnquiryId === item.enquiryId
            : Boolean(item.contactId) && row.contactId === item.contactId,
        );
        if (match) {
          setSelectedClient(match);
          return;
        }
      }
      const enquiryId = item.kind === "followup" ? item.id : item.enquiryId;
      if (enquiryId && canReadEnquiries) {
        try {
          setSelectedEnquiry(await fetchEnquiry(enquiryId));
          return;
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to open this record");
        }
      }
      setPlainItem(item);
    },
    [canReadClients, canReadEnquiries, clients.data],
  );

  const openItem = useCallback(
    async (item: CrmCalendarItem) => {
      if (item.kind === "booking" || item.kind === "event") {
        setPickedDay(null);
        setPlainItem(item);
        return;
      }
      await openRecord(item);
    },
    [openRecord],
  );

  const remindItem = useCallback((item: CrmCalendarItem) => {
    setPickedDay(null);
    setPlainItem(null);
    setSelectedEnquiry(null);
    setSelectedClient(null);
    setReminding({
      label: item.title,
      contactId: item.contactId,
      enquiryId: item.kind === "followup" ? item.id : item.enquiryId,
    });
  }, []);

  const followItem = useCallback((item: CrmCalendarItem) => {
    const enquiryId = item.kind === "followup" ? item.id : item.enquiryId;
    if (!enquiryId) return;
    setPickedDay(null);
    setPlainItem(null);
    setSelectedEnquiry(null);
    setSelectedClient(null);
    setFollowing({
      id: enquiryId,
      title: item.title,
      stageSet: item.kind === "booking" ? "booked" : undefined,
    });
  }, []);

  const remindPayment = useCallback(
    (payment: CrmPayment) => {
      const person = payeeFor(payment);
      const client =
        payment.referenceType === "client"
          ? clients.data?.items.find((item) => item.id === payment.referenceId)
          : undefined;
      setSelectedPayment(null);
      setReminding({
        label: personLine(person?.name ?? "Booked", person?.mobile),
        contactId: payment.referenceType === "vendor" ? payment.referenceId : (client?.contactId ?? null),
        enquiryId: payment.enquiryId,
      });
    },
    [clients.data, payeeFor],
  );

  const followPayment = useCallback(
    (payment: CrmPayment) => {
      const enquiryId =
        payment.enquiryId ??
        (payment.referenceType === "client"
          ? clients.data?.items.find((item) => item.id === payment.referenceId)?.convertedFromEnquiryId
          : null);
      if (!enquiryId) return;
      setSelectedPayment(null);
      setFollowing({
        id: enquiryId,
        title: payeeFor(payment)?.name ?? "This enquiry",
        stageSet: "booked",
      });
    },
    [clients.data, payeeFor],
  );

  const payTarget = useCallback(
    (payment: CrmPayment) => {
      const person = payeeFor(payment);
      return {
        id: payment.referenceId,
        enquiryId: payment.enquiryId,
        label: personLine(person?.name ?? "Booked", person?.mobile),
        referenceType: payment.referenceType,
      };
    },
    [payeeFor],
  );

  const visibleItems = useMemo(
    () =>
      (feed.data?.items ?? []).filter((item) => {
        if (kind !== "all" && item.kind !== kind) return false;
        return matchesQuery(query, item.title, item.notes, KIND_LABELS[item.kind]);
      }),
    [feed.data, kind, query],
  );
  const monthItems = useMemo(() => itemsInMonth(visibleItems, cursor), [visibleItems, cursor]);
  const byDay = useMemo(() => {
    const grouped = groupByDay(visibleItems);
    for (const list of grouped.values()) {
      list.sort((left, right) =>
        sort === "title" ? compareText(left.title, right.title, order) : compareTime(left.at, right.at, order),
      );
    }
    return grouped;
  }, [order, sort, visibleItems]);
  const filterSections = useMemo(() => {
    const next: FilterSection[] = [
      {
        id: "calendar-kind",
        kind: "single",
        label: "Kind",
        value: kind,
        neutral: "all",
        options: [
          { value: "all", label: "All" },
          ...LEGEND_KINDS.map((item) => ({ value: item, label: KIND_LABELS[item] })),
        ],
        onChange: (nextKind) => setKind(nextKind as CrmCalendarKind | "all"),
      },
    ];
    if (view === "month") {
      next.push({
        id: "calendar-category",
        kind: "single",
        label: "Month list",
        value: canReadPayments || category !== "payment" ? category : "all",
        neutral: "all",
        options: MONTH_CATEGORIES.filter((item) => canReadPayments || item.id !== "payment").map((item) => ({
          value: item.id,
          label: item.label,
        })),
        onChange: (nextCategory) => setCategory(nextCategory as MonthCategory),
      });
    }
    return next;
  }, [canReadPayments, category, kind, view]);

  if (!canRead) return <ForbiddenState label="the calendar" />;

  const changeView = (next: CalendarView) => {
    setView(next);
    // Leaving month view on the current month should land on today, not the 1st.
    const today = new Date();
    if (next !== "month" && cursor.getMonth() === today.getMonth() && cursor.getFullYear() === today.getFullYear()) {
      setCursor(startOfDay(today));
    }
  };

  const openDay = (day: Date) => setPickedDay(startOfDay(day));

  const pickTarget = (target: CreateTarget) => {
    const day = pickedDay;
    if (!day) return;
    setPickedDay(null);
    setCreateFor({ target, day });
  };

  const closeCreate = (next: boolean) => {
    if (!next) setCreateFor(null);
  };

  const dayItems = pickedDay ? (byDay.get(dayKey(pickedDay)) ?? []) : [];
  const agenda = byDay.get(dayKey(cursor)) ?? [];
  const createDay = createFor?.day ?? cursor;
  const reminderOpen = createFor?.target === "reminder" || intentOpen;

  return (
    <div className="space-y-3">
      <FilterSortBar
        query={query}
        onQuery={setQuery}
        searchPlaceholder="Search this view"
        searchLabel="Search calendar"
        sort={sort}
        onSort={(next) => setSort(next as "time" | "title")}
        sortOptions={[
          { value: "time", label: "Time" },
          { value: "title", label: "Title" },
        ]}
        defaultSort="time"
        order={order}
        onOrder={setOrder}
        defaultOrder="asc"
        sections={filterSections}
        resultCount={view === "month" ? monthItems.length : visibleItems.length}
        singular="event"
        plural="events"
        onClear={() => {
          setKind("all");
          setCategory("all");
        }}
      />

      <div role="tablist" aria-label="Calendar view" className="flex rounded-xl bg-secondary p-1">
        {CALENDAR_VIEWS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={view === option}
            onClick={() => changeView(option)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors tap-highlight-none",
              view === option
                ? "bg-card text-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground",
            )}
          >
            {VIEW_LABELS[option]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Previous ${view}`}
          className="h-9 w-9 rounded-xl"
          onClick={() => setCursor(shiftCursor(view, cursor, -1))}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">{rangeLabel(view, days, cursor)}</p>
          <button
            type="button"
            className="text-[11px] text-primary tap-highlight-none"
            onClick={() => setCursor(startOfDay(new Date()))}
          >
            Today
          </button>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Next ${view}`}
          className="h-9 w-9 rounded-xl"
          onClick={() => setCursor(shiftCursor(view, cursor, 1))}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Button>
      </div>

      <Legend />

      {feed.status === "error" ? (
        <ErrorState message={feed.errorMessage} onRetry={feed.reload} />
      ) : (
        <>
          {/* The grid stays mounted while a range reloads, so paging does not flash. */}
          {feed.status === "loading" ? <LoadingState label="Loading calendar…" /> : null}

          {view === "month" ? (
            <>
              <MonthGrid
                days={days}
                cursor={cursor}
                byDay={byDay}
                selectedKey={pickedDay ? dayKey(pickedDay) : null}
                onSelect={openDay}
              />
              {feed.status === "ready" ? (
                <MonthCategories
                  category={canReadPayments || category !== "payment" ? category : "all"}
                  onCategory={setCategory}
                  items={monthItems}
                  payments={feed.data?.payments ?? []}
                  query={query}
                  showPayments={canReadPayments}
                  payeeFor={payeeFor}
                  onOpenItem={(item) => void openItem(item)}
                  onOpenPayment={setSelectedPayment}
                  onRemindItem={canCreateReminder ? remindItem : undefined}
                  onFollowItem={canCreateFollowUp ? followItem : undefined}
                  onRemindPayment={canCreateReminder ? remindPayment : undefined}
                  onFollowPayment={canCreateFollowUp ? followPayment : undefined}
                  enquiryIdFor={(payment) =>
                    payment.enquiryId ??
                    (payment.referenceType === "client"
                      ? clients.data?.items.find((item) => item.id === payment.referenceId)?.convertedFromEnquiryId ??
                        null
                      : null)
                  }
                />
              ) : null}
            </>
          ) : null}

          {view === "week" ? (
            <WeekList
              days={days}
              byDay={byDay}
              canAdd={targets.length > 0}
              onAdd={openDay}
              onOpen={(item) => void openItem(item)}
              onRemind={canCreateReminder ? remindItem : undefined}
              onFollow={canCreateFollowUp ? followItem : undefined}
            />
          ) : null}

          {view === "day" ? (
            agenda.length === 0 ? (
              feed.status === "ready" ? <EmptyState label="Nothing scheduled for this day." /> : null
            ) : (
              <ul className="space-y-2">
                {agenda.map((item) => (
                  <li key={`${item.kind}-${item.id}`}>
                    <AgendaItem
                      item={item}
                      onOpen={() => void openItem(item)}
                      onRemind={canCreateReminder ? () => remindItem(item) : undefined}
                      onFollow={canCreateFollowUp ? () => followItem(item) : undefined}
                    />
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {view === "day" && targets.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl text-sm"
              onClick={() => setPickedDay(startOfDay(cursor))}
            >
              Add on this day
            </Button>
          ) : null}
        </>
      )}

      <DaySheet
        day={pickedDay}
        items={dayItems}
        targets={targets}
        onOpenChange={(next) => {
          if (!next) setPickedDay(null);
        }}
        onPick={pickTarget}
        onOpen={(item) => void openItem(item)}
        onRemind={canCreateReminder ? remindItem : undefined}
        onFollow={canCreateFollowUp ? followItem : undefined}
      />

      <CreateEventSheet
        open={reminderOpen}
        onOpenChange={(next) => {
          closeCreate(next);
          if (!next && intentOpen) setIntentOpen(false);
        }}
        day={createDay}
        onCreated={feed.reload}
      />
      <CreateEnquirySheet
        open={createFor?.target === "enquiry"}
        onOpenChange={closeCreate}
        defaultDate={toDateInputValue(createDay)}
        onCreated={feed.reload}
      />
      <CreateFollowUpSheet
        open={createFor?.target === "followUp"}
        onOpenChange={closeCreate}
        day={createDay}
        onCreated={feed.reload}
      />
      <CreateTaskSheet
        open={createFor?.target === "task"}
        onOpenChange={closeCreate}
        day={createDay}
        onCreated={feed.reload}
      />

      <PaymentDetailSheet
        payment={selectedPayment}
        payee={selectedPayment ? (payeeFor(selectedPayment)?.name ?? "Booked") : ""}
        mobile={selectedPayment ? (payeeFor(selectedPayment)?.mobile ?? null) : null}
        canUpdate={canUpdatePayment}
        canDelete={canDeletePayment}
        canCreate={canCreatePayment}
        onClose={() => setSelectedPayment(null)}
        onEdit={(payment) => {
          setSelectedPayment(null);
          setEditingPayment(payment);
        }}
        onAdd={(payment) => {
          setSelectedPayment(null);
          setPaying(payTarget(payment));
        }}
        onRemind={canCreateReminder ? remindPayment : undefined}
        onFollow={
          canCreateFollowUp &&
          selectedPayment &&
          (selectedPayment.enquiryId ||
            (selectedPayment.referenceType === "client" &&
              clients.data?.items.find((item) => item.id === selectedPayment.referenceId)?.convertedFromEnquiryId))
            ? followPayment
            : undefined
        }
        onRemoved={feed.reload}
      />
      <QuickPaymentSheet
        client={paying}
        onOpenChange={(next) => {
          if (!next) setPaying(null);
        }}
        onCreated={feed.reload}
      />
      <CreatePaymentSheet
        open={Boolean(editingPayment)}
        payment={editingPayment}
        onOpenChange={(next) => {
          if (!next) setEditingPayment(null);
        }}
        onCreated={feed.reload}
      />
      <EnquiryDetailSheet
        enquiry={selectedEnquiry}
        permissions={permissions}
        onClose={() => setSelectedEnquiry(null)}
        onChanged={feed.reload}
        onEdit={(enquiry) => {
          setSelectedEnquiry(null);
          setEditingEnquiry(enquiry);
        }}
        onFollow={(enquiry) => {
          setSelectedEnquiry(null);
          setFollowing(enquiry);
        }}
        onRemind={
          canCreateReminder
            ? (enquiry) => {
                setSelectedEnquiry(null);
                setReminding({
                  label: enquiry.title,
                  contactId: enquiry.contactId,
                  enquiryId: enquiry.id,
                });
              }
            : undefined
        }
        onConvert={(enquiry) => {
          setSelectedEnquiry(null);
          setConverting(enquiry);
        }}
      />
      <CreateEnquirySheet
        open={Boolean(editingEnquiry)}
        enquiry={editingEnquiry}
        onOpenChange={(next) => {
          if (!next) setEditingEnquiry(null);
        }}
        onCreated={feed.reload}
      />
      <CreateFollowUpSheet
        open={Boolean(following)}
        enquiry={following}
        stageSet={following?.stageSet ?? "pipeline"}
        day={new Date()}
        onOpenChange={(next) => {
          if (!next) setFollowing(null);
        }}
        onCreated={feed.reload}
      />
      <ConvertEnquirySheet
        enquiry={converting}
        onOpenChange={(next) => {
          if (!next) setConverting(null);
        }}
        onConverted={feed.reload}
      />
      <ClientDetailSheet
        client={selectedClient}
        permissions={permissions}
        onClose={() => setSelectedClient(null)}
        onEdit={(client) => {
          setSelectedClient(null);
          setEditingClient(client);
        }}
        onRemind={
          canCreateReminder
            ? (client) => {
                const contact = contacts.data?.items.find((item) => item.id === client.contactId);
                setSelectedClient(null);
                setReminding({
                  label: personLine(contact?.name || client.billingName, contact?.mobile),
                  contactId: client.contactId,
                  enquiryId: client.convertedFromEnquiryId,
                });
              }
            : undefined
        }
        onFollow={
          canCreateFollowUp
            ? (client) => {
                if (!client.convertedFromEnquiryId) return;
                setSelectedClient(null);
                setFollowing({
                  id: client.convertedFromEnquiryId,
                  title: client.billingName,
                  stageSet: "booked",
                });
              }
            : undefined
        }
      />
      <EditClientSheet
        client={editingClient}
        onOpenChange={(next) => {
          if (!next) setEditingClient(null);
        }}
        onSaved={() => {
          clients.reload();
          feed.reload();
        }}
      />
      <CalendarItemSheet
        item={plainItem}
        onClose={() => setPlainItem(null)}
        canUpdate={canUpdateCalendar}
        canDelete={canDeleteCalendar}
        onChanged={() => {
          feed.reload();
          clients.reload();
        }}
        onOpenRecord={(item) => {
          setPlainItem(null);
          void openRecord(item);
        }}
        onRemind={canCreateReminder ? remindItem : undefined}
        onFollow={canCreateFollowUp ? followItem : undefined}
      />
      <QuickReminderSheet
        target={reminding}
        onOpenChange={(next) => {
          if (!next) setReminding(null);
        }}
        onCreated={feed.reload}
      />
    </div>
  );
}
