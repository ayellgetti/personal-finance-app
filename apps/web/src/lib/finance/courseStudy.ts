/* ─────────────────────────────────────────────────────────────────────────
   Financial Freedom Journey — Study material for all 30 lessons
   Each entry: overview paragraphs, key points, worked Indian example,
   and a step-by-step guide to the matching Freedom Planner tab.
   ───────────────────────────────────────────────────────────────────────── */

export interface LessonExample {
  title: string;
  steps: string[];
}

export interface AppGuide {
  tab: string;
  description: string;
  steps: string[];
}

export interface LessonStudy {
  overview: string[];
  keyPoints: string[];
  example: LessonExample;
  appGuide: AppGuide;
}

export const LESSON_STUDY: Record<number, LessonStudy> = {
  1: {
    overview: [
      "Financial freedom is the point where your passive income — money that flows in without active work — fully covers your living expenses. This is fundamentally different from being 'rich': a doctor earning ₹5 lakh/month but spending ₹4.8 lakh is less free than a teacher who earns ₹60,000 but needs only ₹40,000 and has rental income of ₹50,000.",
      "Freedom Planner measures this with a Freedom Score from 0 to 100. A score of 100 means passive income equals or exceeds monthly expenses — you no longer need to work for money. Most people start at 5–15. The goal is to raise it, year by year, through intentional saving, investing, and debt reduction.",
      "Before doing anything else, define your own freedom. What monthly income would let you live comfortably without a job? That number — multiplied by 12, then multiplied by 25 (the 4% withdrawal rule) — is your Freedom Number, your corpus target.",
    ],
    keyPoints: [
      "Financial freedom = passive income ≥ monthly expenses (not net worth > ₹X crore)",
      "Passive income sources: rental income, dividends, SIP returns, royalties, interest on FDs/bonds",
      "Freedom Number = monthly expenses × 12 × 25 (corpus that can sustain 4% withdrawal indefinitely)",
      "Freedom Score in Freedom Planner = (passive income ÷ monthly expenses) × 100",
      "Start by writing your 'freedom lifestyle' — the monthly cost of the life you want without a job",
      "Every rupee saved and invested moves the score; every rupee of unnecessary expense raises the target",
    ],
    example: {
      title: "Rahul's Freedom Score",
      steps: [
        "Rahul earns ₹1,20,000/month. His expenses: rent ₹18,000, food ₹12,000, EMIs ₹22,000, other ₹8,000 = ₹60,000/month.",
        "Passive income: nil currently. Freedom Score = 0/100.",
        "His Freedom Number = ₹60,000 × 12 × 25 = ₹1.8 crore.",
        "He starts a ₹25,000/month SIP. At 10% CAGR over 18 years → corpus ≈ ₹1.8 crore.",
        "He also plans to buy a flat that earns ₹20,000/month rent in 10 years, reducing his required corpus.",
        "Defining the goal and the number is step one — without it, saving feels random.",
      ],
    },
    appGuide: {
      tab: "Freedom Calculator",
      description: "See your current Freedom Score, define your freedom goal, and project when you'll reach it.",
      steps: [
        "Go to the Freedom Calculator tab from the left nav.",
        "Enter your monthly expenses and any current passive income to see your real-time Freedom Score.",
        "Toggle to the 'Retirement / FIRE' mode to enter your target retirement age and lifestyle cost.",
        "The calculator shows your Freedom Number (corpus needed) and the monthly investment required to reach it.",
        "Use the 'Path' toggle to compare Lean, Regular, Fat, and Coast FIRE scenarios.",
        "Once you have a goal, set it formally in the Goals tab so Freedom Planner tracks your progress.",
      ],
    },
  },

  2: {
    overview: [
      "Understanding your money starts with a complete financial snapshot: everything you own (assets) and everything you owe (liabilities). The difference is your net worth — the single most important number in personal finance. It can be negative when you start, and that is fine. Knowing it accurately is what matters.",
      "Most people overestimate their net worth because they count assets at purchase price, not current market value, and underestimate liabilities by forgetting small loans. A complete, honest snapshot — bank balances, investments, property, vehicle value, all loans, credit card outstanding — gives you a true baseline from which to grow.",
    ],
    keyPoints: [
      "Net worth = Total assets − Total liabilities (can be negative initially — that is the starting point, not a failure)",
      "Assets: savings accounts, FDs, mutual funds, EPF/PPF balance, property market value, gold, vehicle resale value",
      "Liabilities: home loan outstanding, car loan, personal loan, credit card dues, family borrowings",
      "Liquid assets = can be converted to cash within days without major loss (savings, liquid funds, FDs <1 year)",
      "Fixed income = predictable recurring income: salary, rent, pension, interest",
      "Update your snapshot every 3–6 months to track net worth growth over time",
    ],
    example: {
      title: "Priya's Financial Snapshot",
      steps: [
        "Assets: Savings account ₹80,000 | FD ₹1,50,000 | Mutual funds ₹2,20,000 | EPF ₹3,40,000 | Bike resale ₹60,000 = Total ₹8,50,000.",
        "Liabilities: Personal loan outstanding ₹1,20,000 | Credit card due ₹35,000 | Family loan ₹50,000 = Total ₹2,05,000.",
        "Net worth = ₹8,50,000 − ₹2,05,000 = ₹6,45,000.",
        "Monthly income: Salary ₹75,000 (fixed) + freelance average ₹15,000 (variable) = ₹90,000.",
        "By entering this in Freedom Planner's profile, all tools (freedom score, advisor, planner) use real numbers instead of guesses.",
      ],
    },
    appGuide: {
      tab: "Profile → Financial Profile",
      description: "Complete your financial profile so every tool in the app uses your real numbers.",
      steps: [
        "Click Profile (top-right avatar) → Financial Profile tab.",
        "Enter monthly income: salary, rental, business — each as a separate line.",
        "Add all assets: bank balances, FDs, mutual fund value, EPF, property, vehicle.",
        "Add all liabilities: every loan, credit card outstanding, and informal borrowing.",
        "Save — Freedom Planner instantly updates your net worth, Freedom Score, and advisor insights.",
        "Return every 3 months to update values and see net worth growth on the Dashboard.",
      ],
    },
  },

  3: {
    overview: [
      "Cash flow is the movement of money in and out of your account over a period — usually a month. Positive cash flow means income exceeds expenses; negative means you are spending more than you earn. Unlike net worth (a snapshot), cash flow is a movie — it shows whether you are moving forward or backward every month.",
      "Understanding your cash flow is the prerequisite for every financial decision: investing, saving, debt repayment. If you don't know your surplus, you might invest money you need for next month's rent, or under-invest when you have more room than you think.",
    ],
    keyPoints: [
      "Cash inflows: salary, rent received, dividends, freelance income, any money coming in",
      "Cash outflows: rent paid, EMIs, groceries, utilities, subscriptions, entertainment, everything going out",
      "Monthly surplus = total inflows − total outflows (the only amount truly available to save or invest)",
      "Track for 3 months to find the real average — don't rely on your best or worst month",
      "Seasonal expenses (insurance premiums, school fees, holidays) should be monthly-averaged ('sinking fund' approach)",
      "A surplus of even ₹5,000/month, consistently invested, creates significant wealth over 10+ years",
    ],
    example: {
      title: "Arjun's Cash Flow Reality Check",
      steps: [
        "Arjun thought he was saving ₹20,000/month. He tracked actual spending for 3 months.",
        "Income: Salary ₹95,000 + side income avg ₹8,000 = ₹1,03,000/month.",
        "Outflows: Rent ₹25,000 | Home loan EMI ₹18,000 | Groceries ₹10,000 | Dining out ₹8,000 | Subscriptions ₹3,500 | Fuel ₹4,000 | Annual expenses (₹1.2L ÷ 12) = ₹10,000 | Other ₹12,000 = ₹90,500/month.",
        "Real surplus = ₹1,03,000 − ₹90,500 = ₹12,500 (not ₹20,000 as he thought).",
        "Discovery: ₹3,500 in subscriptions he forgot about, ₹10,000 in annual expenses not factored in.",
        "He cancelled 2 unused subscriptions (₹2,000 saved) and renegotiated the internet plan (₹500 saved).",
        "Revised surplus = ₹15,000 — now invested consistently.",
      ],
    },
    appGuide: {
      tab: "Expenses + Budget Tracker",
      description: "Map your inflows and outflows to find your true monthly surplus.",
      steps: [
        "Go to Expenses → Add all recurring monthly expenses with accurate amounts.",
        "Add variable expenses as monthly averages (3-month average is best).",
        "Go to Income → confirm all income sources are entered with the correct frequency.",
        "Your Dashboard will now show Cash Flow: total inflows vs outflows and your monthly surplus.",
        "Use Budget Tracker (Daily tab) to log actual daily spending and compare against budget.",
        "The Statement Analyzer tab can auto-import and categorize transactions from bank statements.",
      ],
    },
  },

  4: {
    overview: [
      "A budget is simply a plan for your money before the month begins. The most popular framework is the 50/30/20 rule: 50% of take-home income to needs (rent, EMIs, groceries, utilities), 30% to wants (dining, entertainment, travel), and 20% to savings and debt repayment. It's a starting point — adjust based on your city, income, and goals.",
      "Zero-based budgeting takes it further: every rupee of income is assigned a category so income minus allocations equals zero. Nothing 'disappears.' This approach is powerful for high earners who wonder where their money goes despite a large salary.",
    ],
    keyPoints: [
      "50/30/20: Needs ≤50%, Wants ≤30%, Savings/Debt ≥20% of take-home pay",
      "Needs: rent, EMIs, insurance premiums, groceries, utilities, medicines — non-negotiable essentials",
      "Wants: restaurants, OTT subscriptions, shopping, vacations, gadgets — nice but cuttable",
      "Savings bucket includes: emergency fund contributions, SIPs, loan prepayments, goal contributions",
      "If you live in Mumbai or Delhi, Needs may be 60%+ — reduce Wants instead of Savings",
      "Automate savings on salary day — pay yourself first before discretionary spending begins",
    ],
    example: {
      title: "Meera's 50/30/20 Budget (₹70,000 take-home)",
      steps: [
        "Take-home: ₹70,000/month.",
        "Needs (50% = ₹35,000): Rent ₹18,000 | Groceries ₹7,000 | Utilities ₹2,500 | Transport ₹4,000 | Insurance premiums ₹3,500 = ₹35,000. ✓",
        "Wants (30% = ₹21,000): Dining out ₹5,000 | OTT & apps ₹2,000 | Shopping ₹6,000 | Weekend activities ₹5,000 | Miscellaneous ₹3,000 = ₹21,000. ✓",
        "Savings (20% = ₹14,000): Emergency fund SIP ₹5,000 | ELSS SIP ₹5,000 | Vacation goal ₹4,000 = ₹14,000. ✓",
        "Total = ₹70,000. Every rupee has a purpose.",
        "Meera automates all three SIPs on the 2nd of each month, right after salary credit.",
      ],
    },
    appGuide: {
      tab: "Expenses → Budget Planner",
      description: "Set up your monthly budget and see how your spending compares to the 50/30/20 framework.",
      steps: [
        "Go to Expenses tab → Budget section.",
        "Enter your monthly take-home income.",
        "Add each expense category and tag it as Need, Want, or Saving.",
        "Freedom Planner calculates your percentages and flags when you exceed the recommended 50/30/20 split.",
        "Use the Budget Tracker (Daily tab) to log actual spending daily and compare against your plan.",
        "At month-end, the dashboard shows budget variance — categories where you over- or underspent.",
      ],
    },
  },

  5: {
    overview: [
      "Most people have a rough sense of big expenses but are shocked when they total up the small ones. A ₹200 coffee, a ₹500 impulse buy, a ₹1,500 subscription you forgot — these compound into thousands. The expense analyzer isn't about guilt; it's about awareness. You can't improve what you don't measure.",
      "The goal isn't to track every rupee forever — it's to track for 2–3 months to identify patterns, find the leaks, plug them, and redirect that money toward goals. After that, a monthly review of 5–10 minutes is enough.",
    ],
    keyPoints: [
      "Lifestyle creep: spending rises silently as income rises — fight it by assigning income increases to savings first",
      "Categories to review: food & dining, subscriptions, shopping, transport, entertainment",
      "A ₹3,000/month leak = ₹36,000/year = ₹2.4 lakh over 5 years (before compounding)",
      "Find your 'Big 3' unnecessary expenses and reduce just those — small wins are more sustainable than total cuts",
      "Fixed costs (rent, EMIs) need renegotiation or restructuring; variable costs can be cut immediately",
      "Annual expenses (insurance, vacations, festivals) should be divided by 12 and budgeted monthly",
    ],
    example: {
      title: "Finding ₹8,000 in Hidden Monthly Leaks",
      steps: [
        "Karan exported 3 months of bank statements and used Freedom Planner's Statement Analyzer.",
        "Discovery 1: 4 streaming subscriptions = ₹1,800/month (watching only 2).",
        "Discovery 2: Gym membership ₹2,500 unused for 6 months.",
        "Discovery 3: Food delivery apps ₹3,200/month (didn't feel like much per order).",
        "Discovery 4: Auto-renewal software ₹800/month for a tool he stopped using.",
        "Total found: ₹8,300/month of cuttable spending.",
        "He kept 1 streaming service (₹600), cancelled the gym and joined a ₹800 local one, reduced delivery to ₹1,500. Net saving = ₹5,700/month → now invested in SIPs.",
      ],
    },
    appGuide: {
      tab: "Statement Analyzer + Expenses",
      description: "Upload bank/UPI statements to auto-categorize spending and find patterns.",
      steps: [
        "Go to Statement Analyzer tab → Upload your bank or UPI statement (PDF/Excel/CSV).",
        "Freedom Planner auto-categorizes transactions: food, transport, shopping, EMIs, subscriptions.",
        "Review the category breakdown chart — look for any category that surprises you.",
        "Go to Expenses tab → add the spending you want to reduce as budget line items with a lower target.",
        "Use the Daily Budget Tracker to log spending in real time during the next month.",
        "Run the analyzer again after 3 months to measure the improvement.",
      ],
    },
  },

  6: {
    overview: [
      "An emergency fund is the foundation of your entire financial plan. It is 3–6 months of essential expenses kept in liquid, capital-safe instruments — not invested for growth. Its job is to protect your investments and prevent you from taking on high-interest debt when life surprises you: job loss, medical emergency, urgent car repair, or a family crisis.",
      "Without an emergency fund, every financial shock forces you to either sell investments at a loss, take a personal loan at 15–24% interest, or borrow from family. The emergency fund is your financial shock absorber — build it before anything else.",
    ],
    keyPoints: [
      "Target: 6 months of essential expenses (NOT total expenses — only the non-negotiable ones)",
      "Essential expenses = rent, groceries, utilities, EMIs, medicines — not dining out or subscriptions",
      "Where to keep it: savings account (1 month), liquid mutual fund (2–3 months), short-term FD (1–2 months)",
      "Do NOT invest emergency funds in equity — a market crash is often correlated with economic emergencies",
      "Freelancers and business owners: aim for 9–12 months due to income variability",
      "Review the fund every year — your essential expenses grow with inflation",
    ],
    example: {
      title: "Sizing Ananya's Emergency Fund",
      steps: [
        "Ananya's essential monthly expenses: Rent ₹15,000 | Groceries ₹8,000 | Utilities ₹3,000 | Home loan EMI ₹22,000 | Medicine ₹2,000 = ₹50,000.",
        "Target (6 months): ₹50,000 × 6 = ₹3,00,000.",
        "Current emergency savings: ₹75,000 in savings account.",
        "Gap: ₹2,25,000.",
        "Plan: Save ₹15,000/month → reaches target in 15 months.",
        "Where to park: ₹50,000 savings account (instant access) + ₹2,50,000 in liquid mutual fund.",
        "She sets this as a Goal in Freedom Planner to track progress month by month.",
      ],
    },
    appGuide: {
      tab: "Goals",
      description: "Create an Emergency Fund goal to track your progress toward the 6-month target.",
      steps: [
        "Go to Goals tab → Add Goal → Select 'Emergency Fund'.",
        "Enter your essential monthly expenses — Freedom Planner calculates the 6-month target automatically.",
        "Enter your current emergency savings as the starting amount.",
        "Set a monthly contribution — the app shows how long it will take to reach the target.",
        "Tag the goal as 'High Priority' so it appears first in your overview.",
        "Use the Freedom Calculator to confirm your emergency fund doesn't count toward your FIRE corpus — it's separate.",
      ],
    },
  },

  7: {
    overview: [
      "Knowing the target is not enough — you need a system to reach it. The most reliable system for building an emergency fund is automation: set up a standing instruction to transfer a fixed amount to a dedicated savings account or liquid fund on salary day, before you can spend it.",
      "Treat the emergency fund account as 'locked' — not in any official sense, but psychologically. Label it clearly. Don't swipe from it for non-emergencies. Every rupee used must be replenished before moving to other goals.",
    ],
    keyPoints: [
      "Automate: set a standing instruction to transfer to emergency savings on the 1st or 2nd of each month",
      "Separate account: keep emergency funds in a different account or liquid fund — don't mix with daily spending",
      "Once built, redirect the monthly contribution to the next priority goal (debt, SIPs)",
      "After using any amount, replenishing takes priority over all other discretionary spending",
      "Liquid funds offer slightly higher returns than savings accounts (≈6.5–7%) with T+1 withdrawal",
      "Don't count on credit cards as emergency funds — they are debt, not savings",
    ],
    example: {
      title: "Vikram Builds ₹1.8 Lakh in 12 Months",
      steps: [
        "Vikram's essential expenses: ₹30,000/month. Target: 6 months = ₹1,80,000.",
        "Starting balance: ₹0.",
        "Month 1 action: Opens a separate savings account labeled 'Emergency Fund'. Sets up ₹15,000 auto-transfer on salary day.",
        "Months 1–12: Auto-transfers ₹15,000/month. Does not touch it.",
        "Month 6 check: ₹90,000 saved — halfway there.",
        "Month 12: ₹1,80,000 reached. Goal complete in Freedom Planner.",
        "Month 13: Redirects ₹15,000 to an ELSS SIP for long-term wealth building.",
      ],
    },
    appGuide: {
      tab: "Goals → Emergency Fund Goal",
      description: "Track your emergency fund build-up and see the gap close month by month.",
      steps: [
        "Go to Goals tab → find your Emergency Fund goal (created in Lesson 6).",
        "Each month, update 'Current Amount' to reflect your actual emergency fund balance.",
        "The progress bar shows percentage complete and months remaining.",
        "When you reach 100%, the app marks the goal complete — redirect the contribution to the next goal.",
        "If you use any amount (emergency happens), update the balance down and restart the progress tracking.",
        "Go to Dashboard to see your overall goal completion rate improving over time.",
      ],
    },
  },

  8: {
    overview: [
      "A loan is a contract: you borrow a lump sum (principal) and repay it over time (tenure) via equal monthly instalments (EMIs). Each EMI has two components — interest and principal repayment. In the early months, the majority of your EMI goes toward interest. Over time, the principal component grows. This is called amortization.",
      "Understanding this is powerful: a ₹50 lakh home loan at 8.5% for 20 years means you pay ₹50 lakh principal plus ₹63 lakh in interest — a total of ₹1.13 crore for a ₹50 lakh asset. Knowing the true cost of debt changes how you approach borrowing and prepayment.",
    ],
    keyPoints: [
      "EMI = fixed monthly payment covering both interest and principal (Equated Monthly Instalment)",
      "Amortization: early EMIs are mostly interest; later EMIs are mostly principal repayment",
      "Longer tenure = lower EMI but much higher total interest paid",
      "Reducing balance: interest calculated on outstanding principal each month (better for borrowers than flat rate)",
      "Processing fees, insurance, and prepayment charges are part of the real loan cost",
      "Compare loans using APR (Annual Percentage Rate) not just the headline interest rate",
    ],
    example: {
      title: "The Hidden Cost of a Home Loan",
      steps: [
        "Loan: ₹40,00,000 at 8.5% per annum for 20 years.",
        "Monthly EMI ≈ ₹34,750.",
        "Total paid over 20 years = ₹34,750 × 240 = ₹83,40,000.",
        "Total interest paid = ₹83,40,000 − ₹40,00,000 = ₹43,40,000.",
        "Year 1, EMI breakdown: Interest ≈ ₹28,300 | Principal ≈ ₹6,450 (82% of EMI is interest).",
        "Year 15, EMI breakdown: Interest ≈ ₹14,200 | Principal ≈ ₹20,550 (59% is principal).",
        "If he makes ₹1,00,000 prepayment in Year 2, he saves ≈₹3.5 lakh in interest and 18 months tenure.",
      ],
    },
    appGuide: {
      tab: "Loans",
      description: "See the amortization schedule and total interest cost of each loan you have.",
      steps: [
        "Go to Loans tab → Add Loan → enter principal, interest rate, tenure, and EMI.",
        "Click 'View Amortization' to see the full repayment schedule: how much principal and interest is in each EMI.",
        "Freedom Planner shows total interest paid over the life of the loan.",
        "Add all your loans — home, car, personal — to get the complete debt picture.",
        "The Loan Analyzer section shows your total debt burden, EMI-to-income ratio, and interest drag.",
        "Use the Calculators tab → EMI Calculator to model different loan scenarios before taking a new loan.",
      ],
    },
  },

  9: {
    overview: [
      "Not all debt is equal. Good debt is borrowed at a reasonable rate to acquire something that holds or grows in value — a home loan, an education loan that increases earning capacity. Bad debt is borrowed at high rates for consumption or depreciating assets — credit card revolving debt, personal loans for vacations, payday loans.",
      "The debt-to-income ratio (DTI) is the most important health metric. Total monthly debt payments divided by gross monthly income. A DTI above 36% is a yellow flag; above 50% is dangerous. It means more than half your income is committed before you eat or save.",
    ],
    keyPoints: [
      "Good debt: home loans (asset appreciation + tax benefits), education loans (higher earning potential)",
      "Bad debt: credit card revolving balances (24–42% p.a.), personal loans for consumption, buy-now-pay-later misuse",
      "Grey area: car loans (depreciating asset, but often necessary), consumer durable loans",
      "Debt-to-income ratio = (total monthly EMIs ÷ gross monthly income) × 100",
      "Target DTI: below 36% (below 20% is excellent, above 50% requires immediate action)",
      "High-interest bad debt erodes wealth faster than any investment can build it — eliminate it first",
    ],
    example: {
      title: "Rohan's DTI Problem",
      steps: [
        "Monthly gross income: ₹1,00,000.",
        "EMIs: Home loan ₹28,000 | Car loan ₹12,000 | Personal loan ₹8,000 | Credit card min due ₹5,000 = ₹53,000.",
        "DTI = (₹53,000 ÷ ₹1,00,000) × 100 = 53%. Danger zone.",
        "Good debt: Home loan (8.5%) — keep and consider prepaying with any bonus.",
        "Grey debt: Car loan (10%) — continue, no emergency.",
        "Bad debt: Personal loan (18%) + Credit card (36%) — these must go first.",
        "Strategy: Redirect all discretionary spending to clear credit card in 3 months, then personal loan in 6 months.",
        "After 9 months, DTI drops to 40%. After full payoff, DTI = 40%, and freed EMI goes to SIPs.",
      ],
    },
    appGuide: {
      tab: "Loans → Debt Health",
      description: "See your DTI ratio and categorize each loan as good or bad debt.",
      steps: [
        "Go to Loans tab → Debt Health section.",
        "Ensure all loans are entered with their interest rates.",
        "Freedom Planner calculates your DTI and flags if it exceeds recommended levels.",
        "Loans are color-coded by interest rate — higher-rate loans are highlighted for priority payoff.",
        "Look at the 'Interest Drag' figure: the total interest cost per year across all loans.",
        "Click any loan → 'Mark Priority' to flag it for the debt freedom plan in Lesson 10.",
      ],
    },
  },

  10: {
    overview: [
      "Once you understand your debts, you need a system to eliminate them. Two proven methods: Avalanche (pay off highest interest rate first — mathematically optimal) and Snowball (pay off smallest balance first — psychologically motivating). Prepayment is the turbo button — any lump sum paid toward principal saves years of interest.",
      "The best strategy is the one you will actually follow. If watching a debt disappear keeps you motivated, use Snowball. If you're disciplined and want to minimize interest cost, use Avalanche. Most people benefit from a hybrid: quick win on one small debt (for momentum), then Avalanche for the rest.",
    ],
    keyPoints: [
      "Avalanche: list debts by interest rate (highest first), pay minimum on all, pour extra money on the top-rate debt",
      "Snowball: list debts by balance (smallest first), pay minimum on all, extra money on smallest balance for a quick win",
      "Avalanche saves more interest; Snowball delivers faster account closures and motivational momentum",
      "Prepayment: any lump sum (bonus, tax refund, gift) paid to principal reduces interest dramatically if done early in the loan tenure",
      "Debt consolidation: combine multiple high-rate loans into one lower-rate loan (use only if the rate difference is meaningful)",
      "Always check for prepayment charges before making a large prepayment on a fixed-rate loan",
    ],
    example: {
      title: "Sona's Debt Freedom Plan",
      steps: [
        "Debts: Credit card ₹45,000 at 36% | Personal loan ₹90,000 at 18% | Car loan ₹2,50,000 at 10%.",
        "Monthly extra available for debt: ₹8,000.",
        "Avalanche order: Credit card first (36%), then personal loan (18%), then car (10%).",
        "Month 1–6: Pay ₹8,000 extra on credit card. Balance cleared in ~5.5 months. Saved ₹12,000 in interest.",
        "Month 7–14: Roll ₹8,000 to personal loan. Cleared in ~8 months. Saved ₹7,000 in interest.",
        "Month 15+: Roll ₹8,000 to car loan prepayment. Loan shortened by 14 months.",
        "Total interest saved: ≈₹28,000 vs. paying minimums only. All debt free 2 years earlier.",
      ],
    },
    appGuide: {
      tab: "Loans → Debt Freedom Planner",
      description: "Model your debt payoff timeline with Avalanche or Snowball strategy.",
      steps: [
        "Go to Loans tab → Debt Freedom Planner section.",
        "All your loans are listed. Enter any extra monthly amount available for debt repayment.",
        "Toggle between Avalanche and Snowball — the plan updates to show the payoff timeline for each.",
        "See the projected debt-free date and total interest saved compared to minimum payments.",
        "Click 'Simulate Prepayment' → enter a lump-sum amount to see how much it saves in interest and time.",
        "Once a loan is cleared, mark it complete in the Loans tab and redirect the freed EMI.",
      ],
    },
  },

  11: {
    overview: [
      "Your credit score (CIBIL Score in India, ranging from 300–900) is a measure of your creditworthiness based on your repayment history, credit utilization, credit age, credit mix, and new credit inquiries. It affects your ability to get loans and the interest rate you're offered — a difference of 50 points can mean 0.5% higher home loan rate, costing lakhs over 20 years.",
      "The most important factors: payment history (35% weight) and credit utilization (30%). Pay every EMI and credit card bill on time, and keep your card usage below 30% of your credit limit. These two habits alone will build or maintain a 750+ score.",
    ],
    keyPoints: [
      "CIBIL score range: 300–900. Good: 750–900. Average: 650–749. Poor: below 650",
      "Payment history (35%): one missed payment can drop your score by 50–100 points",
      "Credit utilization (30%): use less than 30% of your credit limit (e.g., ₹30,000 of a ₹1 lakh limit)",
      "Credit age (15%): older accounts help — don't close your oldest credit card unnecessarily",
      "Hard inquiries (10%): each loan application triggers an inquiry — multiple in a short period hurt the score",
      "Check your CIBIL report free once a year at cibil.com — dispute any errors immediately",
    ],
    example: {
      title: "Improving a 620 Score to 760 in 18 Months",
      steps: [
        "Starting score: 620. Reason: 2 missed credit card payments 2 years ago, 78% credit utilization.",
        "Action 1: Set auto-pay for minimum due on all cards — no more missed payments.",
        "Action 2: Request credit limit increase on primary card (limit raised from ₹50,000 to ₹80,000) — utilization drops from 78% to 49% instantly.",
        "Action 3: Pay down credit card balance by ₹15,000 over 3 months — utilization drops to 25%.",
        "Action 4: Did not apply for any new credit for 12 months.",
        "Month 6 score: 690. Month 12 score: 740. Month 18 score: 762.",
        "Now eligible for home loan at 8.4% instead of 9.2% (saves ≈₹8 lakh over 20 years on ₹50 lakh loan).",
      ],
    },
    appGuide: {
      tab: "Loans → Debt Health",
      description: "Review your EMI commitments and utilization ratios that directly impact your credit score.",
      steps: [
        "Go to Loans tab → your debt health metrics show EMI-to-income ratio and credit card utilization.",
        "Go to Credit Card tab → enter your credit limit and outstanding balance for each card.",
        "Freedom Planner flags cards above 30% utilization in yellow/red.",
        "Use the Loans tab to track on-time payment streaks (mark each EMI as paid).",
        "Go to Dashboard → Financial Health gauge — it incorporates credit health signals.",
        "For your actual CIBIL score, visit cibil.com (free once/year) and enter the score in your Profile.",
      ],
    },
  },

  12: {
    overview: [
      "Credit cards are powerful tools that reward disciplined users and punish the undisciplined. When you pay the full outstanding balance every statement cycle, you enjoy 30–50 days of interest-free credit, cashback, rewards, and purchase protection — essentially a free service funded by those who carry a balance.",
      "When you revolve a balance (carry it forward), the interest rate kicks in immediately — typically 24–42% per annum in India. At 36% annual interest, a ₹50,000 balance grows to ₹68,000 in 12 months if you only pay the minimum due. Reward points earned are wiped out many times over by interest charges.",
    ],
    keyPoints: [
      "Grace period: the interest-free window from purchase date to payment due date (typically 18–50 days)",
      "Paying only the 'minimum due' is the most expensive financial habit — interest accrues on the remaining balance",
      "A card paying 1% cashback earning ₹500/month while carrying a ₹30,000 balance at 36% = net loss of ₹9,500/year",
      "Statement date ≠ due date: purchases after statement date get a longer grace period — use this strategically",
      "Revolved balances lose the grace period — every new purchase attracts interest from the transaction date",
      "Best use: pay in full every month, use for big purchases (cashback/EMI offers), track spending automatically",
    ],
    example: {
      title: "The Minimum Payment Trap",
      steps: [
        "Aditya spends ₹40,000 on a credit card in January. His credit limit is ₹1,00,000.",
        "Statement generated Feb 1. Due date: Feb 20. Pays minimum due = ₹2,000 (5%).",
        "Remaining balance: ₹38,000. Interest rate: 3.75%/month (45% p.a.).",
        "February interest charge: ₹38,000 × 3.75% = ₹1,425.",
        "Spends another ₹20,000 in February. New balance: ₹38,000 + ₹20,000 + ₹1,425 = ₹59,425.",
        "If he continues only paying the minimum, this cycle never ends — he pays more in interest than he earns in rewards.",
        "Solution: Pay full outstanding balance every month. If funds are tight, don't spend on the card — spend from debit.",
      ],
    },
    appGuide: {
      tab: "Credit Card",
      description: "Track every credit card: limit, outstanding balance, statement date, due date.",
      steps: [
        "Go to Credit Card tab → Add each card with its credit limit and current outstanding balance.",
        "Enter the statement date and payment due date for each card.",
        "Freedom Planner shows utilization % per card and total credit card debt.",
        "Cards where you're carrying a revolving balance are highlighted — prioritize clearing these.",
        "Set a reminder or payment goal: 'Pay card X in full by due date' as a monthly recurring goal.",
        "Check the Dashboard → Credit card utilization shows in your Financial Health score.",
      ],
    },
  },

  13: {
    overview: [
      "You don't have to wait for loan tenure to end to reduce your interest burden. Three tools help: prepayment (paying extra principal amounts during the tenure), balance transfer (moving a high-rate loan to a lower-rate lender), and consolidation (combining multiple loans into one).",
      "The most powerful decision is often the simplest: when you have spare cash (a bonus, inheritance, or tax refund), compare your loan interest rate against expected investment returns. If your loan costs 12% and your investment earns 10%, prepaying the loan is the guaranteed superior choice.",
    ],
    keyPoints: [
      "Prepayment is most impactful early in the loan tenure — when interest is the dominant EMI component",
      "Even ₹50,000 prepaid in Year 2 of a 20-year home loan can save ₹1.5–2 lakh in total interest",
      "Balance transfer: worth doing only if the rate difference is ≥ 1% and remaining tenure > 3 years",
      "Check balance transfer processing fees — they can eat 0.5–1% of the transferred amount",
      "Loan consolidation: useful when juggling 4+ loans — reduces mental overhead and may lower total rate",
      "Rule of thumb: if loan interest > expected investment return (after tax), prepay the loan first",
    ],
    example: {
      title: "₹2 Lakh Bonus — Prepay or Invest?",
      steps: [
        "Sneha has a home loan outstanding: ₹38,00,000 at 8.7% with 16 years remaining.",
        "She receives a ₹2,00,000 annual bonus.",
        "Option A — Prepay ₹2L on home loan: saves approximately ₹4.2 lakh in total interest, reduces tenure by 14 months.",
        "Option B — Invest ₹2L in ELSS at expected 12% CAGR for 16 years = ₹12.1 lakh corpus.",
        "Net: Loan savings = ₹4.2L. Investment gains = ₹10.1L above invested amount.",
        "At 12% expected returns > 8.7% loan cost: investing wins — but only if she is disciplined and actually earns close to 12%.",
        "Conservative choice: split ₹1L prepayment + ₹1L investment = guaranteed + market upside.",
        "Freedom Planner's Loan Optimizer models both scenarios with her actual numbers.",
      ],
    },
    appGuide: {
      tab: "Loans → Loan Optimizer + Calculators",
      description: "Model prepayment scenarios and compare them against investment returns.",
      steps: [
        "Go to Loans tab → Select a loan → click 'Simulate Prepayment'.",
        "Enter the prepayment amount. The tool shows interest saved and tenure reduction.",
        "Go to Calculators tab → Lumpsum Calculator → enter the same amount at your expected investment return.",
        "Compare: guaranteed interest saving vs projected investment gain. Choose the higher one (or split).",
        "For balance transfer: enter new rate in Loan Optimizer and see EMI reduction and total savings.",
        "Review all your high-interest loans in Debt Health and flag the top 2 for prepayment when surplus arrives.",
      ],
    },
  },

  14: {
    overview: [
      "Insurance is risk transfer: you pay a small, predictable premium to an insurer who covers a potentially large, unpredictable loss. The keyword is 'unpredictable' — insurance is not an investment, and it should never be evaluated on returns. A term plan you never claim on is not a waste — it means nothing catastrophic happened.",
      "The most common mistake is buying insurance for the wrong reasons: to save tax, because an agent recommended it, or bundled with an investment product. Buy insurance to protect against financial ruin — large losses that would destroy your family's financial stability without coverage.",
    ],
    keyPoints: [
      "Insurance covers: life (family income replacement), health (medical costs), property (home/vehicle), liability",
      "Three coverage checks: Do you have adequate life cover? Do you have comprehensive health insurance? Are your assets insured?",
      "Underinsurance is as dangerous as no insurance — a ₹5L health plan for a family of 4 in a metro city is severely insufficient",
      "Keep insurance and investment separate: buy pure term life (cheap, high cover) and invest separately",
      "ULIPs and endowment plans combine insurance + investment poorly — you get low cover and low returns",
      "Review coverage every 3 years or when life changes: marriage, children, major salary change, new loan",
    ],
    example: {
      title: "The Coverage Audit",
      steps: [
        "Vikram (32, married, 1 child, ₹1.2L/month income, home loan ₹45L): Does he have enough coverage?",
        "Current coverage: Employer's health plan ₹3L (family) + LIC endowment ₹15L sum assured.",
        "Life cover check: He needs ≈ 15× annual income = ₹1.2L × 12 × 15 = ₹2.16 crore. Has only ₹15L. Massively underinsured.",
        "Health cover check: ₹3L for a family of 3 in Delhi. A single hospitalization can cost ₹3–5L. Severely insufficient.",
        "Action: Buy ₹1.5 crore term plan (premium ≈ ₹12,000/year at age 32) + ₹10L family floater health plan (≈₹25,000/year).",
        "Total new insurance cost: ₹37,000/year = ₹3,083/month. Protects his family from complete financial devastation.",
      ],
    },
    appGuide: {
      tab: "Insurance",
      description: "Enter all your policies and see your coverage gaps compared to your actual need.",
      steps: [
        "Go to Insurance tab → Add each existing policy: type (life/health/vehicle), sum assured, premium.",
        "Freedom Planner checks your life cover against a recommended multiple of annual income.",
        "The Coverage Checker shows: Current cover vs Recommended cover vs Gap.",
        "For health: it checks your sum insured against family size and location.",
        "Gaps are shown in red — use these as a checklist for your next insurance agent/broker meeting.",
        "Review annually: as income grows and the home loan reduces, your life insurance need changes.",
      ],
    },
  },

  15: {
    overview: [
      "Health insurance is not optional in India — it is the most urgent financial protection for most households. A single hospitalization in a tier-1 city can cost ₹2–8 lakh. Without insurance, this single event can wipe out years of savings or force you into high-interest debt.",
      "A family floater plan covers all family members under one shared sum insured. A deductible is what you pay first before the insurer pays. Co-payment means you share a percentage of every claim. Understanding these terms helps you choose the right plan — and avoid surprises at the hospital.",
    ],
    keyPoints: [
      "Sum insured for a family of 3–4 in a metro city: minimum ₹10 lakh (₹20L+ recommended)",
      "Family floater is cost-effective but has one shared sum — a large claim can exhaust coverage for the year",
      "Pre-existing conditions: 2–4 year waiting period before claims are covered — buy early before conditions develop",
      "Cashless hospitalisation: insurer settles directly with network hospital — always check if your preferred hospital is in-network",
      "Top-up plan: covers claims above a deductible threshold at much lower premium — smart way to get ₹50L+ effective cover",
      "Critical illness plan: lump sum on diagnosis of cancer, heart attack, etc. — different from regular hospitalisation cover",
    ],
    example: {
      title: "Why ₹3L Coverage Was Not Enough",
      steps: [
        "Swati had a ₹3L employer health plan for her family (husband + 2 children).",
        "Her mother-in-law (dependent) had a cardiac event. Hospital bill: ₹4.8 lakh.",
        "Insurance paid ₹3L. Swati had to arrange ₹1.8L from savings and a personal loan.",
        "Solution: She buys a ₹10L family floater (including in-laws) at ₹32,000/year.",
        "She adds a ₹20L top-up plan with ₹5L deductible at ₹8,000/year. Effective coverage: ₹25L at ₹40,000/year.",
        "If a claim exceeds ₹5L, the top-up kicks in — her effective protection is now ₹25L.",
        "Annual premium = ₹40,000 = ₹3,333/month. One hospitalization could have cost her ₹20L+.",
      ],
    },
    appGuide: {
      tab: "Insurance → Health",
      description: "Check if your current health coverage is adequate for your family size and city.",
      steps: [
        "Go to Insurance tab → Health Insurance section.",
        "Enter family members covered, current sum insured, and annual premium.",
        "Freedom Planner benchmarks your coverage against recommended minimums for your family size.",
        "Coverage gaps are highlighted — use these to shortlist better plans on Policybazaar or Ditto.",
        "If you have a top-up plan, enter it separately — the app shows your combined effective coverage.",
        "Review when adding a family member (new child, ageing parent becoming dependent).",
      ],
    },
  },

  16: {
    overview: [
      "Life insurance serves one purpose: replacing your income for your dependants if you die. The right product for this is a term plan — pure life cover with no maturity value, at a fraction of the cost of endowment or ULIP plans. A ₹1 crore term plan at age 30 costs ₹8,000–12,000 per year. The same cover in an endowment plan could cost ₹3–4 lakh per year.",
      "The Human Life Value (HLV) method calculates how much cover you need: multiply your annual income by a factor based on years to retirement (typically 10–20×). Add your total loan outstanding. This is your minimum life cover need.",
    ],
    keyPoints: [
      "Term plan = pure life cover. No maturity benefit. Nominee receives sum assured only if insured dies during tenure",
      "HLV method: Annual income × 10–15 (years until retirement) + total loans outstanding = minimum cover",
      "Buy term cover early: premium at 28 is ≈40% of the premium at 38 for the same cover",
      "Claim settlement ratio: choose insurers with 95%+ CSR — this indicates how reliably they pay claims",
      "Cover tenure: ideally until age 60–65 or until all major loans are repaid",
      "Do NOT buy endowment/money-back plans for life protection — the cover is too low and returns too poor",
    ],
    example: {
      title: "How Much Term Cover Does Rajan Need?",
      steps: [
        "Rajan: 35 years old, married, 2 children (ages 5 and 8). Monthly income: ₹1,50,000. Home loan outstanding: ₹55L.",
        "HLV: Annual income ₹18L × 15 (years to retirement at 50) = ₹2.7 crore.",
        "Plus outstanding home loan: ₹55L.",
        "Minimum life cover needed: ₹2.7 crore + ₹55L = ₹3.25 crore.",
        "Current cover: company group term ₹30L (only while employed). Severely insufficient.",
        "Action: Buy ₹2.5 crore term plan for 30 years (until age 65). Premium at 35: ≈₹18,000–22,000/year.",
        "This replaces 15+ years of income for his family and repays the home loan if he passes away.",
      ],
    },
    appGuide: {
      tab: "Insurance → Life Coverage",
      description: "Calculate your required life cover using HLV and see your current gap.",
      steps: [
        "Go to Insurance tab → Life Insurance section.",
        "Enter your annual income, number of dependants, years to retirement, and total loan outstanding.",
        "Freedom Planner calculates your recommended life cover using the HLV method.",
        "Enter your current policies — employer group term, LIC, ULIP sum assured.",
        "The Coverage Gap is shown: if your current cover is ₹30L and need is ₹2.5 crore, the gap is ₹2.2 crore.",
        "Use this gap figure when buying a new term plan — buy exactly what you need, not more.",
      ],
    },
  },

  17: {
    overview: [
      "Saving and investing are not the same thing, and confusing them costs people money. Saving is putting money in a capital-safe, liquid account (savings account, FD, liquid fund). It preserves purchasing power for short-term needs but rarely beats inflation over the long run. Investing is allocating money to assets that can grow above inflation — equity, debt mutual funds, real estate, gold — with corresponding risk.",
      "The correct sequence: build your emergency fund first (savings), then invest the surplus for long-term goals. Investing before you have a buffer is like building a skyscraper without a foundation — one emergency and you have to sell investments at a loss.",
    ],
    keyPoints: [
      "Saving: FDs, savings accounts, liquid funds — capital-safe, low return (4–7%), suitable for <3 year horizon",
      "Investing: equity funds, equity direct, REITs, bonds — growth-oriented, higher risk, suitable for 5+ years",
      "The inflation trap: ₹1 lakh in a savings account at 4% with 6% inflation = ₹1,04,000 nominal but ₹97,736 real purchasing power after 1 year",
      "SIP (Systematic Investment Plan): automatic monthly investment in mutual funds — harnesses rupee cost averaging",
      "Separate mental accounts: emergency fund (never touch), goal savings (medium-term FDs), investments (long-term equity)",
      "Rule: liquid buffer first, then invest. Never invest money you might need within 3 years",
    ],
    example: {
      title: "Divya's Saving vs Investing Decision",
      steps: [
        "Divya has ₹5,00,000 accumulated. Emergency fund: fully built (₹2,00,000). Remaining: ₹3,00,000.",
        "Goal 1: Vacation in 1 year (₹80,000). → Keep in FD or liquid fund — too short for equity risk.",
        "Goal 2: Car down payment in 3 years (₹1,20,000). → Short-term debt fund or recurring deposit.",
        "Goal 3: Retirement in 25 years. → ₹1,00,000 invested in equity fund at 12% CAGR = ₹17 lakh in 25 years.",
        "She also starts ₹15,000/month SIP in a diversified equity fund for retirement.",
        "Three buckets: liquid (emergencies), medium-term FD/debt (goals < 5 years), equity SIP (goals > 5 years).",
      ],
    },
    appGuide: {
      tab: "Investments + Goals",
      description: "Map each investment to a goal and verify you have the right instrument for the right horizon.",
      steps: [
        "Go to Investments tab → Add all current investments: mutual funds, FDs, stocks, PPF, NPS.",
        "For each investment, tag it to a goal: Retirement, Child Education, Emergency, etc.",
        "Go to Goals tab → check that short-term goals are in low-risk instruments and long-term goals in equity.",
        "Go to Dashboard → Investment Allocation chart shows the mix of equity, debt, and liquid assets.",
        "Use Calculators → Lumpsum Calculator to see how ₹1 lakh grows at different return rates over different horizons.",
        "The AI Advisor tab surfaces any mismatches: long-term goals in FDs, or short-term goals in high-risk equity.",
      ],
    },
  },

  18: {
    overview: [
      "Inflation is the silent wealth destroyer. It is the rate at which prices rise each year, reducing the purchasing power of money. India's CPI (Consumer Price Index) inflation has averaged 5–7% over the past decade. This means ₹1 lakh today will have the purchasing power of only ₹55,839 in 10 years at 6% inflation — even if the nominal value doesn't change.",
      "For retirement planning, inflation is doubly dangerous: your expenses grow with inflation while your income from a fixed corpus does not grow proportionally. A retirement plan that ignores inflation will run out of money years before you do.",
    ],
    keyPoints: [
      "Rule of 72 for inflation: 72 ÷ 6% inflation = 12 years for prices to double",
      "Real return = nominal return − inflation rate (e.g., FD at 7%, inflation at 6% → real return ≈ 1%)",
      "The best inflation hedge over long periods: equity investments, which historically return 10–14% in India vs. 5–7% inflation",
      "Healthcare inflation runs higher than CPI (10–15% p.a.) — critical for retirement planning",
      "Use inflation-adjusted calculations for all long-term goals: what costs ₹10 lakh today may cost ₹32 lakh in 20 years at 6%",
      "Government inflation-indexed bonds (IIBs) or RBI Floating Rate Bonds can partly offset inflation in debt portfolio",
    ],
    example: {
      title: "Today's ₹50,000/Month vs. Retirement",
      steps: [
        "Priya (age 30) plans to retire at 60. Current lifestyle cost: ₹50,000/month.",
        "At 6% inflation, ₹50,000 today = ₹50,000 × (1.06)^30 = ₹2,87,175/month in 30 years.",
        "She will need ₹2,87,175/month, not ₹50,000/month, at retirement — to maintain the same lifestyle.",
        "Annual retirement expense (inflation-adjusted): ₹2,87,175 × 12 = ₹34.46 lakh/year.",
        "Corpus needed (25× rule): ₹34.46L × 25 = ₹8.61 crore.",
        "If she planned for a ₹1.5 crore corpus (ignoring inflation), she would run out of money in 4–5 years of retirement.",
        "The Inflation Calculator in Freedom Planner shows this gap in seconds.",
      ],
    },
    appGuide: {
      tab: "Calculators → Inflation Calculator",
      description: "See what today's expenses will cost in the future and how it affects your retirement target.",
      steps: [
        "Go to Calculators tab → select 'Inflation' calculator.",
        "Enter your current monthly expenses and select an inflation rate (use 6% as a baseline, 8% for conservative).",
        "Enter the number of years until you need the money (e.g., 25 years to retirement).",
        "The calculator shows the future value of today's expenses — your real retirement income need.",
        "Go to Freedom Calculator → enter this inflation-adjusted expense figure as your retirement monthly spend.",
        "The planner recalculates your corpus target — this number will be significantly larger than naive estimates.",
      ],
    },
  },

  19: {
    overview: [
      "Compound interest is the eighth wonder of the world — it is interest earned on interest, creating exponential growth over time. The longer money stays invested and compounds, the more dramatically it grows. The difference between starting at 25 and starting at 35 is not 10 years of returns — it's roughly double the final corpus, because of the additional years of compounding.",
      "The Rule of 72 is a mental shortcut: divide 72 by the annual return rate to find how many years it takes to double your money. At 8%, money doubles in 9 years. At 12%, in 6 years. Understanding this makes the cost of delay viscerally clear.",
    ],
    keyPoints: [
      "Compound growth formula: FV = P × (1 + r)^n (P = principal, r = return, n = years)",
      "Rule of 72: Years to double = 72 ÷ annual return % (at 9% → doubles every 8 years)",
      "₹1,00,000 at 10% for 10 years = ₹2.59 lakh | for 20 years = ₹6.73 lakh | for 30 years = ₹17.45 lakh",
      "Starting 10 years early roughly doubles the final corpus — the extra compounding years are disproportionately powerful",
      "Interrupting compounding (withdrawing mid-tenure) resets the clock and destroys most of the value",
      "Compounding works against you for debt (unpaid credit card balance compounds at 36%) — same math, opposite direction",
    ],
    example: {
      title: "₹5,000/Month — The 10-Year Head Start",
      steps: [
        "Anika starts investing ₹5,000/month SIP at age 22. Stops at 32. Does not invest again. Leaves corpus to compound until 60.",
        "Invested: ₹5,000 × 120 months = ₹6,00,000. Corpus at 60 at 12% CAGR ≈ ₹3.36 crore.",
        "Bijay starts investing ₹5,000/month at age 32. Invests until age 60 (28 years).",
        "Invested: ₹5,000 × 336 months = ₹16,80,000. Corpus at 60 at 12% CAGR ≈ ₹2.6 crore.",
        "Anika invested ₹6L (less) but ends up with MORE (₹3.36 crore vs ₹2.6 crore) — solely due to 10 extra years of compounding.",
        "The lesson: start early, stay invested, never interrupt compounding unnecessarily.",
      ],
    },
    appGuide: {
      tab: "Calculators → Lumpsum / Investment Growth",
      description: "See the power of compounding on your own investment amounts over different time horizons.",
      steps: [
        "Go to Calculators tab → select 'Lumpsum' or 'SIP' calculator.",
        "Enter your investment amount, expected annual return, and time horizon.",
        "Try different time periods: 10, 20, 30 years — watch how the final corpus changes non-linearly.",
        "Toggle the return rate: 8%, 10%, 12% — see how much even 2% difference matters over 20 years.",
        "Use the 'SIP' tab → enter ₹5,000/month at 12% for 10 years vs. 20 years to see the compounding difference.",
        "Go to Investments tab — tag each investment with its approximate CAGR and see projected future value on the Dashboard.",
      ],
    },
  },

  20: {
    overview: [
      "A mutual fund pools money from thousands of investors and invests it in a diversified portfolio managed by a professional fund manager. You buy units of the fund at the Net Asset Value (NAV), which fluctuates daily with the market. A Systematic Investment Plan (SIP) lets you invest a fixed amount monthly — no need to time the market.",
      "The beauty of SIPs: rupee cost averaging means you automatically buy more units when prices are low and fewer when high, reducing the average cost per unit over time. This removes the emotional decision-making of 'when to invest' and makes investing a habit.",
    ],
    keyPoints: [
      "Equity mutual funds: invest in stocks, higher risk, target 10–14% long-term returns, suitable for 5+ year horizon",
      "Debt mutual funds: invest in bonds and government securities, lower risk, 6–8% returns, suitable for 1–5 years",
      "Liquid funds: ultra-short duration debt, very low risk, 5–7% return, suitable for emergency fund parking",
      "ELSS (Equity Linked Savings Scheme): equity fund with 3-year lock-in, Section 80C tax benefit",
      "Index funds: track a market index (Nifty, Sensex), no active management, low expense ratio — great default for beginners",
      "Expense ratio: the annual fee charged by the fund — prefer direct plans (no distributor commission) over regular plans",
    ],
    example: {
      title: "Mapping SIPs to Goals",
      steps: [
        "Sanjay (28) has ₹18,000/month to invest after expenses and emergency fund.",
        "Goal 1: Retirement at 60 (32 years away) — ₹10,000/month SIP in Nifty 50 index fund. At 11%: ≈₹3.8 crore.",
        "Goal 2: Child's education in 15 years — ₹5,000/month SIP in mid-cap fund. At 13%: ≈₹28 lakh.",
        "Goal 3: House down payment in 7 years — ₹3,000/month in debt hybrid fund. At 8%: ≈₹3.6 lakh.",
        "Each SIP is linked to a specific goal — he doesn't mix them.",
        "He chooses direct plans: saves ≈0.5–1% expense ratio annually vs regular plans.",
        "Over 32 years, saving 0.75% in expense ratio on ₹10,000/month = ≈₹40 lakh in additional corpus.",
      ],
    },
    appGuide: {
      tab: "Investments",
      description: "Add your SIPs and mutual fund portfolio, link them to goals, and track growth.",
      steps: [
        "Go to Investments tab → Add Investment → select Mutual Fund.",
        "Enter fund name, current value, monthly SIP amount, and start date.",
        "Link each fund to a goal (retirement, child education, etc.).",
        "Freedom Planner projects the future value of each SIP at a selected return assumption.",
        "Use Calculators → SIP Calculator to model a new SIP before committing.",
        "Check the Dashboard → Investment Allocation: verify equity/debt split matches your risk tolerance and time horizon.",
      ],
    },
  },

  21: {
    overview: [
      "A financial goal is a specific, funded intention — not a vague wish. 'I want to be rich' is a wish. 'I want to accumulate ₹15 lakh for a car down payment by December 2028 by investing ₹8,500/month in a debt fund' is a goal. The specificity is what makes it actionable and trackable.",
      "Goals transform abstract financial planning into a series of concrete, monthly actions. When you link a goal to a specific investment, you can track progress, celebrate milestones, and stay motivated during market downturns. You also stop asking 'how much should I invest?' — the goal tells you exactly.",
    ],
    keyPoints: [
      "SMART goals: Specific, Measurable, Achievable (from your actual surplus), Relevant, Time-bound",
      "Every goal needs three numbers: target amount, target date, and monthly contribution required",
      "Fund goals from surplus — never from debt. If you can't fund the goal from surplus, shrink the target or extend the timeline",
      "Priority order: emergency fund → insurance → high-interest debt → retirement → other goals",
      "Link each goal to a specific investment account — don't pool all investments together",
      "Review goals every 6 months: update for salary changes, new goals, or life events",
    ],
    example: {
      title: "From Vague Wish to Funded Goal",
      steps: [
        "Wish: 'I want to buy a house someday.'",
        "SMART goal: 'Accumulate ₹18 lakh for a 10% down payment on a ₹1.8 crore apartment in Bengaluru by January 2030 (4 years).'",
        "Monthly contribution needed: ₹18L over 48 months = ₹27,500 (simplified). With 8% return on debt fund: ≈₹24,000/month.",
        "Current monthly surplus: ₹32,000. After ₹24,000 goal contribution, ₹8,000 left for other goals.",
        "She opens a separate STP (Systematic Transfer Plan) from liquid fund to short-duration debt fund.",
        "In Freedom Planner, she creates a Goal 'Home Down Payment — Jan 2030' and sees the progress bar fill every month.",
        "Tracking makes her less likely to dip into the fund for discretionary spending.",
      ],
    },
    appGuide: {
      tab: "Goals",
      description: "Create specific, funded goals and track progress month by month.",
      steps: [
        "Go to Goals tab → Add Goal.",
        "Enter: Goal name, target amount, target date, current amount saved.",
        "Freedom Planner calculates the required monthly contribution.",
        "Compare required contribution against your available surplus (from the Dashboard).",
        "If the goal is unaffordable, adjust the target date or amount until the contribution fits your surplus.",
        "For each goal, link it to an investment (the app shows projected attainment based on expected returns).",
      ],
    },
  },

  22: {
    overview: [
      "Every financial goal has a natural time horizon, and matching the investment instrument to that horizon is the single most important investment decision. Too short-term for the goal → you might not grow the money enough. Too long-term for the goal → you risk a market downturn right when you need the money.",
      "Short-term (0–3 years): safety first. Savings accounts, liquid funds, FDs, short-duration debt funds. Medium-term (3–7 years): debt hybrid funds, balanced advantage funds. Long-term (7+ years): equity-oriented funds, direct equity — where you can ride out multiple market cycles.",
    ],
    keyPoints: [
      "Short-term goals (< 3 years): safety and liquidity are paramount — avoid equity entirely",
      "Medium-term goals (3–7 years): hybrid or balanced funds offer equity upside with partial downside protection",
      "Long-term goals (> 7 years): equity can ride out multiple market cycles and deliver inflation-beating returns",
      "Never use equity for a goal that is < 3 years away — markets can be 30–40% down in the short run",
      "A goal timeline can extend if your investment performs below expectations — build a 1–2 year buffer into timelines",
      "Visualizing all goals on a timeline prevents accidental funding conflicts (two large goals in the same year)",
    ],
    example: {
      title: "Placing Goals on a Timeline",
      steps: [
        "Kavita's goals: Emergency top-up (now) | Vacation Europe (2 years) | Car upgrade (4 years) | Child's college (12 years) | Retirement (28 years).",
        "Emergency top-up: liquid fund (access within 24 hours).",
        "Vacation (2 years): FD or debt fund — no equity risk for a 2-year goal.",
        "Car upgrade (4 years): balanced advantage fund — some equity growth, but not 100% equity.",
        "Child's college (12 years): diversified equity fund — 12-year horizon easily absorbs market cycles.",
        "Retirement (28 years): aggressive equity SIP (small/mid/flexi cap mix).",
        "Timeline view shows all goals — she sees that car (2027) and child's college start (2036) don't conflict.",
      ],
    },
    appGuide: {
      tab: "Goals",
      description: "View all goals on a timeline and verify each is funded with the right instrument.",
      steps: [
        "Go to Goals tab → view the Goal Timeline (if available) or list all goals sorted by target date.",
        "For each goal, check the linked investment type against the time horizon guide.",
        "Flag any equity investments linked to goals within 3 years — consider moving to a safer instrument.",
        "If two goals have the same target year, check that your surplus covers both contributions.",
        "Use the Dashboard to see total monthly goal contributions vs. available surplus.",
        "The AI Advisor will flag mismatches: e.g., equity fund linked to a 1-year vacation goal.",
      ],
    },
  },

  23: {
    overview: [
      "Large expenses — a wedding, a child's college education, a home renovation — are predictable. You know they're coming, you just don't always plan for them. The key is to start a 'sinking fund' early: a dedicated monthly saving toward that future lump sum. This transforms a financial shock into a planned event.",
      "The goal projection calculator answers the key question: given a target amount, a target date, and an expected return, how much do I need to save monthly? Or conversely: given what I can save monthly, when will I reach the target?",
    ],
    keyPoints: [
      "Sinking fund: save a fixed monthly amount toward a future large expense — avoids taking a personal loan",
      "Inflation matters for education and healthcare goals — the actual cost in 15 years may be 2–3× today's estimate",
      "House down payment: typically 10–20% of property value, plus registration (5–7%), plus renovation — budget the total",
      "Wedding planning: start 3–5 years before expected date; costs can range from ₹5L to ₹1 crore+ depending on scale",
      "Education abroad: ₹50–₹1.5 crore total for a 2-year MBA abroad — start a dedicated SIP the moment a child is born",
      "Goal projection reverse calculation: enter the target amount, date, and expected return → get the exact monthly SIP needed",
    ],
    example: {
      title: "Funding a Child's IIT + MBA",
      steps: [
        "Ramesh has a 3-year-old daughter. He estimates: 4-year engineering = ₹15L (today's value) | 2-year MBA = ₹30L (today's value).",
        "Engineering starts in 15 years: ₹15L at 7% education inflation = ₹15L × (1.07)^15 = ₹41.4L.",
        "MBA starts in 20 years: ₹30L at 7% education inflation = ₹30L × (1.07)^20 = ₹1.16 crore.",
        "Total corpus needed: ₹41.4L + ₹1.16 crore = ₹1.57 crore.",
        "SIP in equity fund at 12% CAGR for 15 years: need ≈₹14,500/month.",
        "He starts the SIP today in a dedicated child education fund, labeled clearly in Freedom Planner.",
        "Starting 5 years later (at child's age 8): monthly SIP needed jumps to ₹26,000 — same goal, 80% more monthly cost.",
      ],
    },
    appGuide: {
      tab: "Goals + Calculators",
      description: "Use the goal projection calculator to size your monthly contribution for large future expenses.",
      steps: [
        "Go to Goals tab → Add Goal → 'Education' or 'Large Expense'.",
        "Enter today's estimated cost, target date, and expected inflation rate.",
        "Freedom Planner shows the inflation-adjusted future cost.",
        "Enter your expected investment return — the app calculates the required monthly contribution.",
        "Go to Calculators tab → SIP Calculator to cross-verify the math.",
        "Create the SIP immediately — the earlier you start, the lower the monthly contribution needed.",
      ],
    },
  },

  24: {
    overview: [
      "Retirement planning should start on your first salary — not at 40 or 50. The reason is compounding: ₹5,000/month invested from age 23 grows to far more at 60 than ₹15,000/month started at 40, even though the later investor contributes three times as much. Every decade of delay roughly requires a tripling of the monthly contribution to reach the same corpus.",
      "The Freedom Calculator in Freedom Planner gives you a concrete view: your current corpus, projected growth at your SIP rate, expected retirement corpus needed (based on your lifestyle), and the gap between where you're heading and where you need to be.",
    ],
    keyPoints: [
      "Compound growth makes early investing disproportionately powerful — the first 10 years of saving do most of the work",
      "Retirement corpus needed = (monthly expenses at retirement × 12 × 25) — inflation-adjusted to the retirement year",
      "The corpus gap = retirement corpus needed − current projected corpus at retirement date",
      "To close the gap: increase monthly SIP, extend working years, or reduce retirement lifestyle expectations",
      "EPF is a forced savings mechanism — don't withdraw it during job changes; let it compound",
      "NPS (National Pension System) offers tax benefits (80CCD) and forced long-term equity/debt allocation",
    ],
    example: {
      title: "The Gap Reveal",
      steps: [
        "Deepak, 35, plans to retire at 60. Monthly expenses today: ₹80,000. Inflation 6%.",
        "Inflation-adjusted monthly expenses at 60: ₹80,000 × (1.06)^25 = ₹3,43,000/month.",
        "Corpus needed: ₹3,43,000 × 12 × 25 = ₹10.29 crore.",
        "Current investments: ₹15 lakh (EPF ₹12L + mutual funds ₹3L).",
        "Current monthly SIP: ₹10,000/month.",
        "Projected corpus at 60 (10% CAGR on current + SIP): ≈₹2.8 crore.",
        "GAP: ₹10.29 crore − ₹2.8 crore = ₹7.5 crore shortfall.",
        "To close the gap: increase SIP to ₹48,000/month immediately, OR retire at 65, OR reduce retirement expenses.",
        "Freedom Planner surfaces this gap in the Freedom Calculator instantly.",
      ],
    },
    appGuide: {
      tab: "Freedom Calculator",
      description: "See your retirement corpus gap and what it takes to close it.",
      steps: [
        "Go to Freedom Calculator tab → Retirement Mode.",
        "Enter: current age, target retirement age, current monthly expenses, current investments.",
        "Enter monthly SIP amount and expected CAGR.",
        "Freedom Planner calculates: projected corpus vs required corpus → shows the gap.",
        "Use the sliders to test scenarios: what if I increase SIP by ₹5,000? What if I retire at 62 instead of 60?",
        "The 'Years Left' counter makes the urgency concrete — use it as motivation to increase investments.",
      ],
    },
  },

  25: {
    overview: [
      "Inflation doesn't stop when you retire — your expenses continue to rise while your corpus is slowly drawn down. A ₹5 crore corpus at 60 sounds comfortable, but if inflation is 6% and your expenses grow accordingly, the same lifestyle that costs ₹1 lakh/month at 60 will cost ₹1.79 lakh/month at 70. Your corpus must be invested even in retirement — not parked entirely in FDs.",
      "Healthcare inflation is the most dangerous element: medical costs in India have risen 10–15% per year over the last decade. A retiree's medical expenses at 75 can be 4–6× their medical expenses at 60, even with insurance. Plan for this explicitly.",
    ],
    keyPoints: [
      "Retirement is not a 'safe' zone for money — expenses grow, corpus must partly stay in inflation-beating assets",
      "The '100 minus age' rule for equity allocation in retirement: a 65-year-old keeps 35% in equity",
      "Sequence of returns risk: a bear market in the first 3 years of retirement is the most damaging scenario — buffer with 2 years of expenses in FD",
      "Healthcare inflation (10–15% p.a.) requires explicit budget line in retirement planning",
      "Income sources in retirement: corpus withdrawal + EPF/NPS pension + rental income + any part-time work",
      "Safe withdrawal rate of 4% assumes a balanced portfolio (60% equity/40% debt) — 100% FD at 7% barely covers inflation",
    ],
    example: {
      title: "Managing the Inflation Sting in Retirement",
      steps: [
        "Suresh retires at 60 with ₹6 crore corpus. Monthly expenses: ₹1,20,000 (inflation: 6%).",
        "Age 60: expenses ₹1,20,000 | Portfolio withdrawal: ₹1,20,000/month.",
        "Age 70: expenses = ₹1,20,000 × (1.06)^10 = ₹2,14,740/month — 79% more.",
        "If he parked the ₹6 crore entirely in FDs at 7%, annual income = ₹42 lakh. At age 70, he needs ₹25.8L but has ₹42L — fine.",
        "But at age 80: expenses = ₹3,84,000/month = ₹46L/year. FD income still ₹42L. He is now dipping into principal.",
        "Better strategy: 40% in equity MF (for growth), 40% in FD/debt (for stability), 20% in liquid (for buffer).",
        "The equity portion grows with inflation, sustaining the corpus longer.",
      ],
    },
    appGuide: {
      tab: "Freedom Calculator + Investments",
      description: "Model inflation impact on your retirement corpus and ensure your allocation sustains it.",
      steps: [
        "Go to Freedom Calculator → enable 'Inflation Adjustment' toggle.",
        "Enter your current expenses and target inflation rate — the tool shows retirement-year expenses.",
        "Look at the 'Corpus Runway' chart: at what age does your corpus run out under different scenarios?",
        "Go to Investments tab → check if your retirement allocation has some equity exposure.",
        "Use the AI Advisor: it flags if your projected retirement corpus is 100% FD (insufficient for inflation).",
        "Add a 'Healthcare Fund' as a separate goal — size it at ₹50–₹80L (today's value) for a couple.",
      ],
    },
  },

  26: {
    overview: [
      "The most popular framework for sizing a retirement corpus is the 4% safe withdrawal rule: you can withdraw 4% of your corpus per year and have a high probability of the corpus lasting 30+ years. Working backwards: if you need ₹12 lakh/year in retirement, you need a corpus of ₹12L ÷ 0.04 = ₹3 crore (or equivalently, 25× annual expenses).",
      "This rule was derived from US historical market data (the Trinity Study). In India, with higher inflation (6–7% vs 2–3% in the US) and different market dynamics, some planners use a 3.5% withdrawal rate (≈28.6× annual expenses) for a more conservative estimate. Factor in your pension, rental income, or any other fixed income — only the shortfall needs to come from the corpus.",
    ],
    keyPoints: [
      "25× annual expenses rule: corpus = monthly expenses × 12 × 25 (based on 4% safe withdrawal rate)",
      "For Indian context with higher inflation, consider 3.5% withdrawal = corpus = monthly expenses × 12 × 28.5",
      "Subtract fixed income sources: EPF pension, NPS annuity, rental income, spouse's income — only fund the gap",
      "Longevity risk: plan for corpus to last 30+ years (retire at 60, plan until 90 — no one plans to run out at 80)",
      "Corpus depletion strategy: withdraw from FD/debt first; let equity compound; rebalance annually",
      "Review the corpus target every 5 years — lifestyle costs and inflation estimates change",
    ],
    example: {
      title: "Building the Corpus Target for Padma",
      steps: [
        "Padma (40), plans to retire at 58. Current monthly expenses: ₹70,000. Inflation 6%.",
        "Expenses at 58 (18 years × 6% inflation): ₹70,000 × (1.06)^18 = ₹2,00,000/month (approx).",
        "Annual expense at retirement: ₹2,00,000 × 12 = ₹24 lakh.",
        "Corpus needed (25×): ₹24L × 25 = ₹6 crore.",
        "Fixed income at retirement: EPF pension ₹15,000/month = ₹1,80,000/year.",
        "Net annual withdrawal needed from corpus: ₹24L − ₹1.8L = ₹22.2 lakh.",
        "Adjusted corpus: ₹22.2L × 25 = ₹5.55 crore.",
        "She enters all this in Freedom Planner → Retirement Corpus Planner → sees the exact SIP needed starting today.",
      ],
    },
    appGuide: {
      tab: "Freedom Calculator → Corpus Planner",
      description: "Calculate your exact retirement corpus target and required monthly investment.",
      steps: [
        "Go to Freedom Calculator → Corpus Planner mode.",
        "Enter: current expenses, inflation rate, target retirement age, current age.",
        "Enter fixed income at retirement (EPF, NPS, rental) — the tool subtracts this from required corpus.",
        "Freedom Planner outputs: inflation-adjusted retirement expenses, required corpus, monthly SIP to reach it.",
        "Cross-reference with your Goals tab — set 'Retirement Corpus' as a goal with the calculated target amount.",
        "Use the AI Advisor to get a personalised recommendation on how to split the investment between equity and debt.",
      ],
    },
  },

  27: {
    overview: [
      "FIRE (Financial Independence, Retire Early) is a movement built on one idea: save aggressively, invest wisely, and reach the point where passive income covers your expenses — then choose how you spend your time. FIRE is not about deprivation; it is about intention and freedom of choice.",
      "FIRE comes in several variants to suit different life goals. Lean FIRE is extreme frugality — a very small lifestyle footprint and corpus. Fat FIRE is the version for those who want to maintain a high standard of living. Coast FIRE means saving enough early that compounding does the rest. Barista FIRE (semi-retirement) means working part-time to cover basic expenses while investments grow undisturbed.",
    ],
    keyPoints: [
      "Lean FIRE: corpus = 25× minimal annual expenses (₹30,000/month lifestyle = ₹90L corpus)",
      "Regular FIRE: corpus = 25× moderate annual expenses (₹80,000/month = ₹2.4 crore corpus)",
      "Fat FIRE: corpus = 25× high annual expenses (₹2,50,000/month = ₹7.5 crore corpus)",
      "Coast FIRE: invest early until projected growth reaches the FIRE number — then coast (just earn enough to live on)",
      "Barista FIRE: partial retirement — part-time work covers current expenses; investments compound unmolested",
      "FIRE is a spectrum — most people land somewhere between; define YOUR version before chasing a number",
    ],
    example: {
      title: "Choosing the Right FIRE Variant",
      steps: [
        "Nisha (30, freelance designer, ₹1.5L/month income, ₹60,000/month expenses): What FIRE is right for her?",
        "Lean FIRE: Could she live on ₹35,000/month? Corpus needed: ₹35K × 12 × 25 = ₹1.05 crore. Achievable in 8 years at 40% savings rate.",
        "Regular FIRE: Maintain ₹60,000/month lifestyle. Corpus: ₹60K × 12 × 25 = ₹1.8 crore. 10–12 years at 30% savings rate.",
        "Fat FIRE: ₹1,50,000/month lifestyle (travel, etc.). Corpus: ₹1.5L × 12 × 25 = ₹4.5 crore. 15–18 years.",
        "Barista FIRE: Take occasional design projects (₹30,000/month) — needs corpus for only ₹30,000 shortfall = ₹90L. Possible in 6 years.",
        "She chooses Barista FIRE → aggressive saving for 6 years, then selective freelance projects she enjoys.",
        "Freedom Planner's path toggle shows all four variants and the timeline for each, based on her actual numbers.",
      ],
    },
    appGuide: {
      tab: "Freedom Calculator → FIRE Paths",
      description: "Explore all FIRE variants and see which path suits your timeline and lifestyle.",
      steps: [
        "Go to Freedom Calculator → toggle to 'FIRE' mode.",
        "Enter your current monthly expenses and any projected retirement expenses.",
        "Use the 'Path' selector: Lean, Regular, Fat, Coast — see the corpus needed and timeline for each.",
        "Enter your current savings rate and investment amount — the projected FIRE age updates instantly.",
        "Try adjusting savings rate sliders: +5% savings rate → how many years earlier do you FIRE?",
        "Save your preferred FIRE path as a Goal — track progress month by month.",
      ],
    },
  },

  28: {
    overview: [
      "Your FIRE number is the corpus at which you can safely stop working and live on investment returns. Calculated as: annual expenses × 25 (for 4% withdrawal), adjusted for inflation to your target FIRE year. It's a specific, calculable number — not a vague 'a lot of money.'",
      "The most powerful insight: your FIRE date is primarily driven by your savings rate, not your income. Someone earning ₹5 lakh/month but spending ₹4.8 lakh (4% savings rate) won't FIRE for 65+ years. Someone earning ₹1.5 lakh but saving 50% (₹75,000) can FIRE in 15 years. FIRE is a spending problem, not an income problem.",
    ],
    keyPoints: [
      "FIRE number = annual retirement expenses × 25 (at today's value, then inflate to FIRE year)",
      "Savings rate is the master variable: 10% savings rate → FIRE in 40+ years | 50% savings rate → FIRE in ~17 years",
      "Every ₹1 of monthly expense reduced = ₹300 less corpus needed (₹1 × 12 months × 25× rule)",
      "Use conservative return assumptions (8–10% equity, 6% debt, blended ≈9%) to avoid overconfidence",
      "Healthcare, housing, and lifestyle cost changes in early retirement must be budgeted explicitly",
      "Tax efficiency: long-term capital gains on equity (>₹1L/year) at 10% — optimize withdrawal strategy",
    ],
    example: {
      title: "Calculating Mihir's FIRE Number",
      steps: [
        "Mihir (32), target FIRE age: 45 (13 years away). Current expenses: ₹90,000/month.",
        "Planned FIRE lifestyle: ₹1,00,000/month (travel, hobbies added — no commute, kids' school cost reduced).",
        "Inflation-adjusted FIRE expenses (13 years, 6%): ₹1,00,000 × (1.06)^13 = ₹2,13,000/month.",
        "Annual FIRE expense: ₹2,13,000 × 12 = ₹25.6L.",
        "FIRE corpus (25×): ₹25.6L × 25 = ₹6.4 crore.",
        "Current portfolio: ₹25 lakh. Monthly SIP: ₹60,000 (48% savings rate).",
        "Projected corpus at 45 (10% CAGR, 13 years): ₹25L growing + ₹60K/month SIP ≈ ₹2.2 crore + ₹2.8 crore = ₹5 crore.",
        "Gap: ₹1.4 crore. Action: increase SIP by ₹10,000/month and invest any bonuses → gap closes by 45.",
      ],
    },
    appGuide: {
      tab: "Freedom Calculator → FIRE Number",
      description: "Calculate your exact FIRE number and track how close your portfolio is to reaching it.",
      steps: [
        "Go to Freedom Calculator → FIRE Calculator.",
        "Enter: target FIRE age, planned monthly expenses in retirement, inflation rate.",
        "Freedom Planner calculates the inflation-adjusted FIRE corpus (your FIRE number).",
        "Enter current portfolio value and monthly investment → see projected FIRE age.",
        "If the projected FIRE age is later than your target, try the savings rate slider — see how much earlier you can FIRE.",
        "Set the FIRE number as your primary Retirement Goal — the progress bar shows how much of the corpus you've built.",
      ],
    },
  },

  29: {
    overview: [
      "Your financial-freedom rate is the percentage of income you consistently save and invest. It is the single number most correlated with how quickly you reach financial independence. A 10% savings rate means FIRE in 40+ years. A 50% savings rate means FIRE in about 17 years. A 70% savings rate means FIRE in under 10 years.",
      "The freedom rate has four levers you can pull simultaneously: increase income, reduce expenses, pay down debt (frees up EMI for investment), and grow SIPs. The Financial Freedom Simulator in Freedom Planner lets you model what happens when you move any of these levers.",
    ],
    keyPoints: [
      "Freedom rate = (monthly savings + investments) ÷ monthly gross income × 100",
      "Each lever matters: even a 5% higher savings rate can reduce FIRE timeline by 3–5 years",
      "Every rupee of EMI eliminated permanently becomes investable surplus — debt payoff has a 100% guaranteed 'return'",
      "Lifestyle creep is the enemy: most people increase spending proportionally with every income raise",
      "The 'Latte factor' compounds: ₹150/day × 30 days × 12 months × 10% invested × 15 years ≈ ₹12 lakh",
      "Income growth is the fastest lever — but only if expenses don't grow proportionally with it",
    ],
    example: {
      title: "Moving from 20% to 40% Savings Rate",
      steps: [
        "Tanya earns ₹1,20,000/month. Current savings: ₹24,000 (20%). Expenses: ₹96,000.",
        "Goal: increase to 40% savings (₹48,000/month).",
        "Lever 1 — Reduce expenses: Cancel unused gym (₹3,000) + meal prep vs. delivery (₹5,000 saved) + renegotiate rent (₹3,000 saved) = ₹11,000 freed.",
        "Lever 2 — Pay off personal loan in 6 months: EMI ₹8,000 freed when loan clears.",
        "Lever 3 — Negotiate salary increment of 10%: income grows to ₹1,32,000. Save 50% of the increment (₹6,000).",
        "New savings: ₹24,000 + ₹11,000 (expenses) + ₹8,000 (debt payoff) + ₹6,000 (income) = ₹49,000/month.",
        "Savings rate: ₹49,000 ÷ ₹1,32,000 = 37% → close to target in 12 months with focused effort.",
      ],
    },
    appGuide: {
      tab: "Freedom Calculator → Financial Freedom Simulator",
      description: "Simulate the impact of changing income, expenses, debt, and SIP on your FIRE timeline.",
      steps: [
        "Go to Freedom Calculator → Financial Freedom Simulator.",
        "Your current income, expenses, EMIs, and SIP are pre-filled from your profile.",
        "Move the 'Reduce Expenses' slider → see FIRE age move earlier.",
        "Move the 'Increase SIP' slider → see the impact of monthly investing.",
        "Toggle 'Debt payoff in X months' → see the freed EMI redirect to SIP from that month.",
        "Use these projections to set a 12-month financial freedom action plan in your Goals tab.",
      ],
    },
  },

  30: {
    overview: [
      "A financial-freedom roadmap is where everything comes together: your real numbers (from the profile), your goals, your investment plan, and the AI's insights — assembled into a prioritized action plan. It is not a generic template; it is your personal map built from your actual income, expenses, debts, goals, and timeline.",
      "The roadmap has three phases: Stabilize (emergency fund + insurance + bad debt), Optimize (good debt management + systematic investing), and Accelerate (maximize savings rate + FIRE planning). Most people are in phase 1 or 2. Freedom Planner's AI Advisor identifies which phase you're in and what the highest-leverage next action is for you specifically.",
    ],
    keyPoints: [
      "Phase 1 — Stabilize: emergency fund (6 months), adequate insurance, eliminate high-interest debt",
      "Phase 2 — Optimize: maximize EPF/NPS, SIPs for all goals, manage remaining debt intelligently",
      "Phase 3 — Accelerate: maximize savings rate, diversify income, optimize tax, model FIRE timeline",
      "Review the roadmap every 6 months or after any major life event (job change, marriage, child, inheritance)",
      "Prioritization is everything: not all goals are equal. Emergency fund > insurance > bad debt > retirement > other goals",
      "Celebrate milestones: debt-free date, emergency fund complete, first SIP anniversary — reinforces the habits",
    ],
    example: {
      title: "Arjun's 3-Year Financial Roadmap",
      steps: [
        "Current state: Emergency fund ₹60K (target ₹2.4L) | Personal loan ₹80K at 18% | No term insurance | SIP ₹5,000/month.",
        "Year 1 priorities: Complete emergency fund (₹1,800/month × 10 months) | Buy ₹1.5 crore term plan (₹10K/year) | Pay off personal loan (₹8,000/month × 10 months).",
        "Year 2 priorities: Redirect freed loan EMI (₹8,000) + emergency fund contribution (₹1,800) to SIP = SIP grows to ₹14,800/month.",
        "Year 2 also: Buy ₹10L family health floater | Start ELSS SIP for tax saving.",
        "Year 3 priorities: Salary increment → increase SIP by 50% of increment | Model retirement corpus in Freedom Calculator | Set FIRE target.",
        "3-year outcome: Debt-free | Insured | Emergency fund complete | SIP ₹20,000+/month | Freedom Score improved from 3 to 18.",
        "The roadmap makes each year's priorities clear — no financial paralysis.",
      ],
    },
    appGuide: {
      tab: "AI Advisor + Goals + Freedom Calculator",
      description: "Use all three together to generate and maintain your personal financial roadmap.",
      steps: [
        "Go to AI Advisor tab → run a fresh advisor report. It analyses your full profile and surfaces your top 5 priority actions.",
        "Compare advisor recommendations with your current Goals — add any missing priorities as new goals.",
        "Go to Freedom Calculator → set your FIRE target (corpus, age) — this becomes your north star.",
        "Go to Summary Report tab → generate a PDF of your financial state, goals, and projections — share with your partner or financial advisor.",
        "Revisit every 6 months: update profile, re-run advisor, check goal progress, adjust SIPs for income changes.",
        "Every completed goal in Freedom Planner moves your Freedom Score — watch it climb from 0 toward 100.",
      ],
    },
  },
};
