import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth/store";
import type { CheckIn, CheckInInput } from "./check-in";

function requireAuth() {
  if (!getAccessToken()) {
    throw new Error("Not signed in");
  }
}

export async function listCheckIns(limit = 24): Promise<CheckIn[]> {
  requireAuth();
  const result = await api<{ items: CheckIn[] }>(`/api/check-ins?limit=${limit}`);
  return result.items;
}

export async function saveCheckIn(input: CheckInInput): Promise<CheckIn> {
  requireAuth();
  const result = await api<{ checkIn: CheckIn }>("/api/check-ins", { method: "PUT", body: input });
  return result.checkIn;
}
