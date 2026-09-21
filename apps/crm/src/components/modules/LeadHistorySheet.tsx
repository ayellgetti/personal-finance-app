import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EnquiriesTab } from "@/components/modules/ContactViewSheet";
import { SideSheet } from "@/components/modules/shared";
import { CONTACT_TYPE_LABELS } from "@/lib/crm/display";
import { fetchContactDetail, listEnquiries, listFollowUps } from "@/lib/crm/remote";
import { useCrm } from "@/lib/crm/store";
import {
  CRM_PERMISSIONS,
  type CrmContact,
  type CrmEnquiryWithFollowUps,
} from "@/types/crm";

export type LeadHistoryTarget = {
  contactId: string;
  /** Enquiry to open first; other enquiries for the same contact stay collapsed. */
  enquiryId: string | null;
  /** Shown in the header until the contact loads. */
  title?: string;
};

type LeadHistory = {
  contact: CrmContact | null;
  enquiries: CrmEnquiryWithFollowUps[];
};

type HistoryPermissions = {
  contacts: boolean;
  enquiries: boolean;
  followUps: boolean;
};

async function loadLeadHistory(contactId: string, can: HistoryPermissions): Promise<LeadHistory> {
  if (can.contacts) {
    const detail = await fetchContactDetail(contactId);
    return { contact: detail.contact, enquiries: detail.enquiries };
  }

  if (!can.enquiries) {
    throw new Error("You do not have permission to view this lead.");
  }

  const [enquiriesPage, followUpsPage] = await Promise.all([
    listEnquiries({ contactId, limit: 100 }),
    can.followUps ? listFollowUps({ contactId, limit: 100 }) : Promise.resolve(null),
  ]);
  const followUps = followUpsPage?.items ?? [];
  return {
    contact: null,
    enquiries: enquiriesPage.items.map((enquiry) => ({
      ...enquiry,
      followUps: followUps.filter((followUp) => followUp.enquiryId === enquiry.id),
    })),
  };
}

export function LeadHistorySheet({
  lead,
  onClose,
  onOpenContact,
}: {
  lead: LeadHistoryTarget | null;
  onClose: () => void;
  onOpenContact?: (contactId: string) => void;
}) {
  const crm = useCrm();
  const canContacts = crm.hasPermission(CRM_PERMISSIONS.contactsRead);
  const [history, setHistory] = useState<LeadHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const contactId = lead?.contactId ?? null;
  const enquiryId = lead?.enquiryId ?? null;

  useEffect(() => {
    if (!contactId) {
      setHistory(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void loadLeadHistory(contactId, {
      contacts: canContacts,
      enquiries: crm.hasPermission(CRM_PERMISSIONS.enquiriesRead),
      followUps: crm.hasPermission(CRM_PERMISSIONS.followUpsRead),
    })
      .then((next) => {
        if (cancelled) return;
        setHistory(next);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setHistory(null);
        setError(caught instanceof Error ? caught.message : "Unable to load lead history");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId, reloadToken]);

  const enquiries = useMemo(() => {
    const items = history?.enquiries ?? [];
    if (!enquiryId) return items;
    const focused = items.filter((enquiry) => enquiry.id === enquiryId);
    if (focused.length === 0) return items;
    return [...focused, ...items.filter((enquiry) => enquiry.id !== enquiryId)];
  }, [history, enquiryId]);

  const contact = history?.contact ?? null;
  const description = contact
    ? `${CONTACT_TYPE_LABELS[contact.type]} · ${contact.mobile}`
    : "Complete history for this lead";

  return (
    <SideSheet
      open={Boolean(lead)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={contact?.name ?? lead?.title ?? "Lead history"}
      description={description}
      className="sm:max-w-xl"
      footer={
        onOpenContact && canContacts && contactId ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenContact(contactId)}
          >
            Open contact
          </Button>
        ) : null
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setReloadToken((token) => token + 1)}
          >
            Try again
          </Button>
        </div>
      ) : (
        <EnquiriesTab key={enquiryId ?? contactId ?? "lead"} enquiries={enquiries} focusEnquiryId={enquiryId} />
      )}
    </SideSheet>
  );
}
