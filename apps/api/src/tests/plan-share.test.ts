import assert from "node:assert/strict";
import test from "node:test";
import {
  PlanShareService,
  hashPlanShareToken,
  newPlanShareToken,
} from "../modules/personal-finance/plan-share/plan-share.service";
import {
  createPlanShareBodySchema,
  planSnapshotSchema,
  sharedPlanParamsSchema,
} from "../modules/personal-finance/plan-share/plan-share.request";
import type { PlanShareModel } from "../models/index";

const snapshot = {
  generatedAt: "2026-11-08T10:00:00.000Z",
  currency: "₹",
  netWorth: 250000,
  assets: 900000,
  liabilities: 650000,
  monthlyIncome: 120000,
  monthlyBills: 70000,
  savingsRate: 25,
  healthScore: { total: 62, components: [{ label: "Emergency Fund", score: 40, answered: true }] },
  emergency: { months: 3.2, targetMonths: 6 },
  freedom: { mode: "FIRE", target: 90_000_000, projectedCorpus: 40_000_000, targetYear: 2049 },
  goals: [{ name: "Car", type: "Dream Car", targetAmount: 1_000_000, currentSaved: 200_000, status: "At Risk" }],
  nextSteps: [{ title: "Top up your emergency fund", detail: "You have 3.2 months of cover." }],
  cover: { termCurrent: 1, termRecommended: 2, healthCurrent: 3, healthRecommended: 4 },
};
const passthrough = async <T>(_u: string, fn: () => Promise<T>) => fn();
const NOW = new Date("2026-11-08T10:00:00.000Z");

test("tokens are 43 url-safe characters, unique, and stored only as a hash", () => {
  const a = newPlanShareToken();
  const b = newPlanShareToken();
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(a, b);
  assert.equal(sharedPlanParamsSchema.safeParse({ token: a }).success, true);
  assert.equal(hashPlanShareToken(a).length, 64);
  assert.notEqual(hashPlanShareToken(a), a);
});

test("the public route rejects anything that is not a well-formed token", () => {
  for (const token of ["", "short", "x".repeat(44), "../etc/passwd", `${"a".repeat(42)}!`]) {
    assert.equal(sharedPlanParamsSchema.safeParse({ token }).success, false, token);
  }
});

test("a snapshot cannot carry personal fields or extra keys", () => {
  assert.equal(planSnapshotSchema.safeParse(snapshot).success, true);
  assert.equal(planSnapshotSchema.safeParse({ ...snapshot, email: "a@b.com" }).success, false);
  assert.equal(planSnapshotSchema.safeParse({ ...snapshot, dob: "1990-01-01" }).success, false);
  assert.equal(
    planSnapshotSchema.safeParse({ ...snapshot, goals: [{ ...snapshot.goals[0], notes: "x" }] }).success,
    false,
  );
});

test("a snapshot is size-bounded", () => {
  const many = Array.from({ length: 21 }, () => snapshot.goals[0]);
  assert.equal(planSnapshotSchema.safeParse({ ...snapshot, goals: many }).success, false);
  assert.equal(
    planSnapshotSchema.safeParse({ ...snapshot, nextSteps: [{ title: "t", detail: "d".repeat(401) }] }).success,
    false,
  );
});

test("expiry must be one of the offered periods", () => {
  const ok = { label: "For my CA", expiresInDays: 30, snapshot };
  assert.equal(createPlanShareBodySchema.safeParse(ok).success, true);
  assert.equal(createPlanShareBodySchema.safeParse({ ...ok, expiresInDays: 3650 }).success, false);
  assert.equal(createPlanShareBodySchema.safeParse({ ...ok, label: " " }).success, false);
});

test("creating stores a hash and the expiry, and returns the token once", async () => {
  let stored: Record<string, unknown> = {};
  const model = {
    count: async () => 0,
    create: async (d: Record<string, unknown>) => {
      stored = d;
      return { id: "id1", label: d.label, createdAt: NOW, expiresAt: d.expiresAt };
    },
  } as unknown as PlanShareModel;
  const out = await new PlanShareService(model, passthrough, () => NOW).create("u1", {
    label: "For my CA",
    expiresInDays: 7,
    snapshot,
  });
  assert.match(out.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(stored.tokenHash, hashPlanShareToken(out.token));
  assert.ok(!JSON.stringify(stored).includes(out.token), "the raw token must not be stored");
  assert.equal((stored.expiresAt as Date).getTime(), NOW.getTime() + 7 * 24 * 3600 * 1000);
});

test("a user can have at most five live links", async () => {
  let created = false;
  const model = {
    count: async () => 5,
    create: async () => {
      created = true;
      return {};
    },
  } as unknown as PlanShareModel;
  await assert.rejects(
    () => new PlanShareService(model, passthrough, () => NOW).create("u1", { label: "x", expiresInDays: 7, snapshot }),
    /up to 5/,
  );
  assert.equal(created, false);
});

test("listing is scoped to the owner's live links and never returns tokens or snapshots", async () => {
  let where: Record<string, unknown> = {};
  const model = {
    read: async (w: Record<string, unknown>) => {
      where = w;
      return [{ id: "1", label: "A", tokenHash: "secret", snapshot, createdAt: NOW, expiresAt: NOW, viewCount: 2, lastViewedAt: null }];
    },
  } as unknown as PlanShareModel;
  const out = await new PlanShareService(model, passthrough, () => NOW).list("u1");
  assert.equal(where.userId, "u1");
  assert.equal(where.isActive, 1);
  assert.deepEqual(where.expiresAt, { gt: NOW });
  assert.ok(!JSON.stringify(out).includes("secret"));
  assert.equal("snapshot" in (out.items[0] as object), false);
});

test("viewing a live link returns the snapshot and counts the view", async () => {
  let looked: Record<string, unknown> = {};
  let updated: Record<string, unknown> = {};
  const model = {
    readOne: async (w: Record<string, unknown>) => {
      looked = w;
      return { id: "r1", label: "For my CA", expiresAt: NOW, snapshot };
    },
    update: async (_w: unknown, d: Record<string, unknown>) => {
      updated = d;
      return {};
    },
  } as unknown as PlanShareModel;
  const token = newPlanShareToken();
  const out = await new PlanShareService(model, passthrough, () => NOW).view(token);
  assert.equal(looked.tokenHash, hashPlanShareToken(token));
  assert.equal(looked.isActive, 1);
  assert.deepEqual(looked.expiresAt, { gt: NOW });
  assert.deepEqual(updated.viewCount, { increment: 1 });
  assert.equal(out.label, "For my CA");
});

test("unknown, expired and revoked links look identical and count nothing", async () => {
  let updated = false;
  const model = {
    readOne: async () => null,
    update: async () => {
      updated = true;
      return {};
    },
  } as unknown as PlanShareModel;
  await assert.rejects(
    () => new PlanShareService(model, passthrough, () => NOW).view(newPlanShareToken()),
    /no longer available/,
  );
  assert.equal(updated, false);
});

test("revoking someone else's link is a 404 and changes nothing", async () => {
  let updated = false;
  const model = {
    readOne: async () => null,
    update: async () => {
      updated = true;
      return {};
    },
  } as unknown as PlanShareModel;
  await assert.rejects(
    () => new PlanShareService(model, passthrough, () => NOW).revoke("u1", { id: "6f1c1f0e-5a0b-4f4e-9d0a-1f2b3c4d5e6f" }),
    /not found/,
  );
  assert.equal(updated, false);
});

test("revoking marks the link inactive", async () => {
  let data: Record<string, unknown> = {};
  const model = {
    readOne: async () => ({ id: "1" }),
    update: async (_w: unknown, d: Record<string, unknown>) => {
      data = d;
      return {};
    },
  } as unknown as PlanShareModel;
  await new PlanShareService(model, passthrough, () => NOW).revoke("u1", { id: "6f1c1f0e-5a0b-4f4e-9d0a-1f2b3c4d5e6f" });
  assert.equal(data.isActive, 0);
});
