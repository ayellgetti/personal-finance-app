import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SideSheet } from "@/components/modules/shared";
import { CONTACT_IMPORT_SAMPLE, previewContactCsv } from "@/lib/crm/contact-import";
import { importContacts } from "@/lib/crm/remote";

export function ImportContactsSheet({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [csv, setCsv] = useState(CONTACT_IMPORT_SAMPLE);
  const [busy, setBusy] = useState(false);
  const preview = useMemo(() => previewContactCsv(csv), [csv]);
  const ready = preview.rows.filter((row) => !row.error).length;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setCsv(await file.text());
  };

  const onImport = async () => {
    if (busy || ready === 0) return;
    setBusy(true);
    try {
      const result = await importContacts(csv);
      const skipped = result.skipped.length;
      toast.success(
        skipped > 0
          ? `Imported ${result.created} contacts. Skipped ${skipped}.`
          : `Imported ${result.created} contacts.`,
      );
      if (skipped > 0) {
        toast.message(result.skipped.slice(0, 3).map((row) => `Row ${row.row}: ${row.reason}`).join("\n"));
      }
      onOpenChange(false);
      onImported();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import contacts");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Import contacts"
      description="CSV with three columns: name, mobile, and type (lead, client, vendor, or employee)."
      footer={
        <Button type="button" className="rounded-xl" disabled={busy || ready === 0} onClick={() => void onImport()}>
          {busy ? "Importing…" : `Import ${ready}`}
        </Button>
      }
    >
      <label className="block text-sm font-medium" htmlFor="contact-import-file">
        CSV file
        <input
          id="contact-import-file"
          type="file"
          accept=".csv,text/csv,text/plain"
          className="mt-1 block w-full text-sm"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="contact-import-csv">
        Or paste CSV
        <Textarea
          id="contact-import-csv"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          className="mt-1 min-h-32 rounded-xl font-mono text-xs"
        />
      </label>
      {preview.error ? <p className="text-sm text-destructive">{preview.error}</p> : null}
      {preview.rows.length > 0 ? (
        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {preview.rows.slice(0, 20).map((row) => (
            <li key={row.row} className={row.error ? "text-destructive" : "text-muted-foreground"}>
              {row.name || "—"} · {row.mobile || "—"} · {row.type || "—"}
              {row.error ? ` — ${row.error}` : ""}
            </li>
          ))}
          {preview.rows.length > 20 ? (
            <li className="text-muted-foreground">+{preview.rows.length - 20} more</li>
          ) : null}
        </ul>
      ) : null}
    </SideSheet>
  );
}
