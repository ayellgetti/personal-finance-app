import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import {
  EMERGENCY_FUND_GOAL_ID,
  FinanceData,
  Income,
  Expense,
  Loan,
  Investment,
  Insurance,
  Goal,
  Profile,
  DailyExpense,
} from "@/types/finance";
import { newId, createEmergencyFundGoal } from "./sampleData";
import { useAuth } from "@/lib/auth/store";
import { updateStoredUser } from "@/lib/auth/session";
import {
  applyAccountIdentity,
  applyProfilePatch,
  defaultProfile,
  pickProfileExtras,
  toAccountIdentity,
  type AccountIdentity,
} from "./profile";
import {
  createRemoteExpense,
  createRemoteIncome,
  createRemoteInvestment,
  createRemoteLoan,
  fetchAccountUser,
  fetchRemoteFinance,
  removeRemoteBudget,
  removeRemoteInvestment,
  removeRemoteLoan,
  updateRemoteLoan,
  upsertRemoteFinancialProfile,
  type RemoteFinance,
  type RemoteFinancialProfile,
} from "./remote";
import { toast } from "sonner";

const LEGACY_STORAGE_KEY = "ffp-finance-data-v1";
const LOCAL_EXTRAS_KEY = "ffp-finance-local-v2";

type Collections = "incomes" | "expenses" | "loans" | "investments" | "insurances" | "goals" | "dailyExpenses";

interface FinanceContextValue {
  data: FinanceData;
  loading: boolean;
  updateProfile: (p: Partial<Profile>) => Promise<void> | void;
  addItem: <K extends Collections>(key: K, item: FinanceData[K][number]) => Promise<void> | void;
  updateItem: <K extends Collections>(key: K, id: string, patch: Partial<FinanceData[K][number]>) => Promise<void> | void;
  removeItem: (key: Collections, id: string) => Promise<void> | void;
}

type LocalExtras = {
  profile: Partial<Profile>;
  insurances: Insurance[];
  dailyExpenses: DailyExpense[];
};

const FinanceContext = createContext<FinanceContextValue | null>(null);
const SAMPLE_PROFILE_NAME = "Arjun Mehta";
const FINANCIAL_KEYS: (keyof Profile)[] = [
  "retirementAge",
  "dependents",
  "inflationRate",
  "employmentType",
  "currency",
];

function extrasKey(userId: string) {
  return `${LOCAL_EXTRAS_KEY}:${userId}`;
}

function legacyKey(userId: string) {
  return `${LEGACY_STORAGE_KEY}:${userId}`;
}

function ensureEmergencyFundGoal(data: FinanceData): FinanceData {
  const existing = data.goals.find((g) => g.id === EMERGENCY_FUND_GOAL_ID || g.type === "Emergency Fund");
  if (!existing) {
    return {
      ...data,
      goals: [createEmergencyFundGoal(data.profile.emergencyFund), ...data.goals],
    };
  }
  if (existing.currentSaved === data.profile.emergencyFund && existing.id === EMERGENCY_FUND_GOAL_ID) {
    return data;
  }
  return {
    ...data,
    goals: data.goals.map((g) =>
      g.id === existing.id
        ? { ...g, id: EMERGENCY_FUND_GOAL_ID, type: "Emergency Fund", currentSaved: data.profile.emergencyFund }
        : g,
    ),
  };
}

function emptyForUser(account?: AccountIdentity | null): FinanceData {
  return ensureEmergencyFundGoal({
    profile: defaultProfile(account),
    incomes: [],
    expenses: [],
    loans: [],
    investments: [],
    insurances: [],
    goals: [],
    dailyExpenses: [],
  });
}

function looksLikeSample(parsed: Partial<FinanceData> | LocalExtras | null | undefined): boolean {
  return parsed?.profile?.name === SAMPLE_PROFILE_NAME;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function readLocalExtras(userId: string): LocalExtras {
  const empty: LocalExtras = { profile: {}, insurances: [], dailyExpenses: [] };
  const current = readJson<LocalExtras>(extrasKey(userId));
  if (current && !looksLikeSample(current)) {
    return {
      profile: pickProfileExtras(current.profile),
      insurances: Array.isArray(current.insurances) ? current.insurances : [],
      dailyExpenses: Array.isArray(current.dailyExpenses) ? current.dailyExpenses : [],
    };
  }

  const legacy = readJson<Partial<FinanceData>>(legacyKey(userId)) ?? readJson<Partial<FinanceData>>(LEGACY_STORAGE_KEY);
  if (legacy && !looksLikeSample(legacy)) {
    return {
      profile: pickProfileExtras(legacy.profile),
      insurances: Array.isArray(legacy.insurances) ? legacy.insurances : [],
      dailyExpenses: Array.isArray(legacy.dailyExpenses) ? legacy.dailyExpenses : [],
    };
  }

  return empty;
}

function persistLocalExtras(userId: string, data: FinanceData) {
  const extras: LocalExtras = {
    profile: pickProfileExtras(data.profile),
    insurances: data.insurances,
    dailyExpenses: data.dailyExpenses,
  };
  localStorage.setItem(extrasKey(userId), JSON.stringify(extras));
  localStorage.removeItem(legacyKey(userId));
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function financialPayload(profile: Profile): RemoteFinancialProfile {
  return {
    retirementAge: profile.retirementAge,
    dependents: profile.dependents,
    inflationRate: profile.inflationRate,
    employmentType: profile.employmentType,
    currency: profile.currency,
  };
}

function hasFinancialPatch(patch: Partial<Profile>) {
  return FINANCIAL_KEYS.some((key) => patch[key] !== undefined);
}

function mergeFinance(
  account: AccountIdentity | null,
  extras: LocalExtras,
  remote?: RemoteFinance,
): FinanceData {
  return ensureEmergencyFundGoal({
    profile: applyAccountIdentity(
      {
        ...defaultProfile(account),
        ...pickProfileExtras(extras.profile),
        ...(remote?.profile ?? {}),
      },
      account,
    ),
    incomes: remote?.incomes ?? [],
    expenses: remote?.expenses ?? [],
    loans: remote?.loans ?? [],
    investments: remote?.investments ?? [],
    insurances: extras.insurances,
    goals: remote?.goals.filter((g) => g.type !== "Emergency Fund") ?? [],
    dailyExpenses: extras.dailyExpenses,
  });
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "guest";
  const account: AccountIdentity | null = user ? toAccountIdentity(user) : null;
  const persistTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [data, setData] = useState<FinanceData>(() =>
    user ? mergeFinance(toAccountIdentity(user), readLocalExtras(user.id)) : emptyForUser(null),
  );
  const [loading, setLoading] = useState(!!user);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setData(emptyForUser(null));
      setLoading(false);
      return;
    }

    const extras = readLocalExtras(user.id);
    setData(mergeFinance(toAccountIdentity(user), extras));
    setLoading(true);

    Promise.allSettled([fetchRemoteFinance(), fetchAccountUser()]).then(([remoteResult, accountResult]) => {
      if (cancelled) return;

      if (remoteResult.status === "rejected") {
        toast.error("Could not load saved finance data");
      }

      const remote = remoteResult.status === "fulfilled" ? remoteResult.value : undefined;
      const dbUser = accountResult.status === "fulfilled" ? accountResult.value : null;
      if (dbUser) updateStoredUser(dbUser);
      const identity = dbUser ? toAccountIdentity(dbUser) : toAccountIdentity(user);
      setData(mergeFinance(identity, extras, remote));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    setData((current) => ({
      ...current,
      profile: applyAccountIdentity(current.profile, toAccountIdentity(user)),
    }));
  }, [user?.name, user?.dob]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || loading) return;
    persistLocalExtras(user.id, data);
  }, [data, user, loading]);

  const persistFinancialProfile = (profile: Profile, immediate = false) => {
    if (!user) return;
    const write = () =>
      upsertRemoteFinancialProfile(financialPayload(profile)).catch(() => {
        toast.error("Could not save financial profile");
      });
    window.clearTimeout(persistTimer.current);
    if (immediate) {
      void write();
      return;
    }
    persistTimer.current = setTimeout(() => {
      void write();
    }, 500);
  };

  const updateProfile = (p: Partial<Profile>) =>
    setData((d) => {
      const profile = applyAccountIdentity(applyProfilePatch(d.profile, p), account);
      if (hasFinancialPatch(p)) persistFinancialProfile(profile);
      return ensureEmergencyFundGoal({ ...d, profile });
    });

  const addItem: FinanceContextValue["addItem"] = async (key, item) => {
    try {
      if (key === "loans") {
        const created = await createRemoteLoan(item as Loan);
        setData((d) => ({ ...d, loans: [...d.loans, created] }));
        return;
      }
      if (key === "incomes") {
        const created = await createRemoteIncome(item as Income);
        setData((d) => ({ ...d, incomes: [...d.incomes, created] }));
        return;
      }
      if (key === "expenses") {
        const created = await createRemoteExpense(item as Expense);
        setData((d) => ({ ...d, expenses: [...d.expenses, created] }));
        return;
      }
      if (key === "investments") {
        const created = await createRemoteInvestment(item as Investment);
        setData((d) => ({ ...d, investments: [...d.investments, created] }));
        return;
      }
      setData((d) => ({ ...d, [key]: [...(d[key] as any[]), item] }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    }
  };

  const updateItem: FinanceContextValue["updateItem"] = async (key, id, patch) => {
    if (key === "loans") {
      const current = data.loans.find((loan) => loan.id === id);
      if (!current) return;
      try {
        const updated = await updateRemoteLoan(id, { ...current, ...(patch as Partial<Loan>), id } as Loan);
        setData((d) => ({
          ...d,
          loans: d.loans.map((loan) => (loan.id === id ? updated : loan)),
        }));
        toast.success("Loan updated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update loan");
      }
      return;
    }
    setData((d) => ({
      ...d,
      [key]: (d[key] as any[]).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const removeItem = async (key: Collections, id: string) => {
    if (key === "goals" && id === EMERGENCY_FUND_GOAL_ID) return;
    try {
      if (key === "loans") {
        await removeRemoteLoan(id);
        setData((d) => ({ ...d, loans: d.loans.filter((loan) => loan.id !== id) }));
        return;
      }
      if (key === "incomes" || key === "expenses") {
        await removeRemoteBudget(id);
        setData((d) => ({ ...d, [key]: (d[key] as any[]).filter((x) => x.id !== id) }));
        return;
      }
      if (key === "investments") {
        await removeRemoteInvestment(id);
        setData((d) => ({ ...d, investments: d.investments.filter((item) => item.id !== id) }));
        return;
      }
      setData((d) => ({ ...d, [key]: (d[key] as any[]).filter((x) => x.id !== id) }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove");
    }
  };

  return (
    <FinanceContext.Provider value={{ data, loading, updateProfile, addItem, updateItem, removeItem }}>
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
