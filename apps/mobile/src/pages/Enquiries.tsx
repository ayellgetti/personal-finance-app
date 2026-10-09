import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { FilterChips, type ChipOption } from "@/components/FilterChips";
import { CreateEnquirySheet } from "@/components/forms/CreateEnquirySheet";
import { LoadMore } from "@/components/LoadMore";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate, humanize, matchesQuery } from "@/lib/mobile/format";
import { listEnquiries, updateEnquiry } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import {
  CRM_ENQUIRY_STATUSES,
  CRM_PERMISSIONS,
  type CrmEnquiry,
  type CrmEnquiryStatus,
} from "@/types/crm";

const STATUS_FILTERS: ChipOption<CrmEnquiryStatus | "all">[] = [
  { value: "all", label: "All" },
  ...CRM_ENQUIRY_STATUSES.map((status) => ({ value: status, label: humanize(status) })),
];

function EnquiryRow({ enquiry, onOpen }: { enquiry: CrmEnquiry; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-secondary tap-highlight-none"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{enquiry.title}</span>
        <Badge
          variant={enquiry.status === "closed" ? "secondary" : "default"}
          className="shrink-0 rounded-lg text-[10px]"
        >
          {humanize(enquiry.status)}
        </Badge>
      </div>
      <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">{enquiry.source || "No source"}</span>
        <span aria-hidden>·</span>
        <span className="shrink-0">Due {formatDate(enquiry.dueDate)}</span>
      </p>
    </button>
  );
}

function EnquiryDetailSheet({
  enquiry,
  canUpdate,
  onClose,
  onUpdated,
}: {
  enquiry: CrmEnquiry | null;
  canUpdate: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const changeStatus = async (next: CrmEnquiryStatus) => {
    if (!enquiry) return;
    setBusy(true);
    try {
      await updateEnquiry(enquiry.id, { status: next });
      toast.success("Enquiry updated");
      onClose();
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update enquiry");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={Boolean(enquiry)} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl pb-safe">
        {enquiry ? (
          <div className="mx-auto w-full max-w-md space-y-4 pb-4">
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-lg">{enquiry.title}</SheetTitle>
              <SheetDescription>{humanize(enquiry.status)}</SheetDescription>
            </SheetHeader>

            <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Source</dt>
                <dd className="truncate text-sm font-medium">{enquiry.source || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Due</dt>
                <dd className="truncate text-sm font-medium">{formatDate(enquiry.dueDate)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Next follow-up</dt>
                <dd className="truncate text-sm font-medium">{formatDate(enquiry.nextFollowupDate)}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Value</dt>
                <dd className="truncate text-sm font-medium">
                  {enquiry.expectedValue == null ? "—" : enquiry.expectedValue.toLocaleString()}
                </dd>
              </div>
            </dl>

            {enquiry.notes ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {enquiry.notes}
              </p>
            ) : null}

            {canUpdate ? (
              <div className="space-y-2">
                <Label htmlFor="enquiry-status">Move to stage</Label>
                <Select
                  value={enquiry.status}
                  disabled={busy}
                  onValueChange={(next) => void changeStatus(next as CrmEnquiryStatus)}
                >
                  <SelectTrigger id="enquiry-status" className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_ENQUIRY_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {humanize(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default function Enquiries() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.enquiriesRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.enquiriesCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.enquiriesUpdate);

  const [status, setStatus] = useState<CrmEnquiryStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CrmEnquiry | null>(null);
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
        canUpdate={canUpdate}
        onClose={() => setSelected(null)}
        onUpdated={list.reload}
      />
      <CreateEnquirySheet open={createOpen} onOpenChange={setCreateOpen} onCreated={list.reload} />
    </div>
  );
}
