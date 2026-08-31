import { z } from "zod";
import { CALCULATOR_TYPES } from "./calculator.engine";

const amount = z.number().finite().positive().max(1_000_000_000_000);
const nonNegativeAmount = z.number().finite().nonnegative().max(1_000_000_000_000);
const annualRate = z.number().finite().nonnegative().max(100);
const years = z.number().finite().min(1 / 12).max(100);
const title = z.string().trim().min(1).max(120);

const lumpsumSchema = z
  .object({
    type: z.literal("lumpsum"),
    principal: amount,
    annualRatePct: annualRate,
    years,
  })
  .strict();

const sipSchema = z
  .object({
    type: z.literal("sip"),
    monthlyContribution: amount,
    annualRatePct: annualRate,
    years,
  })
  .strict();

const stepUpSipSchema = z
  .object({
    type: z.literal("step_up_sip"),
    monthlyContribution: amount,
    annualRatePct: annualRate,
    years,
    annualStepUpPct: annualRate,
  })
  .strict();

const emiSchema = z
  .object({
    type: z.literal("emi"),
    principal: amount,
    annualRatePct: annualRate,
    months: z.number().int().positive().max(1_200),
  })
  .strict();

const loanSchema = z
  .object({
    type: z.literal("loan"),
    principal: amount,
    annualRatePct: annualRate,
    months: z.number().int().positive().max(1_200),
    monthlyPayment: amount.optional(),
    prepaymentAmount: nonNegativeAmount.optional(),
    increasedMonthlyPayment: nonNegativeAmount.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.prepaymentAmount !== undefined &&
      value.prepaymentAmount > value.principal
    ) {
      context.addIssue({
        code: "custom",
        path: ["prepaymentAmount"],
        message: "Prepayment amount cannot exceed the outstanding principal",
      });
    }
  });

const futureSchema = z
  .object({
    type: z.literal("future"),
    targetAmount: amount,
    annualRatePct: annualRate,
    years,
  })
  .strict();

const depreciationSchema = z
  .object({
    type: z.literal("depreciation"),
    method: z.enum(["straight_line", "written_down_value"]),
    cost: amount,
    salvageValue: nonNegativeAmount,
    usefulLifeYears: z.number().int().positive().max(100),
    ratePct: z.number().finite().positive().max(100).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.salvageValue > value.cost) {
      context.addIssue({
        code: "custom",
        path: ["salvageValue"],
        message: "Salvage value cannot exceed cost",
      });
    }
    if (value.method === "written_down_value" && value.ratePct === undefined) {
      context.addIssue({
        code: "custom",
        path: ["ratePct"],
        message: "Rate is required for written-down value depreciation",
      });
    }
  });

const currencySchema = z
  .object({
    type: z.literal("currency"),
    amount,
    exchangeRate: z.number().finite().positive().max(1_000_000),
    targetCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  })
  .strict();

const numberWordsSchema = z
  .object({
    type: z.literal("number_words"),
    number: z.number().int().nonnegative().max(999_999_999_999),
  })
  .strict();

const bondYieldSchema = z
  .object({
    type: z.literal("bond_yield"),
    faceValue: amount,
    marketPrice: amount,
    annualCouponRatePct: annualRate,
    yearsToMaturity: years,
    paymentsPerYear: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  })
  .strict();

const stockSchema = z
  .object({
    type: z.literal("stock"),
    buyPrice: amount,
    sellPrice: nonNegativeAmount,
    quantity: amount,
    dividends: nonNegativeAmount,
    fees: nonNegativeAmount,
  })
  .strict();

const cashFlows = z
  .array(z.number().finite().min(-1_000_000_000_000).max(1_000_000_000_000))
  .min(2)
  .max(1_000)
  .superRefine((values, context) => {
    if ((values[0] ?? 0) >= 0) {
      context.addIssue({
        code: "custom",
        path: [0],
        message: "The first cash flow must be an outflow",
      });
    }
    if (!values.some((value) => value > 0)) {
      context.addIssue({
        code: "custom",
        message: "At least one positive cash flow is required",
      });
    }
  });

const irrSchema = z
  .object({
    type: z.literal("irr"),
    cashFlows,
  })
  .strict();

export const calculatorInputSchema = z.discriminatedUnion("type", [
  lumpsumSchema,
  sipSchema,
  stepUpSipSchema,
  emiSchema,
  loanSchema,
  futureSchema,
  depreciationSchema,
  currencySchema,
  numberWordsSchema,
  bondYieldSchema,
  stockSchema,
  irrSchema,
]);

export const createCalculatorScenarioBodySchema = z.discriminatedUnion("type", [
  lumpsumSchema.extend({ title: title.optional() }),
  sipSchema.extend({ title: title.optional() }),
  stepUpSipSchema.extend({ title: title.optional() }),
  emiSchema.extend({ title: title.optional() }),
  loanSchema.safeExtend({ title: title.optional() }),
  futureSchema.extend({ title: title.optional() }),
  depreciationSchema.safeExtend({ title: title.optional() }),
  currencySchema.extend({ title: title.optional() }),
  numberWordsSchema.extend({ title: title.optional() }),
  bondYieldSchema.extend({ title: title.optional() }),
  stockSchema.extend({ title: title.optional() }),
  irrSchema.extend({ title: title.optional() }),
]);

export const updateCalculatorScenarioBodySchema = z
  .object({
    title: title.optional(),
    type: z.enum(CALCULATOR_TYPES).optional(),
    principal: amount.optional(),
    monthlyContribution: amount.optional(),
    annualRatePct: annualRate.optional(),
    years: years.optional(),
    annualStepUpPct: annualRate.optional(),
    months: z.number().int().positive().max(1_200).optional(),
    monthlyPayment: amount.optional(),
    prepaymentAmount: nonNegativeAmount.optional(),
    increasedMonthlyPayment: nonNegativeAmount.optional(),
    targetAmount: amount.optional(),
    method: z.enum(["straight_line", "written_down_value"]).optional(),
    cost: amount.optional(),
    salvageValue: nonNegativeAmount.optional(),
    usefulLifeYears: z.number().int().positive().max(100).optional(),
    ratePct: z.number().finite().positive().max(100).optional(),
    amount: amount.optional(),
    exchangeRate: z.number().finite().positive().max(1_000_000).optional(),
    targetCurrency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(),
    number: z.number().int().nonnegative().max(999_999_999_999).optional(),
    faceValue: amount.optional(),
    marketPrice: amount.optional(),
    annualCouponRatePct: annualRate.optional(),
    yearsToMaturity: years.optional(),
    paymentsPerYear: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
    buyPrice: amount.optional(),
    sellPrice: nonNegativeAmount.optional(),
    quantity: amount.optional(),
    dividends: nonNegativeAmount.optional(),
    fees: nonNegativeAmount.optional(),
    cashFlows: cashFlows.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const calculatorIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listCalculatorScenariosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.enum(CALCULATOR_TYPES).optional(),
});

export const removeCalculatorScenarioBodySchema = z.object({
  id: z.string().uuid(),
});

export type CalculatorInputBody = z.infer<typeof calculatorInputSchema>;
export type CreateCalculatorScenarioBody = z.infer<
  typeof createCalculatorScenarioBodySchema
>;
export type UpdateCalculatorScenarioBody = z.infer<
  typeof updateCalculatorScenarioBodySchema
>;
export type ListCalculatorScenariosQuery = z.infer<
  typeof listCalculatorScenariosQuerySchema
>;
export type RemoveCalculatorScenarioBody = z.infer<
  typeof removeCalculatorScenarioBodySchema
>;
