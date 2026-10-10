import {
  Bell,
  Building2,
  CalendarDays,
  FolderKanban,
  Home,
  LayoutDashboard,
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

/** Same groups and order as the web CRM sidebar (`apps/crm` layout nav). */
export const SIDEBAR_GROUPS = ["Overview", "Pipeline", "Work", "Admin"] as const;

export type SidebarItem = NavItem & { group: (typeof SIDEBAR_GROUPS)[number] };

export const SIDEBAR: SidebarItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, group: "Overview" },
  { to: "/contacts", label: "Contacts", icon: Users, group: "Pipeline" },
  { to: "/enquiries", label: "Enquiries", icon: FolderKanban, group: "Pipeline" },
  { to: "/follow-ups", label: "Follow-ups", icon: PhoneCall, group: "Pipeline" },
  { to: "/booked", label: "Booked", icon: Building2, group: "Pipeline" },
  { to: "/payments", label: "Payments", icon: Wallet, group: "Pipeline" },
  { to: "/tasks", label: "Tasks", icon: ListTodo, group: "Work" },
  { to: "/reminders", label: "Reminders", icon: Bell, group: "Work" },
  { to: "/users", label: "Users", icon: Users, group: "Admin", permission: CRM_PERMISSIONS.usersRead },
  { to: "/roles", label: "Roles", icon: Shield, group: "Admin", permission: CRM_PERMISSIONS.rolesRead },
];

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

export function hasPermission(item: NavItem, permissions: readonly string[]): boolean {
  if (!item.permission) return true;
  return permissions.includes(item.permission);
}

export function visibleSidebarItems(permissions: readonly string[]): SidebarItem[] {
  return SIDEBAR.filter((item) => hasPermission(item, permissions));
}
