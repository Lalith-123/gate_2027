import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getAllMeta,
  getBankError,
  getBankIssues,
  getBankStatus,
  getFacets,
  getManifest,
  getMeta,
  getQuestion,
  isYearLoaded,
  loadManifest,
  loadYear,
  subscribeToBank,
  type BankIssue,
  type BankStatus,
  type Facets,
} from '@/services/questionService';
import type { Question, QuestionManifest, QuestionMeta } from '@/types/question';

interface BankValue {
  status: BankStatus;
  error: string | null;
  issues: BankIssue[];
  manifest: QuestionManifest;
  facets: Facets;
  metas: QuestionMeta[];
  total: number;
  getMeta: (id: string) => QuestionMeta | undefined;
  getQuestion: (id: string) => Question | undefined;
  isYearLoaded: (year: number) => boolean;
  ensureYear: (year: number) => Promise<number>;
  ensureQuestion: (id: string) => Promise<Question | undefined>;
}

const BankContext = createContext<BankValue | null>(null);

/** Stable across renders so effects that depend on them do not re-run. */
const ensureQuestion = async (id: string): Promise<Question | undefined> => {
  const found = getQuestion(id);
  if (found) return found;
  const meta = getMeta(id);
  if (!meta) return undefined;
  await loadYear(meta.y);
  return getQuestion(id);
};

function mirrorBank(): BankValue {
  return {
    status: getBankStatus(),
    error: getBankError(),
    issues: getBankIssues(),
    manifest: getManifest(),
    facets: getFacets(),
    metas: getAllMeta(),
    total: getAllMeta().length,
    getMeta,
    getQuestion,
    isYearLoaded,
    ensureYear: loadYear,
    ensureQuestion,
  };
}

export function BankProvider({ children }: { children: ReactNode }) {
  // Bumped by every service notification; the service owns the cache and this
  // provider only mirrors it, so the revision counter is the dependency.
  const [revision, bump] = useState(0);

  useEffect(() => {
    void loadManifest();
  }, []);

  useEffect(() => subscribeToBank(() => bump((n) => n + 1)), []);

  const value = useMemo<BankValue>(() => mirrorBank(), [revision]);

  return <BankContext.Provider value={value}>{children}</BankContext.Provider>;
}

export function useBank(): BankValue {
  const ctx = useContext(BankContext);
  if (!ctx) throw new Error('useBank must be used inside <BankProvider>');
  return ctx;
}

export function useMetas(): QuestionMeta[] {
  return useBank().metas;
}

export function useEnsureQuestion(id: string | undefined): { question: Question | undefined; ready: boolean } {
  const { getQuestion, ensureQuestion } = useBank();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) {
      setReady(false);
      return;
    }
    if (getQuestion(id)) {
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    void ensureQuestion(id).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, ensureQuestion, getQuestion]);

  return { question: id ? getQuestion(id) : undefined, ready };
}

/** Warms a year's chunk without needing a specific question id. */
export function useEnsureYear(year: number | undefined) {
  const { ensureYear, isYearLoaded: check } = useBank();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (year === undefined || check(year)) {
      setDone(true);
      return;
    }
    let cancelled = false;
    setDone(false);
    void ensureYear(year).then(() => {
      if (!cancelled) setDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [year, ensureYear, check]);

  return done;
}

export function useDebouncedValue<T>(value: T, delay = 180): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useDebouncedCallback<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  const [pending, setPending] = useState<(() => void) | null>(null);
  useEffect(() => {
    if (!pending) return;
    const t = window.setTimeout(pending, delay);
    return () => window.clearTimeout(t);
  }, [pending, delay]);
  return useCallback((...args: T) => setPending(() => () => fn(...args)), [fn]);
}
