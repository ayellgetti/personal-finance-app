import {
  LayoutDashboard,
  Users,
  FolderKanban,
  PhoneCall,
  Building2,
  Wallet,
  Receipt,
  Send,
  ListTodo,
  Bell,
  CalendarDays,
  Shield,
  Landmark,
} from "lucide-react";
import { CRM_PERMISSIONS, type CrmViewId } from "@/types/crm";

export type NavItem = {
  id: CrmViewId;
  label: string;
  icon: typeof LayoutDashboard;
  group: string;
  permission?: string;
};

export const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, group: "Overview" },
  { id: "contacts", label: "Contacts", icon: Users, group: "Pipeline" },
  { id: "enquiries", label: "Enquiries", icon: FolderKanban, group: "Pipeline" },
  { id: "followUps", label: "Follow-ups", icon: PhoneCall, group: "Pipeline" },
  { id: "clients", label: "Booked", icon: Building2, group: "Pipeline" },
  { id: "payments", label: "Payments", icon: Wallet, group: "Pipeline" },
  { id: "invoices", label: "Invoices", icon: Receipt, group: "Pipeline" },
  { id: "tasks", label: "Tasks", icon: ListTodo, group: "Work" },
  { id: "reminders", label: "Reminders", icon: Bell, group: "Work" },
  { id: "communications", label: "Communications", icon: Send, group: "Work" },
  { id: "users", label: "Users", icon: Users, group: "Admin", permission: CRM_PERMISSIONS.usersRead },
  { id: "roles", label: "Roles", icon: Shield, group: "Admin", permission: CRM_PERMISSIONS.rolesRead },
  { id: "company", label: "Company", icon: Landmark, group: "Admin", permission: CRM_PERMISSIONS.companyRead },
];

export const NAV_GROUPS = ["Overview", "Pipeline", "Work", "Admin"];

export function isNavItemVisible(item: NavItem, permissions: readonly string[]): boolean {
  if (!item.permission) return true;
  return permissions.includes(item.permission);
}

export function visibleNavItems(permissions: readonly string[]): NavItem[] {
  return NAV.filter((item) => isNavItemVisible(item, permissions));
}
