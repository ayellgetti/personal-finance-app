import { useMemo, useState, type ReactNode } from "react";
import { Filter, Minus, Plus, Search, X } from "lucide-react";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { SearchBar } from "@/components/SearchBar";
import { AddButton } from "@/components/ViewSwitch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { SortOrder } from "@/lib/mobile/sort";

export type FilterChoice = { value: string; label: string };

export type SingleFilter = {
  id: string;
  kind: "single";
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly FilterChoice[];
  /** This value means the filter is off and is left out of the applied chips. */
  neutral?: string;
};

export type MultiFilter = {
  id: string;
  kind: "multi";
  label: string;
  values: readonly string[];
  onChange: (values: string[]) => void;
  options: readonly FilterChoice[];
};

export type DateFilter = {
  id: string;
  kind: "dates";
  label: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  error?: string | null;
};

export type FilterSection = SingleFilter | MultiFilter | DateFilter;

type AppliedChip = { id: string; label: string; onRemove: () => void };

const ORDER_OPTIONS: readonly FilterChoice[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

function choiceLabel(options: readonly FilterChoice[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function seeLabel(count: number, singular: string, plural: string): string {
  return `See ${count} ${count === 1 ? singular : plural}`;
}

export function FilterSortBar({
  query,
  onQuery,
  searchPlaceholder,
  searchLabel,
  sort,
  onSort,
  sortOptions,
  defaultSort,
  order,
  onOrder,
  defaultOrder,
  sections,
  resultCount,
  singular,
  plural,
  onClear,
  onAdd,
  addLabel = "New",
  views,
}: {
  query: string;
  onQuery: (next: string) => void;
  searchPlaceholder: string;
  searchLabel: string;
  sort: string;
  onSort: (next: string) => void;
  sortOptions: readonly FilterChoice[];
  defaultSort: string;
  order: SortOrder;
  onOrder: (next: SortOrder) => void;
  defaultOrder: SortOrder;
  sections: readonly FilterSection[];
  resultCount: number;
  singular: string;
  plural: string;
  onClear: () => void;
  onAdd?: () => void;
  addLabel?: string;
  views?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const resetAll = () => {
    onQuery("");
    onSort(defaultSort);
    onOrder(defaultOrder);
    onClear();
  };

  const chips = useMemo(() => {
    const next: AppliedChip[] = [];
    const trimmed = query.trim();
    if (trimmed) next.push({ id: "search", label: `“${trimmed}”`, onRemove: () => onQuery("") });
    if (sort !== defaultSort) {
      next.push({
        id: "sort",
        label: choiceLabel(sortOptions, sort),
        onRemove: () => onSort(defaultSort),
      });
    }
    if (order !== defaultOrder) {
      next.push({
        id: "order",
        label: choiceLabel(ORDER_OPTIONS, order),
        onRemove: () => onOrder(defaultOrder),
      });
    }
    for (const section of sections) {
      if (section.kind === "single") {
        const neutral = section.neutral ?? "";
        if (section.value !== neutral) {
          next.push({
            id: section.id,
            label: choiceLabel(section.options, section.value),
            onRemove: () => section.onChange(neutral),
          });
        }
      } else if (section.kind === "multi") {
        for (const value of section.values) {
          next.push({
            id: `${section.id}:${value}`,
            label: choiceLabel(section.options, value),
            onRemove: () => section.onChange(section.values.filter((item) => item !== value)),
          });
        }
      } else {
        if (section.from) {
          next.push({
            id: `${section.id}:from`,
            label: `From ${section.from}`,
            onRemove: () => section.onFromChange(""),
          });
        }
        if (section.to) {
          next.push({
            id: `${section.id}:to`,
            label: `To ${section.to}`,
            onRemove: () => section.onToChange(""),
          });
        }
      }
    }
    return next;
  }, [defaultOrder, defaultSort, onOrder, onQuery, onSort, order, query, sections, sort, sortOptions]);

  const toggle = (id: string) =>
    setOpenSections((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <SearchBar inline value={query} onChange={onQuery} placeholder={searchPlaceholder} label={searchLabel} />
        <button
          type="button"
          aria-label={chips.length > 0 ? `Filter and sort, ${chips.length} applied` : "Filter and sort"}
          onClick={() => setOpen(true)}
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground tap-highlight-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Filter className="h-4 w-4" aria-hidden />
          {chips.length > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {chips.length}
            </span>
          ) : null}
        </button>
        {views}
        {onAdd ? <AddButton label={addLabel} onClick={onAdd} /> : null}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="flex h-[92dvh] max-h-[92dvh] flex-col gap-0 overflow-hidden rounded-t-3xl p-0 pb-safe"
        >
          <SheetHeader className="space-y-0 px-4 pb-2 pr-12 pt-4 text-left">
            <SheetTitle className="font-display text-lg">Filter & Sort</SheetTitle>
            <SheetDescription className="sr-only">Search, sort, order, and filter this list.</SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                type="search"
                aria-label={`${searchLabel} in filters`}
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 rounded-xl pl-9 text-base"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Applied filters</p>
              {chips.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((chip) => (
                    <span
                      key={chip.id}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs font-medium"
                    >
                      {chip.label}
                      <button
                        type="button"
                        aria-label={`Remove ${chip.label}`}
                        onClick={chip.onRemove}
                        className="rounded-sm text-muted-foreground tap-highlight-none hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </span>
                  ))}
                  <button type="button" className="text-sm font-semibold text-primary" onClick={resetAll}>
                    Clear all
                  </button>
                </div>
              )}
            </div>

            <div className="divide-y divide-border border-y border-border">
              <Section
                id="sort"
                label="Sort"
                summary={choiceLabel(sortOptions, sort)}
                open={openSections.includes("sort")}
                onToggle={() => toggle("sort")}
              >
                <ChoiceList
                  id="sort"
                  label="Sort"
                  mode="single"
                  value={sort}
                  options={sortOptions}
                  onChange={onSort}
                />
              </Section>
              <Section
                id="order"
                label="Order"
                summary={choiceLabel(ORDER_OPTIONS, order)}
                open={openSections.includes("order")}
                onToggle={() => toggle("order")}
              >
                <ChoiceList
                  id="order"
                  label="Order"
                  mode="single"
                  value={order}
                  options={ORDER_OPTIONS}
                  onChange={(next) => onOrder(next as SortOrder)}
                />
              </Section>
              {sections.map((section) => (
                <FilterBlock
                  key={section.id}
                  section={section}
                  open={openSections.includes(section.id)}
                  onToggle={() => toggle(section.id)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border px-4 py-3">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={resetAll}>
              Clear Filters
            </Button>
            <Button type="button" className="h-11 rounded-xl" onClick={() => setOpen(false)}>
              {seeLabel(resultCount, singular, plural)}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({
  id,
  label,
  summary,
  count,
  open,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  summary?: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        id={`${id}-heading`}
        className="flex w-full items-center gap-3 py-3 text-left tap-highlight-none"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold">{label}</span>
          {summary ? <span className="block truncate text-sm text-muted-foreground">{summary}</span> : null}
        </span>
        {count != null && count > 0 ? (
          <span className="text-sm tabular-nums text-muted-foreground">{count}</span>
        ) : null}
        {open ? <Minus className="h-4 w-4 shrink-0" aria-hidden /> : <Plus className="h-4 w-4 shrink-0" aria-hidden />}
      </button>
      {open ? (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-heading`} className="pb-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function ChoiceList({
  id,
  label,
  mode,
  value,
  values,
  options,
  onChange,
  onToggle,
}: {
  id: string;
  label: string;
  mode: "single" | "multi";
  value?: string;
  values?: readonly string[];
  options: readonly FilterChoice[];
  onChange?: (next: string) => void;
  onToggle?: (next: string) => void;
}) {
  if (mode === "multi") {
    return (
      <div role="group" aria-label={label} className="space-y-1">
        {options.map((option) => (
          <label key={option.value} className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={values?.includes(option.value) ?? false}
              onChange={() => onToggle?.(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label={label} className="space-y-1">
      {options.map((option) => (
        <label key={option.value} className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="radio"
            name={`filter-sort-${id}`}
            className="h-4 w-4"
            checked={value === option.value}
            onChange={() => onChange?.(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function FilterBlock({
  section,
  open,
  onToggle,
}: {
  section: FilterSection;
  open: boolean;
  onToggle: () => void;
}) {
  if (section.kind === "dates") {
    const summary =
      section.from || section.to ? [section.from || "…", section.to || "…"].join(" – ") : "Any date";
    return (
      <Section id={section.id} label={section.label} summary={summary} open={open} onToggle={onToggle}>
        <DateRangeFilter
          idPrefix={section.id}
          from={section.from}
          to={section.to}
          onFromChange={section.onFromChange}
          onToChange={section.onToChange}
          error={section.error}
        />
      </Section>
    );
  }

  if (section.kind === "multi") {
    return (
      <Section
        id={section.id}
        label={section.label}
        count={section.values.length}
        open={open}
        onToggle={onToggle}
      >
        <ChoiceList
          id={section.id}
          label={section.label}
          mode="multi"
          values={section.values}
          options={section.options}
          onToggle={(value) => {
            const next = section.values.includes(value)
              ? section.values.filter((item) => item !== value)
              : [...section.values, value];
            section.onChange(next);
          }}
        />
      </Section>
    );
  }

  return (
    <Section
      id={section.id}
      label={section.label}
      summary={choiceLabel(section.options, section.value)}
      open={open}
      onToggle={onToggle}
    >
      <ChoiceList
        id={section.id}
        label={section.label}
        mode="single"
        value={section.value}
        options={section.options}
        onChange={section.onChange}
      />
    </Section>
  );
}
