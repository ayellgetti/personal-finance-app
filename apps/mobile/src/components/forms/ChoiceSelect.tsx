import { useMemo, useState } from "react";
import { NativeSelect } from "@/components/forms/NativeSelect";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ChoiceOption = {
  value: string;
  /** Primary line, such as the person's name. */
  label: string;
  /** Second line, such as the mobile number. */
  detail?: string | null;
  /** Text used by the phone's own picker. Defaults to the label. */
  text?: string;
};

/** Android's native picker drops or truncates a second value in the option text. */
export function isAndroidDevice(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/**
 * People and other long lists. On Android this is a search field plus a list that
 * shows the name and mobile on separate lines. Other devices keep the native picker.
 */
export function ChoiceSelect({
  id,
  value,
  onChange,
  options,
  emptyLabel,
  searchLabel = "Search by name or mobile",
  showSearch = true,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  options: readonly ChoiceOption[];
  emptyLabel?: string;
  searchLabel?: string;
  showSearch?: boolean;
}) {
  const [query, setQuery] = useState("");
  const android = isAndroidDevice();
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!android || !showSearch || !needle) return options;
    return options.filter((option) => {
      const haystack = `${option.label} ${option.detail ?? ""} ${option.text ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [android, options, query, showSearch]);

  if (!android) {
    return (
      <NativeSelect id={id} value={value} onChange={onChange}>
        {emptyLabel !== undefined ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.text ?? option.label}
          </option>
        ))}
      </NativeSelect>
    );
  }

  return (
    <div className="space-y-2">
      {showSearch ? (
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="h-11 rounded-xl text-base"
        />
      ) : null}
      <div
        id={id}
        role="listbox"
        aria-label={emptyLabel ?? searchLabel}
        className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-1"
      >
        {emptyLabel !== undefined ? (
          <button
            type="button"
            role="option"
            aria-selected={value === ""}
            onClick={() => onChange("")}
            className={cn(
              "flex w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground",
              value === "" && "bg-secondary text-foreground",
            )}
          >
            {emptyLabel}
          </button>
        ) : null}
        {filtered.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left",
              value === option.value ? "bg-secondary text-foreground" : "hover:bg-muted",
            )}
          >
            <span className="text-sm font-medium">{option.label}</span>
            {option.detail ? <span className="text-xs text-muted-foreground">{option.detail}</span> : null}
          </button>
        ))}
        {filtered.length === 0 ? <p className="px-3 py-2 text-sm text-muted-foreground">No matches</p> : null}
      </div>
    </div>
  );
}
