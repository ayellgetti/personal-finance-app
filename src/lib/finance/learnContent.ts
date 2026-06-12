import {
  PiggyBank, ShieldAlert, ShieldCheck, Landmark, TrendingUp, LineChart,
  Receipt, Rocket, Home, Flame, Target, Gem,
} from "lucide-react";

export type LessonFormat = "2-min read" | "Video" | "Infographic" | "Calculator" | "Quiz";

export interface Lesson {
  title: string;
  format: LessonFormat;
  minutes: number;
  summary: string;
  body: string[];
}

export interface LearnCategory {
  id: string;
  title: string;
  icon: typeof PiggyBank;
  blurb: string;
  lessons: Lesson[];
}

export const LEARN_CATEGORIES: LearnCategory[] = [
  {
    id: "budgeting",
    title: "Budgeting Basics",
    icon: Receipt,
    blurb: "Take control of every rupee with a simple, repeatable system.",
    lessons: [
      {
        title: "The 50-30-20 Budget",
        format: "2-min read",
        minutes: 2,
        summary: "Split income into needs, wants and savings for effortless balance.",
        body: [
          "The 50-30-20 rule divides your take-home pay into three buckets: 50% to needs, 30% to wants, and 20% to savings & debt repayment.",
          "Needs are non-negotiables — rent, groceries, utilities, EMIs. Wants are lifestyle choices — dining out, subscriptions, travel.",
          "Automate the 20% on payday so saving happens before spending. Adjust the ratios if you live in a high-cost city, but never let savings drop below 20%.",
        ],
      },
      {
        title: "Zero-Based Budgeting",
        format: "Infographic",
        minutes: 2,
        summary: "Give every rupee a job so nothing leaks away.",
        body: [
          "In zero-based budgeting, income minus expenses equals zero — every rupee is assigned to spending, saving, or investing.",
          "It forces intentional choices and surfaces hidden leaks like unused subscriptions.",
          "Review weekly. Reassign unspent amounts to savings instead of letting them vanish.",
        ],
      },
    ],
  },
  {
    id: "emergency",
    title: "Emergency Fund",
    icon: ShieldAlert,
    blurb: "Build a safety net before you build wealth.",
    lessons: [
      {
        title: "Why You Need 6X Expenses",
        format: "2-min read",
        minutes: 2,
        summary: "An emergency fund is insurance against job loss and shocks.",
        body: [
          "An emergency fund covers 6–12 months of essential expenses, kept in liquid, low-risk instruments.",
          "Salaried earners aim for 6 months; business owners and freelancers need 9–12 months due to income volatility.",
          "Park it across a savings account, sweep-in FD, and liquid funds for a mix of instant access and better returns.",
        ],
      },
      {
        title: "Where to Keep It",
        format: "Calculator",
        minutes: 2,
        summary: "Balance instant access with returns across 3–4 instruments.",
        body: [
          "Keep 1 month in a savings account for instant needs.",
          "Place 2–3 months in sweep-in FDs and the rest in liquid mutual funds.",
          "Never invest your emergency fund in equities — capital safety beats returns here.",
        ],
      },
    ],
  },
  {
    id: "insurance",
    title: "Insurance Planning",
    icon: ShieldCheck,
    blurb: "Protect your income and family before investing.",
    lessons: [
      {
        title: "Term Insurance Explained",
        format: "2-min read",
        minutes: 2,
        summary: "Pure protection at the lowest cost — cover 15-20x income.",
        body: [
          "Term insurance pays your family a large sum if you pass away during the policy term — at a tiny premium.",
          "Aim for cover of 15–20x your annual income, plus outstanding loans.",
          "Never mix insurance with investment (avoid ULIPs/endowments for protection). Buy term + invest the difference.",
        ],
      },
      {
        title: "Health Cover Essentials",
        format: "Video",
        minutes: 3,
        summary: "A medical emergency can wipe out years of savings.",
        body: [
          "Get a family floater of at least ₹10 lakh, more in metro cities.",
          "Add a super top-up to extend cover cheaply.",
          "Check for room-rent caps and disease waiting periods before buying.",
        ],
      },
    ],
  },
  {
    id: "debt",
    title: "Debt Management",
    icon: Landmark,
    blurb: "Escape high-interest debt and free up cashflow.",
    lessons: [
      {
        title: "Avalanche vs Snowball",
        format: "2-min read",
        minutes: 2,
        summary: "Two proven strategies to clear debt faster.",
        body: [
          "Avalanche: pay minimums on all loans, then attack the highest-interest debt first — saves the most money.",
          "Snowball: clear the smallest balance first for quick psychological wins.",
          "Keep total EMIs under 40% of income. Prepay high-rate personal loans before low-rate home loans.",
        ],
      },
    ],
  },
  {
    id: "mutualfunds",
    title: "Mutual Funds",
    icon: TrendingUp,
    blurb: "Invest in markets without picking individual stocks.",
    lessons: [
      {
        title: "SIP & Rupee Cost Averaging",
        format: "2-min read",
        minutes: 2,
        summary: "Invest a fixed amount monthly to smooth out volatility.",
        body: [
          "A SIP invests a fixed sum every month, buying more units when prices fall and fewer when they rise.",
          "Index funds offer low-cost, diversified exposure — ideal for beginners.",
          "Stay invested for 7+ years to let compounding work. Don't stop SIPs in market dips.",
        ],
      },
    ],
  },
  {
    id: "stocks",
    title: "Stock Market Basics",
    icon: LineChart,
    blurb: "Understand equities before you buy your first share.",
    lessons: [
      {
        title: "What Moves a Stock",
        format: "2-min read",
        minutes: 2,
        summary: "Earnings, growth and sentiment drive long-term prices.",
        body: [
          "A share is part-ownership of a business. Over the long run, prices follow earnings growth.",
          "Diversify across sectors and never invest borrowed money.",
          "Ignore daily noise — time in the market beats timing the market.",
        ],
      },
    ],
  },
  {
    id: "tax",
    title: "Tax Saving",
    icon: Receipt,
    blurb: "Keep more of what you earn, legally.",
    lessons: [
      {
        title: "80C and Beyond",
        format: "2-min read",
        minutes: 2,
        summary: "Use deductions to cut your taxable income.",
        body: [
          "Section 80C lets you deduct up to ₹1.5 lakh via ELSS, PPF, EPF, and life insurance premiums.",
          "ELSS funds offer the shortest lock-in (3 years) plus equity returns.",
          "Compare old vs new tax regime each year based on your deductions.",
        ],
      },
    ],
  },
  {
    id: "retirement",
    title: "Retirement Planning",
    icon: PiggyBank,
    blurb: "Secure your future self with disciplined investing.",
    lessons: [
      {
        title: "The Power of Starting Early",
        format: "2-min read",
        minutes: 2,
        summary: "A decade head-start can double your final corpus.",
        body: [
          "Thanks to compounding, money invested in your 20s grows far more than the same amount in your 40s.",
          "Use a mix of EPF, NPS, PPF, and equity mutual funds.",
          "Target a corpus of 25x your annual expenses for a comfortable retirement.",
        ],
      },
    ],
  },
  {
    id: "realestate",
    title: "Real Estate Investing",
    icon: Home,
    blurb: "Weigh property as an asset class.",
    lessons: [
      {
        title: "Buy vs Rent",
        format: "2-min read",
        minutes: 2,
        summary: "Owning isn't always better — run the numbers.",
        body: [
          "Real estate is illiquid and carries high transaction costs (stamp duty, registration, brokerage).",
          "Compare the rental yield (usually 2–3%) against returns from equity (10–12%).",
          "Buy a home to live in for stability, not purely as an investment.",
        ],
      },
    ],
  },
  {
    id: "fire",
    title: "Financial Freedom & FIRE",
    icon: Flame,
    blurb: "Reach the point where work becomes optional.",
    lessons: [
      {
        title: "The 4% Rule",
        format: "2-min read",
        minutes: 2,
        summary: "Withdraw 4% a year from a 25x corpus, sustainably.",
        body: [
          "FIRE = Financial Independence, Retire Early. The goal is a corpus of 25x your annual expenses.",
          "The 4% rule says you can safely withdraw 4% of that corpus each year, adjusted for inflation.",
          "Boost your savings rate — it's the single biggest lever to reach FIRE faster.",
        ],
      },
    ],
  },
  {
    id: "goals",
    title: "Goal Planning",
    icon: Target,
    blurb: "Turn dreams into funded, time-bound plans.",
    lessons: [
      {
        title: "Goal-Based Investing",
        format: "2-min read",
        minutes: 2,
        summary: "Match each goal to the right instrument and horizon.",
        body: [
          "Tag every goal with a target amount and date, then adjust for inflation.",
          "Short-term goals (<3 yrs) → debt funds/FDs. Long-term goals (>7 yrs) → equity.",
          "Review annually and increase contributions as income grows.",
        ],
      },
    ],
  },
  {
    id: "wealth",
    title: "Wealth Building",
    icon: Gem,
    blurb: "Compound your way to lasting prosperity.",
    lessons: [
      {
        title: "Pay Yourself First",
        format: "2-min read",
        minutes: 2,
        summary: "Automate investments before lifestyle spending.",
        body: [
          "Wealth is built by consistently investing a growing share of income.",
          "Increase your SIP every time your salary rises (step-up SIP).",
          "Avoid lifestyle inflation — let income grow faster than expenses.",
        ],
      },
    ],
  },
];

export interface ThumbRule {
  id: string;
  title: string;
  formula: string;
  description: string;
  icon: typeof PiggyBank;
}

export const THUMB_RULES: ThumbRule[] = [
  { id: "503020", title: "50-30-20 Rule", formula: "50% Needs · 30% Wants · 20% Savings", description: "A simple budgeting split for balanced money management.", icon: Receipt },
  { id: "100age", title: "100 Minus Age Rule", formula: "Equity % = 100 − Age", description: "Suggested equity allocation as you grow older.", icon: LineChart },
  { id: "6x", title: "6X Emergency Fund Rule", formula: "Emergency Fund = 6 × Monthly Expenses", description: "Minimum safety buffer for salaried earners.", icon: ShieldAlert },
  { id: "20x", title: "20X Annual Expense Rule", formula: "Freedom Corpus = 20–25 × Annual Expenses", description: "The nest egg needed for financial freedom.", icon: Flame },
  { id: "lifeins", title: "Life Insurance Rule", formula: "Cover = 15–20 × Annual Income", description: "Adequate term protection for your dependents.", icon: ShieldCheck },
  { id: "housing", title: "Housing / EMI Rule", formula: "EMI ≤ 30–40% of Income", description: "Keep loan EMIs within a safe share of income.", icon: Home },
];
