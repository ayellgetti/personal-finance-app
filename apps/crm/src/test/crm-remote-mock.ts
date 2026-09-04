import { vi } from "vitest";
import {
  ALL_CRM_PERMISSIONS,
  type CrmClient,
  type CrmContact,
  type CrmEnquiry,
  type CrmMe,
  type CrmPaginated,
  type CrmTask,
  type CrmTaskStatus,
} from "@/types/crm";

export const emptyPage = <T,>(items: T[] = []): CrmPaginated<T> => ({
  items,
  pagination: {
    total: items.length,
    page: 1,
    limit: 25,
    totalPages: items.length ? 1 : 0,
    hasNextPage: false,
    hasPreviousPage: false,
  },
});

export const adminMe: CrmMe = {
  user: {
    id: "user-1",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    mobileNo: "+919999999999",
  },
  roles: [{ id: "role-admin", name: "Admin", slug: "admin" }],
  permissions: [...ALL_CRM_PERMISSIONS],
};

export const fetchCrmMe = vi.fn(async () => adminMe);
export const fetchDashboard = vi.fn(async () => ({
  contactsByType: { lead: 0, client: 0, vendor: 0, employee: 0 },
  enquiries: { open: 0, won: 0, lost: 0 },
  overdueFollowUps: 0,
  paymentsPaidThisMonth: 0,
  tasksByStatus: { todo: 0, in_progress: 0, in_review: 0, done: 0 },
}));
export const listContacts = vi.fn(async (query?: { type?: string; search?: string; page?: number; limit?: number }) => {
  void query;
  return emptyPage<CrmContact>();
});
export const createContact = vi.fn();
export const updateContact = vi.fn();
export const removeContact = vi.fn();
export const listEnquiries = vi.fn(async (query?: { status?: string; page?: number; limit?: number }) => {
  void query;
  return emptyPage<CrmEnquiry>();
});
export const createEnquiry = vi.fn();
export const updateEnquiry = vi.fn();
export const removeEnquiry = vi.fn();
export const convertEnquiry = vi.fn();
export const listFollowUps = vi.fn(async () => emptyPage());
export const createFollowUp = vi.fn();
export const updateFollowUp = vi.fn();
export const removeFollowUp = vi.fn();
export const listClients = vi.fn(async (query?: { status?: string; search?: string; page?: number; limit?: number }) => {
  void query;
  return emptyPage<CrmClient>();
});
export const createClient = vi.fn();
export const updateClient = vi.fn();
export const removeClient = vi.fn();
export const listPayments = vi.fn(async () => emptyPage());
export const createPayment = vi.fn();
export const updatePayment = vi.fn();
export const removePayment = vi.fn();
export const listTasks = vi.fn(async (query?: { status?: string; page?: number; limit?: number }) => {
  void query;
  return emptyPage<CrmTask>();
});
export const createTask = vi.fn();
export const updateTask = vi.fn();
export const updateTaskStatus = vi.fn(async (id: string, status: CrmTaskStatus): Promise<CrmTask> => ({
  id,
  title: "",
  description: null,
  status,
  assigneeId: null,
  dueAt: null,
  contactId: null,
  enquiryId: null,
}));
export const removeTask = vi.fn();
export const listCalendar = vi.fn(async () => ({ items: [] }));
export const createCalendarEvent = vi.fn();
export const updateCalendarEvent = vi.fn();
export const removeCalendarEvent = vi.fn();
export const listCrmUsers = vi.fn(async () => emptyPage());
export const createCrmUser = vi.fn();
export const updateCrmUser = vi.fn();
export const listRoles = vi.fn(async () => []);
export const listPermissions = vi.fn(async () => []);
export const updateRolePermissions = vi.fn();
