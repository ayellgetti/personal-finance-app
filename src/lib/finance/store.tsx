import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  FinanceData,
  Income,
  Expense,
  Loan,
  Investment,
  Insurance,
  Goal,
  Profile,
} from "@/types/finance";
import { sampleData, newId } from "./sampleData";

const STORAGE_KEY = "ffp-finance-data-v1";

type Collections = "incomes" | "expenses" | "loans" | "investments" | "insurances" | "goals" | "dailyExpenses";

interface FinanceContextValue {
  data: FinanceData;
  updateProfile: (p: Partial<Profile>) => void;
  addItem: <K extends Collections>(key: K, item: FinanceData[K][number]) => void;
  removeItem: (key: Collections, id: string) => void;
  resetToSample: () => void;
  clearAll: () => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function load(): FinanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FinanceData>;
      // merge with defaults so older saved data gains new fields
      return {
        ...sampleData,
        ...parsed,
        profile: { ...sampleData.profile, ...(parsed.profile || {}) },
        dailyExpenses: parsed.dailyExpenses ?? sampleData.dailyExpenses,
      };
    }
  } catch {
    /* ignore */
  }
  return sampleData;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinanceData>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateProfile = (p: Partial<Profile>) =>
    setData((d) => ({ ...d, profile: { ...d.profile, ...p } }));

  const addItem: FinanceContextValue["addItem"] = (key, item) =>
    setData((d) => ({ ...d, [key]: [...(d[key] as any[]), item] }));

  const removeItem = (key: Collections, id: string) =>
    setData((d) => ({ ...d, [key]: (d[key] as any[]).filter((x) => x.id !== id) }));

  const resetToSample = () => setData(JSON.parse(JSON.stringify(sampleData)));

  const clearAll = () =>
    setData((d) => ({
      profile: d.profile,
      incomes: [],
      expenses: [],
      loans: [],
      investments: [],
      insurances: [],
      goals: [],
      dailyExpenses: [],
    }));

  return (
    <FinanceContext.Provider value={{ data, updateProfile, addItem, removeItem, resetToSample, clearAll }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}

export { newId };
export type { Income, Expense, Loan, Investment, Insurance, Goal };
