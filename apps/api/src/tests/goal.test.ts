import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import {
  EMERGENCY_FUND_CATEGORY,
  EMERGENCY_FUND_SUBCATEGORY,
  EMERGENCY_FUND_TITLE,
} from "../modules/personal-finance/goal/goal.constants";
import { GoalService } from "../modules/personal-finance/goal/goal.service";
import { assertRequiredSetupGoals } from "../modules/personal-finance/setup/setup.service";
import type { GoalModel } from "../models/index";

type FakeGoal = {
  id: string;
  userId: string;
  category: string;
  subcategory: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingYears: number;
  targetYear: number;
  isActive: number;
};

function fakeModel(seed: FakeGoal[] = []) {
  const rows = [...seed];
  const model = {
    async findOne(where: { userId?: string; category?: string; isActive?: number }) {
      return (
        rows.find(
          (row) =>
            row.userId === where.userId &&
            row.category === where.category &&
            row.isActive === where.isActive,
        ) ?? null
      );
    },
    async create(data: Omit<FakeGoal, "id" | "isActive"> & { isActive?: number }) {
      const created: FakeGoal = {
        id: `goal-${rows.length + 1}`,
        isActive: 1,
        ...data,
      };
      rows.push(created);
      return created;
    },
    async paginate() {
      return { items: rows.filter((row) => row.isActive === 1) };
    },
    async readOne(where: { id: string }) {
      return rows.find((row) => row.id === where.id) ?? null;
    },
    async update(where: { id: string }, data: Partial<FakeGoal>) {
      const index = rows.findIndex((row) => row.id === where.id);
      const current = rows[index];
      if (index < 0 || !current) {
        throw new Error("missing");
      }
      const next = { ...current, ...data };
      rows[index] = next;
      return next;
    },
  };

  return { model: model as unknown as GoalModel, rows };
}

test("ensureEmergencyFund creates a required emergency goal with category", async () => {
  const { model, rows } = fakeModel();
  const service = new GoalService(model);

  const goal = await service.ensureEmergencyFund("user-1", {
    employmentType: "Salaried",
    monthlyExpenses: 50_000,
  });

  assert.equal(rows.length, 1);
  assert.equal(goal.category, EMERGENCY_FUND_CATEGORY);
  assert.equal(goal.subcategory, EMERGENCY_FUND_SUBCATEGORY);
  assert.equal(goal.title, EMERGENCY_FUND_TITLE);
  assert.equal(goal.targetAmount, 300_000);
});

test("list ensures an emergency fund exists before returning goals", async () => {
  const { model, rows } = fakeModel();
  const service = new GoalService(model);

  await service.list("user-1", {});

  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.category, EMERGENCY_FUND_CATEGORY);
});

test("remove rejects the compulsory emergency fund goal", async () => {
  const { model } = fakeModel([
    {
      id: "ef-1",
      userId: "user-1",
      category: EMERGENCY_FUND_CATEGORY,
      subcategory: EMERGENCY_FUND_SUBCATEGORY,
      title: EMERGENCY_FUND_TITLE,
      targetAmount: 0,
      currentAmount: 0,
      remainingYears: 1,
      targetYear: 2027,
      isActive: 1,
    },
  ]);
  const service = new GoalService(model);

  await assert.rejects(
    () => service.remove("user-1", { id: "ef-1" }),
    (error: unknown) => error instanceof HttpError && error.status === 400,
  );
});

test("quick setup requires funded emergency and FIRE goals", () => {
  assert.throws(
    () => assertRequiredSetupGoals({ targetAmount: 300_000 }, null),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
  assert.throws(
    () => assertRequiredSetupGoals(null, { targetAmount: 10_000_000 }),
    (error: unknown) => error instanceof HttpError && error.status === 422,
  );
  assert.doesNotThrow(() =>
    assertRequiredSetupGoals(
      { targetAmount: 300_000 },
      { targetAmount: 10_000_000 },
    ),
  );
});
