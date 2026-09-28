import type { Difficulty, QuestionMeta, QuestionType } from '@/types/question';
import type { PracticeMode } from '@/types/question';
import type { StatusIndex } from '@/services/filterService';

export interface EngineScope {
  /** candidate pool, already narrowed by filters if the user filtered */
  metas: QuestionMeta[];
  index: StatusIndex;
  /** ids served most recently, most recent last */
  recent: string[];
}

export interface EngineOptions extends EngineScope {
  mode: PracticeMode;
  subject?: string;
  topic?: string;
  year?: number;
  difficulty?: Difficulty[];
  types?: QuestionType[];
  /** never return this id */
  exclude?: string;
  /** how far back to avoid repeating */
  memory?: number;
}

const DEFAULT_MEMORY = 30;

/* ------------------------------------------------------------------ *
 * Randomness
 * ------------------------------------------------------------------ */

function shuffle<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Weighted pick: questions the student has never seen are strongly preferred
 * over previously served ones, and anything in the recent window is only
 * considered as a last resort. This keeps sessions varied without ever
 * showing the same question twice in a row.
 */
function weightedPick(pool: QuestionMeta[], index: StatusIndex, recent: string[], memory: number): QuestionMeta | null {
  if (!pool.length) return null;

  const window = new Set(recent.slice(-memory));
  const fresh = pool.filter((m) => !index.attempted.has(m.id) && !window.has(m.id));
  const seenButCool = pool.filter((m) => index.attempted.has(m.id) && !window.has(m.id));
  const recycled = pool.filter((m) => window.has(m.id));

  const roll = Math.random();
  if (fresh.length && roll < 0.7) return fresh[Math.floor(Math.random() * fresh.length)];
  if (seenButCool.length) return seenButCool[Math.floor(Math.random() * seenButCool.length)];
  if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
  if (recycled.length) return recycled[Math.floor(Math.random() * recycled.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function poolFrom(scope: EngineScope, predicate: (m: QuestionMeta) => boolean): QuestionMeta[] {
  return scope.metas.filter(predicate);
}

function guard(pool: QuestionMeta[], exclude?: string): QuestionMeta[] {
  if (!exclude || pool.length < 2) return pool;
  const trimmed = pool.filter((m) => m.id !== exclude);
  return trimmed.length ? trimmed : pool;
}

function finish(pool: QuestionMeta[], opts: EngineOptions): QuestionMeta | null {
  if (!pool.length) return null;
  const candidates = guard(pool, opts.exclude);
  return weightedPick(candidates, opts.index, opts.recent, opts.memory ?? DEFAULT_MEMORY);
}

/* ------------------------------------------------------------------ *
 * Public strategies
 * ------------------------------------------------------------------ */

export function getRandomQuestion(opts: EngineOptions): QuestionMeta | null {
  return finish(opts.metas, opts);
}

export function getRandomQuestionBySubject(opts: EngineOptions): QuestionMeta | null {
  return finish(poolFrom(opts, (m) => m.s === opts.subject), opts);
}

export function getRandomQuestionByTopic(opts: EngineOptions): QuestionMeta | null {
  return finish(poolFrom(opts, (m) => m.t === opts.topic), opts);
}

export function getRandomQuestionByYear(opts: EngineOptions): QuestionMeta | null {
  return finish(poolFrom(opts, (m) => m.y === opts.year), opts);
}

export function getUnattemptedQuestion(opts: EngineOptions): QuestionMeta | null {
  return finish(poolFrom(opts, (m) => !opts.index.attempted.has(m.id)), opts);
}

export function getWrongQuestion(opts: EngineOptions): QuestionMeta | null {
  return finish(poolFrom(opts, (m) => opts.index.wrong.has(m.id)), opts);
}

export function getRevisionQuestion(opts: EngineOptions): QuestionMeta | null {
  return finish(poolFrom(opts, (m) => opts.index.marked.has(m.id)), opts);
}

export function getDifficultQuestion(opts: EngineOptions): QuestionMeta | null {
  const hard: Difficulty[] = opts.difficulty?.length ? opts.difficulty : ['Hard', 'Medium'];
  return finish(poolFrom(opts, (m) => hard.includes(m.d)), opts);
}

/* ------------------------------------------------------------------ *
 * Dispatcher used by the practice views
 * ------------------------------------------------------------------ */

export interface PickResult {
  meta: QuestionMeta | null;
  /** true when the requested mode had no questions and the pool was widened */
  fellBack: boolean;
  mode: PracticeMode;
}

export function pickQuestion(opts: EngineOptions): PickResult {
  const { mode } = opts;

  const scoped: QuestionMeta[] = opts.subject
    ? poolFrom(opts, (m) => m.s === opts.subject)
    : opts.topic
      ? poolFrom(opts, (m) => m.t === opts.topic)
      : opts.year
        ? poolFrom(opts, (m) => m.y === opts.year)
        : opts.metas;

  const strategies: Record<PracticeMode, (o: EngineOptions) => QuestionMeta | null> = {
    random: getRandomQuestion,
    unattempted: getUnattemptedQuestion,
    wrong: getWrongQuestion,
    revision: getRevisionQuestion,
    subject: getRandomQuestionBySubject,
    topic: getRandomQuestionByTopic,
    year: getRandomQuestionByYear,
    difficult: getDifficultQuestion,
  };

  const narrowed = scoped.filter((m) => {
    if (opts.types?.length && !opts.types.includes(m.k)) return false;
    if (opts.difficulty?.length && !opts.difficulty.includes(m.d)) return false;
    return true;
  });

  const pool = narrowed.length ? narrowed : scoped;
  const meta = (strategies[mode] ?? getRandomQuestion)({ ...opts, metas: pool });

  if (meta) return { meta, fellBack: false, mode };

  // The requested mode was empty: widen to the whole pool rather than stall.
  const fallback = getRandomQuestion({ ...opts, metas: opts.metas });
  return { meta: fallback, fellBack: Boolean(fallback), mode };
}

/** Human readable description of what the next question will be drawn from. */
export function describeScope(opts: EngineOptions): string {
  const parts: string[] = [];
  if (opts.subject) parts.push(opts.subject);
  if (opts.topic) parts.push(opts.topic);
  if (opts.year) parts.push(`GATE ${opts.year}`);
  if (opts.difficulty?.length) parts.push(opts.difficulty.join(' · '));
  if (opts.types?.length) parts.push(opts.types.join(' / '));
  return parts.length ? parts.join('  ·  ') : 'All subjects';
}

export { shuffle };
