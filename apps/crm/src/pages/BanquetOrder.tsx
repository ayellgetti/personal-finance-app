import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect, type SearchableGroup } from "@/components/modules/shared";
import { copyToClipboard } from "@/lib/clipboard";
import { formatDate } from "@/lib/crm/display";
import { buildWhatsAppOrderMessage } from "@/lib/crm/banquet-order";
import { whatsAppHandoverUrl } from "@/lib/crm/banquet-checklist";
import {
  PROCUREMENT_CATEGORIES,
  procurementDisplayName,
  procurementItemById,
  procurementItemsByCategory,
} from "@/lib/crm/banquet-procurement";

type OrderRow = { id: string; category: string; itemId: string; quantity: string; remarks: string };

let nextRowId = 0;
function emptyRow(): OrderRow {
  nextRowId += 1;
  return { id: `order-${nextRowId}`, category: "", itemId: "", quantity: "", remarks: "" };
}

/** Search across all categories; a product can be added any number of times. */
function productGroups(): SearchableGroup[] {
  return PROCUREMENT_CATEGORIES.map((name) => ({
    name,
    options: procurementItemsByCategory(name).map((entry) => ({
      value: entry.id,
      label: `${procurementDisplayName(entry)} · ${entry.unit}`,
    })),
  }));
}

const inputClass =
  "h-10 rounded-lg border-stone-200 bg-stone-50 px-3 py-1 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:ring-amber-400 print:hidden";
const rowInputClass =
  "h-9 rounded-md border-stone-200 bg-white px-2.5 py-1 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:ring-amber-400 print:hidden";
const selectClass =
  "h-9 rounded-md border-stone-200 bg-white px-2.5 py-1 text-sm text-stone-800 print:hidden";
const cellClass = "border border-amber-100 p-1.5 align-middle print:border-black";
const headCellClass =
  "border border-amber-100 bg-stone-50 px-2 py-1.5 text-left text-xs font-semibold text-amber-800 print:border-black print:bg-white";

function PrintValue({ value, className = "" }: { value: string; className?: string }) {
  return (
    <span className={`hidden whitespace-pre-wrap print:block ${className}`}>{value || " "}</span>
  );
}

export default function BanquetOrder() {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deliverTo, setDeliverTo] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<OrderRow[]>(() => [emptyRow()]);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [whatsAppDraft, setWhatsAppDraft] = useState("");

  const updateRow = (id: string, patch: Partial<Omit<OrderRow, "id">>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const addRow = () => setRows((current) => [...current, emptyRow()]);
  const removeRow = (id: string) =>
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));

  const buildMessage = () =>
    buildWhatsAppOrderMessage({
      title,
      eventDate: eventDate ? formatDate(eventDate) : "",
      deliverTo,
      notes,
      lines: rows.map((row) => {
        const entry = procurementItemById(row.itemId);
        return {
          item: entry ? procurementDisplayName(entry) : "",
          quantity: row.quantity,
          unit: entry?.unit ?? "",
          remarks: row.remarks,
        };
      }),
    });

  const copyMessage = async () => {
    if (!(await copyToClipboard(whatsAppDraft))) {
      toast.error("Unable to copy message");
      return;
    }
    toast.success("Message copied");
  };

  const confirmReset = () => {
    toast("Reset the order?", {
      action: {
        label: "Reset",
        onClick: () => {
          setTitle("");
          setEventDate("");
          setDeliverTo("");
          setNotes("");
          setRows([emptyRow()]);
          toast.success("Order reset");
        },
      },
      cancel: { label: "Cancel", onClick: () => undefined },
    });
  };

  return (
    <div className="banquet-checklist min-h-screen bg-[#fbf8f3] px-3 py-4 text-stone-800 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-amber-100 bg-white p-4 shadow-[0_16px_48px_-24px_rgba(120,90,40,0.35)] sm:p-6 print:max-w-none print:rounded-none print:border-black print:p-0 print:shadow-none">
        <h1 className="font-display text-xl font-semibold tracking-tight text-amber-700 sm:text-2xl">
          Banquet Order
        </h1>
        <p className="mt-1 text-xs text-stone-500">Products to order — print it or send on WhatsApp</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3 print:grid-cols-3">
          <div>
            <Label htmlFor="order-title" className="text-xs font-medium text-stone-700">
              Order for
            </Label>
            <Input
              id="order-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Client / event"
              className={`mt-1.5 ${inputClass}`}
            />
            <PrintValue value={title} className="border-b border-stone-400 pb-0.5" />
          </div>
          <div>
            <Label htmlFor="order-date" className="text-xs font-medium text-stone-700">
              Required on
            </Label>
            <Input
              id="order-date"
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
            <PrintValue
              value={eventDate ? formatDate(eventDate) : ""}
              className="border-b border-stone-400 pb-0.5"
            />
          </div>
          <div>
            <Label htmlFor="order-deliver" className="text-xs font-medium text-stone-700">
              Deliver to
            </Label>
            <Input
              id="order-deliver"
              value={deliverTo}
              onChange={(event) => setDeliverTo(event.target.value)}
              placeholder="Venue / address"
              className={`mt-1.5 ${inputClass}`}
            />
            <PrintValue value={deliverTo} className="border-b border-stone-400 pb-0.5" />
          </div>
        </div>

        <section aria-labelledby="order-products-heading" className="mt-4">
          <h2 id="order-products-heading" className="sr-only">
            Products
          </h2>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full min-w-[36rem] border-collapse text-sm print:min-w-0">
              <thead>
                <tr>
                  <th scope="col" className={`${headCellClass} w-10`}>
                    #
                  </th>
                  <th scope="col" className={headCellClass}>
                    Category
                  </th>
                  <th scope="col" className={headCellClass}>
                    Product
                  </th>
                  <th scope="col" className={`${headCellClass} w-24`}>
                    Qty
                  </th>
                  <th scope="col" className={`${headCellClass} w-16`}>
                    Unit
                  </th>
                  <th scope="col" className={headCellClass}>
                    Remarks
                  </th>
                  <th scope="col" className={`${headCellClass} w-12 print:hidden`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const entry = procurementItemById(row.itemId);
                  return (
                    <tr key={row.id}>
                      <td className={`${cellClass} text-xs text-stone-600`}>{index + 1}</td>
                      <td className={cellClass}>
                        <span
                          id={`order-${index + 1}-category`}
                          aria-label={`Order row ${index + 1} category`}
                          className="block text-xs text-stone-600"
                        >
                          {entry?.category ?? "Auto-filled"}
                        </span>
                      </td>
                      <td className={cellClass}>
                        <SearchableSelect
                          id={`order-${index + 1}-item`}
                          value={row.itemId}
                          onChange={(value) =>
                            updateRow(row.id, {
                              itemId: value,
                              category: procurementItemById(value)?.category ?? "",
                            })
                          }
                          className={selectClass}
                          aria-label={`Order row ${index + 1} product`}
                          placeholder="Search product..."
                          emptyLabel="No matching product"
                          groups={productGroups()}
                        />
                        <PrintValue value={entry ? procurementDisplayName(entry) : ""} />
                      </td>
                      <td className={cellClass}>
                        <Input
                          type="number"
                          min={0}
                          value={row.quantity}
                          onChange={(event) => updateRow(row.id, { quantity: event.target.value })}
                          placeholder="Qty"
                          aria-label={`Order row ${index + 1} quantity`}
                          className={`${rowInputClass} text-right`}
                        />
                        <PrintValue value={row.quantity} className="text-right" />
                      </td>
                      <td className={`${cellClass} text-xs text-stone-600`}>{entry?.unit ?? ""}</td>
                      <td className={cellClass}>
                        <Input
                          value={row.remarks}
                          onChange={(event) => updateRow(row.id, { remarks: event.target.value })}
                          placeholder="Brand, delivery time..."
                          aria-label={`Order row ${index + 1} remarks`}
                          className={rowInputClass}
                        />
                        <PrintValue value={row.remarks} />
                      </td>
                      <td className={`${cellClass} print:hidden`}>
                        {rows.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-base text-red-700 hover:text-red-800"
                            aria-label="Remove order"
                            onClick={() => removeRow(row.id)}
                          >
                            ×
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex justify-end print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-stone-200 px-3 text-xs"
              onClick={addRow}
            >
              + Add product
            </Button>
          </div>
        </section>

        <div className="mt-3">
          <Label htmlFor="order-notes" className="text-xs font-medium text-stone-700">
            Note
          </Label>
          <Textarea
            id="order-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Any instruction for the supplier..."
            className="mt-1.5 min-h-[72px] rounded-xl border-stone-200 bg-stone-50 px-3 py-2 text-sm print:hidden"
          />
          <PrintValue value={notes} className="min-h-[3rem] rounded border border-stone-400 px-2 py-1" />
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-2 print:hidden">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-stone-200 px-5 text-sm"
            onClick={confirmReset}
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-stone-200 px-5 text-sm"
            onClick={() => {
              setWhatsAppDraft(buildMessage());
              setWhatsAppOpen(true);
            }}
          >
            WhatsApp message
          </Button>
          <Button
            type="button"
            className="h-9 rounded-full bg-amber-400 px-6 text-sm font-semibold text-stone-900 hover:bg-amber-500"
            onClick={() => window.print()}
          >
            Print order
          </Button>
        </div>
      </div>

      <Dialog open={whatsAppOpen} onOpenChange={setWhatsAppOpen}>
        <DialogContent className="p-4 sm:max-w-lg sm:p-6">
          <DialogHeader>
            <DialogTitle>WhatsApp message</DialogTitle>
            <DialogDescription>Edit if needed, then copy or open WhatsApp.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={whatsAppDraft}
            onChange={(event) => setWhatsAppDraft(event.target.value)}
            rows={12}
            aria-label="WhatsApp message"
            className="min-h-[11rem] rounded-xl border-stone-200 font-mono text-sm sm:min-h-[16rem]"
          />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full rounded-full sm:w-auto"
              onClick={() => void copyMessage()}
            >
              Copy
            </Button>
            <Button
              type="button"
              className="h-9 w-full rounded-full bg-amber-400 font-semibold text-stone-900 hover:bg-amber-500 sm:w-auto"
              onClick={() =>
                window.open(whatsAppHandoverUrl("", whatsAppDraft), "_blank", "noopener,noreferrer")
              }
            >
              Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
