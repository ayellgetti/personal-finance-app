import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, ModulePage } from "@/components/modules/shared";
import { fetchCompanyProfile, updateCompanyProfile } from "@/lib/crm/remote";
import { useCrm } from "@/lib/crm/store";
import { CRM_PERMISSIONS, type CrmCompanyLetterhead, type CrmCompanyProfile } from "@/types/crm";

const EMPTY_LETTERHEAD: CrmCompanyLetterhead = {
  name: "",
  details: "",
  contactName: "",
  contactMobile: "",
  logoUrl: "",
};

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

export function CompanyModule() {
  const crm = useCrm();
  const canUpdate = crm.hasPermission(CRM_PERMISSIONS.companyUpdate);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [defaults, setDefaults] = useState<CrmCompanyLetterhead>(EMPTY_LETTERHEAD);
  const [form, setForm] = useState<CrmCompanyLetterhead>(EMPTY_LETTERHEAD);
  const [logo, setLogo] = useState<LogoChoice>({ kind: "keep" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchCompanyProfile()
      .then((profile) => {
        if (cancelled) return;
        setDefaults(profile.defaults);
        setForm(profile.saved);
        setLogo({ kind: "keep" });
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Unable to load the company profile");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const preview =
    logo.kind === "replace" ? logo.dataUrl : logo.kind === "clear" ? defaults.logoUrl : form.logoUrl || defaults.logoUrl;

  const applyProfile = (profile: CrmCompanyProfile) => {
    setDefaults(profile.defaults);
    setForm(profile.saved);
    setLogo({ kind: "keep" });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!canUpdate) return;
    setBusy(true);
    try {
      const profile = await updateCompanyProfile({
        name: form.name,
        details: form.details,
        contactName: form.contactName,
        contactMobile: form.contactMobile,
        ...(logo.kind === "replace" ? { logo: logo.dataUrl } : logo.kind === "clear" ? { logo: null } : {}),
      });
      applyProfile(profile);
      toast.success("Company profile saved");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to save the company profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModulePage crumb="Company">
      {status === "loading" ? (
        <p className="text-sm text-muted-foreground" aria-busy="true">
          Loading company profile
        </p>
      ) : null}
      {status === "error" ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {status === "ready" ? (
        <Card className="mx-auto max-w-3xl rounded-2xl shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Invoice company</CardTitle>
            <CardDescription>
              Printed on every invoice. Leave a field blank to use the value from the server environment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void save(event)} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field id="company-name" label="Company name">
                  <Input
                    id="company-name"
                    className="rounded-xl"
                    value={form.name}
                    placeholder={defaults.name || "Company name"}
                    disabled={!canUpdate}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="company-logo" label="Logo">
                  <div className="flex flex-wrap items-center gap-3">
                    {preview ? (
                      <img src={preview} alt="" className="h-16 w-16 rounded-xl border object-contain" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl border text-xs text-muted-foreground">
                        None
                      </div>
                    )}
                    <Input
                      id="company-logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="max-w-xs rounded-xl"
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
                    />
                    {canUpdate && (form.logoUrl || logo.kind === "replace") ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setLogo({ kind: "clear" })}
                      >
                        Use environment logo
                      </Button>
                    ) : null}
                  </div>
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="company-details" label="Organization details">
                  <Textarea
                    id="company-details"
                    className="min-h-28 rounded-xl"
                    value={form.details}
                    placeholder={defaults.details || "Address, GSTIN, and other details printed under the name"}
                    disabled={!canUpdate}
                    onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
                  />
                </Field>
              </div>
              <Field id="company-contact-name" label="Contact person">
                <Input
                  id="company-contact-name"
                  className="rounded-xl"
                  value={form.contactName}
                  placeholder={defaults.contactName || "Contact person"}
                  disabled={!canUpdate}
                  onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
                />
              </Field>
              <Field id="company-contact-mobile" label="Mobile no.">
                <Input
                  id="company-contact-mobile"
                  className="rounded-xl"
                  value={form.contactMobile}
                  placeholder={defaults.contactMobile || "Mobile no."}
                  disabled={!canUpdate}
                  onChange={(event) => setForm((current) => ({ ...current, contactMobile: event.target.value }))}
                />
              </Field>
              {canUpdate ? (
                <div className="sm:col-span-2">
                  <Button type="submit" className="rounded-xl" disabled={busy}>
                    Save company
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  An admin or manager can change these details.
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      ) : null}
    </ModulePage>
  );
}
