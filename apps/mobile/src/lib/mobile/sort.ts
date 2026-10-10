export type SortOrder = "asc" | "desc";

function direction(order: SortOrder): number {
  return order === "asc" ? 1 : -1;
}

/** Empty text sorts last in both directions. */
export function compareText(
  left: string | null | undefined,
  right: string | null | undefined,
  order: SortOrder,
): number {
  const a = left?.trim() ?? "";
  const b = right?.trim() ?? "";
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }) * direction(order);
}

/** Missing times sort last in both directions. */
export function compareTime(
  left: string | null | undefined,
  right: string | null | undefined,
  order: SortOrder,
): number {
  const a = left ? new Date(left).getTime() : Number.NaN;
  const b = right ? new Date(right).getTime() : Number.NaN;
  const aMissing = Number.isNaN(a);
  const bMissing = Number.isNaN(b);
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return (a - b) * direction(order);
}

/** Missing numbers sort last in both directions. */
export function compareNumber(
  left: number | null | undefined,
  right: number | null | undefined,
  order: SortOrder,
): number {
  if (left == null || Number.isNaN(left)) return right == null || Number.isNaN(right) ? 0 : 1;
  if (right == null || Number.isNaN(right)) return -1;
  return (left - right) * direction(order);
}
