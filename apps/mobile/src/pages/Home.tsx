import { useCallback, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { SectionCard } from "@/components/SectionCard";
import { useAuth } from "@/lib/auth/store";
import {
  endOfDayIso,
  formatDate,
  formatMoney,
  formatTime,
  humanize,
  paymentTypeClass,
  startOfDayIso,
} from "@/lib/mobile/format";
import { fetchDashboard, listCalendar, listClients } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useResource } from "@/lib/mobile/use-resource";
import {
  CRM_CONTACT_TYPES,
  CRM_PERMISSIONS,
  CRM_TASK_STATUSES,
  type CrmCalendarItem,
  type CrmDashboard,
} from "@/types/crm";

function StatTile({ value, label, to }: { value: number; label: string; to?: string }) {
  const body = (
    <>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
    </>
  );
  if (!to) return <div className="stat-tile">{body}</div>;
  return (
    <Link to={to} className="stat-tile block tap-highlight-none">
      {body}
    </Link>
  );
}

function NextUpCard({ item }: { item: CrmCalendarItem }) {
  return (
    <Link
      to="/calendar"
      className="flex items-center gap-3 rounded-2xl bg-gradient-hero px-4 py-4 text-primary-foreground shadow-[var(--shadow-card)] tap-highlight-none"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="tabular-nums">{formatTime(item.at)}</span>
          <span className="truncate">{item.title}</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-primary-foreground/70">
          {formatDate(item.at)} · {humanize(item.kind)}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-primary-foreground/80" aria-hidden />
    </Link>
  );
}

function PipelineCounts({
  openCount,
  bookedCount,
  bookedLoading,
  canOpenEnquiries,
  canOpenBooked,
}: {
  openCount: number;
  bookedCount: number | null;
  bookedLoading: boolean;
  canOpenEnquiries: boolean;
  canOpenBooked: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <PipelineCount
        label="Open"
        value={openCount}
        to={canOpenEnquiries ? "/enquiries?status=open" : null}
      />
      <PipelineCount
        label="Booked"
        value={bookedLoading ? null : bookedCount}
        to={canOpenBooked ? "/booked" : null}
      />
    </div>
  );
}

function PipelineCount({
  label,
  value,
  to,
}: {
  label: string;
  value: number | null;
  to: string | null;
}) {
  const body = (
    <>
      <p className="font-display text-xl font-bold tabular-nums">{value ?? "—"}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </>
  );
  const className =
    "rounded-xl border border-border bg-background px-3 py-3 text-left transition-colors tap-highlight-none";
  if (!to) return <div className={className}>{body}</div>;
  return (
    <Link to={to} className={`${className} hover:bg-secondary`}>
      {body}
    </Link>
  );
}

function PaymentTotal({
  label,
  amount,
  tone,
  to,
}: {
  label: string;
  amount: string;
  tone: string;
  to: string | null;
}) {
  const body = (
    <>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-display text-lg font-bold tabular-nums ${tone}`}>{amount}</p>
    </>
  );
  const className = "rounded-xl border border-border bg-background px-3 py-3 text-left tap-highlight-none";
  if (!to) return <div className={className}>{body}</div>;
  return (
    <Link to={to} className={`${className} hover:bg-secondary`}>
      {body}
    </Link>
  );
}

function DueList({ dashboard, canOpen }: { dashboard: CrmDashboard; canOpen: boolean }) {
  const items = dashboard.customerDueItems;
  if (items.length === 0) {
    return <p className="py-2 text-sm text-muted-foreground">Nothing is due today.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="min-w-0 truncate text-sm font-medium">{item.title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.dueDate)}</span>
        </li>
      ))}
      {canOpen ? (
        <li className="pt-2.5">
          <Link to="/enquiries?due=today" className="text-xs font-semibold text-primary hover:underline">
            All due today
          </Link>
        </li>
      ) : null}
    </ul>
  );
}

function CountRows({ rows }: { rows: { key: string; label: string; value: number; to?: string }[] }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => {
        const body = (
          <>
            <span className="text-sm">{row.label}</span>
            <span className="font-display text-sm font-bold tabular-nums">{row.value}</span>
          </>
        );
        return (
          <li key={row.key}>
            {row.to ? (
              <Link
                to={row.to}
                className="flex items-center justify-between gap-3 py-2.5 tap-highlight-none hover:text-primary"
              >
                {body}
              </Link>
            ) : (
              <div className="flex items-center justify-between gap-3 py-2.5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { permissions } = useMobile();

  const canReadDashboard = permissions.includes(CRM_PERMISSIONS.dashboardRead);
  const canReadCalendar = permissions.includes(CRM_PERMISSIONS.calendarRead);
  const canReadEnquiries = permissions.includes(CRM_PERMISSIONS.enquiriesRead);
  const canReadClients = permissions.includes(CRM_PERMISSIONS.clientsRead);
  const canReadFollowUps = permissions.includes(CRM_PERMISSIONS.followUpsRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canReadPayments = permissions.includes(CRM_PERMISSIONS.paymentsRead);
  const canReadTasks = permissions.includes(CRM_PERMISSIONS.tasksRead);

  const dashboard = useResource(fetchDashboard, canReadDashboard);
  const loadBooked = useCallback(() => listClients({ page: 1, limit: 1 }), []);
  const booked = useResource(loadBooked, canReadClients);

  const loadAgenda = useCallback(() => {
    const now = new Date();
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 7);
    return listCalendar({ from: startOfDayIso(now), to: endOfDayIso(horizon) });
  }, []);
  const agenda = useResource(loadAgenda, canReadCalendar);

  const nextUp = useMemo(
    () =>
      agenda.data?.items
        .filter((item) => new Date(item.at).getTime() >= Date.now())
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())[0],
    [agenda.data],
  );

  if (!canReadDashboard) return <ForbiddenState label="the dashboard" />;
  if (dashboard.status === "loading") return <LoadingState label="Loading your day…" />;
  if (dashboard.status === "error") {
    return <ErrorState message={dashboard.errorMessage} onRetry={dashboard.reload} />;
  }
  if (!dashboard.data) return <ForbiddenState label="the dashboard" />;

  const data = dashboard.data;

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Today</p>
        <h2 className="font-display text-xl font-bold tracking-tight">
          Hi {user?.firstName || "there"}
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatTile
          value={data.leadsGeneratedToday}
          label="New"
          to={canReadEnquiries ? "/enquiries?status=new" : undefined}
        />
        <StatTile
          value={data.customerDueToday}
          label="Due"
          to={canReadEnquiries ? "/enquiries?due=today" : undefined}
        />
        <StatTile
          value={data.followUpsToday}
          label="Calls"
          to={canReadFollowUps ? "/follow-ups?when=today" : undefined}
        />
        <StatTile
          value={data.overdueFollowUps}
          label="Late"
          to={canReadFollowUps ? "/follow-ups?when=overdue" : undefined}
        />
      </div>

      {canReadCalendar ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Next up</p>
            <Link to="/calendar" className="text-xs font-semibold text-primary hover:underline">
              Full agenda
            </Link>
          </div>
          {agenda.status === "loading" ? (
            <div className="h-[72px] animate-pulse rounded-2xl bg-muted" />
          ) : nextUp ? (
            <NextUpCard item={nextUp} />
          ) : (
            <p className="rounded-2xl border border-border bg-card px-4 py-5 text-center text-sm text-muted-foreground">
              Nothing scheduled in the next 7 days.
            </p>
          )}
        </div>
      ) : null}

      <SectionCard eyebrow="Pipeline" title="Due today" tone="primary">
        <DueList dashboard={data} canOpen={canReadEnquiries} />
      </SectionCard>

      <SectionCard eyebrow="Pipeline" title="Open and booked" tone="neutral">
        <PipelineCounts
          openCount={data.enquiries.open}
          bookedCount={booked.data?.pagination.total ?? null}
          bookedLoading={booked.status === "loading"}
          canOpenEnquiries={canReadEnquiries}
          canOpenBooked={canReadClients}
        />
        {canReadEnquiries ? (
          <Link to="/enquiries?status=closed" className="mt-3 block text-xs font-semibold text-primary hover:underline">
            {data.enquiries.closed} closed enquiries
          </Link>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">{data.enquiries.closed} closed enquiries</p>
        )}
      </SectionCard>

      <SectionCard eyebrow="This month" title="Payments" tone="neutral">
        <div className="grid grid-cols-2 gap-3">
          <PaymentTotal
            label="Income"
            amount={formatMoney(data.paymentsIncomeThisMonth, "INR")}
            tone={paymentTypeClass("INCOME")}
            to={canReadPayments ? "/payments?type=INCOME&month=current" : null}
          />
          <PaymentTotal
            label="Expense"
            amount={formatMoney(data.paymentsExpenseThisMonth, "INR")}
            tone={paymentTypeClass("EXPENSE")}
            to={canReadPayments ? "/payments?type=EXPENSE&month=current" : null}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {data.paymentsPaidThisMonth} paid payment{data.paymentsPaidThisMonth === 1 ? "" : "s"}
          {canReadPayments ? (
            <>
              {" · "}
              <Link to="/payments" className="font-semibold text-primary hover:underline">
                View payments
              </Link>
            </>
          ) : null}
        </p>
      </SectionCard>

      <SectionCard eyebrow="People" title="Contacts by type" tone="neutral">
        <CountRows
          rows={CRM_CONTACT_TYPES.map((type) => ({
            key: type,
            label: humanize(type),
            value: data.contactsByType[type] ?? 0,
            to: canReadContacts ? `/contacts?type=${type}` : undefined,
          }))}
        />
      </SectionCard>

      <SectionCard eyebrow="Work" title="Tasks by status" tone="neutral">
        <CountRows
          rows={CRM_TASK_STATUSES.map((status) => ({
            key: status,
            label: humanize(status),
            value: data.tasksByStatus[status] ?? 0,
            to: canReadTasks ? `/tasks?status=${status}` : undefined,
          }))}
        />
      </SectionCard>
    </div>
  );
}
