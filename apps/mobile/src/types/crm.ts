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
  enquiriesRead: "crm.enquiries.read",
  enquiriesCreate: "crm.enquiries.create",
  enquiriesUpdate: "crm.enquiries.update",
  followUpsRead: "crm.followups.read",
  followUpsCreate: "crm.followups.create",
  clientsRead: "crm.clients.read",
  paymentsRead: "crm.payments.read",
  paymentsCreate: "crm.payments.create",
  tasksRead: "crm.tasks.read",
  tasksCreate: "crm.tasks.create",
  calendarRead: "crm.calendar.read",
  calendarCreate: "crm.calendar.create",
  usersRead: "crm.users.read",
  rolesRead: "crm.roles.read",
} as const;

export type CrmPermissionCode = (typeof CRM_PERMISSIONS)[keyof typeof CRM_PERMISSIONS];

export const CRM_CONTACT_TYPES = ["lead", "client", "vendor", "employee"] as const;
export type CrmContactType = (typeof CRM_CONTACT_TYPES)[number];

export const CRM_ENQUIRY_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "discussion",
  "quotation_sent",
  "negotiation",
  "schedule_meeting",
  "closed",
] as const;
export type CrmEnquiryStatus = (typeof CRM_ENQUIRY_STATUSES)[number];

export const CRM_ENQUIRY_DUE_DATE_WINDOWS = [
  "within_7_days",
  "within_15_days",
  "within_1_month",
  "within_2_months",
  "within_3_months",
  "within_6_months",
] as const;
export type CrmEnquiryDueDateWindow = (typeof CRM_ENQUIRY_DUE_DATE_WINDOWS)[number];

export const CRM_TASK_STATUSES = ["todo", "in_progress", "in_review", "done"] as const;
export type CrmTaskStatus = (typeof CRM_TASK_STATUSES)[number];

export const CRM_CLIENT_STATUSES = ["active", "inactive"] as const;
export type CrmClientStatus = (typeof CRM_CLIENT_STATUSES)[number];

export const CRM_PAYMENT_TYPES = ["INCOME", "EXPENSE"] as const;
export type CrmPaymentType = (typeof CRM_PAYMENT_TYPES)[number];

export const CRM_PAYMENT_MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE"] as const;
export type CrmPaymentMode = (typeof CRM_PAYMENT_MODES)[number];

export const CRM_PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type CrmPaymentStatus = (typeof CRM_PAYMENT_STATUSES)[number];

export const CRM_PAYMENT_REFERENCE_TYPES = ["client", "vendor"] as const;
export type CrmPaymentReferenceType = (typeof CRM_PAYMENT_REFERENCE_TYPES)[number];

export const CRM_EVENT_SLOTS = ["morning", "evening", "full_day"] as const;
export type CrmEventSlot = (typeof CRM_EVENT_SLOTS)[number];

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
  closedReason: string | null;
  expectedValue: number | null;
  assignedToId: string | null;
  notes: string | null;
  dueDateWindow: CrmEnquiryDueDateWindow | null;
  dueDate: string | null;
  nextFollowupDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

// Follow-ups are activity logs for enquiries; their "stage" mirrors the enquiry stage.
export type CrmFollowUp = {
  id: string;
  enquiryId: string;
  contactId: string;
  stage: CrmEnquiryStatus;
  dueAt: string;
  nextFollowupDate: string | null;
  notes: string | null;
};

export type CrmEnquiryWithFollowUps = CrmEnquiry & {
  followUps: CrmFollowUp[];
};

export type CrmClient = {
  id: string;
  contactId: string;
  status: CrmClientStatus;
  billingName: string;
  gstin: string | null;
  convertedFromEnquiryId: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type CrmPayment = {
  id: string;
  referenceType: CrmPaymentReferenceType;
  referenceId: string;
  enquiryId: string | null;
  amount: number;
  currency: string;
  type: CrmPaymentType;
  mode: CrmPaymentMode;
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

export type CrmCalendarKind = "task" | "event" | "booking" | "followup";

export type CrmCalendarItem = {
  kind: CrmCalendarKind;
  id: string;
  title: string;
  at: string;
  endsAt: string | null;
  contactId: string | null;
  enquiryId: string | null;
  slot?: CrmEventSlot | null;
  notes?: string | null;
};

export type CrmCalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  slot: CrmEventSlot | null;
  contactId: string | null;
  enquiryId: string | null;
  assigneeId: string | null;
  notes: string | null;
};

export type CrmDashboardDueEnquiry = {
  id: string;
  title: string;
  dueDate: string | null;
  contactId: string;
};

export type CrmDashboard = {
  contactsByType: Record<CrmContactType, number>;
  enquiries: {
    open: number;
    closed: number;
  };
  leadsGeneratedToday: number;
  customerDueToday: number;
  customerDueItems: CrmDashboardDueEnquiry[];
  overdueFollowUps: number;
  followUpsToday: number;
  paymentsPaidThisMonth: number;
  paymentsIncomeThisMonth: number;
  paymentsExpenseThisMonth: number;
  tasksByStatus: Record<CrmTaskStatus, number>;
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
  closedReason?: string | null;
  expectedValue?: number | null;
  assignedToId?: string | null;
  notes?: string | null;
  dueDate: string;
};

export type CreateFollowUpInput = {
  enquiryId: string;
  stage: CrmEnquiryStatus;
  dueAt: string;
  nextFollowupDate: string;
  notes?: string | null;
};

export type CreatePaymentInput = {
  referenceType: CrmPaymentReferenceType;
  referenceId: string;
  enquiryId?: string | null;
  amount: number;
  currency?: string;
  type?: CrmPaymentType;
  mode: CrmPaymentMode;
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
  slot?: CrmEventSlot | null;
  contactId?: string | null;
  enquiryId?: string | null;
  assigneeId?: string | null;
  notes?: string | null;
};
