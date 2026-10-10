import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { FilterChips, type ChipOption } from "@/components/FilterChips";
import { ConvertEnquirySheet } from "@/components/forms/ConvertEnquirySheet";
import { CreateEnquirySheet } from "@/components/forms/CreateEnquirySheet";
import { CreateFollowUpSheet } from "@/components/forms/CreateFollowUpSheet";
import { EnquiryDetailSheet } from "@/components/records/EnquiryDetailSheet";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { formatDate, humanize, matchesQuery } from "@/lib/mobile/format";
import { listEnquiries } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import {
  CRM_ENQUIRY_STATUSES,
  CRM_PERMISSIONS,
  type CrmEnquiry,
  type CrmEnquiryStatus,
} from "@/types/crm";

type EnquiryFilter = CrmEnquiryStatus | "all" | "open";

const STATUS_FILTERS: ChipOption<EnquiryFilter>[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  ...CRM_ENQUIRY_STATUSES.map((status) => ({ value: status, label: humanize(status) })),
];

function readEnquiryFilter(value: string | null): EnquiryFilter {
  if (value === "open") return "open";
  if (value && (CRM_ENQUIRY_STATUSES as readonly string[]).includes(value)) {
    return value as CrmEnquiryStatus;
  }
  return "all";
}

function EnquiryRow({ enquiry, onOpen }: { enquiry: CrmEnquiry; onOpen: () => void }) {
  return (
    <ListRow
      title={enquiry.title}
      detail={enquiry.source || "No source"}
      value={formatDate(enquiry.dueDate)}
      badge={
        <Badge
          variant={enquiry.status === "closed" ? "secondary" : "default"}
          className="rounded-lg text-[10px]"
        >
          {humanize(enquiry.status)}
        </Badge>
      }
      onClick={onOpen}
    />
  );
}

export default function Enquiries() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.enquiriesRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.enquiriesCreate);

  const [params, setParams] = useSearchParams();
  const status = readEnquiryFilter(params.get("status"));
  const setStatus = (next: EnquiryFilter) => {
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        if (next === "all") nextParams.delete("status");
        else nextParams.set("status", next);
        return nextParams;
      },
      { replace: true },
    );
  };
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CrmEnquiry | null>(null);
  const [editing, setEditing] = useState<CrmEnquiry | null>(null);
  const [converting, setConverting] = useState<CrmEnquiry | null>(null);
  const [following, setFollowing] = useState<CrmEnquiry | null>(null);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);

  const load = useCallback(
    (page: number) =>
      listEnquiries({ page, limit: 20, status: status === "all" ? undefined : status }),
    [status],
  );

  const signature = useMemo(() => status, [status]);
  const list = usePagedList(load, signature, canRead);
  const visible = useMemo(
    () => list.items.filter((enquiry) => matchesQuery(query, enquiry.title, enquiry.source, enquiry.status)),
    [list.items, query],
  );

  if (!canRead) return <ForbiddenState label="enquiries" />;

  return (
    <div className="space-y-3">
      <SearchBar value={query} onChange={setQuery} placeholder="Search enquiries" label="Search enquiries" />
      <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} label="Filter by stage" />

      {list.status === "loading" ? <LoadingState label="Loading enquiries…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "ready" && visible.length === 0 ? <EmptyState label="No enquiries found." /> : null}

      {list.status === "ready" && visible.length > 0 ? (
        <div className="space-y-2">
          {visible.map((enquiry) => (
            <EnquiryRow key={enquiry.id} enquiry={enquiry} onOpen={() => setSelected(enquiry)} />
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <EnquiryDetailSheet
        enquiry={selected}
        permissions={permissions}
        onClose={() => setSelected(null)}
        onChanged={list.reload}
        onEdit={(enquiry) => {
          setSelected(null);
          setEditing(enquiry);
        }}
        onFollow={(enquiry) => {
          setSelected(null);
          setFollowing(enquiry);
        }}
        onConvert={(enquiry) => {
          setSelected(null);
          setConverting(enquiry);
        }}
      />
      <CreateEnquirySheet open={createOpen} onOpenChange={setCreateOpen} onCreated={list.reload} />
      <CreateEnquirySheet
        open={Boolean(editing)}
        enquiry={editing}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        onCreated={list.reload}
      />
      <CreateFollowUpSheet
        open={Boolean(following)}
        enquiry={following}
        day={new Date()}
        onOpenChange={(next) => {
          if (!next) setFollowing(null);
        }}
        onCreated={list.reload}
      />
      <ConvertEnquirySheet
        enquiry={converting}
        onOpenChange={(next) => {
          if (!next) setConverting(null);
        }}
        onConverted={list.reload}
      />
    </div>
  );
}
