import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { FilterSortBar } from "@/components/FilterSortSheet";
import { FieldError, NativeSelect } from "@/components/forms/NativeSelect";
import { FormSheet } from "@/components/forms/FormSheet";
import { LoadMore } from "@/components/LoadMore";
import { ContactHubSheet } from "@/components/records/ContactHubSheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { humanize } from "@/lib/mobile/format";
import { compareText, type SortOrder } from "@/lib/mobile/sort";
import { createContact, listContacts, updateContact } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useCreateIntent } from "@/lib/mobile/use-create-intent";
import { usePagedList } from "@/lib/mobile/use-paged-list";
import { useDebounced } from "@/lib/mobile/use-debounced";
import { toContactInput, validateContact } from "@/lib/mobile/validate";
import { CRM_PERMISSIONS, CRM_CONTACT_TYPES, type CrmContact, type CrmContactType } from "@/types/crm";

function readContactType(value: string | null): CrmContactType | "all" {
  if (value && (CRM_CONTACT_TYPES as readonly string[]).includes(value)) return value as CrmContactType;
  return "all";
}

type ContactSort = "name" | "company" | "type";

const CONTACT_SORTS: { value: ContactSort; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "company", label: "Company" },
  { value: "type", label: "Type" },
];

const TYPE_FILTERS: { value: CrmContactType | "all"; label: string }[] = [
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

type ContactForm = {
  name: string;
  mobile: string;
  type: CrmContactType;
  email: string;
  companyName: string;
  notes: string;
};

const EMPTY_FORM: ContactForm = { name: "", mobile: "", type: "lead", email: "", companyName: "", notes: "" };

function ContactFormSheet({
  open,
  onOpenChange,
  contact,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  contact: CrmContact | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      contact
        ? {
            name: contact.name,
            mobile: contact.mobile,
            type: contact.type,
            email: contact.email ?? "",
            companyName: contact.companyName ?? "",
            notes: contact.notes ?? "",
          }
        : EMPTY_FORM,
    );
  }, [open, contact]);

  const set = <K extends keyof ContactForm>(key: K, value: ContactForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextErrors = validateContact(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.name ?? nextErrors.mobile ?? nextErrors.email ?? "Check the contact");
      return;
    }
    setBusy(true);
    try {
      const input = toContactInput(form);
      if (contact) await updateContact(contact.id, input);
      else await createContact(input);
      toast.success(contact ? "Contact updated" : "Contact created");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save contact");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={contact ? "Edit contact" : "New contact"}
      description={contact ? "Update this person's details." : "Add a lead, client, or vendor."}
      submitLabel={contact ? "Save contact" : "Create contact"}
      busy={busy}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" value={form.name} onChange={(e) => set("name", e.target.value)} className="h-11 rounded-xl text-base" />
        <FieldError message={errors.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-mobile">Mobile</Label>
        <Input
          id="contact-mobile"
          value={form.mobile}
          onChange={(e) => set("mobile", e.target.value)}
          className="h-11 rounded-xl text-base"
          inputMode="tel"
        />
        <FieldError message={errors.mobile} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-type">Type</Label>
        <NativeSelect id="contact-type" value={form.type} onChange={(next) => set("type", next as CrmContactType)}>
          {CRM_CONTACT_TYPES.map((option) => (
            <option key={option} value={option}>
              {humanize(option)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input
          id="contact-email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className="h-11 rounded-xl text-base"
          inputMode="email"
        />
        <FieldError message={errors.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-company">Company</Label>
        <Input
          id="contact-company"
          value={form.companyName}
          onChange={(e) => set("companyName", e.target.value)}
          className="h-11 rounded-xl text-base"
        />
        <FieldError message={errors.companyName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-notes">Notes</Label>
        <Textarea id="contact-notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} className="rounded-xl text-base" rows={3} />
        <FieldError message={errors.notes} />
      </div>
    </FormSheet>
  );
}

export default function Contacts() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.contactsRead);
  const canCreate = permissions.includes(CRM_PERMISSIONS.contactsCreate);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.contactsUpdate);
  const canDelete = permissions.includes(CRM_PERMISSIONS.contactsDelete);
  const canEditBooking = permissions.includes(CRM_PERMISSIONS.calendarUpdate);

  const [params, setParams] = useSearchParams();
  const type = readContactType(params.get("type"));
  const setType = (next: CrmContactType | "all") => {
    setParams(
      (current) => {
        const nextParams = new URLSearchParams(current);
        if (next === "all") nextParams.delete("type");
        else nextParams.set("type", next);
        return nextParams;
      },
      { replace: true },
    );
  };
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ContactSort>("name");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [selected, setSelected] = useState<CrmContact | null>(null);
  const [editing, setEditing] = useState<CrmContact | null>(null);
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
  const shown = useMemo(
    () =>
      [...list.items].sort((left, right) => {
        if (sort === "company") return compareText(left.companyName, right.companyName, order);
        if (sort === "type") return compareText(left.type, right.type, order);
        return compareText(left.name, right.name, order);
      }),
    [list.items, order, sort],
  );

  if (!canRead) return <ForbiddenState label="contacts" />;

  return (
    <div className="space-y-3">
      <FilterSortBar
          query={search}
          onQuery={setSearch}
          searchPlaceholder="Search contacts"
          searchLabel="Search contacts"
          sort={sort}
          onSort={(next) => setSort(next as ContactSort)}
          sortOptions={CONTACT_SORTS}
          defaultSort="name"
          order={order}
          onOrder={setOrder}
          defaultOrder="asc"
          sections={[
            {
              id: "type",
              kind: "single",
              label: "Type",
              value: type,
              neutral: "all",
              options: TYPE_FILTERS,
              onChange: (next) => setType(next as CrmContactType | "all"),
            },
          ]}
          resultCount={shown.length}
          singular="contact"
          plural="contacts"
          onClear={() => setType("all")}
          onAdd={canCreate ? () => setCreateOpen(true) : undefined}
          addLabel="New"
        />

      {list.status === "loading" ? <LoadingState label="Loading contacts…" /> : null}
      {list.status === "error" ? <ErrorState message={list.errorMessage} onRetry={list.reload} /> : null}
      {list.status === "forbidden" ? <ForbiddenState label="contacts" /> : null}
      {list.status === "ready" && list.items.length === 0 ? <EmptyState label="No contacts found." /> : null}

      {list.status === "ready" && list.items.length > 0 ? (
        <div className="space-y-2">
          {shown.map((contact) => (
            <ContactRow key={contact.id} contact={contact} onOpen={() => setSelected(contact)} />
          ))}
          <LoadMore hasMore={list.hasMore} loading={list.loadingMore} onLoadMore={list.loadMore} />
        </div>
      ) : null}

      <ContactHubSheet
        contact={selected}
        canUpdate={canUpdate}
        canDelete={canDelete}
        canEditBooking={canEditBooking}
        onClose={() => setSelected(null)}
        onEdit={(contact) => {
          setSelected(null);
          setEditing(contact);
        }}
        onRemoved={list.reload}
      />
      <ContactFormSheet
        open={createOpen || Boolean(editing)}
        onOpenChange={(next) => {
          if (next) return;
          setCreateOpen(false);
          setEditing(null);
        }}
        contact={editing}
        onSaved={list.reload}
      />
    </div>
  );
}
