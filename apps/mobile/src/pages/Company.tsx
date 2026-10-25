import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/PageState";
import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchCompanyProfile, updateCompanyProfile } from "@/lib/mobile/remote";
import { useMobile } from "@/lib/mobile/store";
import { useResource } from "@/lib/mobile/use-resource";
import { CRM_PERMISSIONS, type CrmCompanyProfile } from "@/types/crm";

const MAX_LOGO_BYTES = 1024 * 1024;

type LogoChoice = { kind: "keep" } | { kind: "replace"; dataUrl: string } | { kind: "clear" };

function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose a PNG, JPEG, WebP, or GIF logo"));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      reject(new Error("Logo must be 1 MB or smaller"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(result)) {
        reject(new Error("Choose a PNG, JPEG, WebP, or GIF logo"));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("Could not read the logo"));
    reader.readAsDataURL(file);
  });
}

function CompanyForm({ profile, canUpdate }: { profile: CrmCompanyProfile; canUpdate: boolean }) {
  const [defaults, setDefaults] = useState(profile.defaults);
  const [form, setForm] = useState(profile.saved);
  const [logo, setLogo] = useState<LogoChoice>({ kind: "keep" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDefaults(profile.defaults);
    setForm(profile.saved);
    setLogo({ kind: "keep" });
  }, [profile]);

  const preview =
    logo.kind === "replace" ? logo.dataUrl : logo.kind === "clear" ? defaults.logoUrl : form.logoUrl || defaults.logoUrl;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !canUpdate) return;
    setBusy(true);
    try {
      const saved = await updateCompanyProfile({
        name: form.name,
        details: form.details,
        contactName: form.contactName,
        contactMobile: form.contactMobile,
        ...(logo.kind === "replace" ? { logo: logo.dataUrl } : logo.kind === "clear" ? { logo: null } : {}),
      });
      setDefaults(saved.defaults);
      setForm(saved.saved);
      setLogo({ kind: "keep" });
      toast.success("Company profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the company profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="space-y-3" aria-label="Invoice company">
      <div className="space-y-1">
        <Label htmlFor="company-name">Company name</Label>
        <Input
          id="company-name"
          value={form.name}
          placeholder={defaults.name || "Company name"}
          disabled={!canUpdate}
          onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          className="h-11 rounded-xl text-base"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="company-logo">Logo</Label>
        <div className="flex items-center gap-3">
          {preview ? (
            <img src={preview} alt="" className="h-16 w-16 shrink-0 rounded-xl border border-border object-contain" />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border text-xs text-muted-foreground">
              None
            </div>
          )}
          <Input
            id="company-logo"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={!canUpdate}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void readLogo(file)
                .then((dataUrl) => setLogo({ kind: "replace", dataUrl }))
                .catch((error: unknown) => {
                  toast.error(error instanceof Error ? error.message : "Could not read the logo");
                });
            }}
            className="h-11 min-w-0 rounded-xl text-sm"
          />
        </div>
        {canUpdate && (form.logoUrl || logo.kind === "replace") ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl"
            onClick={() => setLogo({ kind: "clear" })}
          >
            Use environment logo
          </Button>
        ) : null}
      </div>

      <div className="space-y-1">
        <Label htmlFor="company-details">Organization details</Label>
        <Textarea
          id="company-details"
          value={form.details}
          placeholder={defaults.details || "Address, GSTIN, and other details printed under the name"}
          disabled={!canUpdate}
          onChange={(e) => setForm((current) => ({ ...current, details: e.target.value }))}
          className="min-h-24 rounded-xl text-base"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="company-contact-name">Contact person</Label>
        <Input
          id="company-contact-name"
          value={form.contactName}
          placeholder={defaults.contactName || "Contact person"}
          disabled={!canUpdate}
          onChange={(e) => setForm((current) => ({ ...current, contactName: e.target.value }))}
          className="h-11 rounded-xl text-base"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="company-contact-mobile">Mobile no.</Label>
        <Input
          id="company-contact-mobile"
          type="tel"
          inputMode="tel"
          value={form.contactMobile}
          placeholder={defaults.contactMobile || "Mobile no."}
          disabled={!canUpdate}
          onChange={(e) => setForm((current) => ({ ...current, contactMobile: e.target.value }))}
          className="h-11 rounded-xl text-base"
        />
      </div>

      {canUpdate ? (
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={busy}>
          Save company
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">An admin or manager can change these details.</p>
      )}
    </form>
  );
}

export default function Company() {
  const { permissions } = useMobile();
  const canRead = permissions.includes(CRM_PERMISSIONS.companyRead);
  const canUpdate = permissions.includes(CRM_PERMISSIONS.companyUpdate);
  const profile = useResource(() => fetchCompanyProfile(), canRead);

  if (!canRead) return <ForbiddenState label="the company profile" />;

  return (
    <div className="space-y-3">
      {profile.status === "loading" ? <LoadingState label="Loading company profile…" /> : null}
      {profile.status === "error" ? <ErrorState message={profile.errorMessage} onRetry={profile.reload} /> : null}
      {profile.status === "forbidden" ? <ForbiddenState label="the company profile" /> : null}
      {profile.status === "ready" && profile.data ? (
        <SectionCard eyebrow="Admin" title="Invoice company" tone="neutral">
          <p className="pb-3 text-sm text-muted-foreground">
            Printed on every invoice. Leave a field blank to use the value from the server environment.
          </p>
          <CompanyForm profile={profile.data} canUpdate={canUpdate} />
        </SectionCard>
      ) : null}
    </div>
  );
}
