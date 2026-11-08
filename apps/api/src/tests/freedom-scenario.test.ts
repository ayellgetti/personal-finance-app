import assert from "node:assert/strict";
import test from "node:test";
import { FreedomScenarioService } from "../modules/personal-finance/freedom-scenario/freedom-scenario.service";
import { createFreedomScenarioBodySchema } from "../modules/personal-finance/freedom-scenario/freedom-scenario.request";
import type { FreedomScenarioModel } from "../models/index";

const passthrough = async <T>(_userId: string, fn: () => Promise<T>) => fn();

const body = {
  title: "Retire at 55",
  mode: "FIRE" as const,
  input: { monthlyExpenses: 70000, currentAge: 32, retirementAge: 55, inflationRate: 6, coastAge: 45, expectedReturn: 11 },
  result: { target: 90_000_000, targetAge: 55, yearsToTarget: 23, projectedCorpus: 40_000_000, shortfall: 50_000_000, requiredMonthlyInvestment: 62000, progressPct: 44 },
};

test("what-if body needs a title, a known mode and bounded inputs", () => {
  assert.equal(createFreedomScenarioBodySchema.safeParse(body).success, true);
  assert.equal(createFreedomScenarioBodySchema.safeParse({ ...body, title: "  " }).success, false);
  assert.equal(createFreedomScenarioBodySchema.safeParse({ ...body, mode: "Super FIRE" }).success, false);
  assert.equal(
    createFreedomScenarioBodySchema.safeParse({ ...body, input: { ...body.input, inflationRate: 99 } }).success,
    false,
  );
  assert.equal(
    createFreedomScenarioBodySchema.safeParse({ ...body, result: { ...body.result, target: Number.NaN } }).success,
    false,
  );
});

test("a user can keep at most three what-ifs", async () => {
  let created = 0;
  const model = {
    count: async () => 3,
    create: async () => {
      created += 1;
      return {};
    },
  } as unknown as FreedomScenarioModel;
  await assert.rejects(() => new FreedomScenarioService(model, passthrough).create("u1", body), /up to 3/);
  assert.equal(created, 0);
});

test("saving under the limit stores the scenario for the user", async () => {
  let data: Record<string, unknown> = {};
  const model = {
    count: async () => 2,
    create: async (d: Record<string, unknown>) => {
      data = d;
      return d;
    },
  } as unknown as FreedomScenarioModel;
  await new FreedomScenarioService(model, passthrough).create("u1", body);
  assert.equal(data.userId, "u1");
  assert.equal(data.mode, "FIRE");
  assert.equal(data.title, "Retire at 55");
});

test("removing another user's what-if is a 404 and changes nothing", async () => {
  let updated = false;
  const model = {
    readOne: async () => null,
    update: async () => {
      updated = true;
      return {};
    },
  } as unknown as FreedomScenarioModel;
  await assert.rejects(
    () => new FreedomScenarioService(model, passthrough).remove("u1", { id: "6f1c1f0e-5a0b-4f4e-9d0a-1f2b3c4d5e6f" }),
    /not found/,
  );
  assert.equal(updated, false);
});

test("saves are serialised per user so concurrent requests cannot pass the limit together", async () => {
  let active = 0;
  let maxActive = 0;
  let stored = 2;
  const queue: Promise<unknown>[] = [];
  const lock = async <T>(_userId: string, fn: () => Promise<T>): Promise<T> => {
    const previous = queue[queue.length - 1] ?? Promise.resolve();
    const run = previous.then(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      try {
        return await fn();
      } finally {
        active -= 1;
      }
    });
    queue.push(run.catch(() => undefined));
    return run;
  };
  const model = {
    count: async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return stored;
    },
    create: async () => {
      stored += 1;
      return {};
    },
  } as unknown as FreedomScenarioModel;
  const service = new FreedomScenarioService(model, lock);
  const results = await Promise.allSettled([service.create("u1", body), service.create("u1", body)]);
  assert.equal(maxActive, 1);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(stored, 3);
});
