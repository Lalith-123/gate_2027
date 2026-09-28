import type { Question, QuestionManifest, QuestionMeta, QuestionType, Difficulty } from '@/types/question';
import { yearChunks } from '@/data/questionLoaders';

const MANIFEST_URL = '/data/questions.manifest.json';
const EMPTY_MANIFEST: QuestionManifest = {
  version: 1,
  generatedAt: '',
  total: 0,
  years: [],
  branches: [],
  types: [],
  difficulties: [],
  tags: [],
  yearFiles: {},
  subjects: [],
  yearTotals: {},
  questions: [],
};

export type BankStatus = 'loading' | 'ready' | 'error';

export interface BankIssue {
  file: string;
  message: string;
}

/* ------------------------------------------------------------------ *
 * Store + subscription
 * ------------------------------------------------------------------ */

let manifest: QuestionManifest = EMPTY_MANIFEST;
let status: BankStatus = 'loading';
let loadError: string | null = null;
const issues: BankIssue[] = [];

const questionsById = new Map<string, Question>();
const metaById = new Map<string, QuestionMeta>();
const loadedYears = new Set<number>();
const pendingYears = new Map<number, Promise<number>>();

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeToBank(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

let manifestPromise: Promise<QuestionManifest> | null = null;

export function loadManifest(): Promise<QuestionManifest> {
  if (manifestPromise) return manifestPromise;

  manifestPromise = (async () => {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Manifest request failed with ${res.status}`);
      const data = (await res.json()) as QuestionManifest;

      if (!data || !Array.isArray(data.questions)) {
        throw new Error('Manifest is malformed: expected a "questions" array');
      }

      manifest = {
        ...EMPTY_MANIFEST,
        ...data,
        yearFiles: data.yearFiles ?? {},
        subjects: Array.isArray(data.subjects) ? data.subjects : [],
      };
      metaById.clear();
      for (const m of manifest.questions) metaById.set(m.id, m);

      if (typeof data.error === 'string' && data.error) {
        issues.push({ file: 'build', message: data.error });
      }

      status = 'ready';
      loadError = null;
      emit();
      return manifest;
    } catch (err) {
      status = 'error';
      loadError =
        err instanceof Error
          ? `Could not load the question index. ${err.message}`
          : 'Could not load the question index.';
      issues.push({ file: 'manifest', message: loadError });
      emit();
      return manifest;
    }
  })();

  return manifestPromise;
}

export function getManifest(): QuestionManifest {
  return manifest;
}

export function getBankStatus(): BankStatus {
  return status;
}

export function getBankError(): string | null {
  return loadError;
}

export function getBankIssues(): BankIssue[] {
  return issues;
}

export function getAllMeta(): QuestionMeta[] {
  return manifest.questions;
}

export function getMeta(id: string): QuestionMeta | undefined {
  return metaById.get(id);
}

export function getYearFor(id: string): number | undefined {
  return metaById.get(id)?.y;
}

/* ------------------------------------------------------------------ *
 * Per-year hydration
 * ------------------------------------------------------------------ */

const LETTERS = 'ABCDEFGH';

/** Runtime guard: a malformed future JSON file must not take the app down. */
function coerce(raw: unknown, fallbackYear: number, index: number): Question | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const q = raw as Record<string, unknown>;

  const id = typeof q.id === 'string' && q.id ? q.id : `gate-${fallbackYear}-${index + 1}`;
  const year = typeof q.year === 'number' ? q.year : fallbackYear;
  const stem = typeof q.question === 'string' ? q.question : '';
  if (!stem.trim()) return null;

  const rawType = String(q.type ?? 'MCQ').toUpperCase();
  const type: QuestionType =
    rawType === 'MSQ' ? 'MSQ' : rawType === 'NAT' ? 'NAT' : Array.isArray(q.options) ? 'MCQ' : 'NAT';

  let options: Question['options'];
  if (type !== 'NAT' && Array.isArray(q.options)) {
    options = q.options.map((o, i) => {
      if (typeof o === 'string') return { key: LETTERS[i] ?? `O${i + 1}`, text: o };
      const obj = (o ?? {}) as Record<string, unknown>;
      return {
        key: String(obj.key ?? obj.id ?? LETTERS[i] ?? `O${i + 1}`),
        text: String(obj.text ?? obj.label ?? ''),
      };
    });
  }

  const answerRaw = q.answer ?? q.correctAnswer ?? q.correct;
  const answer = (Array.isArray(answerRaw) ? answerRaw : [answerRaw])
    .filter((a) => a !== undefined && a !== null && a !== '')
    .map((a) => String(a).trim())
    .filter(Boolean);

  if (type !== 'NAT' && options && options.length < 2) return null;
  if (!answer.length) return null;

  return {
    id,
    year,
    branch: typeof q.branch === 'string' ? q.branch : '',
    subject: typeof q.subject === 'string' ? q.subject : 'Uncategorised',
    topic: typeof q.topic === 'string' ? q.topic : 'General',
    type,
    marks: typeof q.marks === 'number' ? q.marks : type === 'MSQ' ? 2 : 1,
    negativeMarks: typeof q.negativeMarks === 'number' ? q.negativeMarks : 0,
    difficulty: (['Easy', 'Medium', 'Hard'] as const).includes(q.difficulty as Difficulty)
      ? (q.difficulty as Difficulty)
      : 'Medium',
    question: stem,
    options,
    answer,
    natTolerance: typeof q.natTolerance === 'number' ? q.natTolerance : 0,
    explanation: typeof q.explanation === 'string' ? q.explanation : '',
    hint: typeof q.hint === 'string' ? q.hint : '',
    image: typeof q.image === 'string' ? q.image : '',
    source: typeof q.source === 'string' ? q.source : '',
    tags: Array.isArray(q.tags) ? q.tags.filter((t): t is string => typeof t === 'string') : [],
  };
}

function extractList(mod: unknown): unknown[] {
  const value = (mod as { default?: unknown })?.default ?? mod;
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.questions)) return obj.questions;
    if (Array.isArray(obj.data)) return obj.data;
    return [obj];
  }
  return [];
}

/** Loads (and caches) every question for one GATE year. */
export function loadYear(year: number): Promise<number> {
  if (loadedYears.has(year)) return Promise.resolve(manifest.yearTotals?.[year] ?? 0);

  const inflight = pendingYears.get(year);
  if (inflight) return inflight;

  const file = manifest.yearFiles?.[String(year)];
  const loader = file ? yearChunks[file] : undefined;

  if (!loader) {
    issues.push({ file: file ?? String(year), message: `No question file found for GATE ${year}` });
    return Promise.resolve(0);
  }

  const task = (async () => {
    try {
      const mod = await loader();
      const list = extractList(mod);
      let added = 0;
      list.forEach((raw, i) => {
        const q = coerce(raw, year, i);
        if (!q) {
          issues.push({ file, message: `Entry ${i + 1} is missing required fields and was skipped` });
          return;
        }
        questionsById.set(q.id, q);
        added += 1;
      });
      loadedYears.add(year);
      emit();
      return added;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      issues.push({ file, message: `Failed to load ${file}: ${message}` });
      loadedYears.add(year); // do not retry-loop on a broken file
      emit();
      return 0;
    } finally {
      pendingYears.delete(year);
    }
  })();

  pendingYears.set(year, task);
  return task;
}

export function loadYears(years: number[]): Promise<void> {
  return Promise.all(years.map((y) => loadYear(y))).then(() => undefined);
}

export function isYearLoaded(year: number): boolean {
  return loadedYears.has(year);
}

export function loadedCount(): number {
  return questionsById.size;
}

export function loadedYearsList(): number[] {
  return [...loadedYears].sort((a, b) => a - b);
}

/** Synchronous read. Returns undefined when the year has not been fetched yet. */
export function getQuestion(id: string): Question | undefined {
  return questionsById.get(id);
}

export function getQuestions(ids: string[]): Question[] {
  return ids.map((id) => questionsById.get(id)).filter((q): q is Question => Boolean(q));
}

export function getLoadedQuestions(): Question[] {
  return [...questionsById.values()];
}

export interface Facets {
  years: { year: number; total: number }[];
  subjects: { name: string; total: number; topics: string[] }[];
  types: QuestionType[];
  difficulties: Difficulty[];
  branches: string[];
}

let facetsFor: QuestionManifest | null = null;
let facetsCache: Facets = {
  years: [],
  subjects: [],
  types: ['MCQ', 'MSQ', 'NAT'],
  difficulties: ['Easy', 'Medium', 'Hard'],
  branches: [],
};

/** Derived, memoised list values used by every filter control. */
export function getFacets(): Facets {
  if (facetsFor === manifest) return facetsCache;
  facetsFor = manifest;
  const yearTotals = manifest.yearTotals ?? {};
  facetsCache = {
    years: manifest.years.map((y) => ({ year: y, total: yearTotals[String(y)] ?? 0 })),
    subjects: manifest.subjects.map((s) => ({ ...s })),
    types: manifest.types.length ? manifest.types : (['MCQ', 'MSQ', 'NAT'] as QuestionType[]),
    difficulties: manifest.difficulties.length
      ? manifest.difficulties
      : (['Easy', 'Medium', 'Hard'] as Difficulty[]),
    branches: manifest.branches,
  };
  return facetsCache;
}

/* ------------------------------------------------------------------ *
 * Test-only reset
 * ------------------------------------------------------------------ */

export function __resetBank() {
  questionsById.clear();
  metaById.clear();
  loadedYears.clear();
  pendingYears.clear();
  issues.length = 0;
  manifest = EMPTY_MANIFEST;
  status = 'loading';
  loadError = null;
  manifestPromise = null;
  facetsFor = null;
  facetsCache = {
    years: [],
    subjects: [],
    types: ['MCQ', 'MSQ', 'NAT'],
    difficulties: ['Easy', 'Medium', 'Hard'],
    branches: [],
  };
  emit();
}
