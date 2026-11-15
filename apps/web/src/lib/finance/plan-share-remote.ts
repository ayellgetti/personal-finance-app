import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth/store";
import type { PlanShare, PlanSnapshot, SharedPlan } from "./plan-snapshot";

function requireAuth() {
  if (!getAccessToken()) {
    throw new Error("Not signed in");
  }
}

export async function listPlanShares(): Promise<PlanShare[]> {
  requireAuth();
  const result = await api<{ items: PlanShare[] }>("/api/plan-shares");
  return result.items;
}

/** The token is returned once. It cannot be fetched again, only revoked. */
export async function createPlanShare(input: {
  label: string;
  expiresInDays: 7 | 30 | 90;
  snapshot: PlanSnapshot;
}): Promise<{ token: string; share: PlanShare }> {
  requireAuth();
  return api("/api/plan-shares", { method: "POST", body: input });
}

export async function revokePlanShare(id: string): Promise<void> {
  requireAuth();
  await api("/api/plan-shares/remove", { method: "POST", body: { id } });
}

/** Public: no sign-in, and never sends the viewer's own credentials. */
export function fetchSharedPlan(token: string): Promise<SharedPlan> {
  return api<SharedPlan>(`/api/shared/plans/${encodeURIComponent(token)}`, { skipAuth: true });
}
