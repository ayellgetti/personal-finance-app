import { isLocalDateKeyOnOrAfterToday } from "@/lib/mobile/booking";
import type { CreateCalendarEventInput, CreateContactInput, CreatePaymentInput, CreateTaskInput } from "@/types/crm";

const MOBILE_PATTERN = /^\+?[0-9]{7,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODE_PATTERN = /^\+[1-9]\d{0,3}$/;

export function trimmed(value: string): string {
  return value.trim();
}

export function optionalTrimmed(value: string): string | null {
  const next = value.trim();
  return next ? next : null;
}

export function validateContact(input: {
  name: string;
  mobile: string;
  email: string;
  companyName: string;
  notes: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = trimmed(input.name);
  const mobile = trimmed(input.mobile);
  const email = trimmed(input.email);
  const companyName = trimmed(input.companyName);
  if (!name || name.length > 120) errors.name = "Name is required (120 characters max)";
  if (!MOBILE_PATTERN.test(mobile)) errors.mobile = "Enter a mobile number of 7 to 15 digits";
  if (email && (!EMAIL_PATTERN.test(email) || email.length > 254)) errors.email = "Enter a valid email";
  if (companyName.length > 160) errors.companyName = "Company name is too long";
  if (input.notes.trim().length > 4000) errors.notes = "Notes are too long";
  return errors;
}

export function toContactInput(input: {
  name: string;
  mobile: string;
  type: CreateContactInput["type"];
  email: string;
  companyName: string;
  notes: string;
}): CreateContactInput {
  return {
    name: trimmed(input.name),
    mobile: trimmed(input.mobile),
    type: input.type,
    email: optionalTrimmed(input.email),
    companyName: optionalTrimmed(input.companyName),
    notes: optionalTrimmed(input.notes),
  };
}

export function validateEnquiry(input: {
  contactId: string;
  title: string;
  source: string;
  dueDate: string;
  notes: string;
  closedReason?: string;
  status?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.contactId) errors.contactId = "Contact is required";
  const title = trimmed(input.title);
  const source = trimmed(input.source);
  if (!title || title.length > 160) errors.title = "Title is required (160 characters max)";
  if (!source || source.length > 80) errors.source = "Source is required (80 characters max)";
  if (!input.dueDate) errors.dueDate = "Due date is required";
  else if (!isLocalDateKeyOnOrAfterToday(input.dueDate.slice(0, 10))) {
    errors.dueDate = "Due date must be today or in the future";
  }
  if (input.notes.trim().length > 4000) errors.notes = "Notes are too long";
  if (input.status === "closed" && !trimmed(input.closedReason ?? "")) {
    errors.closedReason = "A close reason is required";
  }
  return errors;
}

export function validateFollowUp(input: {
  enquiryId: string;
  dueDate: string;
  dueTime: string;
  nextDate: string;
  notes: string;
  closedReason?: string;
  requireClosedReason?: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.enquiryId) errors.enquiryId = "Enquiry is required";
  if (!input.dueDate || !input.dueTime) errors.dueAt = "Activity date and time are required";
  else if (Number.isNaN(new Date(`${input.dueDate}T${input.dueTime}`).getTime())) {
    errors.dueAt = "Activity date is invalid";
  }
  if (!input.nextDate) errors.nextFollowupDate = "Next follow-up date is required";
  else if (Number.isNaN(new Date(`${input.nextDate}T${input.dueTime || "00:00"}`).getTime())) {
    errors.nextFollowupDate = "Next follow-up date is invalid";
  }
  if (input.notes.trim().length > 4000) errors.notes = "Notes are too long";
  if (input.requireClosedReason && !trimmed(input.closedReason ?? "")) {
    errors.closedReason = "A close reason is required";
  }
  return errors;
}

export function validatePayment(input: {
  referenceId: string;
  amount: string;
  reference: string;
  paidAt: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.referenceId) errors.referenceId = "A booked record or vendor is required";
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Amount must be greater than 0";
  if (input.reference.trim().length > 80) errors.reference = "Reference is too long";
  if (input.paidAt && Number.isNaN(new Date(input.paidAt).getTime())) errors.paidAt = "Paid at is invalid";
  return errors;
}

export function toPaymentPaidAt(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function validateReminder(input: { title: string; remindAt: string; notes: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = trimmed(input.title);
  if (!title || title.length > 160) errors.title = "Title is required (160 characters max)";
  if (!input.remindAt || Number.isNaN(new Date(input.remindAt).getTime())) {
    errors.remindAt = "Reminder time is required";
  }
  if (input.notes.trim().length > 4000) errors.notes = "Notes are too long";
  return errors;
}

export function toReminderInput(input: {
  title: string;
  remindAt: string;
  notes: string;
  contactId?: string | null;
  enquiryId?: string | null;
}): CreateCalendarEventInput {
  const start = new Date(input.remindAt);
  return {
    title: trimmed(input.title),
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 30 * 60 * 1000).toISOString(),
    slot: null,
    notes: optionalTrimmed(input.notes),
    contactId: input.contactId || null,
    enquiryId: input.enquiryId || null,
  };
}

export function validateTask(input: { title: string; description: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = trimmed(input.title);
  if (!title || title.length > 160) errors.title = "Title is required (160 characters max)";
  if (input.description.trim().length > 4000) errors.description = "Description is too long";
  return errors;
}

export function toTaskInput(input: {
  title: string;
  description: string;
  dueAt?: string | null;
  status?: CreateTaskInput["status"];
  assigneeId?: string | null;
  contactId?: string | null;
  enquiryId?: string | null;
}): CreateTaskInput {
  return {
    title: trimmed(input.title),
    description: optionalTrimmed(input.description),
    dueAt: input.dueAt ?? null,
    status: input.status,
    assigneeId: input.assigneeId || null,
    contactId: input.contactId || null,
    enquiryId: input.enquiryId || null,
  };
}

export function validateProfileName(input: { firstName: string; lastName: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  const firstName = trimmed(input.firstName);
  const lastName = trimmed(input.lastName);
  if (!firstName || firstName.length > 80) errors.firstName = "First name is required";
  if (!lastName || lastName.length > 80) errors.lastName = "Last name is required";
  return errors;
}

export function validatePasswordChange(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.currentPassword) errors.currentPassword = "Current password is required";
  if (input.newPassword.length < 8 || input.newPassword.length > 72) {
    errors.newPassword = "New password must be 8 to 72 characters";
  } else if (input.newPassword === input.currentPassword) {
    errors.newPassword = "New password must be different from the current password";
  }
  if (input.newPassword !== input.confirmPassword) errors.confirmPassword = "Passwords do not match";
  return errors;
}

export function validateStaffUser(input: {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  countryCode: string;
  mobileNo: string;
  email: string;
  password: string;
  roleIds: string[];
  editing: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!trimmed(input.firstName) || trimmed(input.firstName).length > 80) errors.firstName = "First name is required";
  if (!trimmed(input.lastName) || trimmed(input.lastName).length > 80) errors.lastName = "Last name is required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dob)) errors.dob = "Date of birth is required";
  if (!trimmed(input.gender) || trimmed(input.gender).length > 20) errors.gender = "Gender is required";
  if (!COUNTRY_CODE_PATTERN.test(trimmed(input.countryCode))) errors.countryCode = "Country code must look like +91";
  if (!MOBILE_PATTERN.test(trimmed(input.mobileNo))) errors.mobileNo = "Enter a mobile number of 7 to 15 digits";
  const email = trimmed(input.email);
  if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) errors.email = "Enter a valid email";
  if (!input.editing && (input.password.length < 8 || input.password.length > 72)) {
    errors.password = "Password must be 8 to 72 characters";
  }
  if (input.roleIds.length === 0) errors.roleIds = "Choose at least one role";
  return errors;
}

export function validateClient(input: { contactId: string; billingName: string; gstin: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.contactId) errors.contactId = "Choose a client contact";
  const billingName = trimmed(input.billingName);
  if (!billingName || billingName.length > 200) errors.billingName = "Billing name is required (200 characters max)";
  if (trimmed(input.gstin).length > 32) errors.gstin = "GSTIN is too long";
  return errors;
}

/** Inclusive local-day range; the API rejects `to` before `from`. */
export function validateDateRange(from: string, to: string): string | null {
  if (from && to && to < from) return "End date must be on or after the start date";
  return null;
}

export function validateRole(input: { name: string; permissionIds?: string[] }): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = trimmed(input.name);
  if (name.length < 2 || name.length > 80) errors.name = "Name must be 2 to 80 characters";
  if (input.permissionIds && input.permissionIds.length === 0) {
    errors.permissionIds = "Choose at least one permission";
  }
  return errors;
}

export function toPaymentBody(input: {
  referenceType: CreatePaymentInput["referenceType"];
  referenceId: string;
  enquiryId?: string | null;
  amount: string;
  type: CreatePaymentInput["type"];
  mode: CreatePaymentInput["mode"];
  status: CreatePaymentInput["status"];
  paidAt: string;
  reference: string;
}): CreatePaymentInput {
  return {
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    enquiryId: input.enquiryId ?? null,
    amount: Number(input.amount),
    type: input.type,
    mode: input.mode,
    status: input.status,
    paidAt: toPaymentPaidAt(input.paidAt),
    reference: optionalTrimmed(input.reference),
  };
}
