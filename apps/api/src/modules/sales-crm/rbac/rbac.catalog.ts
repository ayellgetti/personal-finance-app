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
  "crm.clients.read": "View clients",
  "crm.clients.create": "Create clients",
  "crm.clients.update": "Update clients",
  "crm.clients.delete": "Delete clients",
  "crm.payments.read": "View payments",
  "crm.payments.create": "Create payments",
  "crm.payments.update": "Update payments",
  "crm.payments.delete": "Delete payments",
  "crm.tasks.read": "View tasks",
  "crm.tasks.create": "Create tasks",
  "crm.tasks.update": "Update tasks",
  "crm.tasks.delete": "Delete tasks",
  "crm.calendar.read": "View calendar",
  "crm.calendar.create": "Create calendar events",
  "crm.calendar.update": "Update calendar events",
  "crm.calendar.delete": "Delete calendar events",
  "crm.users.read": "View CRM users",
  "crm.users.create": "Create CRM users",
  "crm.users.update": "Update CRM users",
  "crm.roles.read": "View roles",
  "crm.roles.update": "Update roles",
};

export const CRM_PERMISSIONS: { code: CrmPermissionCode; name: string }[] =
  CRM_PERMISSION_CODES.map((code) => ({
    code,
    name: PERMISSION_NAMES[code],
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
