import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getBankError,
  getBankStatus,
  getManifest,
  loadManifest,
  loadYears,
  subscribeToBank,
  type BankStatus,
} from '@/services/questionService';
import type { QuestionManifest } from '@/types/question';

interface BankState {
  status: BankStatus;
  error: string | null;
  manifest: QuestionManifest | null;
}

const BankContext = createContext<BankState>({ status: 'loading', error: null, manifest: null });

/**
 * Fetches the build-time manifest, then warms the year chunks the user is
 * most likely to need first (the most recent years).
 */
export function BankProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BankState>({ status: 'loading', error: null, manifest: null });

  useEffect(() => {
    const sync = () =>
      setState({ status: getBankStatus(), error: getBankError(), manifest: getManifestSafely() });

    sync();
    const unsubscribe = subscribeToBank(sync);

    loadManifest()
      .then((manifest) => {
        setState({ status: getBankStatus(), error: getBankError(), manifest });
        const recent = [...manifest.years].sort((a, b) => b - a);
        return loadYears(recent);
      })
      .catch(() => sync());

    return unsubscribe;
  }, []);

  return <BankContext.Provider value={state}>{children}</BankContext.Provider>;
}

function getManifestSafely(): QuestionManifest | null {
  try {
    // getManifest returns an empty shell before the fetch resolves
    const m = getManifest();
    return m.total > 0 ? m : null;
  } catch {
    return null;
  }
}

export function useBank(): BankState {
  return useContext(BankContext);
}

/** Derived list of years, newest first. */
export function useYears(): number[] {
  const { manifest } = useBank();
  return useMemo(() => (manifest ? [...manifest.years].sort((a, b) => b - a) : []), [manifest]);
}
