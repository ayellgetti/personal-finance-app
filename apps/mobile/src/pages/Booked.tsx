import { useCallback, useMemo, useState } from "react";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { EditClientSheet } from "@/components/forms/EditClientSheet";
import { ClientDetailSheet } from "@/components/records/ClientDetailSheet";
import { ListRow } from "@/components/ListRow";
import { LoadMore } from "@/components/LoadMore";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime, formatTime, humanize } from "@/lib/mobile/format";
import { listClients, listContacts, listEnquiries } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useResource } from "@/lib/mobile/use-resource";
import { CRM_PERMISSIONS, type CrmClient } from "@/types/crm";

function bookingParts(startsAt: string | null, endsAt: string | null): { value: string; when: string | null } {
  if (!startsAt) return { value: "Dates not set", when: null };
  if (!endsAt) return { value: formatDate(startsAt), when: formatTime(startsAt) };
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (start.toDateString() === end.toDateString()) {
    return { value: formatDate(startsAt), when: `${formatTime(startsAt)} – ${formatTime(endsAt)}` };
  }
  return { value: formatDate(startsAt), when: `Until ${formatDateTime(endsAt)}` };
}

function ClientRow({
  client,
  contactLine,
  enquiryTitle,
  onOpen,
}: {
  client: CrmClient;
  contactLine: string | null;
  enquiryTitle: string | null;
  onOpen: () => void;
}) {
  const { value, when } = bookingParts(client.startsAt, client.endsAt);
  const detail = [when, contactLine, enquiryTitle, client.gstin].filter(Boolean).join(" · ");

  return (
    <ListRow
      title={client.billingName}
      detail={detail || null}
      value={value}
      badge={
        <Badge variant="secondary" className="rounded-lg bg-emerald-500/15 text-[10px] text-emerald-700 dark:text-emerald-300">
          {humanize(client.status)}
        </Badge>
      }
      onClick={onOpen}
    />
  );
}

export default function Booked() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.clientsRead);
  const canReadContacts = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canReadEnquiries = permissions.includes(CRM_PERMISSIONS.enquiriesRead);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CrmClient | null>(null);
  const [editing, setEditing] = useState<CrmClient | null>(null);
  const search = useDebounced(query, 300);

  const load = useCallback(
    (page: number) => listClients({ page, limit: 20, search: search || undefined }),
    [search],
  );
  const signature = useMemo(() => search, [search]);
  const list = usePagedList(load, signature, canRead);
  const loadContacts = useCallback(() => listContacts({ page: 1, limit: 100 }), []);
  const loadEnquiries = useCallback(() => listEnquiries({ page: 1, limit: 100 }), []);
  const contacts = useResource(loadContacts, canRead && canReadContacts);
  const enquiries = useResource(loadEnquiries, canRead && canReadEnquiries);

  if (!canRead) return <ForbiddenState label="booked clients" />;

  return (
    <div className="space-y-3">
      <SearchBar value={query} onChange={setQuery} placeholder="Search bookings" label="Search bookings" />

      {list.status === "loading" ? <LoadingState label="Loading bookings…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "ready" && list.items.length === 0 ? <EmptyState label="No bookings found." /> : null}

      {list.status === "ready" && list.items.length > 0 ? (
        <div className="space-y-2">
          {list.items.map((client) => (
            <ClientRow
              key={client.id}
              client={client}
              contactLine={
                contacts.data?.items.find((contact) => contact.id === client.contactId)?.mobile ?? null
              }
              enquiryTitle={
                enquiries.data?.items.find((enquiry) => enquiry.id === client.convertedFromEnquiryId)?.title ??
                null
              }
              onOpen={() => setSelected(client)}
            />
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <ClientDetailSheet
        client={selected}
        permissions={permissions}
        onClose={() => setSelected(null)}
        onEdit={(client) => {
          setSelected(null);
          setEditing(client);
        }}
      />
      <EditClientSheet
        client={editing}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
        onSaved={list.reload}
      />
    </div>
  );
}
