import type { Settings, UserData } from '@/types/question';
import { uid } from '@/utils/uid';

export const STORAGE_KEY = 'gate.user.v1';
export const SETTINGS_KEY = 'gate.settings.v1';
export const MANIFEST_CACHE_KEY = 'gate.manifest.v1';
const SCHEMA_VERSION = 1;

export const defaultSettings: Settings = {
  theme: 'system',
  defaultMode: 'random',
  showExplanations: true,
  allowRetryAfterCorrect: true,
  showQuestionImages: true,
  reduceMotion: false,
  natStrict: true,
  swipeToAdvance: true,
};

export function emptyUserData(): UserData {
  const now = Date.now();
  return {
    version: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    settings: { ...defaultSettings },
    questions: {},
    notes: {},
    revision: {},
    wrong: {},
    subjectNotes: [],
    recent: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Defensive merge: anything unreadable in a stored blob is replaced with the
 * default rather than crashing the app. Individual malformed fields are
 * dropped so a partially corrupt save still yields usable progress.
 */
function revive(raw: unknown): UserData {
  const base = emptyUserData();
  if (!isObj(raw)) return base;

  const settings: Settings = { ...defaultSettings };
  const s = isObj(raw.settings) ? raw.settings : {};
  if (s.theme === 'light' || s.theme === 'dark' || s.theme === 'system') settings.theme = s.theme;
  if (typeof s.showExplanations === 'boolean') settings.showExplanations = s.showExplanations;
  if (typeof s.allowRetryAfterCorrect === 'boolean') settings.allowRetryAfterCorrect = s.allowRetryAfterCorrect;
  if (typeof s.showQuestionImages === 'boolean') settings.showQuestionImages = s.showQuestionImages;
  if (typeof s.reduceMotion === 'boolean') settings.reduceMotion = s.reduceMotion;
  if (typeof s.natStrict === 'boolean') settings.natStrict = s.natStrict;
  if (typeof s.swipeToAdvance === 'boolean') settings.swipeToAdvance = s.swipeToAdvance;
  if (
    s.defaultMode === 'random' ||
    s.defaultMode === 'unattempted' ||
    s.defaultMode === 'wrong' ||
    s.defaultMode === 'revision' ||
    s.defaultMode === 'subject' ||
    s.defaultMode === 'topic' ||
    s.defaultMode === 'year' ||
    s.defaultMode === 'difficult'
  ) {
    settings.defaultMode = s.defaultMode;
  }

  const questions: UserData['questions'] = {};
  if (isObj(raw.questions)) {
    for (const [id, v] of Object.entries(raw.questions)) {
      if (!isObj(v)) continue;
      const history = Array.isArray(v.history)
        ? v.history.filter(isObj).slice(-40).map((a) => ({
            at: Number(a.at) || 0,
            given: Array.isArray(a.given) ? a.given.map(String) : [],
            correct: Boolean(a.correct),
            awarded: Number(a.awarded) || 0,
            possible: Number(a.possible) || 0,
          }))
        : [];
      questions[id] = {
        attempts: Number(v.attempts) || 0,
        lastResult: v.lastResult === 'correct' || v.lastResult === 'incorrect' ? v.lastResult : null,
        lastAttemptAt: Number(v.lastAttemptAt) || null,
        attempted: Boolean(v.attempted),
        streak: Number(v.streak) || 0,
        history,
      };
    }
  }

  const notes: UserData['notes'] = {};
  if (isObj(raw.notes)) {
    for (const [id, v] of Object.entries(raw.notes)) {
      if (!isObj(v) || typeof v.body !== 'string' || !v.body.trim()) continue;
      notes[id] = {
        id: v.id ? String(v.id) : id,
        body: v.body,
        createdAt: Number(v.createdAt) || Date.now(),
        updatedAt: Number(v.updatedAt) || Date.now(),
      };
    }
  }

  const revision: UserData['revision'] = {};
  if (isObj(raw.revision)) {
    for (const [id, v] of Object.entries(raw.revision)) revision[id] = Number(v) || Date.now();
  }

  const wrong: UserData['wrong'] = {};
  if (isObj(raw.wrong)) {
    for (const [id, v] of Object.entries(raw.wrong)) {
      const at = isObj(v) ? Number(v.at) || 0 : Number(v) || 0;
      if (!at) continue;
      wrong[id] = { at, attempts: isObj(v) ? Number(v.attempts) || 1 : 1 };
    }
  }

  const subjectNotes = Array.isArray(raw.subjectNotes)
    ? raw.subjectNotes.filter(isObj).map((n) => ({
        id: String(n.id ?? uid('sn')),
        subject: String(n.subject ?? 'General'),
        title: String(n.title ?? ''),
        body: String(n.body ?? ''),
        createdAt: Number(n.createdAt) || Date.now(),
        updatedAt: Number(n.updatedAt) || Date.now(),
        pinned: Boolean(n.pinned),
      }))
    : [];

  return {
    version: SCHEMA_VERSION,
    createdAt: Number(raw.createdAt) || base.createdAt,
    updatedAt: Number(raw.updatedAt) || base.updatedAt,
    settings,
    questions,
    notes,
    revision,
    wrong,
    subjectNotes,
    recent: Array.isArray(raw.recent) ? raw.recent.map(String).slice(0, 40) : [],
  };
}

/** Revives an untrusted blob (imported file, older save) into a valid UserData. */
export function reviveUserData(raw: unknown): UserData {
  return revive(raw);
}

let memoryFallback: UserData | null = null;

function safeLocal(): Storage | null {
  try {
    const probe = '__gate_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

export function loadUserData(): UserData {
  const store = safeLocal();
  if (!store) return memoryFallback ?? emptyUserData();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return emptyUserData();
    return revive(JSON.parse(raw));
  } catch {
    return emptyUserData();
  }
}

let writeTimer: number | undefined;

/** Debounced so a burst of state updates costs one write. */
export function saveUserData(data: UserData): void {
  memoryFallback = data;
  const store = safeLocal();
  if (!store) return;
  if (writeTimer) window.clearTimeout(writeTimer);
  writeTimer = window.setTimeout(() => {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }));
    } catch (err) {
      console.warn('[gate] could not persist progress', err);
    }
  }, 180);
}

export function saveSettings(settings: Settings): void {
  const store = safeLocal();
  if (!store) return;
  try {
    store.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* non-fatal */
  }
}

export function readCachedSettings(): Settings {
  const store = safeLocal();
  if (!store) return defaultSettings;
  try {
    const raw = store.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return defaultSettings;
  }
}

export function storageUsage(): { bytes: number; available: boolean } {
  const store = safeLocal();
  if (!store) return { bytes: 0, available: false };
  try {
    const raw = store.getItem(STORAGE_KEY) ?? '';
    return { bytes: new Blob([raw]).size, available: true };
  } catch {
    return { bytes: 0, available: false };
  }
}
