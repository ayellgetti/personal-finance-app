import { HttpError } from "../../utils/http-error.util";

export function requireActive<T extends { isActive: number }>(
  row: T | null | undefined,
  entity: string,
): T {
  if (!row || row.isActive !== 1) {
    throw new HttpError(404, `${entity} not found`);
  }
  return row;
}

export function actorCreate(userId: string) {
  return { createdBy: userId, updatedBy: userId };
}

export function actorUpdate(userId: string) {
  return { updatedBy: userId };
}

export function actorDelete(userId: string) {
  return {
    isActive: 0,
    deletedAt: new Date(),
    deletedBy: userId,
    updatedBy: userId,
  };
}

export const MAX_CALENDAR_RANGE_MS = 92 * 24 * 60 * 60 * 1000;
