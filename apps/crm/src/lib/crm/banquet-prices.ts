import { PROCUREMENT_ITEMS, procurementItemById } from "./banquet-procurement";

export const PROCUREMENT_VENDORS = [
  "Kisan Connect",
  "Country Delight",
  "Blinkit",
  "Zepto",
  "Jumbotail",
] as const;

export type ProcurementVendor = (typeof PROCUREMENT_VENDORS)[number];

/** Price per item unit, by item id then vendor. Vendors without a price are absent. */
export type VendorPrices = Record<string, Partial<Record<ProcurementVendor, number>>>;

export type PriceImportResult = {
  prices: VendorPrices;
  /** Rows that matched a known item and carried at least one price. */
  matched: number;
  /** Rows with a price that did not match any known item. */
  unmatched: number;
};

const norm = (value: unknown): string => String(value ?? "").trim().toLowerCase();

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : undefined;
  const parsed = Number(String(value ?? "").replace(/[₹,\s]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** Sheet rows for the price template: one row per item, one blank column per vendor. */
export function priceTemplateRows(): string[][] {
  return [
    ["Category", "Item", "Unit", ...PROCUREMENT_VENDORS],
    ...PROCUREMENT_ITEMS.map((item) => [
      item.category,
      item.name,
      item.unit,
      ...PROCUREMENT_VENDORS.map(() => ""),
    ]),
  ];
}

/** Reads a filled price template (header row with Category, Item and vendor names). */
export function parsePriceRows(rows: readonly (readonly unknown[])[]): PriceImportResult {
  const headerIndex = rows.findIndex((row) => row.some((cell) => norm(cell) === "item"));
  const empty: PriceImportResult = { prices: {}, matched: 0, unmatched: 0 };
  const header = rows[headerIndex];
  if (!header) return empty;

  const column = (name: string) => header.findIndex((cell) => norm(cell) === name.toLowerCase());
  const categoryCol = column("Category");
  const itemCol = column("Item");
  const vendorCols = PROCUREMENT_VENDORS.map((vendor) => [vendor, column(vendor)] as const).filter(
    ([, index]) => index >= 0,
  );

  const byName = new Map(
    PROCUREMENT_ITEMS.map((item) => [`${norm(item.category)}|${norm(item.name)}`, item] as const),
  );
  const prices: VendorPrices = {};
  let matched = 0;
  let unmatched = 0;

  for (const row of rows.slice(headerIndex + 1)) {
    const found: Partial<Record<ProcurementVendor, number>> = {};
    for (const [vendor, index] of vendorCols) {
      const price = parsePrice(row[index]);
      if (price !== undefined) found[vendor] = price;
    }
    if (Object.keys(found).length === 0) continue;
    const item = byName.get(`${norm(row[categoryCol])}|${norm(row[itemCol])}`);
    if (!item) {
      unmatched += 1;
      continue;
    }
    prices[item.id] = found;
    matched += 1;
  }
  return { prices, matched, unmatched };
}

export type BestPrice = { vendor: ProcurementVendor; price: number };

export function bestPrice(prices: VendorPrices, itemId: string): BestPrice | undefined {
  let best: BestPrice | undefined;
  for (const vendor of PROCUREMENT_VENDORS) {
    const price = prices[itemId]?.[vendor];
    if (price !== undefined && (!best || price < best.price)) best = { vendor, price };
  }
  return best;
}

/** Cheapest-vendor amount for a quantity; undefined when there is no price or quantity. */
export function orderAmount(prices: VendorPrices, itemId: string, quantity: string): number | undefined {
  const best = bestPrice(prices, itemId);
  const qty = Number(quantity);
  if (!best || !procurementItemById(itemId) || !Number.isFinite(qty) || qty <= 0) return undefined;
  return Math.round(best.price * qty * 100) / 100;
}

/** Reads the first sheet of an uploaded .xlsx/.csv price file. */
export async function readPriceFile(file: File): Promise<PriceImportResult> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!sheet) return { prices: {}, matched: 0, unmatched: 0 };
  return parsePriceRows(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }));
}

export async function downloadPriceTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet(priceTemplateRows());
  sheet["!cols"] = [{ wch: 30 }, { wch: 42 }, { wch: 8 }, ...PROCUREMENT_VENDORS.map(() => ({ wch: 16 }))];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Prices");
  XLSX.writeFile(workbook, "vendor-price-template.xlsx");
}
