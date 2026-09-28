import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Question, Settings, UserData } from '@/types/question';
import type { StatusIndex } from '@/services/filterService';
import {
  buildStatusIndex,
  clearWrong,
  deleteQuestionNote,
  deleteSubjectNote,
  recordAttempt,
  removeFromWrong,
  resetUserData,
  saveSubjectNote,
  setRevision,
  toggleRevision,
  toggleSubjectNotePinned,
  upsertQuestionNote,
  type RecordOutcome,
  type ResetScope,
} from '@/services/progressService';
import {
  loadUserData,
  readCachedSettings,
  reviveUserData,
  saveSettings,
  saveUserData,
} from '@/services/storageService';
import { gradeAnswer } from '@/services/gradeService';

export type ResolvedTheme = 'light' | 'dark';

interface UserValue {
  user: UserData;
  index: StatusIndex;
  settings: Settings;
  theme: ResolvedTheme;
  /** true while the browser reports a dark colour scheme */
  prefersDark: boolean;
  ready: boolean;

  setSettings: (patch: Partial<Settings>) => void;
  setTheme: (theme: Settings['theme']) => void;

  submit: (question: Question, given: string[]) => RecordOutcome;
  markForRevision: (id: string, marked?: boolean) => void;
  removeWrong: (id: string) => void;
  clearWrongQuestions: (ids: string[]) => void;
  saveNote: (id: string, body: string) => void;
  deleteNote: (id: string) => void;
  saveSubjectNote: (input: {
    id?: string;
    subject: string;
    title: string;
    body: string;
    pinned?: boolean;
  }) => void;
  deleteSubjectNote: (id: string) => void;
  togglePinned: (id: string) => void;
  reset: (scope: ResetScope) => void;
  importUserData: (next: UserData) => void;
}

const UserContext = createContext<UserValue | null>(null);

const DARK_QUERY = '(prefers-color-scheme: dark)';

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(DARK_QUERY).matches;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData>(() => {
    const stored = loadUserData();
    // The inline bootstrap script in index.html reads this key before React
    // mounts, so keep the two in sync to avoid a flash of the wrong theme.
    return { ...stored, settings: readCachedSettings() };
  });
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);
  const [ready, setReady] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    setReady(true);
  }, []);

  // Persist on every change (debounced inside the storage service).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    saveUserData(user);
    saveSettings(user.settings);
  }, [user]);

  // Track the OS preference so `system` stays live.
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const theme: ResolvedTheme = user.settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : user.settings.theme;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.classList.toggle('reduce-motion', user.settings.reduceMotion);
    const meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b0b0f' : '#fafafc');
  }, [theme, user.settings.reduceMotion]);

  const index = useMemo(() => buildStatusIndex(user), [user]);

  const patch = useCallback((fn: (prev: UserData) => UserData) => setUser((prev) => fn(prev)), []);

  const value = useMemo<UserValue>(
    () => ({
      user,
      index,
      settings: user.settings,
      theme,
      prefersDark,
      ready,

      setSettings: (p) => patch((prev) => ({ ...prev, settings: { ...prev.settings, ...p } })),
      setTheme: (t) => patch((prev) => ({ ...prev, settings: { ...prev.settings, theme: t } })),

      submit: (question, given) => {
        const outcome = gradeAnswer({ question, given, natStrict: user.settings.natStrict });
        setUser((prev) => recordAttempt(prev, question, given, prev.settings.natStrict).next);
        return outcome;
      },

      markForRevision: (id, marked) =>
        patch((prev) =>
          marked === undefined ? toggleRevision(prev, id).next : setRevision(prev, id, marked),
        ),
      removeWrong: (id) => patch((prev) => removeFromWrong(prev, id)),
      clearWrongQuestions: (ids) => patch((prev) => clearWrong(prev, ids)),
      saveNote: (id, body) => patch((prev) => upsertQuestionNote(prev, id, body)),
      deleteNote: (id) => patch((prev) => deleteQuestionNote(prev, id)),
      saveSubjectNote: (input) => patch((prev) => saveSubjectNote(prev, input)),
      deleteSubjectNote: (id) => patch((prev) => deleteSubjectNote(prev, id)),
      togglePinned: (id) => patch((prev) => toggleSubjectNotePinned(prev, id)),
      reset: (scope) => patch((prev) => resetUserData(prev, scope)),
      importUserData: (next) => setUser({ ...reviveUserData(next), settings: { ...user.settings, ...next.settings } }),
    }),
    [user, index, theme, prefersDark, ready, patch],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}

/* ------------------------------------------------------------------ *
 * Convenience selectors
 * ------------------------------------------------------------------ */

export function useSettings(): Settings {
  return useUser().settings;
}

export function useTheme() {
  const { theme, setTheme, settings, prefersDark } = useUser();
  return { theme, setTheme, mode: settings.theme, prefersDark };
}

export function useQuestionState(id: string | undefined) {
  const { user } = useUser();
  return id ? user.questions[id] : undefined;
}

export function useProgress() {
  const { user, index } = useUser();
  return { user, index };
}
