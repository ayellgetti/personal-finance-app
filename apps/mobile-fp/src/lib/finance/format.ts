export function formatInr(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "Not available";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "Not available";
  return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
}

export function formatUpdated(value: string | null) {
  if (!value) return "Not updated yet";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
