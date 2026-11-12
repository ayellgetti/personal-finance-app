import { prisma } from "./prisma.util";

/** Runs `fn` while holding a per-user lock, so two requests cannot both pass a limit check. */
export type UserLock = <T>(userId: string, fn: () => Promise<T>) => Promise<T>;

/** Postgres transaction-scoped advisory lock keyed by a namespace and the user id. */
export function advisoryUserLock(namespace: string): UserLock {
  return (userId, fn) =>
    prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${namespace}:${userId}`}))`;
      return fn();
    });
}
