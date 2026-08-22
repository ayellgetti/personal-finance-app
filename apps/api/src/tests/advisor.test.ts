import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { HttpError } from "../utils/http-error.util";
import type { AiJsonProvider } from "../modules/shared/ai/openai.provider";
import {
  buildPlannerReport,
  type PlannerInvestment,
} from "../modules/personal-finance/planner/planner.engine";    
import type { PlannerService } from "../modules/personal-finance/planner/planner.service";
import type { AdvisorReportStore } from "../modules/personal-finance/advisor/advisor.cache";
import { buildAdvisorContext, hashAdvisorContext } from "../modules/personal-finance/advisor/advisor.prompt";
import type { AdvisorQuotaStore } from "../modules/personal-finance/advisor/advisor.quota";
import { advisorReportSchema, type AdvisorReport } from "../modules/personal-finance/advisor/advisor.schema";
import { AdvisorService } from "../modules/personal-finance/advisor/advisor.service";

const validAdvice = {
  executiveSummary: "Use the available surplus against expensive debt.",
  summaryReport: {
    headline: "Attack the highest-rate loan with surplus cash",
    highlights: [
      { label: "Surplus", detail: "Monthly surplus is available after committed outflows." },
      { label: "Debt", detail: "Highest supplied rate should be prepaid first." },
    ],
  },
  riskWarnings: [
    {
      severity: "medium" as const,
      title: "Liquidity",
      detail: "Keep an emergency buffer before prepaying.",
    },
  ],
  planOfAction: [
    {
      priority: 1,
      category: "Debt" as const,
      impact: "High" as const,
      action: "Prepay the highest-rate loan",
      rationale: "It has the highest supplied rate.",
      monthlyAmount: 50013,
    },
  ],
  immediateActions: [
    {
      priority: 1,
      action: "Prepay the highest-rate loan",
      rationale: "It has the highest supplied rate.",
      monthlyAmount: 50013,
    },
  ],
  debtStrategy: {
    summary: "Follow the supplied avalanche scenario.",
    steps: [
      {
        order: 1,
        loan: "Loan 1",
        action: "Add the monthly surplus",
        reason: "Highest supplied rate",
      },
    ],
    expectedDebtFreeMonth: 65,
  },
  investmentStrategy: {
    status: "pause" as const,
    resumeTrigger: "After the highest-rate loan is cleared",
    monthlyAmountWhenResumed: 27500,
    rationale: "This is the supplied planner milestone.",
  },
  emiTweaks: [
    {
      loan: "Loan 1",
      change: "Add the supplied surplus",
      monthlyExtra: 50013,
      estimatedMonthsSaved: 112,
      estimatedInterestSaved: 1000000,
      caveat: "Confirm lender prepayment rules.",
    },
  ],
  assumptions: ["Income and expenses remain unchanged."],
  disclaimer: "General guidance only; consult a qualified adviser.",
};

function fixtureReport() {
  const investments: PlannerInvestment[] = [
    {
      id: "investment-secret-id",
      subcategory: "ppf",
      title: "Private investment title",
      accumulatedAmount: 2_900_000,
      roi: 7.8,
      remainingMonths: 60,
      investmentAmount: 27_500,
      monthDay: 1,
      onHold: true,
    },
  ];

  return buildPlannerReport({
    budgets: [
      {
        id: "salary-secret-id",
        type: "income",
        subcategory: "salary",
        title: "Salary",
        amount: 235_000,
        monthDay: 1,
        weekDay: null,
        repeatCount: null,
      },
      {
        id: "rent-secret-id",
        type: "expense",
        subcategory: "rent",
        title: "Private home name",
        amount: 58_000,
        monthDay: 5,
        weekDay: null,
        repeatCount: null,
      },
    ],
    loans: [
      {
        id: "personal-secret-id",
        title: "Private lender account",
        type: "Personal Loan",
        principalPendingAmount: 976_167,
        roi: 11.25,
        remainingMonths: 32,
        emiAmount: 35_764,
        emiDay: 5,
      },
      {
        id: "housing-secret-id",
        title: null,
        type: "Home Loan",
        principalPendingAmount: 6_730_000,
        roi: 7.35,
        remainingMonths: 131,
        emiAmount: 75_000,
        emiDay: 10,
      },
    ],
    investments,
    goals: [
      {
        id: "emergency-secret-id",
        category: "emergency",
        subcategory: "emergency_fund",
        title: "Emergency Fund",
        targetAmount: 600_000,
        currentAmount: 120_000,
        remainingYears: 1,
        targetYear: 2027,
      },
      {
        id: "goal-secret-id",
        category: "retirement",
        subcategory: "lean_fire",
        title: "Private family goal",
        targetAmount: 30_000_000,
        currentAmount: 0,
        remainingYears: 11,
        targetYear: 2037,
      },
    ],
  });
}

test("advisor context includes the rule checklist without private titles", () => {
  const serialized = JSON.stringify(buildAdvisorContext(fixtureReport()));

  assert.doesNotMatch(serialized, /secret-id/);
  assert.doesNotMatch(serialized, /Private/);
  assert.match(serialized, /"currency":"INR"/);
  assert.match(serialized, /"ruleChecklist"/);
  assert.match(serialized, /"fireType":"lean_fire"/);
  assert.match(serialized, /"category":"emergency"/);
  assert.match(serialized, /"emergencyFund"/);
});

test("advisor prompt markdown is the live system prompt", async () => {
  const { ADVISOR_SYSTEM_PROMPT } = await import(
    "../modules/personal-finance/advisor/advisor.prompt"
  );
  assert.match(ADVISOR_SYSTEM_PROMPT, /SUMMARY REPORT/i);
  assert.match(ADVISOR_SYSTEM_PROMPT, /PLAN OF ACTION/i);
  assert.match(ADVISOR_SYSTEM_PROMPT, /compulsory Emergency Fund goal/);
});

test("advisor response schema accepts the contract and rejects missing sections", () => {
  assert.equal(advisorReportSchema.safeParse(validAdvice).success, true);
  assert.equal(
    advisorReportSchema.safeParse({ executiveSummary: "Incomplete" }).success,
    false,
  );
});

test("advisor response schema accepts null and omitted optional numbers", () => {
  const parsed = advisorReportSchema.safeParse({
    ...validAdvice,
    immediateActions: [
      {
        action: "Prepay the highest-rate loan",
        rationale: "It has the highest supplied rate.",
      },
    ],
    debtStrategy: {
      summary: "No supplied debt requires repayment planning.",
      steps: [],
      expectedDebtFreeMonth: null,
    },
    emiTweaks: [
      {
        loan: "Loan 1",
        change: "Add the supplied surplus",
        monthlyExtra: null,
        caveat: "Confirm lender prepayment rules.",
      },
    ],
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data?.debtStrategy.expectedDebtFreeMonth, null);
  assert.deepEqual(parsed.data?.debtStrategy.steps, []);
  assert.equal(parsed.data?.immediateActions[0]?.priority, 1);
  assert.equal(parsed.data?.immediateActions[0]?.monthlyAmount, null);
  assert.equal(parsed.data?.emiTweaks[0]?.estimatedMonthsSaved, null);
});

test("surplus scenario improves payoff time and interest over scheduled EMIs", () => {
  const scenarios = fixtureReport().liabilityPlan.scenarios;
  const scheduled = scenarios.find((item) => item.id === "scheduled");
  const surplus = scenarios.find((item) => item.id === "surplus");

  assert.ok(scheduled);
  assert.ok(surplus);
  assert.ok(surplus.debtFreeMonth < scheduled.debtFreeMonth);
  assert.ok(surplus.interestSavedVsScheduled > 0);
  assert.ok(surplus.monthlyExtra > 0);
});

function memoryStore(
  seed?: { userId: string; contextHash: string; advice: AdvisorReport },
): AdvisorReportStore & { writes: number } {
  const rows = new Map<
    string,
    { userId: string; contextHash: string; advice: AdvisorReport; updatedAt: Date }
  >();
  if (seed) {
    rows.set(seed.userId, { ...seed, updatedAt: new Date("2026-08-20T21:00:00.000Z") });
  }
  const store: AdvisorReportStore & { writes: number } = {
    writes: 0,
    async findByUserId(userId) {
      return rows.get(userId) ?? null;
    },
    async upsert(input) {
      store.writes += 1;
      const saved = { ...input, updatedAt: new Date("2026-08-20T21:15:00.000Z") };
      rows.set(input.userId, saved);
      return saved;
    },
  };
  return store;
}

function memoryQuota(limit = 1, used = 0): AdvisorQuotaStore & { used: number } {
  const state = {
    used,
    async read() {
      return { used: state.used, limit, remaining: Math.max(0, limit - state.used) };
    },
    async consume() {
      state.used = Math.min(limit, state.used + 1);
      return state.read();
    },
  };
  return state;
}

test("advisor service stores OpenAI output and reuses it while the numbers stay the same", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  let calls = 0;
  const provider: AiJsonProvider = {
    generateJson: async () => {
      calls += 1;
      return validAdvice;
    },
  };
  const store = memoryStore();
  const service = new AdvisorService(planner, provider, store, memoryQuota());

  const first = await service.report("user-id", "request-id");
  const second = await service.report("user-id", "request-id");

  assert.equal(first.source, "openai");
  assert.equal(second.source, "cache");
  assert.equal(calls, 1);
  assert.equal(store.writes, 1);
  assert.equal(second.advice.summaryReport.headline, validAdvice.summaryReport.headline);
});

test("advisor service calls OpenAI again when refresh is allowed", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  let calls = 0;
  const provider: AiJsonProvider = {
    generateJson: async () => {
      calls += 1;
      return validAdvice;
    },
  };
  const store = memoryStore({
    userId: "user-id",
    contextHash: hashAdvisorContext(fixtureReport()),
    advice: validAdvice,
  });
  const quota = memoryQuota();
  const service = new AdvisorService(planner, provider, store, quota, true, false);

  const result = await service.report("user-id", "request-id", { refresh: true });

  assert.equal(result.source, "openai");
  assert.equal(calls, 1);
  assert.equal(store.writes, 1);
  assert.equal(quota.used, 1);
  assert.deepEqual(result.quota, { used: 1, limit: 1, remaining: 0, unlimited: false });
});

test("advisor service rejects a refresh once the allowance is spent", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  let calls = 0;
  const provider: AiJsonProvider = {
    generateJson: async () => {
      calls += 1;
      return validAdvice;
    },
  };
  const store = memoryStore({
    userId: "user-id",
    contextHash: hashAdvisorContext(fixtureReport()),
    advice: validAdvice,
  });
  const service = new AdvisorService(planner, provider, store, memoryQuota(1, 1), true, false);

  await assert.rejects(
    () => service.report("user-id", "request-id", { refresh: true }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 402 &&
      (error.details as { code: string }).code === "AI_REPORT_LIMIT_REACHED",
  );
  assert.equal(calls, 0);
  assert.equal(store.writes, 0);
});

test("advisor service ignores a spent allowance while ADVISOR_IGNORE_QUOTA is on", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  let calls = 0;
  const provider: AiJsonProvider = {
    generateJson: async () => {
      calls += 1;
      return validAdvice;
    },
  };
  const store = memoryStore({
    userId: "user-id",
    contextHash: hashAdvisorContext(fixtureReport()),
    advice: validAdvice,
  });
  const quota = memoryQuota(1, 1);
  const service = new AdvisorService(planner, provider, store, quota, true, true);

  const first = await service.report("user-id", "request-id", { refresh: true });
  const second = await service.report("user-id", "request-id", { refresh: true });

  assert.equal(first.source, "openai");
  assert.equal(second.source, "openai");
  assert.equal(calls, 2);
  assert.equal(quota.used, 1, "the override must not spend the stored allowance");
  assert.deepEqual(second.quota, { used: 1, limit: 1, remaining: 0, unlimited: true });
});

test("advisor service reports the quota as limited when the override is off", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  const provider: AiJsonProvider = {
    generateJson: async () => validAdvice,
  };
  const service = new AdvisorService(planner, provider, memoryStore(), memoryQuota(), false, false);

  const result = await service.report("user-id", "request-id");

  assert.equal(result.quota.unlimited, false);
});

test("advisor service still serves the saved report after the allowance is spent", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  let calls = 0;
  const provider: AiJsonProvider = {
    generateJson: async () => {
      calls += 1;
      return validAdvice;
    },
  };
  const store = memoryStore({
    userId: "user-id",
    contextHash: hashAdvisorContext(fixtureReport()),
    advice: validAdvice,
  });
  const service = new AdvisorService(planner, provider, store, memoryQuota(1, 1), false, false);

  const result = await service.report("user-id", "request-id");

  assert.equal(result.source, "cache");
  assert.equal(calls, 0);
  assert.deepEqual(result.quota, { used: 1, limit: 1, remaining: 0, unlimited: false });
});

test("advisor service ignores refresh when ADVISOR_ALLOW_REFRESH is missing", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  let calls = 0;
  const provider: AiJsonProvider = {
    generateJson: async () => {
      calls += 1;
      return validAdvice;
    },
  };
  const store = memoryStore({
    userId: "user-id",
    contextHash: hashAdvisorContext(fixtureReport()),
    advice: validAdvice,
  });
  const service = new AdvisorService(planner, provider, store, memoryQuota(), false);

  const result = await service.report("user-id", "request-id", { refresh: true });

  assert.equal(result.source, "cache");
  assert.equal(calls, 0);
  assert.equal(store.writes, 0);
});

test("advisor service propagates provider failures without persisting data", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  const provider: AiJsonProvider = {
    generateJson: async () => {
      throw new HttpError(503, "Upstream unavailable");
    },
  };
  const store = memoryStore();
  const service = new AdvisorService(planner, provider, store, memoryQuota());

  await assert.rejects(
    () => service.report("user-id", "request-id"),
    /Upstream unavailable/,
  );
  assert.equal(store.writes, 0);
});

test("advisor service returns the saved report when OpenAI fails later", async () => {
  const planner = {
    report: async () => fixtureReport(),
  } as unknown as PlannerService;
  const provider: AiJsonProvider = {
    generateJson: async () => {
      throw new HttpError(504, "Upstream timeout");
    },
  };
  const store = memoryStore({
    userId: "user-id",
    contextHash: "stale-hash",
    advice: validAdvice,
  });
  const quota = memoryQuota();
  const service = new AdvisorService(planner, provider, store, quota, true);

  const result = await service.report("user-id", "request-id", { refresh: true });

  assert.equal(result.source, "cache");
  assert.equal(result.advice.summaryReport.headline, validAdvice.summaryReport.headline);
  assert.equal(store.writes, 0);
  assert.equal(quota.used, 0);
});

test("printable HTML escapes AI-provided text before rendering", async () => {
  const html = await readFile(
    new URL("../../public/planner.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /escapeHtml\(advice\.executiveSummary\)/);
  assert.match(html, /escapeHtml\(item\.rationale\)/);
  assert.match(html, /escapeHtml\(advice\.disclaimer\)/);
  assert.match(html, /@media print/);
  assert.match(html, /window\.print\(\)/);
});
