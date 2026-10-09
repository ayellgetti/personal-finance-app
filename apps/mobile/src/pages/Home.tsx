import { useCallback, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { SearchBar } from "@/components/SearchBar";
import { SectionCard } from "@/components/SectionCard";
import { useAuth } from "@/lib/auth/store";
import { KIND_LABELS } from "@/lib/mobile/calendar";
import { endOfDayIso, formatDate, formatTime, humanize, matchesQuery, startOfDayIso } from "@/lib/mobile/format";
import { fetchDashboard, listCalendar } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useResource } from "@/lib/mobile/use-resource";
import { CRM_PERMISSIONS, type CrmCalendarItem, type CrmDashboard } from "@/types/crm";

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat-tile">
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
    </div>
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

function DueList({ dashboard, query }: { dashboard: CrmDashboard; query: string }) {
  const items = dashboard.customerDueItems.filter((item) => matchesQuery(query, item.title));
  if (items.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        {query.trim() ? "Nothing matches your search." : "Nothing is due today."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="min-w-0 truncate text-sm font-medium">{item.title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatDate(item.dueDate)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { permissions } = useMobile();

  const canReadDashboard = permissions.includes(CRM_PERMISSIONS.dashboardRead);
  const canReadCalendar = permissions.includes(CRM_PERMISSIONS.calendarRead);
  const [query, setQuery] = useState("");

  const dashboard = useResource(fetchDashboard, canReadDashboard);

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
        .filter(
          (item) =>
            new Date(item.at).getTime() >= Date.now() &&
            matchesQuery(query, item.title, item.notes, KIND_LABELS[item.kind]),
        )
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())[0],
    [agenda.data, query],
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
      <SearchBar value={query} onChange={setQuery} placeholder="Search your day" label="Search home" />

      <div>
        <p className="eyebrow">Today</p>
        <h2 className="font-display text-xl font-bold tracking-tight">
          Hi {user?.firstName || "there"}
        </h2>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatTile value={data.leadsGeneratedToday} label="New" />
        <StatTile value={data.customerDueToday} label="Due" />
        <StatTile value={data.followUpsToday} label="Calls" />
        <StatTile value={data.overdueFollowUps} label="Late" />
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
        <DueList dashboard={data} query={query} />
      </SectionCard>

      <SectionCard eyebrow="Pipeline" title="Enquiries" tone="neutral">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-muted-foreground">Open</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{data.enquiries.open}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Closed</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{data.enquiries.closed}</dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
