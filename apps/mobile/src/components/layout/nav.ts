import {
  Bell,
  Building2,
  CalendarDays,
  FolderKanban,
  Home,
  ListTodo,
  PhoneCall,
  Shield,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { CRM_PERMISSIONS } from "@/types/crm";

export type NavItem = {
  to: string;
  label: string;
  icon: typeof Home;
  permission?: string;
};

/** The five bottom tabs. The bar always renders five slots so its layout never shifts. */
export const TABS: NavItem[] = [
  { to: "/", label: "Home", icon: Home, permission: CRM_PERMISSIONS.dashboardRead },
  { to: "/enquiries", label: "Enquiries", icon: FolderKanban, permission: CRM_PERMISSIONS.enquiriesRead },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, permission: CRM_PERMISSIONS.calendarRead },
  { to: "/booked", label: "Booked", icon: Building2, permission: CRM_PERMISSIONS.clientsRead },
  { to: "/payments", label: "Payments", icon: Wallet, permission: CRM_PERMISSIONS.paymentsRead },
];

/** Profile lives in the header, beside the plus button, so the tab bar can hold Booked and Payments. */
export const PROFILE_ITEM: NavItem = { to: "/profile", label: "Profile", icon: User };

/** Destinations that do not fit in the tab bar; reachable from the header menu drawer. */
export const DRAWER_ITEMS: NavItem[] = [
  { to: "/contacts", label: "Contacts", icon: Users, permission: CRM_PERMISSIONS.contactsRead },
  { to: "/follow-ups", label: "Follow-ups", icon: PhoneCall, permission: CRM_PERMISSIONS.followUpsRead },
  { to: "/tasks", label: "Tasks", icon: ListTodo, permission: CRM_PERMISSIONS.tasksRead },
  { to: "/reminders", label: "Reminders", icon: Bell, permission: CRM_PERMISSIONS.tasksRead },
  { to: "/users", label: "Users", icon: Users, permission: CRM_PERMISSIONS.usersRead },
  { to: "/roles", label: "Roles", icon: Shield, permission: CRM_PERMISSIONS.rolesRead },
];

export function hasPermission(item: NavItem, permissions: readonly string[]): boolean {
  if (!item.permission) return true;
  return permissions.includes(item.permission);
}

export function visibleDrawerItems(permissions: readonly string[]): NavItem[] {
  return DRAWER_ITEMS.filter((item) => hasPermission(item, permissions));
}
