export type CrmRole = {
  id: string;
  name: string;
  slug: string;
};

export type CrmMeUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
};

export type CrmMe = {
  user: CrmMeUser;
  roles: CrmRole[];
  permissions: string[];
};

export const CRM_PERMISSIONS = {
  dashboardRead: "crm.dashboard.read",
  contactsRead: "crm.contacts.read",
  contactsCreate: "crm.contacts.create",
  contactsUpdate: "crm.contacts.update",
  contactsDelete: "crm.contacts.delete",
  enquiriesRead: "crm.enquiries.read",
  enquiriesCreate: "crm.enquiries.create",
  enquiriesUpdate: "crm.enquiries.update",
  enquiriesDelete: "crm.enquiries.delete",
  enquiriesConvert: "crm.enquiries.convert",
  followUpsRead: "crm.followups.read",
  followUpsCreate: "crm.followups.create",
  followUpsUpdate: "crm.followups.update",
  followUpsDelete: "crm.followups.delete",
  clientsRead: "crm.clients.read",
  clientsCreate: "crm.clients.create",
  clientsUpdate: "crm.clients.update",
  clientsDelete: "crm.clients.delete",
  paymentsRead: "crm.payments.read",
  paymentsCreate: "crm.payments.create",
  paymentsUpdate: "crm.payments.update",
  paymentsDelete: "crm.payments.delete",
  tasksRead: "crm.tasks.read",
  tasksCreate: "crm.tasks.create",
  tasksUpdate: "crm.tasks.update",
  tasksDelete: "crm.tasks.delete",
  calendarRead: "crm.calendar.read",
  calendarCreate: "crm.calendar.create",
  calendarUpdate: "crm.calendar.update",
  calendarDelete: "crm.calendar.delete",
  usersRead: "crm.users.read",
  usersCreate: "crm.users.create",
  usersUpdate: "crm.users.update",
  rolesRead: "crm.roles.read",
  rolesUpdate: "crm.roles.update",
} as const;

export type CrmPermissionCode = (typeof CRM_PERMISSIONS)[keyof typeof CRM_PERMISSIONS];

export const ALL_CRM_PERMISSIONS = Object.values(CRM_PERMISSIONS);

export type CrmViewId =
  | "dashboard"
  | "contacts"
  | "enquiries"
  | "followUps"
  | "clients"
  | "payments"
  | "tasks"
  | "calendar"
  | "users"
  | "roles";

export const CRM_CONTACT_TYPES = ["lead", "client", "vendor", "employee"] as const;
export type CrmContactType = (typeof CRM_CONTACT_TYPES)[number];

export const CRM_ENQUIRY_STATUSES = ["new", "in_progress", "won", "lost", "on_hold"] as const;
export type CrmEnquiryStatus = (typeof CRM_ENQUIRY_STATUSES)[number];

export const CRM_FOLLOW_UP_STATUSES = ["pending", "completed", "cancelled"] as const;
export type CrmFollowUpStatus = (typeof CRM_FOLLOW_UP_STATUSES)[number];

export const CRM_CLIENT_STATUSES = ["active", "inactive"] as const;
export type CrmClientStatus = (typeof CRM_CLIENT_STATUSES)[number];

export const CRM_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type CrmPaymentStatus = (typeof CRM_PAYMENT_STATUSES)[number];

export const CRM_TASK_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;
export type CrmTaskStatus = (typeof CRM_TASK_STATUSES)[number];

export type CrmContact = {
  id: string;
  name: string;
  mobile: string;
  type: CrmContactType;
  email: string | null;
  companyName: string | null;
  notes: string | null;
};

export type CrmEnquiry = {
  id: string;
  contactId: string;
  title: string;
  source: string;
  status: CrmEnquiryStatus;
  expectedValue: number | null;
  assignedToId: string | null;
  notes: string | null;
};

export type CrmFollowUp = {
  id: string;
  enquiryId: string | null;
  contactId: string;
  dueAt: string;
  status: CrmFollowUpStatus;
  assignedToId: string | null;
  notes: string | null;
};

export type CrmClient = {
  id: string;
  contactId: string;
  status: CrmClientStatus;
  billingName: string;
  gstin: string | null;
  convertedFromEnquiryId: string | null;
};

export type CrmPayment = {
  id: string;
  clientId: string;
  enquiryId: string | null;
  amount: number;
  currency: string;
  method: string;
  status: CrmPaymentStatus;
  paidAt: string | null;
  reference: string | null;
};

export type CrmTask = {
  id: string;
  title: string;
  description: string | null;
  status: CrmTaskStatus;
  assigneeId: string | null;
  dueAt: string | null;
  contactId: string | null;
  enquiryId: string | null;
};

export type CrmCalendarKind = "followup" | "task" | "event";

export type CrmCalendarItem = {
  kind: CrmCalendarKind;
  id: string;
  title: string;
  at: string;
  endsAt: string | null;
};

export type CrmCalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  contactId: string | null;
  enquiryId: string | null;
  assigneeId: string | null;
  notes: string | null;
};

export type CrmDashboard = {
  contactsByType: Record<CrmContactType, number>;
  enquiries: {
    open: number;
    won: number;
    lost: number;
  };
  overdueFollowUps: number;
  paymentsPaidThisMonth: number;
  tasksByStatus: Record<CrmTaskStatus, number>;
};

export type CrmStaffUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  dob: string;
  gender: string;
  countryCode: string;
  roleIds: string[];
};

export type CrmRoleDetail = {
  id: string;
  name: string;
  slug: string;
  permissionIds: string[];
};

export type CrmPermission = {
  id: string;
  code: string;
  name: string;
};

export type CrmPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CrmPaginated<T> = {
  items: T[];
  pagination: CrmPagination;
};

export type ConvertedEnquiry = {
  enquiry: CrmEnquiry;
  contact: CrmContact;
  client: CrmClient;
};

export type CreateContactInput = {
  name: string;
  mobile: string;
  type: CrmContactType;
  email?: string | null;
  companyName?: string | null;
  notes?: string | null;
};

export type CreateEnquiryInput = {
  contactId: string;
  title: string;
  source: string;
  status?: CrmEnquiryStatus;
  expectedValue?: number | null;
  assignedToId?: string | null;
  notes?: string | null;
};

export type CreateFollowUpInput = {
  contactId: string;
  enquiryId?: string | null;
  dueAt: string;
  status?: CrmFollowUpStatus;
  assignedToId?: string | null;
  notes?: string | null;
};

export type CreateClientInput = {
  contactId: string;
  billingName: string;
  status?: CrmClientStatus;
  gstin?: string | null;
  convertedFromEnquiryId?: string | null;
};

export type CreatePaymentInput = {
  clientId: string;
  enquiryId?: string | null;
  amount: number;
  currency?: string;
  method: string;
  status?: CrmPaymentStatus;
  paidAt?: string | null;
  reference?: string | null;
};

export type CreateTaskInput = {
  title: string;
  description?: string | null;
  status?: CrmTaskStatus;
  assigneeId?: string | null;
  dueAt?: string | null;
  contactId?: string | null;
  enquiryId?: string | null;
};

export type CreateCalendarEventInput = {
  title: string;
  startsAt: string;
  endsAt: string;
  contactId?: string | null;
  enquiryId?: string | null;
  assigneeId?: string | null;
  notes?: string | null;
};

export type CreateCrmUserInput = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  countryCode: string;
  mobileNo: string;
  email: string;
  password: string;
  roleIds: string[];
};

export type UpdateCrmUserInput = {
  firstName?: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  countryCode?: string;
  mobileNo?: string;
  email?: string;
  roleIds?: string[];
};
