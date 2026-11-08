import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth/store";
import type { FreedomScenario, FreedomScenarioInput } from "./freedom-scenarios";

function requireAuth() {
  if (!getAccessToken()) {
    throw new Error("Not signed in");
  }
}

export async function listFreedomScenarios(): Promise<FreedomScenario[]> {
  requireAuth();
  const result = await api<{ items: FreedomScenario[] }>("/api/freedom-scenarios");
  return result.items;
}

export async function saveFreedomScenario(input: FreedomScenarioInput): Promise<FreedomScenario> {
  requireAuth();
  const result = await api<{ scenario: FreedomScenario }>("/api/freedom-scenarios", { method: "POST", body: input });
  return result.scenario;
}

export async function removeFreedomScenario(id: string): Promise<void> {
  requireAuth();
  await api("/api/freedom-scenarios/remove", { method: "POST", body: { id } });
}
