import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { FormSheet } from "@/components/forms/FormSheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CONTACT_IMPORT_SAMPLE, previewContactCsv } from "@/lib/mobile/contact-import";
import { importContacts } from "@/lib/mobile/remote";

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

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || ready === 0) return;
    setBusy(true);
    try {
      const result = await importContacts(csv);
      toast.success(
        result.skipped.length > 0
          ? `Imported ${result.created}. Skipped ${result.skipped.length}.`
          : `Imported ${result.created} contacts.`,
      );
      onOpenChange(false);
      onImported();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to import contacts");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Import contacts"
      description="CSV columns: name, mobile, type (lead, client, vendor, employee)."
      submitLabel={busy ? "Importing…" : `Import ${ready}`}
      busy={busy || ready === 0}
      onSubmit={onSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="mobile-contact-import-file">CSV file</Label>
        <input
          id="mobile-contact-import-file"
          type="file"
          accept=".csv,text/csv,text/plain"
          className="block w-full text-sm"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mobile-contact-import-csv">Or paste CSV</Label>
        <Textarea
          id="mobile-contact-import-csv"
          value={csv}
          onChange={(event) => setCsv(event.target.value)}
          className="min-h-32 rounded-xl font-mono text-xs"
        />
      </div>
      {preview.error ? <p className="text-sm text-destructive">{preview.error}</p> : null}
      {preview.rows.length > 0 ? (
        <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
          {preview.rows.slice(0, 12).map((row) => (
            <li key={row.row} className={row.error ? "text-destructive" : "text-muted-foreground"}>
              {row.name || "—"} · {row.mobile || "—"} · {row.type || "—"}
              {row.error ? ` — ${row.error}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </FormSheet>
  );
}
