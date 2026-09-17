import type { CrmEnquiryDueDateWindow } from "@prisma/client";

export function resolveEnquiryDueDate(
  window: CrmEnquiryDueDateWindow,
  from = new Date(),
): Date {
  const due = new Date(from);
  switch (window) {
    case "within_7_days":
      due.setDate(due.getDate() + 7);
      break;
    case "within_15_days":
      due.setDate(due.getDate() + 15);
      break;
    case "within_1_month":
      due.setMonth(due.getMonth() + 1);
      break;
    case "within_2_months":
      due.setMonth(due.getMonth() + 2);
      break;
    case "within_3_months":
      due.setMonth(due.getMonth() + 3);
      break;
    case "within_6_months":
      due.setMonth(due.getMonth() + 6);
      break;
  }
  due.setHours(23, 59, 59, 999);
  return due;
}

export function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function endOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

export function nextLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate() + 1);
}

export function isFollowUpOverdue(input: {
  nextFollowupDate: Date | null | undefined;
  enquiryStatus: string | null | undefined;
  now?: Date;
}): boolean {
  if (!input.nextFollowupDate || input.enquiryStatus === "closed") {
    return false;
  }
  const now = input.now ?? new Date();
  return input.nextFollowupDate.getTime() < now.getTime();
}
