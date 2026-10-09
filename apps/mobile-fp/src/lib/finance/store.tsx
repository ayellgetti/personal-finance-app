import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/lib/api";
import {
  createEntity,
  fetchFinanceSnapshot,
  removeEntity,
  updateEntity,
  type FinanceEntity,
} from "@/lib/finance/remote";
import type { FinanceSnapshot } from "@/types/finance";

type State = FinanceSnapshot & {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: string | null;
};

const EMPTY: State = {
  budgets: [],
  loans: [],
  investments: [],
  insurances: [],
  goals: [],
  profile: null,
  planner: null,
  loading: true,
  refreshing: false,
  error: null,
  lastUpdated: null,
};

type EntityInput = Record<string, unknown>;

type FinanceContextValue = State & {
  refresh: () => Promise<void>;
  create: (entity: FinanceEntity, input: EntityInput) => Promise<void>;
  update: (entity: FinanceEntity, id: string, input: EntityInput) => Promise<void>;
  remove: (entity: FinanceEntity, id: string) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function errorText(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Unable to load your financial plan";
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);

  const refresh = useCallback(async () => {
    setState((current) => ({
      ...current,
      refreshing: !current.loading,
      error: null,
    }));
    try {
      const snapshot = await fetchFinanceSnapshot();
      setState({
        ...snapshot,
        loading: false,
        refreshing: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: errorText(error),
      }));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (entity: FinanceEntity, input: EntityInput) => {
      await createEntity(entity, input as never);
      await refresh();
    },
    [refresh],
  );

  const update = useCallback(
    async (entity: FinanceEntity, id: string, input: EntityInput) => {
      await updateEntity(entity, id, input as never);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (entity: FinanceEntity, id: string) => {
      await removeEntity(entity, id);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ ...state, refresh, create, update, remove }),
    [state, refresh, create, update, remove],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance must be used within FinanceProvider");
  return value;
}
