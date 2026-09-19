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
