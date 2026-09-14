/* ─────────────────────────────────────────────────────────────────────────
   Financial Freedom Journey — course structure + quiz data
   Storage key shared with course.html: "fp-course-progress"
   ───────────────────────────────────────────────────────────────────────── */

export const COURSE_STORAGE_KEY = "fp-course-progress";

export interface QuizQuestion {
  q: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
}

export interface CourseLesson {
  id: number;
  title: string;
  tool: string;
  action: string;
  questions: QuizQuestion[];
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface CourseLevel {
  id: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  accentClass: string;
  modules: CourseModule[];
}

/* ── Quiz questions: 10 per lesson × 30 lessons = 300 total ────────────── */

const Q: Record<number, QuizQuestion[]> = {
  1: [
    { q: "Financial freedom is best defined as...", options: ["Earning a very high salary", "Having passive income that covers your living expenses", "Being completely debt-free", "Owning more than ₹1 crore in assets"], answer: 1 },
    { q: "Which metric tracks progress toward financial independence in Freedom Planner?", options: ["Net salary", "Credit score", "Freedom Score", "EMI-to-income ratio"], answer: 2 },
    { q: "A person achieves financial independence when their...", options: ["Bank balance crosses ₹10 lakh", "Investment income exceeds monthly expenses", "All loans are fully repaid", "Salary reaches double the national average"], answer: 1 },
    { q: "Financial freedom differs from simply being 'wealthy' because it focuses on...", options: ["Total net worth", "Monthly cash flow from passive sources", "Investment portfolio size", "Number of properties owned"], answer: 1 },
    { q: "Which of these is an example of passive income?", options: ["Monthly salary", "Freelance project payment", "Rental income from an apartment", "Bonus from employer"], answer: 2 },
    { q: "The first recommended step toward financial freedom is...", options: ["Immediately investing all savings", "Paying off every debt", "Defining your personal freedom goal", "Cutting all discretionary spending"], answer: 2 },
    { q: "If your passive income equals your monthly expenses, your Freedom Score is closest to...", options: ["0", "50", "100", "200"], answer: 2 },
    { q: "A financial freedom goal should be...", options: ["Vague so you have flexibility", "Specific, measurable, and time-bound", "The same as your neighbour's goal", "Set only after retirement"], answer: 1 },
    { q: "Freedom Planner links lessons back to the app so that...", options: ["It is cheaper to build", "Lessons directly improve your real numbers", "Users prefer reading over acting", "It saves server costs"], answer: 1 },
    { q: "If passive income is ₹50,000/month and expenses are ₹45,000/month, what is the situation?", options: ["Financially free — passive income exceeds expenses", "Not yet free — still need to save more", "In deficit", "Break-even only"], answer: 0 },
  ],
  2: [
    { q: "Net worth is calculated as...", options: ["Income minus expenses", "Assets minus liabilities", "Savings minus investments", "Income plus assets"], answer: 1 },
    { q: "Which of these is an asset?", options: ["Home loan outstanding", "Credit card balance", "Savings account balance", "Personal loan"], answer: 2 },
    { q: "Which of these is a liability?", options: ["Mutual fund portfolio", "Fixed deposit", "Car loan outstanding", "Rental income"], answer: 2 },
    { q: "A financial snapshot typically includes...", options: ["Your social media accounts", "Income, expenses, assets, and liabilities", "Your professional certifications", "Family tree details"], answer: 1 },
    { q: "'Liquid assets' are best described as...", options: ["Assets stored in water", "Assets that can be quickly converted to cash", "Long-term investments with lock-in", "Real estate holdings"], answer: 1 },
    { q: "Fixed income refers to...", options: ["Income that never changes over years", "Regular, predictable income like salary", "Income from fixed deposits only", "Government pension only"], answer: 1 },
    { q: "Variable expenses are...", options: ["Expenses fixed every month", "Expenses that change month to month", "Only luxury spending", "Automated bill payments"], answer: 1 },
    { q: "Why is completing a full financial profile important?", options: ["It improves your credit score automatically", "It helps you understand your true financial position", "Banks require it", "It reduces taxes automatically"], answer: 1 },
    { q: "Which is NOT typically part of a personal financial profile?", options: ["Monthly income", "Outstanding loan amounts", "Daily food preferences", "Investment portfolio value"], answer: 2 },
    { q: "A person has ₹5 lakh in savings and a ₹2 lakh car loan. Their net worth from these items is...", options: ["₹7 lakh", "₹5 lakh", "₹3 lakh", "₹2 lakh"], answer: 2 },
  ],
  3: [
    { q: "Cash flow is best defined as...", options: ["Total value of all assets", "Money moving in and out over a period", "Your salary alone", "Net worth change"], answer: 1 },
    { q: "A positive cash flow means...", options: ["You have debt", "Income exceeds expenses in a period", "You own assets", "Expenses exceed income"], answer: 1 },
    { q: "A cash-flow deficit occurs when...", options: ["You save more than you spend", "Your expenses exceed your income", "Your salary increases", "You invest regularly"], answer: 1 },
    { q: "Which is an example of a cash inflow?", options: ["Paying rent", "EMI deduction", "Salary credited", "Grocery bill"], answer: 2 },
    { q: "Monthly surplus is calculated as...", options: ["Total assets minus liabilities", "Total income minus total expenses", "Savings minus EMIs", "Investments minus expenses"], answer: 1 },
    { q: "If income is ₹80,000 and expenses are ₹65,000, the monthly surplus is...", options: ["₹1,45,000", "₹80,000", "₹15,000", "₹65,000"], answer: 2 },
    { q: "The cash-flow analyzer primarily helps you...", options: ["Track your credit score", "Identify your monthly surplus or deficit", "Calculate retirement corpus", "File tax returns"], answer: 1 },
    { q: "Which of these would REDUCE your monthly surplus?", options: ["Getting a salary increment", "Paying off a loan completely", "Taking a new loan with an EMI", "Cancelling an unused subscription"], answer: 2 },
    { q: "Irregular income makes cash-flow analysis...", options: ["Impossible to do", "Simpler than salaried work", "More important to track carefully", "Irrelevant"], answer: 2 },
    { q: "Why should you analyse cash flow before investing?", options: ["Investing requires a CIBIL score", "You need to know how much surplus is safely available to invest", "Cash flow analysis reduces taxes", "Banks require it"], answer: 1 },
  ],
  4: [
    { q: "In the 50/30/20 rule, '50' represents...", options: ["50% for savings", "50% for investments", "50% for needs (essentials)", "50% for wants"], answer: 2 },
    { q: "In the 50/30/20 rule, '20' represents...", options: ["Needs", "Wants", "Savings and debt repayment", "Entertainment"], answer: 2 },
    { q: "Zero-based budgeting means...", options: ["You spend nothing", "Every rupee of income is assigned a purpose", "You save 100%", "Your bank balance stays at zero"], answer: 1 },
    { q: "Which is an example of a 'need' in personal budgeting?", options: ["Weekend vacation", "Streaming subscriptions", "Rent/housing", "Restaurant dining"], answer: 2 },
    { q: "Which is an example of a 'want' in personal budgeting?", options: ["Groceries", "Utility bills", "New smartphone upgrade", "Mandatory insurance premium"], answer: 2 },
    { q: "The main advantage of zero-based budgeting is...", options: ["You never spend on wants", "Every expense is intentional and justified", "It eliminates all debt automatically", "It requires no tracking"], answer: 1 },
    { q: "A budget planner is most useful when...", options: ["You have infinite money", "You want to plan proactively where money goes", "Your expenses are zero", "You never use credit cards"], answer: 1 },
    { q: "If monthly income is ₹1,00,000, the 50/30/20 rule suggests spending on needs up to...", options: ["₹20,000", "₹30,000", "₹50,000", "₹70,000"], answer: 2 },
    { q: "Which approach assigns income to categories BEFORE the month begins?", options: ["Retroactive budgeting", "Zero-based budgeting", "Cash-flow budgeting", "Net-worth budgeting"], answer: 1 },
    { q: "The main goal of a monthly budget is to...", options: ["Eliminate all spending", "Plan income allocation to meet goals and reduce stress", "Avoid paying taxes", "Track only big purchases"], answer: 1 },
  ],
  5: [
    { q: "An expense analyzer primarily helps you...", options: ["Increase your income", "See patterns in where money is spent", "Calculate your net worth", "Generate tax returns"], answer: 1 },
    { q: "'Lifestyle creep' refers to...", options: ["Moving to a larger house", "Expenses rising as income rises, eroding savings", "Reducing spending gradually", "Becoming minimalist"], answer: 1 },
    { q: "The best first step when analysing where money goes is...", options: ["Cutting all entertainment immediately", "Reviewing 3–6 months of bank and card statements", "Asking your employer for a raise", "Opening a new savings account"], answer: 1 },
    { q: "If you identify reduceable expenses, which should you cut first?", options: ["The one that causes the most inconvenience", "The largest recurring one that adds the least value", "The smallest one", "The one your friend suggested"], answer: 1 },
    { q: "Fixed expenses differ from variable expenses in that fixed expenses...", options: ["Are always zero", "Remain the same every month", "Are optional", "Are always luxuries"], answer: 1 },
    { q: "Tracking discretionary spending helps primarily because...", options: ["It reduces taxes", "It reveals where intentional cuts can free up savings", "Banks require it", "It improves credit score"], answer: 1 },
    { q: "Which category is often the largest unnoticed expense drain?", options: ["Rent", "Small recurring subscriptions and impulse purchases", "Salary taxes", "EMI payments"], answer: 1 },
    { q: "If you reduce monthly expenses by ₹5,000 and invest the surplus, the long-term impact is...", options: ["Negligible", "Significant due to compounding over time", "Zero unless you invest ₹50,000+", "Only relevant at retirement"], answer: 1 },
    { q: "The recommended action after identifying spending patterns is to...", options: ["Close all credit cards", "Pick 2–3 expenses to reduce meaningfully", "Stop all investing until expenses are zero", "Switch banks"], answer: 1 },
    { q: "Tracking expenses is useful because it...", options: ["Automatically saves money", "Creates awareness that leads to better financial decisions", "Is required by law", "Guarantees a higher credit score"], answer: 1 },
  ],
  6: [
    { q: "An emergency fund is best defined as...", options: ["Money for luxury items on sale", "Liquid savings reserved for unexpected essential expenses", "A retirement account", "A secondary investment portfolio"], answer: 1 },
    { q: "The generally recommended size of an emergency fund is...", options: ["₹1,00,000 flat", "1 month of salary", "3–6 months of essential expenses", "Equal to your annual income"], answer: 2 },
    { q: "Emergency funds should be kept in...", options: ["Fixed deposits with 5-year lock-in", "Equity mutual funds", "High-liquidity instruments like savings accounts or liquid funds", "Physical gold"], answer: 2 },
    { q: "Which of these is an appropriate use of an emergency fund?", options: ["Vacation trip", "New phone purchase", "Job loss — covering living expenses", "Down payment for a house"], answer: 2 },
    { q: "Why should emergency funds NOT be invested in equity?", options: ["Equity has no returns", "Equity markets are volatile — funds may be needed urgently at a market low", "Equity is too tax-heavy", "Equity requires a Demat account"], answer: 1 },
    { q: "If monthly essential expenses are ₹30,000, a 6-month emergency fund target is...", options: ["₹30,000", "₹1,00,000", "₹1,80,000", "₹3,60,000"], answer: 3 },
    { q: "An emergency fund is most important for people with...", options: ["Very high savings rates", "Variable or uncertain income", "Already retired", "Zero expenses"], answer: 1 },
    { q: "Which of these would be classified as an 'essential expense' for sizing?", options: ["Annual vacation", "Rent and groceries", "New furniture", "Streaming subscriptions"], answer: 1 },
    { q: "Why keep the emergency fund separate from investments?", options: ["Investments earn no returns", "Emergency funds need to be accessible without risk of loss of principal", "Tax rules require it", "Banks mandate it"], answer: 1 },
    { q: "Before building an emergency fund, you should ensure...", options: ["Stock market investments are running", "At least a minimum 1-month buffer to start", "All debt is paid off completely first", "Buying insurance first"], answer: 1 },
  ],
  7: [
    { q: "The best strategy to build an emergency fund consistently is...", options: ["Wait until you have extra money", "Automate a fixed monthly transfer to a dedicated emergency savings account", "Invest in stocks and sell when needed", "Borrow from family if emergencies arise"], answer: 1 },
    { q: "An emergency fund goal should be linked to...", options: ["Your investment portfolio", "A dedicated goal with a target amount and timeline", "Your salary account directly", "Your credit card limit"], answer: 1 },
    { q: "If you have ₹20,000 saved and your target is ₹1,80,000, saving ₹10,000/month, you reach it in...", options: ["6 months", "16 months", "18 months", "20 months"], answer: 1 },
    { q: "Which account type is most suitable for an emergency fund in India?", options: ["PPF (15-year lock-in)", "ELSS mutual fund", "High-yield savings account or liquid mutual fund", "National Pension System (NPS)"], answer: 2 },
    { q: "Once your emergency fund is fully built, you should...", options: ["Stop saving and spend freely", "Redirect that monthly saving toward other financial goals", "Keep accumulating indefinitely", "Withdraw and reinvest in equity"], answer: 1 },
    { q: "Replenishing an emergency fund after using it should be...", options: ["Optional", "Done as fast as comfortably possible", "Deprioritised for years", "Only done once in a lifetime"], answer: 1 },
    { q: "Treating an emergency fund as 'do not touch' for non-emergencies helps because...", options: ["It earns higher interest", "It prevents money from being spent on discretionary items", "Banks reward this behaviour", "It improves credit score"], answer: 1 },
    { q: "Which does NOT belong in an emergency fund account?", options: ["1-month salary buffer", "6 months of essential expenses", "SIP contributions to an equity fund", "Liquid fund units"], answer: 2 },
    { q: "Tracking your emergency fund goal is useful because...", options: ["It shows your credit utilization", "You can track gap closure month by month", "It automatically invests surplus", "It files taxes for you"], answer: 1 },
    { q: "After reaching the emergency fund target, the ideal next step is...", options: ["Spend freely — you've earned it", "Start or increase SIPs toward other goals", "Take a loan using the fund as collateral", "Double the emergency fund target"], answer: 1 },
  ],
  8: [
    { q: "EMI stands for...", options: ["Extra Monthly Interest", "Equated Monthly Installment", "Equal Money Investment", "Extended Monthly Installment"], answer: 1 },
    { q: "In a loan, the 'principal' is...", options: ["The interest component", "The total amount originally borrowed", "The monthly instalment", "The final payment"], answer: 1 },
    { q: "Amortization refers to...", options: ["Early loan closure", "Paying off debt through regular instalments over time", "Applying for a new loan", "Converting variable rate to fixed rate"], answer: 1 },
    { q: "In early months of a home loan EMI, which component is typically larger?", options: ["Principal repayment", "Interest component", "Both are always equal", "Neither varies"], answer: 1 },
    { q: "Loan tenure refers to...", options: ["The interest rate on the loan", "The time period over which the loan is repaid", "The lender's branch location", "The loan processing fee"], answer: 1 },
    { q: "A higher loan tenure generally means...", options: ["Lower total interest paid", "Higher total interest paid but lower monthly EMI", "Exactly the same total cost", "Faster principal repayment"], answer: 1 },
    { q: "The Loan Analyzer in Freedom Planner helps you see...", options: ["Your credit score", "Total interest cost on your current loans", "Stock market performance", "Tax savings"], answer: 1 },
    { q: "Prepaying a loan early primarily benefits you by...", options: ["Increasing the loan tenure", "Reducing total interest paid", "Immediately improving CIBIL score", "Reducing the lender's profit tax"], answer: 1 },
    { q: "A reducing-balance loan charges interest on...", options: ["The original loan amount throughout the tenure", "The outstanding principal balance each month", "A fixed interest amount regardless of balance", "Zero — no interest charged"], answer: 1 },
    { q: "If you take a ₹10 lakh loan at 10% for 10 years, total interest paid will be...", options: ["₹10 lakh", "Less than the principal always", "More than ₹5 lakh", "Exactly ₹1 lakh"], answer: 2 },
  ],
  9: [
    { q: "'Good debt' is generally characterised by...", options: ["High interest rates", "Being used purely for consumption", "Building an asset or generating future income", "Always requiring collateral"], answer: 2 },
    { q: "Which of these is typically considered 'good debt'?", options: ["Credit card revolving balance", "Personal loan for a vacation", "Home loan for a property", "Payday loan"], answer: 2 },
    { q: "'Bad debt' is typically characterised by...", options: ["Low interest rates", "Being used to buy income-generating assets", "Financing depreciating assets or consumption", "Having a long repayment tenure"], answer: 2 },
    { q: "Debt-to-income ratio is calculated as...", options: ["Total assets divided by total income", "Total monthly debt payments divided by monthly gross income", "Annual income divided by total debt", "Net worth divided by monthly income"], answer: 1 },
    { q: "A healthy debt-to-income ratio is generally considered to be...", options: ["Below 10%", "Below 36%", "Above 50%", "Exactly 25%"], answer: 1 },
    { q: "A car loan is generally considered...", options: ["Good debt because a car is an asset", "Questionable debt because a car depreciates in value", "Neutral — neither good nor bad", "Good debt because it reduces tax"], answer: 1 },
    { q: "An education loan could be considered 'good debt' primarily because...", options: ["Education loans have zero interest", "It can increase your future earning capacity", "Banks offer the best rates on education loans", "Education is free anyway"], answer: 1 },
    { q: "The Debt Health Analyzer shows...", options: ["Your CIBIL score", "Debt-to-income ratio against your household data", "Tax liabilities", "Investment returns"], answer: 1 },
    { q: "The BEST strategy when you have both high-interest bad debt and investments?", options: ["Pay all equally", "Eliminate high-interest bad debt first", "Ignore debt and only invest", "Consolidate everything regardless of rate"], answer: 1 },
    { q: "Credit card revolving debt is typically 'bad debt' because...", options: ["Credit cards are illegal", "Interest rates on revolving balances are very high (24–42% p.a.)", "Banks dislike credit cards", "Credit cards have no credit limit"], answer: 1 },
  ],
  10: [
    { q: "The Debt Avalanche method prioritises repaying...", options: ["The smallest debt first", "The debt with the highest interest rate first", "The oldest debt first", "The largest principal first"], answer: 1 },
    { q: "The Debt Snowball method prioritises repaying...", options: ["The highest interest rate debt", "The largest outstanding balance", "The smallest debt by balance first", "The most recent debt"], answer: 2 },
    { q: "Which method mathematically saves more on total interest?", options: ["Debt Snowball", "Debt Avalanche", "Both are equal mathematically", "Neither has any impact"], answer: 1 },
    { q: "Which method provides faster psychological wins?", options: ["Debt Avalanche", "Debt Snowball", "Prepayment only", "Debt consolidation"], answer: 1 },
    { q: "Loan prepayment means...", options: ["Skipping an EMI", "Making an extra payment toward the principal to reduce total interest", "Applying for a new loan", "Changing the lender"], answer: 1 },
    { q: "The Debt Freedom Planner helps you...", options: ["Apply for new loans", "Choose a repayment strategy and model the outcome", "Calculate net worth", "Track insurance coverage"], answer: 1 },
    { q: "Avalanche says to pay extra on — ₹50,000 at 24% vs ₹2,00,000 at 8%...", options: ["The ₹2,00,000 loan at 8%", "The ₹50,000 loan at 24% first", "Both equally", "The newer loan"], answer: 1 },
    { q: "Debt consolidation means...", options: ["Taking multiple new loans", "Combining multiple debts into one, ideally at a lower rate", "Paying off all debt in one day", "Ignoring all debt"], answer: 1 },
    { q: "Making a small extra prepayment on a home loan each year primarily...", options: ["Increases the EMI", "Reduces total interest and can shorten the loan tenure", "Has no measurable effect", "Increases the principal"], answer: 1 },
    { q: "The recommended first step before choosing avalanche or snowball is to...", options: ["Take a new personal loan", "List all debts with balances, interest rates, and EMIs", "Close all bank accounts", "Stop all investments immediately"], answer: 1 },
  ],
  11: [
    { q: "In India, the most commonly referenced credit score is...", options: ["SEBI Score", "CIBIL TransUnion Score", "RBI Rating", "NSE Index"], answer: 1 },
    { q: "A good CIBIL score range is generally considered to be...", options: ["300–500", "500–650", "750–900", "900–999"], answer: 2 },
    { q: "Credit utilization refers to...", options: ["How many credit cards you own", "The percentage of your available credit limit being used", "Your total monthly spending", "The interest rate on your loans"], answer: 1 },
    { q: "A high credit utilization ratio (e.g., 90%) typically...", options: ["Improves your credit score", "Has no effect on credit score", "Lowers your credit score", "Only affects new loan applications"], answer: 2 },
    { q: "Making EMI payments consistently on time primarily...", options: ["Has no effect on credit score", "Improves your payment history — the most important component of credit score", "Reduces the loan interest rate automatically", "Increases your loan principal"], answer: 1 },
    { q: "Which action is most likely to HURT your credit score?", options: ["Paying bills on time", "Keeping old credit card accounts open", "Missing an EMI payment", "Having a mix of loan types"], answer: 2 },
    { q: "Closing old credit card accounts can potentially...", options: ["Always improve your score", "Reduce credit history length and available limit, lowering the score", "Have no impact whatsoever", "Automatically clear pending dues"], answer: 1 },
    { q: "How often should you check your credit report?", options: ["Never — checking harms the score", "Once every 2–3 years", "At least once a year", "Only when applying for a loan"], answer: 2 },
    { q: "In Freedom Planner, high EMIs relative to income show up in...", options: ["Freedom Score only", "Debt health and loan analyzer", "Insurance checker", "Goal planner"], answer: 1 },
    { q: "A mix of secured and unsecured credit typically...", options: ["Harms your credit score severely", "Has a neutral to slightly positive effect on your credit profile", "Doubles your credit score", "Has no relationship to credit score"], answer: 1 },
  ],
  12: [
    { q: "The 'grace period' on a credit card is...", options: ["The time the bank takes to approve the card", "The interest-free period between purchase and payment due date", "A penalty period for late payment", "Time allowed to dispute a transaction"], answer: 1 },
    { q: "'Revolving credit' on a credit card means...", options: ["You pay the full balance every month", "You carry an unpaid balance forward, incurring interest", "You rotate between multiple cards", "The card is automatically renewed annually"], answer: 1 },
    { q: "Credit card interest rates in India are typically...", options: ["2–4% per annum", "8–12% per annum", "24–42% per annum", "Same as home loan rates"], answer: 2 },
    { q: "Paying only the minimum due on a credit card...", options: ["Clears the full balance", "Results in interest being charged on the remaining balance", "Significantly improves your credit score", "Has no cost to you"], answer: 1 },
    { q: "A credit card is most beneficial when used as...", options: ["A way to spend beyond your means", "A payment tool where you always pay the full amount by the due date", "A substitute for an emergency fund", "A source of cheap short-term loans"], answer: 1 },
    { q: "Carrying a revolving balance primarily benefits...", options: ["The cardholder through rewards", "The bank through high interest income", "Your credit score", "Your savings rate"], answer: 1 },
    { q: "Credit card revolved balances appear in Freedom Planner under...", options: ["Insurance checker", "Manage — credit cards section", "Freedom calculator", "SIP tracker"], answer: 1 },
    { q: "The statement date on a credit card is...", options: ["The date your salary is credited", "The date the bank generates your monthly statement", "The date a transaction is blocked", "The date interest stops accruing"], answer: 1 },
    { q: "Which strategy is recommended for credit card usage?", options: ["Pay minimum due and invest the rest", "Pay the full outstanding balance every month to avoid interest", "Use multiple cards to spread the debt", "Apply for a higher credit limit always"], answer: 1 },
    { q: "Reward points are most valuable when...", options: ["You carry a revolving balance", "You pay the full balance each month — interest erases rewards otherwise", "You have many different cards", "You never use the card"], answer: 1 },
  ],
  13: [
    { q: "Loan prepayment is most effective in reducing total interest when done...", options: ["At the end of the loan tenure", "In the early years of the loan — when interest is the largest portion of EMI", "Only in the final year", "After retirement"], answer: 1 },
    { q: "Balance transfer involves...", options: ["Transferring money between savings accounts", "Moving an existing high-interest loan to a lender offering a lower rate", "Adding a co-applicant to a loan", "Skipping an EMI payment"], answer: 1 },
    { q: "Loan consolidation helps when...", options: ["You want more loans", "Multiple high-interest loans can be merged into one lower-rate loan", "Your credit score is very low", "You want to increase your EMI"], answer: 1 },
    { q: "The Loan Optimizer helps you model...", options: ["Your investment returns", "Prepayment vs. continue-SIP trade-off scenarios", "Your CIBIL score", "Tax-saving instruments"], answer: 1 },
    { q: "If you have spare funds, you should compare...", options: ["Only the loan prepayment option", "Only SIP returns", "The loan interest rate vs. expected investment return before deciding", "Neither — keep funds in savings always"], answer: 2 },
    { q: "When loan interest rate > expected investment return, you should generally...", options: ["Continue investing only", "Prepay the loan — guaranteed saving vs uncertain return", "Open a new loan", "Stop all financial activity"], answer: 1 },
    { q: "Reducing your interest burden frees up cash flow for...", options: ["Bank profits", "Savings, investment, or other financial goals", "Government taxes", "Increased lifestyle spending"], answer: 1 },
    { q: "Switching from annual to monthly reducing balance interest calculation...", options: ["Benefits the lender", "Benefits the borrower — you pay less interest", "Has no effect", "Is illegal in India"], answer: 1 },
    { q: "A prepayment calculator helps you see...", options: ["Your investment portfolio value", "How much interest and time you save by making extra payments", "Your tax deductions", "Credit card rewards"], answer: 1 },
    { q: "The most expensive debt to eliminate first is typically...", options: ["Home loan (lowest rate)", "Education loan", "Credit card revolving balance (highest rate)", "Car loan"], answer: 2 },
  ],
  14: [
    { q: "Insurance is fundamentally a tool for...", options: ["Generating investment returns", "Transferring financial risk to the insurer in exchange for a premium", "Avoiding all types of risk entirely", "Building long-term wealth"], answer: 1 },
    { q: "A premium is...", options: ["The insurance payout on a claim", "The regular amount you pay to maintain your insurance policy", "A bonus from the insurer", "The deductible you pay at a hospital"], answer: 1 },
    { q: "The 'sum assured' in a life insurance policy is...", options: ["The premium amount", "The maturity amount of a fixed deposit", "The amount paid to the nominee on the insured's death", "The annual bonus declared"], answer: 2 },
    { q: "Insurance protects households primarily against...", options: ["Normal monthly expenses", "Large, unexpected financial losses that could otherwise be devastating", "Investment market losses", "Tax liabilities"], answer: 1 },
    { q: "Pure term life insurance is designed to...", options: ["Generate investment returns", "Provide a high death benefit at a low premium with no maturity value", "Serve as a savings instrument", "Replace your salary when you retire"], answer: 1 },
    { q: "The Insurance Coverage Checker helps you...", options: ["Buy insurance products directly", "Compare your current coverage against your estimated financial need", "Calculate investment returns", "File insurance claims"], answer: 1 },
    { q: "Which is NOT a key principle of personal insurance?", options: ["Covering large, unlikely losses", "Always choosing the cheapest product regardless of coverage", "Matching coverage to actual need", "Reviewing coverage as life circumstances change"], answer: 1 },
    { q: "Underinsurance means...", options: ["Having no insurance at all", "Having insurance coverage below your actual financial need", "Paying too much premium", "Having multiple policies"], answer: 1 },
    { q: "Insurance and investments are best kept...", options: ["Combined in ULIP products always", "Separate — pure insurance for protection, separate vehicles for investment", "As a single mixed product only", "Only through a financial advisor"], answer: 1 },
    { q: "A household with dependants and a sole earner needs insurance most urgently because...", options: ["Insurance is mandatory by law", "Loss of that income would be financially devastating without coverage", "It reduces income tax significantly", "Banks require it for accounts"], answer: 1 },
  ],
  15: [
    { q: "A health insurance deductible is...", options: ["The annual premium you pay", "The amount you pay out-of-pocket before insurance kicks in", "The hospital's co-payment fee", "The maximum the insurance will pay"], answer: 1 },
    { q: "A family floater health insurance policy covers...", options: ["Only the policyholder", "The entire family under one shared sum insured", "Only children", "Only the spouse"], answer: 1 },
    { q: "The 'sum insured' in health insurance represents...", options: ["The annual premium", "The maximum amount the insurer will pay in a policy year", "The deductible", "The network hospital count"], answer: 1 },
    { q: "Pre-existing disease waiting periods mean...", options: ["You can claim immediately for pre-existing conditions", "There is a waiting period (typically 2–4 years) before such claims are covered", "Pre-existing conditions are never covered", "Premium is waived for pre-existing conditions"], answer: 1 },
    { q: "Cashless hospitalisation means...", options: ["You pay in cash at the hospital", "The insurer directly settles the bill with a network hospital", "You receive a cash reward for staying healthy", "No co-payment ever applies"], answer: 1 },
    { q: "A co-payment clause means...", options: ["Two people share one policy", "You share a percentage of the claim cost with the insurer", "The insurer pays nothing", "Co-applicants get a discount"], answer: 1 },
    { q: "Top-up health insurance plans are useful because...", options: ["They replace the base insurance", "They provide additional coverage above a deductible threshold at lower cost", "They cover pre-existing conditions immediately", "They offer investment returns"], answer: 1 },
    { q: "Critical illness insurance differs from regular health insurance in that it...", options: ["Only covers accidents", "Pays a lump sum on diagnosis of specified serious illnesses", "Only covers hospitalisation costs", "Requires annual health check-ups"], answer: 1 },
    { q: "Reviewing health insurance when life changes (marriage, children) is important because...", options: ["Insurance companies require it", "Family needs and adequacy of coverage change significantly", "Premium reduces automatically", "It improves your credit score"], answer: 1 },
    { q: "The Family Protection Calculator helps compare...", options: ["SIP vs. FD returns", "Current health coverage vs. estimated medical need", "Loan vs. prepayment decisions", "Tax savings options"], answer: 1 },
  ],
  16: [
    { q: "Term insurance is best described as...", options: ["An investment-linked insurance plan", "Pure life cover that pays only on death during the term — no maturity benefit", "A savings instrument with guaranteed returns", "A tax-saving investment scheme"], answer: 1 },
    { q: "Human Life Value (HLV) is a method to calculate...", options: ["Your net worth", "The appropriate amount of life insurance cover needed", "Your credit score", "Annual income tax liability"], answer: 1 },
    { q: "A commonly used rule of thumb for life insurance cover is...", options: ["1–2× annual income", "3–5× annual income", "10–15× annual income", "Equal to total savings"], answer: 2 },
    { q: "Endowment and ULIP policies combine...", options: ["Health and life cover", "Life insurance with a savings/investment component", "Home insurance with life cover", "Term insurance with health insurance"], answer: 1 },
    { q: "Why is a pure term plan generally recommended over endowment plans?", options: ["Term plans pay on survival", "Term plans offer a much higher life cover for the same premium", "Endowment plans have no maturity value", "Term plans also build investment returns"], answer: 1 },
    { q: "The nominee in a life insurance policy is...", options: ["The insurance agent", "The person who receives the death benefit if the insured person dies", "A co-applicant on a loan", "A witness to the policy contract"], answer: 1 },
    { q: "Claim settlement ratio is important when choosing an insurer because...", options: ["It shows the insurer's profit", "A higher ratio means the insurer is more likely to pay valid claims", "It determines the premium cost", "Regulators require you to use it"], answer: 1 },
    { q: "Life insurance need typically DECREASES as you age because...", options: ["You become healthier with age", "Financial dependants reduce and your wealth builds over time", "Insurers lower premiums with age", "The government covers you in old age"], answer: 1 },
    { q: "The Coverage Checker helps you...", options: ["Buy a term plan online", "See if your current life cover matches your estimated household need", "Calculate tax returns", "Review credit card benefits"], answer: 1 },
    { q: "A 30-year-old with a ₹60 lakh home loan and two dependants who has only ₹20 lakh life cover is...", options: ["Adequately covered", "Significantly underinsured", "Overinsured", "Compliant with all regulations"], answer: 1 },
  ],
  17: [
    { q: "The primary difference between saving and investing is...", options: ["Saving earns no interest at all", "Saving preserves capital with low risk; investing seeks growth with higher risk", "They are the same thing", "Investing is always safer than saving"], answer: 1 },
    { q: "A savings account is most appropriate for...", options: ["Building long-term wealth", "Storing the emergency fund and short-term needs", "Beating inflation over 10+ years", "Replacing a stock portfolio"], answer: 1 },
    { q: "Investing is most appropriate for...", options: ["Funds needed within 1 month", "Money you won't need for 5+ years that can tolerate market fluctuation", "Emergency reserves", "Paying next month's bills"], answer: 1 },
    { q: "Inflation risk means...", options: ["Your bank can lose your money", "Money in low-return savings accounts loses purchasing power over time", "Stock markets always fall", "Inflation is always positive for savers"], answer: 1 },
    { q: "The liquid buffer recommended before investing is typically...", options: ["₹10,000 fixed", "3–6 months of essential expenses in an accessible account", "50% of annual income", "Your entire savings amount"], answer: 1 },
    { q: "SIP (Systematic Investment Plan) refers to...", options: ["A special savings account scheme", "Regular, fixed-amount investing in mutual funds at set intervals", "A government bond instrument", "A fixed deposit scheme"], answer: 1 },
    { q: "The main advantage of separating savings from investments is...", options: ["Higher tax returns", "You can invest money you won't need urgently, allowing higher-risk, higher-return opportunities", "It is required by SEBI", "Banks offer better interest rates"], answer: 1 },
    { q: "Which is generally the highest risk on the savings-to-investing spectrum?", options: ["Savings account", "Fixed deposit", "Government bonds", "Equity mutual funds"], answer: 3 },
    { q: "The goal of maintaining a liquid emergency buffer BEFORE investing more is...", options: ["To follow bank regulations", "To avoid being forced to sell investments at a loss during an emergency", "To maximise tax savings", "To earn higher returns on savings"], answer: 1 },
    { q: "Which term best describes putting all savings in equity during a market peak?", options: ["Conservative", "Prudent", "High concentration risk — no liquid buffer", "The optimal strategy"], answer: 2 },
  ],
  18: [
    { q: "Inflation is best defined as...", options: ["A decrease in government spending", "A general increase in prices over time, reducing purchasing power", "An increase in stock prices", "A rise in interest rates"], answer: 1 },
    { q: "If inflation is 6% per year, ₹1,00,000 today will cost approximately how much in 12 years?", options: ["₹1,00,000", "₹1,60,000", "₹2,01,000", "₹3,00,000"], answer: 2 },
    { q: "Real return is calculated as...", options: ["Nominal return plus inflation", "Nominal return minus inflation rate", "Inflation rate divided by nominal return", "Investment return × tax rate"], answer: 1 },
    { q: "If an investment returns 8% and inflation is 6%, the real return is...", options: ["14%", "8%", "6%", "approximately 2%"], answer: 3 },
    { q: "Inflation has the greatest long-term damaging impact on...", options: ["Short-term savings", "Fixed-income instruments held for decades in low-yield accounts", "Equity investments", "Gold prices in the short run"], answer: 1 },
    { q: "The Inflation Calculator helps you see...", options: ["Your tax liability", "How much today's rupee will be worth in future terms", "Your investment returns", "Credit score trends"], answer: 1 },
    { q: "Which asset class has historically provided the best inflation-beating returns over long periods?", options: ["Bank savings accounts", "Fixed deposits", "Equity (stocks and equity mutual funds)", "Gold jewellery"], answer: 2 },
    { q: "Consumer Price Index (CPI) is used to measure...", options: ["Stock market performance", "The inflation rate based on a basket of consumer goods and services", "GDP growth", "Corporate profit margins"], answer: 1 },
    { q: "Retirement planning must account for inflation because...", options: ["Inflation does not affect retirees", "Future expenses will be higher in nominal terms", "Inflation always stops at retirement", "Government covers retiree inflation losses"], answer: 1 },
    { q: "Which statement about inflation is TRUE?", options: ["A moderate amount of inflation (2–4%) is generally considered healthy for an economy", "Inflation is always harmful to all people equally", "Inflation only affects luxury goods", "Inflation has no impact on savings and fixed deposits"], answer: 0 },
  ],
  19: [
    { q: "Compound interest means earning interest on...", options: ["Only the original principal", "Both the principal and previously earned interest", "Only the interest, not principal", "The bank's total deposits"], answer: 1 },
    { q: "The Rule of 72 states that money doubles in approximately 72 divided by...", options: ["The number of years", "The annual interest rate", "The inflation rate", "The tax rate"], answer: 1 },
    { q: "At 8% annual return, money doubles in approximately...", options: ["8 years", "9 years", "10 years", "12 years"], answer: 1 },
    { q: "Which frequency of compounding gives the highest effective annual return?", options: ["Annual", "Quarterly", "Monthly", "Daily"], answer: 3 },
    { q: "₹1,00,000 invested at 10% per annum for 20 years (compounded annually) grows to approximately...", options: ["₹2,00,000", "₹3,00,000", "₹6,72,000", "₹10,00,000"], answer: 2 },
    { q: "The 'time' component of compounding is crucial because...", options: ["More time means more principal invested", "Compounding grows exponentially — earlier investing produces disproportionately larger results", "Time reduces inflation impact", "Banks pay higher rates for longer deposits"], answer: 1 },
    { q: "Starting investing at 25 vs. 35 for retirement at 60 means...", options: ["Only 10 more years of returns — small difference", "Roughly double the corpus at retirement due to compounding over extra years", "No significant difference in final corpus", "The 35-year-old has a bigger advantage"], answer: 1 },
    { q: "Simple interest on ₹1,00,000 at 10% for 3 years = ₹30,000. Compound interest over the same period is...", options: ["Exactly ₹30,000", "Less than ₹30,000", "More than ₹30,000", "₹10,000"], answer: 2 },
    { q: "The biggest enemy of compound growth in long-term investments is...", options: ["Starting early", "Making consistent contributions", "Frequently interrupting the investment by withdrawing", "Market volatility itself"], answer: 2 },
    { q: "The investment growth calculator shows projections that are...", options: ["Guaranteed by SEBI", "Labelled projections — not promises; actual outcomes will vary", "Based on past performance as a future guarantee", "Fixed by the government"], answer: 1 },
  ],
  20: [
    { q: "A mutual fund is...", options: ["A government savings scheme", "A pooled investment vehicle managed by a professional fund manager", "A fixed deposit with monthly interest", "A direct stock purchase scheme"], answer: 1 },
    { q: "SIP works by...", options: ["Investing a lump sum once a year", "Automatically investing a fixed amount at regular intervals (e.g., monthly)", "Switching between funds manually", "Tracking NAV daily and buying at lows"], answer: 1 },
    { q: "NAV stands for...", options: ["Net Annual Value", "National Asset Value", "Net Asset Value — the per-unit price of a mutual fund", "Normal Allocation Value"], answer: 2 },
    { q: "Rupee Cost Averaging in SIPs means...", options: ["You always buy at the same price", "You automatically buy more units when prices are low and fewer when high", "You only invest when markets are rising", "You eliminate market risk entirely"], answer: 1 },
    { q: "Equity mutual funds primarily invest in...", options: ["Government bonds", "Fixed deposits", "Stocks of companies", "Real estate"], answer: 2 },
    { q: "Debt mutual funds primarily invest in...", options: ["Stocks and equities", "Fixed income instruments like bonds and government securities", "Real estate", "Commodities"], answer: 1 },
    { q: "An ELSS fund has a mandatory lock-in period of...", options: ["1 year", "3 years", "5 years", "No lock-in"], answer: 1 },
    { q: "Diversification across asset classes helps by...", options: ["Maximising returns in all market conditions", "Reducing overall portfolio risk by spreading exposure", "Ensuring zero risk in all market conditions", "Eliminating the need for equity"], answer: 1 },
    { q: "Which is typically the highest-risk asset class for retail investors?", options: ["Liquid debt funds", "Government securities", "Small-cap equity funds", "Fixed deposits"], answer: 2 },
    { q: "SIP projections in Freedom Planner are...", options: ["Guaranteed by SEBI", "Labelled assumptions — not guaranteed returns", "Based on past performance as a future guarantee", "Fixed by the government"], answer: 1 },
  ],
  21: [
    { q: "A SMART financial goal is...", options: ["Specific, Measurable, Achievable, Relevant, Time-bound", "Simple, Monthly, Annual, Realistic, Tracked", "Small, Managed, Achievable, Random, Timed", "Set, Modified, Approved, Recurring, Tagged"], answer: 0 },
    { q: "Which of these is a well-defined financial goal?", options: ["Save more money", "Accumulate ₹5,00,000 for a car down payment in 3 years", "Get rich eventually", "Be debt free someday"], answer: 1 },
    { q: "Goal-based investing means...", options: ["Picking stocks based on company goals", "Matching investments to specific financial objectives with timelines", "Following your employer's financial advice", "Investing based on market conditions only"], answer: 1 },
    { q: "A goal should be 'funded from real surplus' to ensure...", options: ["The bank approves it", "You are not taking on debt to fund aspirations beyond your means", "The government subsidises it", "Returns are guaranteed"], answer: 1 },
    { q: "Which is NOT a characteristic of a good financial goal?", options: ["Has a specific target amount", "Has a clear deadline", "Depends on winning the lottery to fund it", "Is linked to your actual income and savings"], answer: 2 },
    { q: "Prioritising goals is important when...", options: ["You have unlimited resources", "Multiple goals compete for limited monthly surplus", "You have only one goal", "Returns are very high"], answer: 1 },
    { q: "Emergency fund before investment goals is recommended because...", options: ["Investment goals have no urgency", "An emergency can force you to sell investments at a loss without a buffer", "Banks require it", "Government mandates it"], answer: 1 },
    { q: "Reviewing goals periodically is important because...", options: ["Goals never change once set", "Income, expenses, and life circumstances change over time", "Inflation never applies to goals", "Financial advisors require annual reviews by law"], answer: 1 },
    { q: "Which goal is most appropriate to fund with equity investments?", options: ["Emergency fund", "Next month's rent", "A vacation in 3 months", "Retirement corpus in 25 years"], answer: 3 },
    { q: "The Goal Planner allows you to...", options: ["Buy stocks directly", "Create funded financial goals linked to your real surplus", "File tax returns", "Access credit card details"], answer: 1 },
  ],
  22: [
    { q: "Short-term financial goals generally have a time horizon of...", options: ["Under 3 years", "5–10 years", "15–20 years", "Over 25 years"], answer: 0 },
    { q: "Medium-term financial goals generally have a time horizon of...", options: ["Under 1 year", "3–7 years", "10–15 years", "Over 20 years"], answer: 1 },
    { q: "Long-term financial goals generally have a time horizon of...", options: ["Under 1 year", "2–4 years", "5–8 years", "10+ years"], answer: 3 },
    { q: "Which investment vehicle is most appropriate for a short-term goal (under 2 years)?", options: ["Small-cap equity fund", "Liquid mutual fund or short-term debt fund", "Direct equity stocks", "Real estate"], answer: 1 },
    { q: "Which investment vehicle is most appropriate for a long-term retirement goal (20+ years)?", options: ["Savings account", "Liquid fund", "Equity-oriented mutual funds", "Government savings bonds (3-year)"], answer: 2 },
    { q: "Placing goals on a timeline helps you...", options: ["Eliminate all risk", "Choose the right investment vehicle and allocate surplus appropriately", "Get government subsidies", "Improve your credit score"], answer: 1 },
    { q: "A 'house purchase in 7 years' goal is best classified as...", options: ["Short-term", "Medium-term", "Long-term", "Impossible to classify"], answer: 1 },
    { q: "Using equity funds for a goal that is only 1 year away is risky because...", options: ["Equity is not allowed for short-term use by SEBI", "Markets can be down significantly in the short term — you may sell at a loss", "Equity returns are too high", "Banks do not offer equity products"], answer: 1 },
    { q: "When two goals compete for the same surplus, the recommended approach is...", options: ["Fund the larger goal first always", "Prioritize based on urgency, timeline, and life impact", "Fund both equally regardless of type", "Ignore the less important one entirely"], answer: 1 },
    { q: "The Goals feature in Freedom Planner helps you...", options: ["Invest directly in stocks", "Visualize and track multiple goals simultaneously", "Calculate your tax returns", "Get a loan approval"], answer: 1 },
  ],
  23: [
    { q: "A goal projection calculator helps you determine...", options: ["Your credit score", "How much you need to save monthly to reach a target amount in a given time", "Your tax liability", "Insurance coverage requirements"], answer: 1 },
    { q: "For a large expense goal (e.g., wedding in 5 years), the recommended approach is...", options: ["Take a loan when the time comes", "Start saving/investing now toward the target amount", "Wait until 6 months before and rush", "Use credit cards for the full amount"], answer: 1 },
    { q: "Sizing a house down payment target requires knowing...", options: ["Only the interest rate", "The property price and the LTV ratio the lender expects", "Your shoe size", "Your employer's annual revenue"], answer: 1 },
    { q: "Education cost goals need to account for inflation because...", options: ["Education fees never increase", "Education costs often rise faster than general CPI inflation", "Inflation does not apply to education", "Loans cover all education costs automatically"], answer: 1 },
    { q: "Starting early for a large expense goal helps because...", options: ["Banks give better rates to early planners", "You need to save a smaller amount per month to reach the same future target", "The expense becomes smaller over time", "There is no advantage to starting early"], answer: 1 },
    { q: "A 'sinking fund' is a savings strategy where you...", options: ["Invest in stocks for quick gains", "Save a small, fixed amount each month toward a known future lump-sum expense", "Take a loan and pay it off in one go", "Use credit cards with cashback"], answer: 1 },
    { q: "If a goal requires ₹10,00,000 in 5 years at 8% per annum, monthly SIP needed is approximately...", options: ["₹16,000", "₹13,600", "₹8,000", "₹5,000"], answer: 1 },
    { q: "Which large expense typically requires the most advance planning?", options: ["Monthly grocery bill", "Annual vacation", "Child's higher education in 15 years", "Utility bill this month"], answer: 2 },
    { q: "Inflation-adjusting your large expense goals means...", options: ["Subtracting inflation from the target", "Increasing the target amount to account for rising costs over time", "Ignoring inflation for 'fixed' costs", "Using nominal returns only without adjustment"], answer: 1 },
    { q: "The Goal Projection Calculator helps you...", options: ["Calculate EMI on loans", "Model required monthly savings for a large future expense", "Track daily expenses", "Apply for government scholarships"], answer: 1 },
  ],
  24: [
    { q: "The primary reason retirement planning should start early is...", options: ["Government requires it at age 25", "Compound interest over decades dramatically increases the retirement corpus", "Retirement benefits decrease after age 40", "Tax laws mandate early planning"], answer: 1 },
    { q: "The Freedom Calculator shows you...", options: ["Stock returns", "Years left vs. corpus gap to your retirement target", "Credit card limits", "Emergency fund status"], answer: 1 },
    { q: "'Years to retirement' directly affects how much you need to save monthly because...", options: ["It has no effect on calculations", "More years = lower required monthly savings for the same target", "More years = higher required monthly savings", "It determines the interest rate your bank pays"], answer: 1 },
    { q: "A 'corpus gap' in retirement planning means...", options: ["You have saved too much", "The difference between your required retirement corpus and currently projected corpus", "Your bank account is overdrawn", "Your assets exceed your liabilities"], answer: 1 },
    { q: "Delaying retirement savings by 10 years can result in...", options: ["Saving 10 times more money in those 10 years to compensate", "Needing to save significantly more per month OR accepting a smaller corpus", "No change as long as returns are good", "A corpus that is still adequate with any savings amount"], answer: 1 },
    { q: "Which government-backed long-term savings scheme is designed for retirement in India?", options: ["PPF (Public Provident Fund) — 15-year tenure with extensions", "Short-term FD", "Regular savings account", "Current account"], answer: 0 },
    { q: "Starting retirement savings at 25 vs. 35 means...", options: ["The same monthly amount needed", "The 35-year-old needs to save more per month to reach the same corpus", "The 25-year-old needs more time", "No significant difference if returns are high"], answer: 1 },
    { q: "Which of these is a key input when calculating required retirement savings?", options: ["Your favourite food preference", "Current expenses, expected retirement age, and expected lifespan", "Number of credit cards", "Your employer's company size"], answer: 1 },
    { q: "Assuming 8% annual returns, ₹5,000/month from age 25 to 60 grows approximately to...", options: ["₹90 lakh", "₹1.5 crore", "₹80 lakh", "₹2.5 crore"], answer: 1 },
    { q: "The power of starting retirement savings early is best described by...", options: ["Linear growth — 10 more years = 10 more years of returns", "Exponential compounding that makes early years disproportionately more valuable", "Guaranteed returns from the government", "Fixed annual salary increments"], answer: 1 },
  ],
  25: [
    { q: "Retirement inflation refers to...", options: ["Inflation only during working years", "The rise in cost of living that continues through retirement, eroding purchasing power", "A special inflation rate set by the government for retirees", "Deflation during retirement"], answer: 1 },
    { q: "If you plan to spend ₹50,000/month (today's money) 25 years from now at 6% inflation, you'll need approximately...", options: ["₹50,000/month", "₹1,00,000/month", "₹2,15,000/month", "₹3,50,000/month"], answer: 2 },
    { q: "Keeping inflation as an explicit assumption in retirement planning means...", options: ["Ignoring it since it's too uncertain to model", "Modelling that your expenses in retirement will be higher in nominal terms", "Assuming inflation will be zero post-retirement", "Using only the past 1-year inflation data"], answer: 1 },
    { q: "Healthcare inflation during retirement is typically...", options: ["Lower than general CPI inflation", "Higher than general CPI inflation — medical costs tend to rise faster", "Exactly equal to CPI inflation", "Zero due to government healthcare schemes"], answer: 1 },
    { q: "A retirement plan using a 3% inflation assumption when actual inflation is 7% will...", options: ["Be accurate", "Significantly underestimate how much corpus you actually need", "Overestimate the need — making you save too much", "Be unaffected by the difference"], answer: 1 },
    { q: "Inflation in retirement is particularly dangerous because...", options: ["Retirees get salary increments to match", "Retirees rely on a fixed corpus that must last many decades without earned income growth", "Banks protect retirees from inflation impact", "Inflation stops after age 60"], answer: 1 },
    { q: "Which investment type best protects against inflation during a long retirement?", options: ["Keeping all money in a savings account", "A mix that includes equity which can grow above inflation", "Short-term fixed deposits only", "Physical cash kept at home"], answer: 1 },
    { q: "Sequence of returns risk in retirement means...", options: ["You always earn returns in a predictable sequence", "A market downturn early in retirement can severely deplete your corpus more than a downturn later", "Returns are always sequential and predictable", "Sequence only affects tax calculation"], answer: 1 },
    { q: "The safest assumption for retirement inflation planning is to use...", options: ["0% inflation — be optimistic", "A rate at or slightly above historical CPI to build in a safety margin", "Exactly last year's published inflation rate", "The same rate as stock market returns"], answer: 1 },
    { q: "Reviewing retirement inflation assumptions every few years is important because...", options: ["It is a legal requirement", "Actual inflation can differ from your assumptions, requiring plan adjustments", "The corpus target never actually changes", "Banks require annual reviews"], answer: 1 },
  ],
  26: [
    { q: "The '25× rule' for retirement corpus states that you need...", options: ["25 months of expenses saved", "25 times your annual retirement expenses as corpus", "25% of your salary saved", "₹25 lakh minimum for everyone"], answer: 1 },
    { q: "The 25× rule is based on the '4% safe withdrawal rate', meaning...", options: ["You spend 4% of income before retirement", "Withdrawing 4% of corpus annually can theoretically sustain it for 30+ years", "You invest 4% of salary", "4% is the tax rate on all withdrawals"], answer: 1 },
    { q: "If you want ₹80,000/month in retirement, your corpus target using 25× rule is approximately...", options: ["₹80,000", "₹24 lakh", "₹2.4 crore", "₹80 lakh"], answer: 2 },
    { q: "Longevity risk in retirement means...", options: ["Risk of dying too soon", "The risk of outliving your retirement corpus", "Risk of market returns being too high", "Short life expectancy reducing your saving time"], answer: 1 },
    { q: "Which factor would INCREASE your required retirement corpus?", options: ["Planning to retire at a later age", "Having smaller monthly expenses", "Having a higher expected lifespan", "Receiving a substantial government pension"], answer: 2 },
    { q: "Setting a corpus target from 'expenses × multiple' means...", options: ["Your fixed deposit interest rate", "Multiplying monthly/annual expenses by a withdrawal-rate-derived multiple (e.g., 25×)", "Dividing your salary by total expenses", "Multiplying your age by your savings rate"], answer: 1 },
    { q: "The 4% safe withdrawal rate was primarily derived from...", options: ["Indian government research for Indian markets", "Historical US market return studies (the Trinity Study)", "RBI guidelines", "Insurance company research on longevity"], answer: 1 },
    { q: "The corpus calculation changes with pension or fixed income because...", options: ["It always doubles the corpus needed", "Fixed income reduces the monthly gap that investments need to cover", "Pension makes corpus planning irrelevant", "Banks require pension accounts for planning"], answer: 1 },
    { q: "Reviewing your retirement corpus target every 2–3 years is important because...", options: ["It is a legal requirement in India", "Your expenses, income, and timeline all change over time", "The corpus target never actually changes", "Banks require annual reviews"], answer: 1 },
    { q: "The Retirement Corpus Planner helps you...", options: ["Apply for a pension", "Set a corpus target based on expected monthly expenses and lifespan", "Track stock performance", "Manage credit card balances"], answer: 1 },
  ],
  27: [
    { q: "FIRE stands for...", options: ["Financial Independence — Reaching Earnings", "Financial Independence, Retire Early", "Financially Investing for Real Earnings", "Future Income and Real Estate"], answer: 1 },
    { q: "Lean FIRE involves...", options: ["Retiring with a very large corpus", "Retiring early with a minimal, highly frugal lifestyle", "Working part-time in retirement", "Investing only in real estate"], answer: 1 },
    { q: "Fat FIRE is characterised by...", options: ["Retiring with a corpus that supports a high-spending lifestyle", "Extreme frugality in retirement", "Early retirement with near-zero expenses", "Retiring only from a specific stressful job"], answer: 0 },
    { q: "Coast FIRE means...", options: ["Retiring at a coastal location", "Saving enough early that compounding grows the corpus to target — covering only current expenses by working", "Investing only in coastal real estate", "A variant that requires no savings at all"], answer: 1 },
    { q: "Barista FIRE refers to...", options: ["Working as a barista coffee professional", "Semi-retirement — working part-time to cover basic expenses while investments grow", "Investing all savings in coffee companies", "A specific mutual fund category"], answer: 1 },
    { q: "FIRE is presented in Freedom Planner as...", options: ["The only correct financial life path", "One of several valid life paths — not a universal prescription for everyone", "A government-endorsed scheme", "Mandatory for all users of the app"], answer: 1 },
    { q: "The key metric in FIRE planning is your...", options: ["Net worth alone", "Savings rate — the higher it is, the faster you reach FIRE", "Number of credit cards", "CIBIL score"], answer: 1 },
    { q: "Financial independence (FI) and early retirement (RE) in FIRE are...", options: ["Always achieved together at the same time", "Separate concepts — you can reach FI and choose whether or not to retire", "Impossible to achieve separately", "Exactly the same concept"], answer: 1 },
    { q: "Which FIRE variant suits someone who wants to retire early but maintain a high-spend lifestyle?", options: ["Lean FIRE", "Coast FIRE", "Fat FIRE", "Barista FIRE"], answer: 2 },
    { q: "The Freedom Calculator Path Toggle allows you to...", options: ["Buy different types of insurance products", "Explore different FIRE paths and see their implications on your numbers", "Apply for a government pension", "Calculate tax under different regimes"], answer: 1 },
  ],
  28: [
    { q: "Your FIRE number is primarily determined by...", options: ["Your current salary", "Your expected annual expenses in retirement × the corpus multiple (e.g., 25)", "Your exact age", "Your CIBIL score"], answer: 1 },
    { q: "If your annual retirement expenses are ₹8,00,000, your FIRE number using the 25× rule is...", options: ["₹8,00,000", "₹80,00,000", "₹2,00,00,000", "₹1,00,00,000"], answer: 2 },
    { q: "Increasing your savings rate accelerates your FIRE date because...", options: ["Higher savings rate has no effect on FIRE date", "You simultaneously build corpus faster AND reduce future expense needs", "Banks offer better rates for high savers", "Government provides FIRE subsidies"], answer: 1 },
    { q: "Expected portfolio return assumptions for FIRE should be...", options: ["Highly optimistic at 30%+ to motivate saving", "Conservative and realistic to account for uncertainty and volatility", "Set at zero — assume no return", "Fixed by the government"], answer: 1 },
    { q: "A higher withdrawal rate (e.g., 5% vs. 4%) in FIRE planning...", options: ["Increases your required corpus", "Decreases your required corpus but increases the risk of eventually depleting it", "Has no effect on corpus size", "Reduces your required savings rate"], answer: 1 },
    { q: "Healthcare costs in early retirement are an important consideration because...", options: ["Healthcare is free for FIRE practitioners", "You need to fund your own health insurance without an employer — potentially for decades", "Insurance is banned during FIRE", "Healthcare costs decrease at early retirement age"], answer: 1 },
    { q: "Running a FIRE calculator with 'labelled assumptions' means...", options: ["The results are guaranteed by the government", "Results are projections based on stated assumptions — actual outcomes will vary", "The assumptions are legally binding", "The app files taxes for you"], answer: 1 },
    { q: "Comparing FIRE age against current investments shows you...", options: ["Your credit score trajectory", "The gap between your current trajectory and desired FIRE age", "Your insurance coverage needs", "Tax savings potential"], answer: 1 },
    { q: "The FIRE number should be adjusted for...", options: ["Your employer's preference", "Inflation, expected portfolio returns, and your specific lifestyle expenses", "Your neighbour's FIRE number", "Stock market conditions on the day of calculation"], answer: 1 },
    { q: "The FIRE Calculator in Freedom Planner estimates...", options: ["A guaranteed FIRE date", "Your projected FIRE age vs. current investment trajectory", "Your credit score trajectory", "Insurance coverage gaps"], answer: 1 },
  ],
  29: [
    { q: "The financial-freedom rate (savings rate driving FI) is best defined as...", options: ["Your salary increment percentage", "The percentage of income saved and invested toward financial independence", "Your bank's interest rate on savings", "The percentage of expenses already covered by passive income"], answer: 3 },
    { q: "The Financial Freedom Simulator models the impact of changing...", options: ["Only your salary", "Savings rate, income, debt levels, and SIP contributions simultaneously", "Only your EMI", "Your job title"], answer: 1 },
    { q: "Increasing savings rate from 20% to 30% has the LARGEST long-term impact by...", options: ["Having no significant effect", "Both growing the corpus faster AND reducing the future lifestyle cost baseline", "Increasing your tax liability only", "Reducing investment returns due to smaller amounts invested"], answer: 1 },
    { q: "Which lever has the FASTEST potential impact on your freedom rate?", options: ["Reducing expenses — immediate effect on surplus", "Starting a new SIP — effect only visible after decades", "Taking a new loan for investment", "Closing a savings account"], answer: 0 },
    { q: "Increasing income without increasing lifestyle expenses is powerful because...", options: ["Banks reward this behaviour", "The entire income increment can become additional savings and investment", "It reduces taxes automatically", "Government provides matching savings contributions"], answer: 1 },
    { q: "Debt paydown accelerates your freedom rate because...", options: ["Debt has no effect on freedom rate", "Each debt eliminated permanently frees up the monthly EMI as investable surplus", "Paying debt reduces your credit score", "Banks automatically lower your interest rate as reward"], answer: 1 },
    { q: "The 'savings rate' used in FIRE calculations is savings as a percentage of...", options: ["Net worth", "Gross or take-home income", "Total debt outstanding", "Annual expense amount"], answer: 1 },
    { q: "A 50% savings rate means reaching financial independence in roughly...", options: ["50 years", "10–15 years (depending on return assumptions)", "2 years", "30 years regardless of returns"], answer: 1 },
    { q: "Which of these does NOT directly improve your financial-freedom rate?", options: ["Increasing income", "Reducing unnecessary expenses", "Investing freed-up EMI savings after debt payoff", "Changing your LinkedIn profile title"], answer: 3 },
    { q: "The interconnected levers of income, expenses, debt, and SIPs matter because...", options: ["Each operates in complete isolation", "Improving all simultaneously compounds the positive effect on your freedom timeline", "Only SIPs matter for FIRE success", "Government monitors all four"], answer: 1 },
  ],
  30: [
    { q: "A financial-freedom roadmap is best described as...", options: ["A map of financial institutions near you", "A personalised written plan with prioritised actions and a timeline toward independence", "A document your bank creates for you", "A legal requirement for high earners"], answer: 1 },
    { q: "Which tools in Freedom Planner are referenced in building a personal financial roadmap?", options: ["Social media and email", "Advisor, goals, and forecast combined", "Only the FIRE calculator", "Credit card statements alone"], answer: 1 },
    { q: "The AI Advisor in Freedom Planner provides...", options: ["Guaranteed investment picks", "Personalised insights based on your specific financial profile", "Generic magazine-style advice", "Tax filing services"], answer: 1 },
    { q: "A financial roadmap should prioritise actions in which order?", options: ["Invest first, then handle emergencies and debt later", "Establish emergency fund → eliminate high-cost debt → invest for long-term goals", "Take loans first, invest later", "Start with luxury goals, then handle basics"], answer: 1 },
    { q: "Reviewing and updating your financial roadmap is recommended...", options: ["Only at retirement", "Periodically — especially when major life events occur (job change, marriage, children)", "Every single day", "Only when your net worth doubles"], answer: 1 },
    { q: "A financial projection in Freedom Planner shows...", options: ["Guaranteed future wealth accumulation", "A model of how your finances may evolve given current inputs and assumptions", "Your credit score history", "Bank account transaction history"], answer: 1 },
    { q: "Celebrating financial milestones is recommended because...", options: ["Milestone celebrations are mandatory by SEBI", "Positive reinforcement builds habits and motivation to continue the journey", "Celebrating productively spends your savings", "Banks provide rewards for reaching milestones"], answer: 1 },
    { q: "Which of these is NOT a reasonable action item in a financial roadmap?", options: ["Build emergency fund to 6 months within 18 months", "Increase SIP by ₹2,000/month after each salary increment", "Stop working entirely in 3 months with zero savings", "Refinance home loan if rate drop exceeds 0.5%"], answer: 2 },
    { q: "The difference between a financial plan and a roadmap is that a roadmap...", options: ["Has no difference from a plan", "Includes specific ordered actions and milestones — not just the end goal", "Is only for businesses", "Is created by the government"], answer: 1 },
    { q: "The Freedom Planner learning journey ends with Lesson 30 because...", options: ["There is nothing more to learn about finance", "It closes the loop — you leave with a personal plan grounded in your own real numbers", "30 is a regulatory requirement", "Users are only allowed 30 lessons by law"], answer: 1 },
  ],
};

/* ── Course structure ─────────────────────────────────────────────────────── */

export const COURSE_LEVELS: CourseLevel[] = [
  {
    id: 1,
    title: "Foundation",
    subtitle: "Level 1",
    description: "Take control of your money. Understand your current situation and build a solid base: cash flow, budget, emergency fund, and your first debt plan.",
    accentClass: "from-emerald-500 to-teal-500",
    modules: [
      {
        id: "f1",
        title: "Module 1 — Money Mindset",
        lessons: [
          { id: 1, title: "What does financial freedom mean?", tool: "Financial Freedom Score", action: "Define a freedom goal", questions: Q[1] },
          { id: 2, title: "Understand your money", tool: "Financial snapshot", action: "Complete the financial profile", questions: Q[2] },
          { id: 3, title: "Understand your cash flow", tool: "Cash-flow analyzer", action: "Identify monthly surplus or deficit", questions: Q[3] },
        ],
      },
      {
        id: "f2",
        title: "Module 2 — Budgeting",
        lessons: [
          { id: 4, title: "How budgeting actually works (50/30/20, zero-based, needs vs wants)", tool: "Budget planner", action: "Create a monthly budget", questions: Q[4] },
          { id: 5, title: "Find where your money is going", tool: "Expense analyzer", action: "Pick three expenses to reduce", questions: Q[5] },
        ],
      },
      {
        id: "f3",
        title: "Module 3 — Emergency Fund",
        lessons: [
          { id: 6, title: "What is an emergency fund?", tool: "Emergency fund calculator", action: "Set a target (e.g., 6 months of essentials)", questions: Q[6] },
          { id: 7, title: "Build your emergency fund", tool: "Emergency fund goal", action: "Create the goal and start funding it", questions: Q[7] },
        ],
      },
      {
        id: "f4",
        title: "Module 4 — Debt",
        lessons: [
          { id: 8, title: "Understanding loans (principal, EMI, tenure, amortization)", tool: "Loan analyzer", action: "See total interest on current loans", questions: Q[8] },
          { id: 9, title: "Good debt vs bad debt", tool: "Debt health analyzer", action: "Read debt-to-income against the household", questions: Q[9] },
          { id: 10, title: "Your first debt-freedom plan (avalanche, snowball, prepay)", tool: "Debt freedom planner", action: "Choose a repayment strategy", questions: Q[10] },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Growth",
    subtitle: "Level 2",
    description: "Protect the household and put surplus to work. Credit, insurance, investing basics, inflation, and SIPs — all mapped to your real numbers.",
    accentClass: "from-amber-500 to-orange-500",
    modules: [
      {
        id: "g1",
        title: "Module 1 — Credit & Debt Optimization",
        lessons: [
          { id: 11, title: "Understanding credit scores", tool: "Debt health / loans", action: "See how utilisation and EMIs show up in the plan", questions: Q[11] },
          { id: 12, title: "How credit cards really work", tool: "Credit cards on Manage", action: "Review revolved balances vs pay-in-full", questions: Q[12] },
          { id: 13, title: "Reduce your interest burden", tool: "Loan optimizer, prepayment, consolidation calculators", action: "Model a prepay vs continue-SIP trade-off", questions: Q[13] },
        ],
      },
      {
        id: "g2",
        title: "Module 2 — Insurance",
        lessons: [
          { id: 14, title: "Why insurance is financial protection", tool: "Insurance coverage checker", action: "Compare current cover vs estimated need", questions: Q[14] },
          { id: 15, title: "Health insurance", tool: "Family protection calculator", action: "Note gaps — no product push without disclosure", questions: Q[15] },
          { id: 16, title: "Life and term insurance", tool: "Coverage checker", action: "Same comparison for term cover", questions: Q[16] },
        ],
      },
      {
        id: "g3",
        title: "Module 3 — Investing",
        lessons: [
          { id: 17, title: "Saving vs investing", tool: "Investments + emergency fund", action: "Split liquid buffer from long-term SIPs", questions: Q[17] },
          { id: 18, title: "Understanding inflation", tool: "Inflation calculator", action: "See today's rupee vs retirement-year rupee", questions: Q[18] },
          { id: 19, title: "Compound interest", tool: "Investment growth / lumpsum", action: "Run a labelled assumption, not a promise", questions: Q[19] },
          { id: 20, title: "Mutual funds, SIP, and asset classes", tool: "SIP calculator", action: "Map existing SIPs; do not guarantee returns", questions: Q[20] },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Freedom",
    subtitle: "Level 3",
    description: "Build a written path to independence. Goals, retirement corpus, FIRE variants, freedom rate, and a personal roadmap grounded in your own numbers.",
    accentClass: "from-violet-500 to-purple-600",
    modules: [
      {
        id: "r1",
        title: "Module 1 — Financial Goals",
        lessons: [
          { id: 21, title: "How to set financial goals", tool: "Goal planner", action: "Write one funded goal from real surplus", questions: Q[21] },
          { id: 22, title: "Short-, medium-, and long-term goals", tool: "Goals", action: "Place existing goals on a timeline", questions: Q[22] },
          { id: 23, title: "Planning large expenses", tool: "Goal projection calculator", action: "Size a house / education / wedding target", questions: Q[23] },
        ],
      },
      {
        id: "r2",
        title: "Module 2 — Retirement",
        lessons: [
          { id: 24, title: "Why retirement planning starts early", tool: "Freedom calculator", action: "See years left vs corpus gap", questions: Q[24] },
          { id: 25, title: "Understanding retirement inflation", tool: "Profile inflation + retirement tools", action: "Keep inflation as an explicit assumption", questions: Q[25] },
          { id: 26, title: "How much do you need for retirement?", tool: "Retirement corpus planner", action: "Set a corpus target from expenses × multiple", questions: Q[26] },
        ],
      },
      {
        id: "r3",
        title: "Module 3 — FIRE",
        lessons: [
          { id: 27, title: "What is FIRE? (Lean, Regular, Fat, Coast)", tool: "Freedom calculator path toggle", action: "Pick a path without treating it as universal", questions: Q[27] },
          { id: 28, title: "Calculate your FIRE number", tool: "FIRE calculator", action: "See estimated FIRE age vs current investments", questions: Q[28] },
          { id: 29, title: "Increase your financial-freedom rate", tool: "Financial freedom simulator", action: "Model savings rate, income, debt, and SIPs", questions: Q[29] },
          { id: 30, title: "Create your financial-freedom roadmap", tool: "Advisor + goals + forecast", action: "Leave with priorities, actions, and a projection", questions: Q[30] },
        ],
      },
    ],
  },
];

/* ── Progress helpers ─────────────────────────────────────────────────────── */

export function loadProgress(): Set<number> {
  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEY);
    return new Set<number>(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set<number>();
  }
}

export function saveProgress(done: Set<number>): void {
  try {
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify([...done]));
  } catch {
    /* ignore */
  }
}

export function totalLessons(): number {
  return COURSE_LEVELS.reduce((a, l) => a + l.modules.reduce((b, m) => b + m.lessons.length, 0), 0);
}

export function levelLessons(level: CourseLevel): CourseLesson[] {
  return level.modules.flatMap((m) => m.lessons);
}
