import assert from "node:assert/strict";
import test from "node:test";
import { CheckInService } from "../modules/personal-finance/check-in/check-in.service";
import type { CheckInModel } from "../models/index";
import { parseListCheckInsQuery, upsertCheckInBodySchema } from "../modules/personal-finance/check-in/check-in.request";

const valid = {
  month: "2026-11",
  netWorth: 250000,
  assets: 900000,
  liabilities: 650000,
  monthlyIncome: 120000,
  monthlyExpense: 70000,
  healthScore: 62,
};

test("check-in body requires a YYYY-MM month and a 0-100 score", () => {
  assert.equal(upsertCheckInBodySchema.safeParse(valid).success, true);
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, month: "2026-13" }).success, false);
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, month: "Nov 2026" }).success, false);
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, healthScore: 101 }).success, false);
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, monthlyIncome: -1 }).success, false);
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, netWorth: Number.NaN }).success, false);
});

test("net worth may be negative", () => {
  assert.equal(
    upsertCheckInBodySchema.safeParse({ ...valid, assets: 100000, liabilities: 150000, netWorth: -50000 }).success,
    true,
  );
});

test("upsert is keyed by user and month and revives a removed row", async () => {
  let args: unknown[] = [];
  const model = {
    upsert: async (...a: unknown[]) => {
      args = a;
      return {};
    },
  } as unknown as CheckInModel;
  await new CheckInService(model).upsert("user-1", upsertCheckInBodySchema.parse(valid));
  const [where, create, update] = args as [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>];
  assert.deepEqual(where, { userId_month: { userId: "user-1", month: "2026-11" } });
  assert.equal(create.userId, "user-1");
  assert.equal(update.isActive, 1);
  assert.equal(update.deletedAt, null);
});

test("list is scoped to the user, newest first and bounded", async () => {
  let args: unknown[] = [];
  const model = {
    read: async (...a: unknown[]) => {
      args = a;
      return [];
    },
  } as unknown as CheckInModel;
  await new CheckInService(model).list("user-1", {});
  assert.deepEqual(args[0], { userId: "user-1", isActive: 1 });
  assert.deepEqual(args[1], { orderBy: { month: "desc" }, take: 24 });
});

test("the list query is parsed to a number even when Express hands over a string", () => {
  // Express 5 re-reads req.query on each access, so the validation middleware's coercion is lost.
  assert.deepEqual(parseListCheckInsQuery({ limit: "36" }), { limit: 36 });
  assert.deepEqual(parseListCheckInsQuery({}), {});
  assert.deepEqual(parseListCheckInsQuery(undefined), {});
  assert.throws(() => parseListCheckInsQuery({ limit: "9999" }));
});

test("a check-in cannot be for a future month", () => {
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, month: "2999-01" }).success, false);
  const now = new Date();
  const thisMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, month: thisMonth }).success, true);
});

test("net worth must equal assets minus liabilities, within rounding", () => {
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, netWorth: 250001 }).success, true);
  assert.equal(upsertCheckInBodySchema.safeParse({ ...valid, netWorth: 999999 }).success, false);
});
