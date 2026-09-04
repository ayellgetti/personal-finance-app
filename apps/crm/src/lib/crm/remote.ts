import { api } from "@/lib/api";
import type {
  ConvertedEnquiry,
  CreateCalendarEventInput,
  CreateClientInput,
  CreateContactInput,
  CreateCrmUserInput,
  CreateEnquiryInput,
  CreateFollowUpInput,
  CreatePaymentInput,
  CreateTaskInput,
  CrmCalendarEvent,
  CrmCalendarItem,
  CrmClient,
  CrmClientStatus,
  CrmContact,
  CrmContactType,
  CrmDashboard,
  CrmEnquiry,
  CrmEnquiryStatus,
  CrmFollowUp,
  CrmMe,
  CrmPaginated,
  CrmPagination,
  CrmPayment,
  CrmPaymentMode,
  CrmPaymentStatus,
  CrmPaymentType,
  CrmPermission,
  CrmRoleDetail,
  CrmStaffUser,
  CrmTask,
  CrmTaskStatus,
  UpdateCrmUserInput,
} from "@/types/crm";

export type ListContactsQuery = {
  page?: number;
  limit?: number;
  type?: CrmContactType;
  search?: string;
};

export type ListEnquiriesQuery = {
  page?: number;
  limit?: number;
  status?: CrmEnquiryStatus;
  contactId?: string;
  assignedToId?: string;
};

export type ListFollowUpsQuery = {
  page?: number;
  limit?: number;
  enquiryId?: string;
  contactId?: string;
  stage?: CrmEnquiryStatus;
  from?: string;
  to?: string;
};

export type ListClientsQuery = {
  page?: number;
  limit?: number;
  status?: CrmClientStatus;
  search?: string;
};

export type ListPaymentsQuery = {
  page?: number;
  limit?: number;
  clientId?: string;
  status?: CrmPaymentStatus;
  from?: string;
  to?: string;
};

export type ListTasksQuery = {
  page?: number;
  limit?: number;
  status?: CrmTaskStatus;
  assigneeId?: string;
};

export type ListCalendarQuery = {
  from: string;
  to: string;
};

export type ListCrmUsersQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

const DEFAULT_PAGINATION: CrmPagination = {
  total: 0,
  page: 1,
  limit: 25,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function toSearchParams(record: Record<string, string | number | undefined | null>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

function asIso(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function asIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  return asIso(value);
}

function asNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapPagination(raw: unknown): CrmPagination {
  if (!raw || typeof raw !== "object") return DEFAULT_PAGINATION;
  const row = raw as Record<string, unknown>;
  return {
    total: typeof row.total === "number" ? row.total : 0,
    page: typeof row.page === "number" ? row.page : 1,
    limit: typeof row.limit === "number" ? row.limit : 25,
    totalPages: typeof row.totalPages === "number" ? row.totalPages : 0,
    hasNextPage: Boolean(row.hasNextPage),
    hasPreviousPage: Boolean(row.hasPreviousPage),
  };
}

function mapContact(row: Record<string, unknown>): CrmContact {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    mobile: String(row.mobile ?? ""),
    type: row.type as CrmContactType,
    email: row.email == null ? null : String(row.email),
    companyName: row.companyName == null ? null : String(row.companyName),
    notes: row.notes == null ? null : String(row.notes),
  };
}

function mapEnquiry(row: Record<string, unknown>): CrmEnquiry {
  return {
    id: String(row.id),
    contactId: String(row.contactId),
    title: String(row.title ?? ""),
    source: String(row.source ?? ""),
    status: row.status as CrmEnquiryStatus,
    closedReason: row.closedReason == null ? null : String(row.closedReason),
    expectedValue: asNumberOrNull(row.expectedValue),
    assignedToId: row.assignedToId == null ? null : String(row.assignedToId),
    notes: row.notes == null ? null : String(row.notes),
  };
}

function mapFollowUp(row: Record<string, unknown>): CrmFollowUp {
  return {
    id: String(row.id),
    enquiryId: String(row.enquiryId),
    contactId: String(row.contactId),
    stage: row.stage as CrmEnquiryStatus,
    dueAt: asIso(row.dueAt),
    notes: row.notes == null ? null : String(row.notes),
  };
}

function mapClient(row: Record<string, unknown>): CrmClient {
  return {
    id: String(row.id),
    contactId: String(row.contactId),
    status: row.status as CrmClientStatus,
    billingName: String(row.billingName ?? ""),
    gstin: row.gstin == null ? null : String(row.gstin),
    convertedFromEnquiryId: row.convertedFromEnquiryId == null ? null : String(row.convertedFromEnquiryId),
  };
}

function mapPayment(row: Record<string, unknown>): CrmPayment {
  return {
    id: String(row.id),
    clientId: String(row.clientId),
    enquiryId: row.enquiryId == null ? null : String(row.enquiryId),
    amount: typeof row.amount === "number" ? row.amount : Number(row.amount),
    currency: String(row.currency ?? "INR"),
    type: row.type as CrmPaymentType,
    mode: row.mode as CrmPaymentMode,
    status: row.status as CrmPaymentStatus,
    paidAt: asIsoOrNull(row.paidAt),
    reference: row.reference == null ? null : String(row.reference),
  };
}

function mapTask(row: Record<string, unknown>): CrmTask {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: row.description == null ? null : String(row.description),
    status: row.status as CrmTaskStatus,
    assigneeId: row.assigneeId == null ? null : String(row.assigneeId),
    dueAt: asIsoOrNull(row.dueAt),
    contactId: row.contactId == null ? null : String(row.contactId),
    enquiryId: row.enquiryId == null ? null : String(row.enquiryId),
  };
}

function mapCalendarEvent(row: Record<string, unknown>): CrmCalendarEvent {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    startsAt: asIso(row.startsAt),
    endsAt: asIso(row.endsAt),
    contactId: row.contactId == null ? null : String(row.contactId),
    enquiryId: row.enquiryId == null ? null : String(row.enquiryId),
    assigneeId: row.assigneeId == null ? null : String(row.assigneeId),
    notes: row.notes == null ? null : String(row.notes),
  };
}

function mapCalendarItem(row: Record<string, unknown>): CrmCalendarItem {
  return {
    kind: row.kind as CrmCalendarItem["kind"],
    id: String(row.id),
    title: String(row.title ?? ""),
    at: asIso(row.at),
    endsAt: asIsoOrNull(row.endsAt),
  };
}

function mapStaffUser(row: Record<string, unknown>): CrmStaffUser {
  const roleIds = Array.isArray(row.roleIds) ? row.roleIds.map((id) => String(id)) : [];
  return {
    id: String(row.id),
    firstName: String(row.firstName ?? ""),
    lastName: String(row.lastName ?? ""),
    email: String(row.email ?? ""),
    mobileNo: String(row.mobileNo ?? ""),
    dob: asIso(row.dob ?? ""),
    gender: String(row.gender ?? ""),
    countryCode: String(row.countryCode ?? ""),
    roleIds,
  };
}

function mapRoleDetail(row: Record<string, unknown>): CrmRoleDetail {
  const permissionIds = Array.isArray(row.permissionIds)
    ? row.permissionIds.map((id) => String(id))
    : [];
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    permissionIds,
  };
}

function mapPermission(row: Record<string, unknown>): CrmPermission {
  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
  };
}

function mapDashboard(row: Record<string, unknown>): CrmDashboard {
  const contactsByType = (row.contactsByType ?? {}) as CrmDashboard["contactsByType"];
  const enquiries = (row.enquiries ?? {}) as CrmDashboard["enquiries"];
  const tasksByStatus = (row.tasksByStatus ?? {}) as CrmDashboard["tasksByStatus"];
  return {
    contactsByType,
    enquiries: {
      open: Number(enquiries.open ?? 0),
      closed: Number(enquiries.closed ?? 0),
    },
    overdueFollowUps: Number(row.overdueFollowUps ?? 0),
    paymentsPaidThisMonth: Number(row.paymentsPaidThisMonth ?? 0),
    tasksByStatus,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return {};
}

function mapPaginated<T>(raw: unknown, mapItem: (row: Record<string, unknown>) => T): CrmPaginated<T> {
  const data = asRecord(raw);
  const items = Array.isArray(data.items) ? data.items.map((item) => mapItem(asRecord(item))) : [];
  return { items, pagination: mapPagination(data.pagination) };
}

function requireField<T>(data: Record<string, unknown>, field: string): T {
  const value = data[field];
  if (value === undefined) {
    throw new Error(`Missing ${field} in response`);
  }
  return value as T;
}

export async function fetchCrmMe(): Promise<CrmMe> {
  return api<CrmMe>("/api/crm/me");
}

export async function fetchDashboard(): Promise<CrmDashboard> {
  const data = await api<Record<string, unknown>>("/api/crm/dashboard");
  return mapDashboard(asRecord(requireField(data, "dashboard")));
}

export async function listContacts(query: ListContactsQuery = {}): Promise<CrmPaginated<CrmContact>> {
  const raw = await api<unknown>(`/api/crm/contacts${toSearchParams(query)}`);
  return mapPaginated(raw, mapContact);
}

export async function createContact(input: CreateContactInput): Promise<CrmContact> {
  const data = await api<Record<string, unknown>>("/api/crm/contacts", { method: "POST", body: input });
  return mapContact(asRecord(requireField(data, "contact")));
}

export async function updateContact(id: string, input: Partial<CreateContactInput>): Promise<CrmContact> {
  const data = await api<Record<string, unknown>>(`/api/crm/contacts/${id}`, { method: "PATCH", body: input });
  return mapContact(asRecord(requireField(data, "contact")));
}

export async function removeContact(id: string): Promise<void> {
  await api("/api/crm/contacts/remove", { method: "POST", body: { id } });
}

export async function listEnquiries(query: ListEnquiriesQuery = {}): Promise<CrmPaginated<CrmEnquiry>> {
  const raw = await api<unknown>(`/api/crm/enquiries${toSearchParams(query)}`);
  return mapPaginated(raw, mapEnquiry);
}

export async function createEnquiry(input: CreateEnquiryInput): Promise<CrmEnquiry> {
  const data = await api<Record<string, unknown>>("/api/crm/enquiries", { method: "POST", body: input });
  return mapEnquiry(asRecord(requireField(data, "enquiry")));
}

export async function updateEnquiry(id: string, input: Partial<CreateEnquiryInput>): Promise<CrmEnquiry> {
  const data = await api<Record<string, unknown>>(`/api/crm/enquiries/${id}`, { method: "PATCH", body: input });
  return mapEnquiry(asRecord(requireField(data, "enquiry")));
}

export async function removeEnquiry(id: string): Promise<void> {
  await api("/api/crm/enquiries/remove", { method: "POST", body: { id } });
}

export async function convertEnquiry(id: string, body: { billingName?: string } = {}): Promise<ConvertedEnquiry> {
  const data = await api<Record<string, unknown>>(`/api/crm/enquiries/${id}/convert`, {
    method: "POST",
    body,
  });
  return {
    enquiry: mapEnquiry(asRecord(requireField(data, "enquiry"))),
    contact: mapContact(asRecord(requireField(data, "contact"))),
    client: mapClient(asRecord(requireField(data, "client"))),
  };
}

export async function listFollowUps(query: ListFollowUpsQuery = {}): Promise<CrmPaginated<CrmFollowUp>> {
  const raw = await api<unknown>(`/api/crm/followups${toSearchParams(query)}`);
  return mapPaginated(raw, mapFollowUp);
}

export async function createFollowUp(input: CreateFollowUpInput): Promise<CrmFollowUp> {
  const data = await api<Record<string, unknown>>("/api/crm/followups", { method: "POST", body: input });
  return mapFollowUp(asRecord(requireField(data, "followUp")));
}

export async function updateFollowUp(id: string, input: Partial<CreateFollowUpInput>): Promise<CrmFollowUp> {
  const data = await api<Record<string, unknown>>(`/api/crm/followups/${id}`, { method: "PATCH", body: input });
  return mapFollowUp(asRecord(requireField(data, "followUp")));
}

export async function removeFollowUp(id: string): Promise<void> {
  await api("/api/crm/followups/remove", { method: "POST", body: { id } });
}

export async function listClients(query: ListClientsQuery = {}): Promise<CrmPaginated<CrmClient>> {
  const raw = await api<unknown>(`/api/crm/clients${toSearchParams(query)}`);
  return mapPaginated(raw, mapClient);
}

export async function createClient(input: CreateClientInput): Promise<CrmClient> {
  const data = await api<Record<string, unknown>>("/api/crm/clients", { method: "POST", body: input });
  return mapClient(asRecord(requireField(data, "client")));
}

export async function updateClient(id: string, input: Partial<CreateClientInput>): Promise<CrmClient> {
  const data = await api<Record<string, unknown>>(`/api/crm/clients/${id}`, { method: "PATCH", body: input });
  return mapClient(asRecord(requireField(data, "client")));
}

export async function removeClient(id: string): Promise<void> {
  await api("/api/crm/clients/remove", { method: "POST", body: { id } });
}

export async function listPayments(query: ListPaymentsQuery = {}): Promise<CrmPaginated<CrmPayment>> {
  const raw = await api<unknown>(`/api/crm/payments${toSearchParams(query)}`);
  return mapPaginated(raw, mapPayment);
}

export async function createPayment(input: CreatePaymentInput): Promise<CrmPayment> {
  const data = await api<Record<string, unknown>>("/api/crm/payments", { method: "POST", body: input });
  return mapPayment(asRecord(requireField(data, "payment")));
}

export async function updatePayment(id: string, input: Partial<CreatePaymentInput>): Promise<CrmPayment> {
  const data = await api<Record<string, unknown>>(`/api/crm/payments/${id}`, { method: "PATCH", body: input });
  return mapPayment(asRecord(requireField(data, "payment")));
}

export async function removePayment(id: string): Promise<void> {
  await api("/api/crm/payments/remove", { method: "POST", body: { id } });
}

export async function listTasks(query: ListTasksQuery = {}): Promise<CrmPaginated<CrmTask>> {
  const raw = await api<unknown>(`/api/crm/tasks${toSearchParams(query)}`);
  return mapPaginated(raw, mapTask);
}

export async function createTask(input: CreateTaskInput): Promise<CrmTask> {
  const data = await api<Record<string, unknown>>("/api/crm/tasks", { method: "POST", body: input });
  return mapTask(asRecord(requireField(data, "task")));
}

export async function updateTask(id: string, input: Partial<CreateTaskInput>): Promise<CrmTask> {
  const data = await api<Record<string, unknown>>(`/api/crm/tasks/${id}`, { method: "PATCH", body: input });
  return mapTask(asRecord(requireField(data, "task")));
}

export async function updateTaskStatus(id: string, status: CrmTaskStatus): Promise<CrmTask> {
  const data = await api<Record<string, unknown>>(`/api/crm/tasks/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
  return mapTask(asRecord(requireField(data, "task")));
}

export async function removeTask(id: string): Promise<void> {
  await api("/api/crm/tasks/remove", { method: "POST", body: { id } });
}

export async function listCalendar(query: ListCalendarQuery): Promise<{ items: CrmCalendarItem[] }> {
  const raw = await api<Record<string, unknown>>(
    `/api/crm/calendar${toSearchParams({ from: query.from, to: query.to })}`,
  );
  const items = Array.isArray(raw.items) ? raw.items.map((item) => mapCalendarItem(asRecord(item))) : [];
  return { items };
}

export async function createCalendarEvent(input: CreateCalendarEventInput): Promise<CrmCalendarEvent> {
  const data = await api<Record<string, unknown>>("/api/crm/calendar/events", { method: "POST", body: input });
  return mapCalendarEvent(asRecord(requireField(data, "event")));
}

export async function updateCalendarEvent(
  id: string,
  input: Partial<CreateCalendarEventInput>,
): Promise<CrmCalendarEvent> {
  const data = await api<Record<string, unknown>>(`/api/crm/calendar/events/${id}`, {
    method: "PATCH",
    body: input,
  });
  return mapCalendarEvent(asRecord(requireField(data, "event")));
}

export async function removeCalendarEvent(id: string): Promise<void> {
  await api("/api/crm/calendar/events/remove", { method: "POST", body: { id } });
}

export async function listCrmUsers(query: ListCrmUsersQuery = {}): Promise<CrmPaginated<CrmStaffUser>> {
  const raw = await api<unknown>(`/api/crm/users${toSearchParams(query)}`);
  return mapPaginated(raw, mapStaffUser);
}

export async function createCrmUser(input: CreateCrmUserInput): Promise<CrmStaffUser> {
  const data = await api<Record<string, unknown>>("/api/crm/users", { method: "POST", body: input });
  return mapStaffUser(asRecord(requireField(data, "user")));
}

export async function updateCrmUser(id: string, input: UpdateCrmUserInput): Promise<CrmStaffUser> {
  const data = await api<Record<string, unknown>>(`/api/crm/users/${id}`, { method: "PATCH", body: input });
  return mapStaffUser(asRecord(requireField(data, "user")));
}

export async function listRoles(): Promise<CrmRoleDetail[]> {
  const data = await api<Record<string, unknown>>("/api/crm/roles");
  const roles = Array.isArray(data.roles) ? data.roles : [];
  return roles.map((role) => mapRoleDetail(asRecord(role)));
}

export async function listPermissions(): Promise<CrmPermission[]> {
  const data = await api<Record<string, unknown>>("/api/crm/permissions");
  const permissions = Array.isArray(data.permissions) ? data.permissions : [];
  return permissions.map((permission) => mapPermission(asRecord(permission)));
}

export async function updateRolePermissions(id: string, permissionIds: string[]): Promise<CrmRoleDetail> {
  const data = await api<Record<string, unknown>>(`/api/crm/roles/${id}`, {
    method: "PATCH",
    body: { permissionIds },
  });
  return mapRoleDetail(asRecord(requireField(data, "role")));
}
