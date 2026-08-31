export const CALCULATOR_TYPES = [
  "lumpsum",
  "sip",
  "step_up_sip",
  "emi",
  "loan",
  "future",
  "depreciation",
  "currency",
  "number_words",
  "bond_yield",
  "stock",
  "irr",
] as const;

export type CalculatorType = (typeof CALCULATOR_TYPES)[number];

type GrowthInput = {
  annualRatePct: number;
  years: number;
};

export type LumpsumInput = GrowthInput & {
  type: "lumpsum";
  principal: number;
};

export type SipInput = GrowthInput & {
  type: "sip";
  monthlyContribution: number;
};

export type StepUpSipInput = GrowthInput & {
  type: "step_up_sip";
  monthlyContribution: number;
  annualStepUpPct: number;
};

export type EmiInput = {
  type: "emi";
  principal: number;
  annualRatePct: number;
  months: number;
};

export type LoanInput = {
  type: "loan";
  principal: number;
  annualRatePct: number;
  months: number;
  monthlyPayment?: number;
};

export type FutureInput = GrowthInput & {
  type: "future";
  targetAmount: number;
};

export type DepreciationInput = {
  type: "depreciation";
  method: "straight_line" | "written_down_value";
  cost: number;
  salvageValue: number;
  usefulLifeYears: number;
  ratePct?: number;
};

export type CurrencyInput = {
  type: "currency";
  amount: number;
  exchangeRate: number;
  targetCurrency: string;
};

export type NumberWordsInput = {
  type: "number_words";
  number: number;
};

export type BondYieldInput = {
  type: "bond_yield";
  faceValue: number;
  marketPrice: number;
  annualCouponRatePct: number;
  yearsToMaturity: number;
  paymentsPerYear: 1 | 2 | 4;
};

export type StockInput = {
  type: "stock";
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  dividends: number;
  fees: number;
};

export type IrrInput = {
  type: "irr";
  cashFlows: number[];
};

export type CalculatorInput =
  | LumpsumInput
  | SipInput
  | StepUpSipInput
  | EmiInput
  | LoanInput
  | FutureInput
  | DepreciationInput
  | CurrencyInput
  | NumberWordsInput
  | BondYieldInput
  | StockInput
  | IrrInput;

export type CalculatorResult = {
  type: CalculatorType;
  values: Record<string, number>;
  schedule?: Array<Record<string, number>>;
  monthlySchedule?: Array<Record<string, number>>;
  textValues?: Record<string, string>;
  notes: string[];
};

const PROJECTION_NOTE =
  "This projection uses a constant return rate and is an estimate, not a guarantee.";

function round(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Calculation produced a non-finite result");
  }
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 1200;
}

function monthsFromYears(years: number): number {
  return Math.round(years * 12);
}

function annuityDueFactor(rate: number, months: number): number {
  if (rate === 0) {
    return months;
  }
  return (((1 + rate) ** months - 1) / rate) * (1 + rate);
}

function monthlyGrowthProjection(
  months: number,
  annualRatePct: number,
  contributionForMonth: (month: number) => number,
): {
  balance: number;
  investedAmount: number;
  finalMonthlyContribution: number;
  schedule: Array<Record<string, number>>;
} {
  const rate = monthlyRate(annualRatePct);
  let balance = 0;
  let investedAmount = 0;
  let finalMonthlyContribution = 0;
  const schedule: Array<Record<string, number>> = [];

  for (let month = 0; month < months; month += 1) {
    const contribution = contributionForMonth(month);
    investedAmount += contribution;
    balance = (balance + contribution) * (1 + rate);
    finalMonthlyContribution = contribution;

    if ((month + 1) % 12 === 0 || month === months - 1) {
      schedule.push({
        year: round((month + 1) / 12),
        investedAmount: round(investedAmount),
        estimatedReturns: round(balance - investedAmount),
        futureValue: round(balance),
      });
    }
  }

  return { balance, investedAmount, finalMonthlyContribution, schedule };
}

function computeLumpsum(input: LumpsumInput): CalculatorResult {
  const futureValue = input.principal * (1 + input.annualRatePct / 100) ** input.years;
  const schedule: Array<Record<string, number>> = [];
  for (let year = 1; year <= Math.ceil(input.years); year += 1) {
    const elapsedYears = Math.min(year, input.years);
    const value =
      input.principal * (1 + input.annualRatePct / 100) ** elapsedYears;
    schedule.push({
      year: round(elapsedYears),
      investedAmount: round(input.principal),
      estimatedReturns: round(value - input.principal),
      futureValue: round(value),
    });
  }
  return {
    type: input.type,
    values: {
      investedAmount: round(input.principal),
      estimatedReturns: round(futureValue - input.principal),
      futureValue: round(futureValue),
    },
    schedule,
    notes: [PROJECTION_NOTE, "Returns are compounded annually."],
  };
}

function computeSip(input: SipInput): CalculatorResult {
  const months = monthsFromYears(input.years);
  const projection = monthlyGrowthProjection(
    months,
    input.annualRatePct,
    () => input.monthlyContribution,
  );
  return {
    type: input.type,
    values: {
      months,
      investedAmount: round(projection.investedAmount),
      estimatedReturns: round(projection.balance - projection.investedAmount),
      futureValue: round(projection.balance),
    },
    schedule: projection.schedule,
    notes: [PROJECTION_NOTE, "Monthly contributions are invested at the start of each month."],
  };
}

function computeStepUpSip(input: StepUpSipInput): CalculatorResult {
  const months = monthsFromYears(input.years);
  const projection = monthlyGrowthProjection(
    months,
    input.annualRatePct,
    (month) =>
      input.monthlyContribution *
      (1 + input.annualStepUpPct / 100) ** Math.floor(month / 12),
  );

  return {
    type: input.type,
    values: {
      months,
      investedAmount: round(projection.investedAmount),
      estimatedReturns: round(projection.balance - projection.investedAmount),
      futureValue: round(projection.balance),
      finalMonthlyContribution: round(projection.finalMonthlyContribution),
    },
    schedule: projection.schedule,
    notes: [
      PROJECTION_NOTE,
      "Contributions are invested at the start of each month and increase every 12 months.",
    ],
  };
}

function scheduledEmi(principal: number, annualRatePct: number, months: number): number {
  const rate = monthlyRate(annualRatePct);
  if (rate === 0) {
    return principal / months;
  }
  const factor = (1 + rate) ** months;
  return (principal * rate * factor) / (factor - 1);
}

function amortizeLoan(
  principal: number,
  annualRatePct: number,
  monthlyPayment: number,
): {
  payoffMonths: number;
  totalPayment: number;
  totalInterest: number;
  monthly: Array<Record<string, number>>;
  yearly: Array<Record<string, number>>;
} {
  const rate = monthlyRate(annualRatePct);
  const firstMonthInterest = principal * rate;
  if (rate > 0 && monthlyPayment <= firstMonthInterest) {
    throw new Error("Monthly payment must be greater than the monthly interest");
  }

  let balance = principal;
  let totalInterest = 0;
  let totalPayment = 0;
  let payoffMonths = 0;
  const monthly: Array<Record<string, number>> = [];
  const yearlyTotals = new Map<
    number,
    { principal: number; interest: number; totalPayment: number; balance: number }
  >();
  const maxMonths = 12_000;

  while (balance > 0.005 && payoffMonths < maxMonths) {
    const interest = balance * rate;
    const payment = Math.min(monthlyPayment, balance + interest);
    const principalPaid = payment - interest;
    totalInterest += interest;
    totalPayment += payment;
    balance = Math.max(0, balance + interest - payment);
    payoffMonths += 1;
    const year = Math.ceil(payoffMonths / 12);
    const loanPaidToDatePct = ((principal - balance) / principal) * 100;
    monthly.push({
      year,
      month: payoffMonths,
      principal: round(principalPaid),
      interest: round(interest),
      payment: round(payment),
      balance: round(balance),
      loanPaidToDatePct: round(loanPaidToDatePct),
    });
    const bucket = yearlyTotals.get(year) ?? {
      principal: 0,
      interest: 0,
      totalPayment: 0,
      balance: 0,
    };
    bucket.principal += principalPaid;
    bucket.interest += interest;
    bucket.totalPayment += payment;
    bucket.balance = balance;
    yearlyTotals.set(year, bucket);
  }

  if (balance > 0.005) {
    throw new Error("Loan payoff exceeds the supported 1,000 year horizon");
  }

  const yearly = [...yearlyTotals.entries()].map(([year, row]) => ({
    year,
    principal: round(row.principal),
    interest: round(row.interest),
    totalPayment: round(row.totalPayment),
    balance: round(row.balance),
    loanPaidToDatePct: round(((principal - row.balance) / principal) * 100),
  }));

  return { payoffMonths, totalPayment, totalInterest, monthly, yearly };
}

function computeEmi(input: EmiInput): CalculatorResult {
  const emi = scheduledEmi(input.principal, input.annualRatePct, input.months);
  const amortized = amortizeLoan(input.principal, input.annualRatePct, emi);
  return {
    type: input.type,
    values: {
      principalAmount: round(input.principal),
      monthlyPayment: round(emi),
      totalPayment: round(amortized.totalPayment),
      totalInterest: round(amortized.totalInterest),
      months: input.months,
    },
    schedule: amortized.yearly,
    notes: ["Assumes a fixed interest rate and equal monthly instalments."],
  };
}

function computeLoan(input: LoanInput): CalculatorResult {
  const scheduledMonthlyPayment = scheduledEmi(
    input.principal,
    input.annualRatePct,
    input.months,
  );
  const monthlyPayment = input.monthlyPayment ?? scheduledMonthlyPayment;
  const amortized = amortizeLoan(input.principal, input.annualRatePct, monthlyPayment);
  const notes = [
    "Assumes a fixed interest rate and equal monthly instalments.",
  ];
  if (input.monthlyPayment !== undefined) {
    notes.push("Custom EMI is used instead of the tenure-based instalment.");
  }

  return {
    type: input.type,
    values: {
      monthlyPayment: round(monthlyPayment),
      scheduledMonthlyPayment: round(scheduledMonthlyPayment),
      totalPayment: round(amortized.totalPayment),
      totalInterest: round(amortized.totalInterest),
      months: input.months,
      payoffMonths: amortized.payoffMonths,
    },
    schedule: amortized.yearly,
    monthlySchedule: amortized.monthly,
    notes,
  };
}

function computeFuture(input: FutureInput): CalculatorResult {
  const months = monthsFromYears(input.years);
  const factor = annuityDueFactor(monthlyRate(input.annualRatePct), months);
  const requiredMonthlySip = input.targetAmount / factor;
  const projection = monthlyGrowthProjection(
    months,
    input.annualRatePct,
    () => requiredMonthlySip,
  );
  return {
    type: input.type,
    values: {
      months,
      targetAmount: round(input.targetAmount),
      requiredMonthlySip: round(requiredMonthlySip),
      investedAmount: round(projection.investedAmount),
      estimatedReturns: round(input.targetAmount - projection.investedAmount),
    },
    schedule: projection.schedule,
    notes: [PROJECTION_NOTE, "Required SIP assumes deposits at the start of each month."],
  };
}

function computeDepreciation(input: DepreciationInput): CalculatorResult {
  let bookValue = input.cost;
  let totalDepreciation = 0;
  const schedule: Array<Record<string, number>> = [];
  const depreciableAmount = input.cost - input.salvageValue;

  for (let year = 1; year <= input.usefulLifeYears; year += 1) {
    const rawDepreciation =
      input.method === "straight_line"
        ? depreciableAmount / input.usefulLifeYears
        : bookValue * ((input.ratePct ?? 0) / 100);
    const depreciation = Math.min(rawDepreciation, bookValue - input.salvageValue);
    bookValue = Math.max(input.salvageValue, bookValue - depreciation);
    totalDepreciation += depreciation;
    schedule.push({
      year,
      depreciation: round(depreciation),
      closingBookValue: round(bookValue),
    });
  }

  return {
    type: input.type,
    values: {
      cost: round(input.cost),
      salvageValue: round(input.salvageValue),
      totalDepreciation: round(totalDepreciation),
      bookValue: round(bookValue),
    },
    schedule,
    notes: [
      input.method === "straight_line"
        ? "Depreciation is spread evenly over the useful life."
        : "Written-down value depreciation applies the rate to each year's opening book value.",
      "Book value is not reduced below the salvage value.",
    ],
  };
}

function computeCurrency(input: CurrencyInput): CalculatorResult {
  return {
    type: input.type,
    values: {
      sourceAmount: round(input.amount),
      exchangeRate: round(input.exchangeRate),
      convertedAmount: round(input.amount * input.exchangeRate),
    },
    textValues: {
      conversion: `${input.targetCurrency} ${(input.amount * input.exchangeRate).toLocaleString(
        "en-IN",
        { maximumFractionDigits: 2 },
      )}`,
    },
    schedule: [
      {
        units: 1,
        inr: 1,
        convertedAmount: round(input.exchangeRate),
      },
      {
        units: round(input.amount),
        inr: round(input.amount),
        convertedAmount: round(input.amount * input.exchangeRate),
      },
    ],
    notes: [
      `Uses the manually entered rate of 1 INR = ${input.exchangeRate} ${input.targetCurrency}.`,
      "Exchange rates change continuously; confirm the live rate before transacting.",
    ],
  };
}

const SMALL_NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
] as const;

const TENS_WORDS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

function integerToIndianWords(value: number): string {
  if (value < 20) {
    return SMALL_NUMBER_WORDS[value] ?? "";
  }
  if (value < 100) {
    const remainder = value % 10;
    return `${TENS_WORDS[Math.floor(value / 10)]}${
      remainder ? ` ${integerToIndianWords(remainder)}` : ""
    }`;
  }
  if (value < 1_000) {
    const remainder = value % 100;
    return `${integerToIndianWords(Math.floor(value / 100))} hundred${
      remainder ? ` ${integerToIndianWords(remainder)}` : ""
    }`;
  }
  const scales = [
    { value: 10_000_000, label: "crore" },
    { value: 100_000, label: "lakh" },
    { value: 1_000, label: "thousand" },
  ] as const;
  const scale = scales.find((item) => value >= item.value);
  if (!scale) {
    return "";
  }
  const remainder = value % scale.value;
  return `${integerToIndianWords(Math.floor(value / scale.value))} ${scale.label}${
    remainder ? ` ${integerToIndianWords(remainder)}` : ""
  }`;
}

function computeNumberWords(input: NumberWordsInput): CalculatorResult {
  const words = integerToIndianWords(input.number);
  return {
    type: input.type,
    values: { number: input.number },
    textValues: {
      words: words.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    },
    notes: ["Uses the Indian numbering system (thousand, lakh, and crore)."],
  };
}

function bondPriceForPeriodicYield(
  couponPayment: number,
  faceValue: number,
  periods: number,
  periodicYield: number,
): number {
  let price = 0;
  for (let period = 1; period <= periods; period += 1) {
    price += couponPayment / (1 + periodicYield) ** period;
  }
  return price + faceValue / (1 + periodicYield) ** periods;
}

function solveBondYield(
  couponPayment: number,
  faceValue: number,
  marketPrice: number,
  periods: number,
  paymentsPerYear: number,
): number {
  let low = -0.999;
  let high = 10;
  for (let iteration = 0; iteration < 200; iteration += 1) {
    const middle = (low + high) / 2;
    const price = bondPriceForPeriodicYield(
      couponPayment,
      faceValue,
      periods,
      middle,
    );
    if (price > marketPrice) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return ((low + high) / 2) * paymentsPerYear * 100;
}

function computeBondYield(input: BondYieldInput): CalculatorResult {
  const periods = Math.max(
    1,
    Math.round(input.yearsToMaturity * input.paymentsPerYear),
  );
  const annualCoupon =
    input.faceValue * (input.annualCouponRatePct / 100);
  const couponPayment = annualCoupon / input.paymentsPerYear;
  const yieldToMaturityPct = solveBondYield(
    couponPayment,
    input.faceValue,
    input.marketPrice,
    periods,
    input.paymentsPerYear,
  );
  const totalCouponIncome = couponPayment * periods;
  const schedule: Array<Record<string, number>> = [];
  let cumulativeCouponIncome = 0;
  const years = Math.ceil(periods / input.paymentsPerYear);
  for (let year = 1; year <= years; year += 1) {
    const paymentsThisYear = Math.min(
      input.paymentsPerYear,
      periods - (year - 1) * input.paymentsPerYear,
    );
    const couponIncome = couponPayment * paymentsThisYear;
    cumulativeCouponIncome += couponIncome;
    schedule.push({
      year,
      couponIncome: round(couponIncome),
      cumulativeCouponIncome: round(cumulativeCouponIncome),
      redemptionValue: year === years ? round(input.faceValue) : 0,
    });
  }

  return {
    type: input.type,
    values: {
      marketPrice: round(input.marketPrice),
      faceValue: round(input.faceValue),
      annualCoupon: round(annualCoupon),
      currentYieldPct: round((annualCoupon / input.marketPrice) * 100),
      yieldToMaturityPct: round(yieldToMaturityPct),
      totalCouponIncome: round(totalCouponIncome),
      redemptionGainLoss: round(input.faceValue - input.marketPrice),
    },
    schedule,
    notes: [
      "Yield to maturity assumes every coupon is received as scheduled and the bond is held to maturity.",
      "This does not include taxes, default risk, or reinvestment differences.",
    ],
  };
}

function computeStock(input: StockInput): CalculatorResult {
  const purchaseCost = input.buyPrice * input.quantity;
  const grossProceeds = input.sellPrice * input.quantity;
  const netProceeds = grossProceeds + input.dividends - input.fees;
  const netProfit = netProceeds - purchaseCost;
  return {
    type: input.type,
    values: {
      purchaseCost: round(purchaseCost),
      grossProceeds: round(grossProceeds),
      dividends: round(input.dividends),
      fees: round(input.fees),
      netProceeds: round(netProceeds),
      netProfit: round(netProfit),
      returnPct: round((netProfit / purchaseCost) * 100),
      breakEvenPrice: round(
        (purchaseCost + input.fees - input.dividends) / input.quantity,
      ),
    },
    schedule: [
      {
        stage: 1,
        marketValue: round(purchaseCost),
        cashIncome: 0,
        fees: 0,
        netValue: round(purchaseCost),
      },
      {
        stage: 2,
        marketValue: round(grossProceeds),
        cashIncome: round(input.dividends),
        fees: round(input.fees),
        netValue: round(netProceeds),
      },
    ],
    notes: [
      "Return includes entered dividends and fees but excludes taxes and inflation.",
    ],
  };
}

function netPresentValue(cashFlows: number[], rate: number): number {
  return cashFlows.reduce(
    (total, cashFlow, period) => total + cashFlow / (1 + rate) ** period,
    0,
  );
}

function solveIrr(cashFlows: number[]): number {
  let low = -0.9999;
  let high = 10;
  let lowValue = netPresentValue(cashFlows, low);
  let highValue = netPresentValue(cashFlows, high);
  if (lowValue * highValue > 0) {
    throw new Error("IRR could not be resolved for these cash flows");
  }
  for (let iteration = 0; iteration < 250; iteration += 1) {
    const middle = (low + high) / 2;
    const middleValue = netPresentValue(cashFlows, middle);
    if (Math.abs(middleValue) < 1e-9) {
      return middle * 100;
    }
    if (lowValue * middleValue <= 0) {
      high = middle;
      highValue = middleValue;
    } else {
      low = middle;
      lowValue = middleValue;
    }
  }
  return ((low + high) / 2) * 100;
}

function computeIrr(input: IrrInput): CalculatorResult {
  const totalInflows = input.cashFlows
    .filter((cashFlow) => cashFlow > 0)
    .reduce((total, cashFlow) => total + cashFlow, 0);
  const totalOutflows = Math.abs(
    input.cashFlows
      .filter((cashFlow) => cashFlow < 0)
      .reduce((total, cashFlow) => total + cashFlow, 0),
  );
  let cumulativeCashFlow = 0;
  const schedule = input.cashFlows.map((cashFlow, period) => {
    cumulativeCashFlow += cashFlow;
    return {
      period,
      cashFlow: round(cashFlow),
      cumulativeCashFlow: round(cumulativeCashFlow),
    };
  });
  return {
    type: input.type,
    values: {
      irrPct: round(solveIrr(input.cashFlows)),
      totalInflows: round(totalInflows),
      totalOutflows: round(totalOutflows),
      netCashFlow: round(totalInflows - totalOutflows),
    },
    schedule,
    notes: [
      "IRR is the periodic discount rate that makes net present value equal to zero.",
      "Cash flows must use equal time intervals and begin with an outflow.",
      "Cash flows with multiple sign changes can have more than one valid IRR.",
    ],
  };
}

export function computeCalculator(input: CalculatorInput): CalculatorResult {
  switch (input.type) {
    case "lumpsum":
      return computeLumpsum(input);
    case "sip":
      return computeSip(input);
    case "step_up_sip":
      return computeStepUpSip(input);
    case "emi":
      return computeEmi(input);
    case "loan":
      return computeLoan(input);
    case "future":
      return computeFuture(input);
    case "depreciation":
      return computeDepreciation(input);
    case "currency":
      return computeCurrency(input);
    case "number_words":
      return computeNumberWords(input);
    case "bond_yield":
      return computeBondYield(input);
    case "stock":
      return computeStock(input);
    case "irr":
      return computeIrr(input);
  }
}
