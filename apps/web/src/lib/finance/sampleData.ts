import { EMERGENCY_FUND_GOAL_ID, FinanceData, Goal } from "@/types/finance";

const uid = () => Math.random().toString(36).slice(2, 10);

export function createEmergencyFundGoal(currentSaved = 0, targetAmount = 0): Goal {
  const targetDate = new Date();
  targetDate.setFullYear(targetDate.getFullYear() + 1);
  return {
    id: EMERGENCY_FUND_GOAL_ID,
    name: "Emergency Fund",
    type: "Emergency Fund",
    targetAmount,
    currentSaved,
    targetDate: targetDate.toISOString().slice(0, 10),
    priority: "High",
  };
}

export const sampleData: FinanceData = {
  profile: {
    name: "Arjun Mehta",
    age: 32,
    retirementAge: 55,
    currency: "₹",
    inflationRate: 6,
    emergencyFund: 480000,
    dependents: 2,
    employmentType: "Salaried",
    monthlyEssentialExpenses: 0,
    liquidAssets: 150000,
    emergencyMonthlyContribution: 25000,
    dailyBudget: 45000,
  },
  incomes: [
    { id: uid(), name: "Tech Lead Salary", type: "Salary", monthlyAmount: 185000, growthRate: 8, startDate: "2019-04-01" },
    { id: uid(), name: "Side Consulting", type: "Freelancing Income", monthlyAmount: 35000, growthRate: 12, startDate: "2021-06-01" },
    { id: uid(), name: "Apartment Rent", type: "Rental Income", monthlyAmount: 22000, growthRate: 5, startDate: "2020-01-01" },
    { id: uid(), name: "Stock Dividends", type: "Dividend Income", monthlyAmount: 6000, growthRate: 10, startDate: "2022-03-01" },
    { id: uid(), name: "FD Interest", type: "Interest Income", monthlyAmount: 4500, growthRate: 4, startDate: "2021-01-01" },
  ],
  expenses: [
    { id: uid(), name: "Electricity", category: "Electricity Bill", amount: 3200, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Water", category: "Water Bill", amount: 600, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Broadband", category: "Internet", amount: 1200, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Mobile Plans", category: "Mobile", amount: 1100, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Groceries", category: "Groceries", amount: 18000, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Petrol", category: "Fuel", amount: 6500, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Cab & Metro", category: "Transportation", amount: 3000, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "LIC Premium", category: "LIC Premium", amount: 5500, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Kids School", category: "School Fees", amount: 22000, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "OTT & Subscriptions", category: "Entertainment", amount: 1500, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Restaurants", category: "Dining Out", amount: 9000, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Medical & Pharmacy", category: "Medical", amount: 3500, recurring: true, date: "2024-01-01" },
    { id: uid(), name: "Goa Trip", category: "Travel", amount: 85000, recurring: false, date: "2024-05-10" },
  ],
  loans: [
    { id: uid(), name: "HDFC Home Loan", type: "Home Loan", outstanding: 4200000, interestRate: 8.5, emi: 42000, remainingTenure: 168, emiDay: 10, prepaymentAllowed: true },
    { id: uid(), name: "Car Loan", type: "Vehicle Loan", outstanding: 480000, interestRate: 9.2, emi: 14500, remainingTenure: 38, emiDay: 5, prepaymentAllowed: true },
    { id: uid(), name: "Personal Loan", type: "Personal Loan", outstanding: 220000, interestRate: 13.5, emi: 11200, remainingTenure: 22, emiDay: 5, prepaymentAllowed: true },
  ],
  investments: [
    { id: uid(), name: "Index Mutual Funds", type: "Mutual Funds", currentValue: 1850000, monthlySip: 35000, expectedReturn: 12, horizon: 20 },
    { id: uid(), name: "Direct Equity", type: "Stocks", currentValue: 920000, monthlySip: 15000, expectedReturn: 14, horizon: 18 },
    { id: uid(), name: "PPF Account", type: "PPF", currentValue: 680000, monthlySip: 12500, expectedReturn: 7.1, horizon: 15 },
    { id: uid(), name: "EPF", type: "EPF", currentValue: 1450000, monthlySip: 21000, expectedReturn: 8.1, horizon: 23 },
    { id: uid(), name: "NPS Tier 1", type: "NPS", currentValue: 320000, monthlySip: 6000, expectedReturn: 10, horizon: 23 },
    { id: uid(), name: "Sovereign Gold", type: "Gold", currentValue: 380000, monthlySip: 5000, expectedReturn: 8, horizon: 10 },
    { id: uid(), name: "Crypto Basket", type: "Crypto", currentValue: 180000, monthlySip: 4000, expectedReturn: 18, horizon: 10 },
    { id: uid(), name: "Liquid FD", type: "Fixed Deposits", currentValue: 600000, monthlySip: 0, expectedReturn: 6.5, horizon: 3 },
  ],
  insurances: [
    { id: uid(), name: "Term Plan", type: "Term Insurance", coverage: 15000000, annualPremium: 24000, expiryDate: "2050-03-31" },
    { id: uid(), name: "Family Floater", type: "Health Insurance", coverage: 1000000, annualPremium: 32000, expiryDate: "2025-11-30" },
    { id: uid(), name: "Car Insurance", type: "Car Insurance", coverage: 800000, annualPremium: 18000, expiryDate: "2025-08-15" },
  ],
  goals: [
    createEmergencyFundGoal(480000, 0),
    { id: uid(), name: "Retirement Corpus", type: "Retirement", targetAmount: 60000000, targetDate: "2049-01-01", priority: "High", currentSaved: 6380000 },
    { id: uid(), name: "Kids Higher Education", type: "Child Education", targetAmount: 8000000, targetDate: "2034-06-01", priority: "High", currentSaved: 1200000 },
    { id: uid(), name: "Dream Villa", type: "Dream Home", targetAmount: 12000000, targetDate: "2032-01-01", priority: "Medium", currentSaved: 1850000 },
    { id: uid(), name: "Europe Vacation", type: "International Vacation", targetAmount: 1200000, targetDate: "2027-12-01", priority: "Low", currentSaved: 280000 },
    { id: uid(), name: "Tesla Model Y", type: "Dream Car", targetAmount: 6000000, targetDate: "2029-01-01", priority: "Medium", currentSaved: 450000 },
  ],
  dailyExpenses: sampleDailyExpenses(),
};

function sampleDailyExpenses() {
  const out: FinanceData["dailyExpenses"] = [];
  const presets: { category: import("@/types/finance").DailyCategory; notes: string; min: number; max: number }[] = [
    { category: "Food", notes: "Lunch & snacks", min: 150, max: 700 },
    { category: "Fuel", notes: "Petrol", min: 500, max: 1500 },
    { category: "Shopping", notes: "Online order", min: 400, max: 3500 },
    { category: "Transport", notes: "Cab ride", min: 80, max: 450 },
    { category: "Bills", notes: "Recharge / utility", min: 200, max: 1200 },
    { category: "Entertainment", notes: "Movie / OTT", min: 150, max: 900 },
    { category: "Medical", notes: "Pharmacy", min: 120, max: 800 },
    { category: "Other", notes: "Misc", min: 100, max: 600 },
  ];
  const rnd = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) / 10) * 10;
  for (let day = 0; day < 30; day++) {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < count; j++) {
      const p = presets[Math.floor(Math.random() * presets.length)];
      const d = new Date();
      d.setDate(d.getDate() - day);
      d.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);
      out.push({ id: uid(), amount: rnd(p.min, p.max), category: p.category, notes: p.notes, date: d.toISOString() });
    }
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export const newId = uid;
