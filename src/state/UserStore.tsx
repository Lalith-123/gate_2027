import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadUserData, saveSettings, saveUserData } from '@/services/storageService';
import type { StatusIndex } from '@/services/filterService';
import {
  buildStatusIndex,
  recordAttempt,
  resetUserData,
  setRevision,
  toggleRevision,
  upsertQuestionNote,
  deleteQuestionNote,
  saveSubjectNote,
  deleteSubjectNote,
  toggleSubjectNotePinned,
  type ResetScope,
} from '@/services/progressService';
import type { Question, Settings, SubjectNote, UserData } from '@/types/question';

/* ------------------------------------------------------------------ *
 * One store for everything the user owns, persisted to localStorage.
 *
 * Settings live inside `user.settings` so there is exactly one source of
 * truth; a separate effect mirrors them into SETTINGS_KEY because the
 * pre-paint script in index.html reads that key before React boots.
 *
 * All mutations are pure `user -> next user` transitions supplied by
 * progressService, so the reducer only has to swap the object. Writes are
 * debounced inside storageService.
 * ------------------------------------------------------------------ */

export interface AttemptRecord {
  correct: boolean;
  awarded: number;
  possible: number;
  partialMiss: boolean;
}

interface Store {
  user: UserData;
  settings: Settings;
  index: StatusIndex;
  /** submit an answer, returns the grading outcome */
  submit: (question: Question, given: string[]) => AttemptRecord;
  toggleMark: (id: string) => boolean;
  setMark: (id: string, marked: boolean) => void;
  saveNote: (id: string, body: string) => void;
  removeNote: (id: string) => void;
  upsertSubjectNote: (note: SubjectNote) => void;
  removeSubjectNote: (id: string) => void;
  pinSubjectNote: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  reset: (scope: ResetScope) => void;
  replaceAll: (next: UserData) => void;
}

const UserContext = createContext<Store | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData>(() => loadUserData());

  useEffect(() => {
    saveUserData(user);
    saveSettings(user.settings);
  }, [user]);

  const index = useMemo(() => buildStatusIndex(user), [user]);

  /**
   * The grading outcome is needed synchronously by the caller (to render the
   * result panel immediately), so it is computed from the same inputs that
   * produce the new user state rather than being read back out of state.
   */
  const submit = useCallback(
    (question: Question, given: string[]): AttemptRecord => {
      const { next, outcome } = recordAttempt(user, question, given, user.settings.natStrict);
      setUser(next);
      return outcome;
    },
    [user],
  );

  const toggleMark = useCallback(
    (id: string) => {
      const { next, marked } = toggleRevision(user, id);
      setUser(next);
      return marked;
    },
    [user],
  );

  const store = useMemo<Store>(
    () => ({
      user,
      settings: user.settings,
      index,
      submit,
      toggleMark,
      setMark: (id, marked) => setUser(setRevision(user, id, marked)),
      saveNote: (id, body) => setUser(upsertQuestionNote(user, id, body)),
      removeNote: (id) => setUser(deleteQuestionNote(user, id)),
      upsertSubjectNote: (note) => setUser(saveSubjectNote(user, note)),
      removeSubjectNote: (id) => setUser(deleteSubjectNote(user, id)),
      pinSubjectNote: (id) => setUser(toggleSubjectNotePinned(user, id)),
      updateSettings: (patch) => setUser((current) => ({ ...current, settings: { ...current.settings, ...patch } })),
      reset: (scope) => setUser(resetUserData(user, scope)),
      replaceAll: (next) => setUser(next),
    }),
    [user, index, submit, toggleMark],
  );

  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
}

export function useUser(): Store {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}

/** Convenience accessor for read-only progress lookups. */
export function useProgress() {
  const { user, index } = useUser();
  return { user, index };
}
