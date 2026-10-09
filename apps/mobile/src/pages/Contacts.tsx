import { FormEvent, useCallback, useMemo, useState } from "react";
import { Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { FilterChips, type ChipOption } from "@/components/FilterChips";
import { LoadMore } from "@/components/LoadMore";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { humanize } from "@/lib/mobile/format";
import { createContact, listContacts } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { CRM_PERMISSIONS, CRM_CONTACT_TYPES, type CrmContact, type CrmContactType } from "@/types/crm";

const TYPE_FILTERS: ChipOption<CrmContactType | "all">[] = [
  { value: "all", label: "All" },
  ...CRM_CONTACT_TYPES.map((type) => ({ value: type, label: humanize(type) })),
];

function ContactRow({ contact, onOpen }: { contact: CrmContact; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-secondary tap-highlight-none"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold text-primary">
        {contact.name.slice(0, 1).toUpperCase() || "?"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{contact.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {contact.companyName || contact.mobile}
        </span>
      </span>
      <Badge variant="secondary" className="shrink-0 rounded-lg text-[10px]">
        {humanize(contact.type)}
      </Badge>
    </button>
  );
}

function ContactDetailSheet({
  contact,
  onClose,
}: {
  contact: CrmContact | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(contact)} onOpenChange={(next) => (next ? undefined : onClose())}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-safe">
        {contact ? (
          <div className="mx-auto w-full max-w-tablet space-y-4 pb-4">
            <SheetHeader className="text-left">
              <SheetTitle className="font-display text-lg">{contact.name}</SheetTitle>
              <SheetDescription>{humanize(contact.type)}</SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="h-11 rounded-xl">
                <a href={`tel:${contact.mobile}`}>
                  <Phone className="h-4 w-4" aria-hidden />
                  Call
                </a>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl" disabled={!contact.email}>
                <a href={`mailto:${contact.email ?? ""}`}>
                  <Mail className="h-4 w-4" aria-hidden />
                  Email
                </a>
              </Button>
            </div>

            <dl className="divide-y divide-border rounded-2xl border border-border bg-card px-4">
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Mobile</dt>
                <dd className="truncate text-sm font-medium">{contact.mobile}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Email</dt>
                <dd className="truncate text-sm font-medium">{contact.email || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Company</dt>
                <dd className="truncate text-sm font-medium">{contact.companyName || "—"}</dd>
              </div>
            </dl>

            {contact.notes ? (
              <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {contact.notes}
              </p>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CreateContactSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [type, setType] = useState<CrmContactType>("lead");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName("");
    setMobile("");
    setType("lead");
    setEmail("");
    setCompanyName("");
    setNotes("");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await createContact({
        name,
        mobile,
        type,
        email: email || null,
        companyName: companyName || null,
        notes: notes || null,
      });
      toast.success("Contact created");
      reset();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create contact");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl pb-safe">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-tablet space-y-4 pb-4">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-lg">New contact</SheetTitle>
            <SheetDescription>Add a lead, client, or vendor.</SheetDescription>
          </SheetHeader>

          <div className="space-y-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl text-base"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-mobile">Mobile</Label>
            <Input
              id="contact-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="h-11 rounded-xl text-base"
              inputMode="tel"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-type">Type</Label>
            <Select value={type} onValueChange={(next) => setType(next as CrmContactType)}>
              <SelectTrigger id="contact-type" className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CRM_CONTACT_TYPES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {humanize(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl text-base"
              inputMode="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-company">Company</Label>
            <Input
              id="contact-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="h-11 rounded-xl text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-notes">Notes</Label>
            <Textarea
              id="contact-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl text-base"
              rows={3}
            />
          </div>

          <Button type="submit" className="h-12 w-full rounded-xl text-base" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Create contact
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default function Contacts() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.contactsCreate);

  const [search, setSearch] = useState("");
  const [type, setType] = useState<CrmContactType | "all">("all");
  const [selected, setSelected] = useState<CrmContact | null>(null);
  const [createOpen, setCreateOpen] = useCreateIntent(canCreate);

  const debouncedSearch = useDebounced(search, 300);

  const load = useCallback(
    (page: number) =>
      listContacts({
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        type: type === "all" ? undefined : type,
      }),
    [debouncedSearch, type],
  );

  const signature = useMemo(() => `${debouncedSearch}|${type}`, [debouncedSearch, type]);
  const list = usePagedList(load, signature, canRead);

  if (!canRead) return <ForbiddenState label="contacts" />;

  return (
    <div className="space-y-3">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search contacts"
        label="Search contacts"
      />
      <FilterChips options={TYPE_FILTERS} value={type} onChange={setType} label="Filter by type" />

      {list.status === "loading" ? <LoadingState label="Loading contacts…" /> : null}
      {list.status === "error" ? (
        <ErrorState message={list.errorMessage} onRetry={list.reload} />
      ) : null}
      {list.status === "ready" && list.items.length === 0 ? <EmptyState label="No contacts found." /> : null}

      {list.status === "ready" && list.items.length > 0 ? (
        <div className="space-y-2">
          {list.items.map((contact) => (
            <ContactRow key={contact.id} contact={contact} onOpen={() => setSelected(contact)} />
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <ContactDetailSheet contact={selected} onClose={() => setSelected(null)} />
      <CreateContactSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={list.reload} />
    </div>
  );
}
