export type OrderMessageLine = {
  item: string;
  quantity: string;
  unit: string;
  remarks: string;
};

export type OrderMessageDraft = {
  title: string;
  eventDate: string;
  deliverTo: string;
  lines: readonly OrderMessageLine[];
  notes: string;
};

/** Plain WhatsApp order list: one numbered line per product. */
export function buildWhatsAppOrderMessage(draft: OrderMessageDraft): string {
  const header = [
    draft.title.trim() ? `*${draft.title.trim()}*` : "*Order*",
    draft.eventDate.trim() ? `Required on: ${draft.eventDate.trim()}` : "",
    draft.deliverTo.trim() ? `Deliver to: ${draft.deliverTo.trim()}` : "",
  ].filter(Boolean);

  const lines = draft.lines
    .filter((row) => row.item.trim())
    .map((row, index) => {
      const qty = row.quantity.trim()
        ? ` — ${row.quantity.trim()}${row.unit.trim() ? ` ${row.unit.trim()}` : ""}`
        : "";
      const remarks = row.remarks.trim() ? ` (${row.remarks.trim()})` : "";
      return `${index + 1}. ${row.item.trim()}${qty}${remarks}`;
    });

  const blocks = [header.join("\n"), lines.join("\n"), draft.notes.trim() ? `Note: ${draft.notes.trim()}` : ""];
  return blocks.filter(Boolean).join("\n\n");
}
