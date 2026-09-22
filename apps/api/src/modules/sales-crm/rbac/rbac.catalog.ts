import { z } from "zod";

export const CRM_PERMISSION_CODES = [
  "crm.dashboard.read",
  "crm.contacts.read",
  "crm.contacts.create",
  "crm.contacts.update",
  "crm.contacts.delete",
  "crm.enquiries.read",
  "crm.enquiries.create",
  "crm.enquiries.update",
  "crm.enquiries.delete",
  "crm.enquiries.convert",
  "crm.followups.read",
  "crm.followups.create",
  "crm.followups.update",
  "crm.followups.delete",
  "crm.clients.read",
  "crm.clients.create",
  "crm.clients.update",
  "crm.clients.delete",
  "crm.payments.read",
  "crm.payments.create",
  "crm.payments.update",
  "crm.payments.delete",
  "crm.tasks.read",
  "crm.tasks.create",
  "crm.tasks.update",
  "crm.tasks.delete",
  "crm.calendar.read",
  "crm.calendar.create",
  "crm.calendar.update",
  "crm.calendar.delete",
  "crm.users.read",
  "crm.users.create",
  "crm.users.update",
  "crm.roles.read",
  "crm.roles.update",
] as const;

export type CrmPermissionCode = (typeof CRM_PERMISSION_CODES)[number];

export const crmPermissionCodeSchema = z.enum(CRM_PERMISSION_CODES);

export const CRM_ROLE_SLUGS = ["admin", "manager", "sales", "viewer"] as const;

export type CrmRoleSlug = (typeof CRM_ROLE_SLUGS)[number];

export const crmRoleSlugSchema = z.enum(CRM_ROLE_SLUGS);

export const CRM_ROLE_NAMES: Record<CrmRoleSlug, string> = {
  admin: "Admin",
  manager: "Manager",
  sales: "Sales",
  viewer: "Viewer",
};

const PERMISSION_NAMES: Record<CrmPermissionCode, string> = {
  "crm.dashboard.read": "View dashboard",
  "crm.contacts.read": "View contacts",
  "crm.contacts.create": "Create contacts",
  "crm.contacts.update": "Update contacts",
  "crm.contacts.delete": "Delete contacts",
  "crm.enquiries.read": "View enquiries",
  "crm.enquiries.create": "Create enquiries",
  "crm.enquiries.update": "Update enquiries",
  "crm.enquiries.delete": "Delete enquiries",
  "crm.enquiries.convert": "Convert enquiries",
  "crm.followups.read": "View follow-ups",
  "crm.followups.create": "Create follow-ups",
  "crm.followups.update": "Update follow-ups",
  "crm.followups.delete": "Delete follow-ups",
  "crm.clients.read": "View booked records",
  "crm.clients.create": "Create booked records",
  "crm.clients.update": "Update booked records",
  "crm.clients.delete": "Delete booked records",
  "crm.payments.read": "View payments",
  "crm.payments.create": "Create payments",
  "crm.payments.update": "Update payments",
  "crm.payments.delete": "Delete payments",
  "crm.tasks.read": "View tasks",
  "crm.tasks.create": "Create tasks",
  "crm.tasks.update": "Update tasks",
  "crm.tasks.delete": "Delete tasks",
  "crm.calendar.read": "View calendar",
  "crm.calendar.create": "Create calendar reminders",
  "crm.calendar.update": "Update calendar events",
  "crm.calendar.delete": "Delete calendar events",
  "crm.users.read": "View CRM users",
  "crm.users.create": "Create CRM users",
  "crm.users.update": "Update CRM users",
  "crm.roles.read": "View roles",
  "crm.roles.update": "Update roles",
};

const PERMISSION_DESCRIPTIONS: Record<CrmPermissionCode, string> = {
  "crm.dashboard.read": "Open the CRM dashboard and see summary counts and due items.",
  "crm.contacts.read": "See contact records and open a contact’s details.",
  "crm.contacts.create": "Add new contacts to the CRM.",
  "crm.contacts.update": "Change contact details such as name, type, and notes.",
  "crm.contacts.delete": "Remove contacts from the CRM.",
  "crm.enquiries.read": "See enquiries and open enquiry details.",
  "crm.enquiries.create": "Log new enquiries against a contact.",
  "crm.enquiries.update": "Change enquiry details, stage, and notes.",
  "crm.enquiries.delete": "Remove enquiries that are not locked by a paid booking.",
  "crm.enquiries.convert": "Convert an enquiry into a booked record with event dates.",
  "crm.followups.read": "See follow-ups and the follow-up calendar.",
  "crm.followups.create": "Schedule follow-ups on enquiries or contacts.",
  "crm.followups.update": "Change follow-up dates, notes, and status.",
  "crm.followups.delete": "Remove follow-up records.",
  "crm.clients.read": "See booked records and their current booking dates.",
  "crm.clients.create": "Create booked records for a contact.",
  "crm.clients.update": "Change booked record details and status.",
  "crm.clients.delete": "Remove booked records that are not locked by a paid booking.",
  "crm.payments.read": "See payment records linked to contacts and bookings.",
  "crm.payments.create": "Record new payments.",
  "crm.payments.update": "Change payment amounts, status, and notes.",
  "crm.payments.delete": "Remove payment records.",
  "crm.tasks.read": "See tasks on the board and in lists.",
  "crm.tasks.create": "Create tasks and assign due dates.",
  "crm.tasks.update": "Change task details and move them between stages.",
  "crm.tasks.delete": "Remove tasks.",
  "crm.calendar.read": "See the calendar of tasks, bookings, and events.",
  "crm.calendar.create": "Create calendar reminders.",
  "crm.calendar.update": "Change event times, notes, and booking details.",
  "crm.calendar.delete": "Remove calendar events that are not locked by a paid booking.",
  "crm.users.read": "See CRM staff accounts and their assigned roles.",
  "crm.users.create": "Create CRM staff accounts and assign roles.",
  "crm.users.update": "Change staff profile details and role assignments.",
  "crm.roles.read": "See roles and the permissions granted to each role.",
  "crm.roles.update": "Create roles and change role names or granted permissions.",
};

export const CRM_PERMISSIONS: { code: CrmPermissionCode; name: string; description: string }[] =
  CRM_PERMISSION_CODES.map((code) => ({
    code,
    name: PERMISSION_NAMES[code],
    description: PERMISSION_DESCRIPTIONS[code],
  }));

function isSalesPermission(code: CrmPermissionCode): boolean {
  if (code === "crm.dashboard.read") {
    return true;
  }
  if (code.startsWith("crm.users.") || code.startsWith("crm.roles.")) {
    return false;
  }
  return true;
}

export const CRM_ROLE_PERMISSIONS: Record<CrmRoleSlug, readonly CrmPermissionCode[]> = {
  admin: CRM_PERMISSION_CODES,
  manager: CRM_PERMISSION_CODES.filter((code) => code !== "crm.roles.update"),
  sales: CRM_PERMISSION_CODES.filter(isSalesPermission),
  viewer: CRM_PERMISSION_CODES.filter((code) => code.endsWith(".read")),
};

export function permissionName(code: CrmPermissionCode): string {
  return PERMISSION_NAMES[code];
}

export function permissionDescription(code: string): string {
  if (code in PERMISSION_DESCRIPTIONS) {
    return PERMISSION_DESCRIPTIONS[code as CrmPermissionCode];
  }
  return permissionNameForUnknown(code);
}

function permissionNameForUnknown(code: string): string {
  if (code in PERMISSION_NAMES) {
    return PERMISSION_NAMES[code as CrmPermissionCode];
  }
  return code;
}

export function roleSlugFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
