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
import { useAuth } from "@/lib/auth/store";

const LEGACY_STORAGE_KEY = "ffp-finance-data-v1";

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

function storageKey(userId: string) {
  return `${LEGACY_STORAGE_KEY}:${userId}`;
}

function emptyForUser(name: string): FinanceData {
  return {
    ...JSON.parse(JSON.stringify(sampleData)),
    profile: {
      ...sampleData.profile,
      name,
    },
    incomes: [],
    expenses: [],
    loans: [],
    investments: [],
    insurances: [],
    goals: [],
    dailyExpenses: [],
  };
}

function loadForUser(userId: string, displayName: string): FinanceData {
  try {
    const scoped = localStorage.getItem(storageKey(userId));
    if (scoped) {
      const parsed = JSON.parse(scoped) as Partial<FinanceData>;
      return {
        ...sampleData,
        ...parsed,
        profile: { ...sampleData.profile, ...(parsed.profile || {}) },
        dailyExpenses: parsed.dailyExpenses ?? [],
      };
    }

    // One-time migrate legacy shared data into the first logged-in account that needs it
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Partial<FinanceData>;
      const migrated: FinanceData = {
        ...sampleData,
        ...parsed,
        profile: { ...sampleData.profile, ...(parsed.profile || {}) },
        dailyExpenses: parsed.dailyExpenses ?? sampleData.dailyExpenses,
      };
      localStorage.setItem(storageKey(userId), JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return emptyForUser(displayName);
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "guest";
  const displayName = user?.name ?? sampleData.profile.name;
  const [data, setData] = useState<FinanceData>(() =>
    user ? loadForUser(user.id, user.name) : emptyForUser(displayName),
  );

  // Reload when the signed-in user changes
  useEffect(() => {
    if (!user) {
      setData(emptyForUser(sampleData.profile.name));
      return;
    }
    setData(loadForUser(user.id, user.name));
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(storageKey(user.id), JSON.stringify(data));
  }, [data, user]);

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
