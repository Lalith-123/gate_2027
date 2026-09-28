import type { Difficulty, QuestionMeta, QuestionType } from '@/types/question';

export type StatusFilter = 'all' | 'attempted' | 'unattempted' | 'correct' | 'incorrect' | 'marked';

export type SortKey = 'recent' | 'oldest' | 'year-desc' | 'year-asc' | 'difficulty' | 'subject' | 'random';

export interface Filters {
  q: string;
  years: number[];
  subjects: string[];
  topics: string[];
  types: QuestionType[];
  difficulties: Difficulty[];
  status: StatusFilter;
  sort: SortKey;
}

/** Cheap lookup sets derived from user data, used by filters and the engine. */
export interface StatusIndex {
  attempted: Set<string>;
  correct: Set<string>;
  incorrect: Set<string>;
  marked: Set<string>;
  lastAttemptedAt: Map<string, number>;
  wrong: Set<string>;
  noteCount: number;
}

export const emptyFilters: Filters = {
  q: '',
  years: [],
  subjects: [],
  topics: [],
  types: [],
  difficulties: [],
  status: 'all',
  sort: 'recent',
};

export const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'All',
  attempted: 'Attempted',
  unattempted: 'Unattempted',
  correct: 'Correct',
  incorrect: 'Incorrect',
  marked: 'Marked for revision',
};

export const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Recently attempted',
  oldest: 'Longest untouched',
  'year-desc': 'Newest year first',
  'year-asc': 'Oldest year first',
  difficulty: 'Difficulty, easy first',
  subject: 'Subject A–Z',
  random: 'Shuffled',
};

export function activeFilterCount(f: Filters): number {
  return (
    (f.q.trim() ? 1 : 0) +
    f.years.length +
    f.subjects.length +
    f.topics.length +
    f.types.length +
    f.difficulties.length +
    (f.status !== 'all' ? 1 : 0)
  );
}

export function isDefaultSort(sort: SortKey): boolean {
  return sort === 'recent';
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

const DIFFICULTY_RANK: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

function scoreOne(meta: QuestionMeta, token: string): number {
  let score = 0;
  const id = meta.id.toLowerCase();
  const subject = meta.s.toLowerCase();
  const topic = meta.t.toLowerCase();
  const preview = meta.p.toLowerCase();
  const expl = meta.x.toLowerCase();
  const year = String(meta.y);

  if (id === token) score += 120;
  else if (id.startsWith(token)) score += 70;
  else if (id.includes(token)) score += 40;

  if (subject === token) score += 60;
  else if (subject.startsWith(token)) score += 32;
  else if (subject.includes(token)) score += 20;

  if (topic === token) score += 50;
  else if (topic.startsWith(token)) score += 26;
  else if (topic.includes(token)) score += 16;

  if (year === token) score += 45;
  else if (`${meta.y} gate`.startsWith(token)) score += 20;

  if (preview.includes(token)) score += preview.startsWith(token) ? 26 : 14;
  if (expl.includes(token)) score += 5;
  if (DIFFICULTY_RANK[meta.d] !== undefined && meta.d.toLowerCase() === token) score += 8;
  if (token === 'msq' && meta.k === 'MSQ') score += 8;
  if (token === 'nat' && meta.k === 'NAT') score += 8;
  if (token === 'mcq' && meta.k === 'MCQ') score += 8;

  return score;
}

export interface Scored {
  meta: QuestionMeta;
  score: number;
}

export function searchMetas(metas: QuestionMeta[], rawQuery: string): Scored[] | null {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return null;
  const tokens = query.split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;

  const out: Scored[] = [];
  for (const meta of metas) {
    let total = 0;
    let matchedAll = true;
    for (const token of tokens) {
      const s = scoreOne(meta, token);
      if (s === 0) {
        matchedAll = false;
        break;
      }
      total += s;
    }
    if (matchedAll) out.push({ meta, score: total });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Filtering
 * ------------------------------------------------------------------ */

export function matchesStatus(meta: QuestionMeta, status: StatusFilter, index: StatusIndex): boolean {
  switch (status) {
    case 'all':
      return true;
    case 'attempted':
      return index.attempted.has(meta.id);
    case 'unattempted':
      return !index.attempted.has(meta.id);
    case 'correct':
      return index.correct.has(meta.id);
    case 'incorrect':
      return index.incorrect.has(meta.id);
    case 'marked':
      return index.marked.has(meta.id);
    default:
      return true;
  }
}

const DIFF_SORT: Record<Difficulty, number> = { Easy: 0, Medium: 1, Hard: 2 };

export function filterMetas(
  metas: QuestionMeta[],
  filters: Filters,
  index: StatusIndex,
  shuffleSeed = 0,
): QuestionMeta[] {
  const scored = searchMetas(metas, filters.q);
  const source = scored ? scored.map((s) => s.meta) : metas;
  const scoreById = scored ? new Map(scored.map((s) => [s.meta.id, s.score])) : null;

  const result = source.filter(
    (m) =>
      (filters.years.length === 0 || filters.years.includes(m.y)) &&
      (filters.subjects.length === 0 || filters.subjects.includes(m.s)) &&
      (filters.topics.length === 0 || filters.topics.includes(m.t)) &&
      (filters.types.length === 0 || filters.types.includes(m.k)) &&
      (filters.difficulties.length === 0 || filters.difficulties.includes(m.d)) &&
      matchesStatus(m, filters.status, index),
  );

  const sort = filters.sort;
  if (sort === 'random') {
    return seededShuffle(result, shuffleSeed);
  }

  const cmp = (a: QuestionMeta, b: QuestionMeta): number => {
    if (scoreById && sort === 'recent') {
      const diff = (scoreById.get(b.id) ?? 0) - (scoreById.get(a.id) ?? 0);
      if (diff !== 0) return diff;
    }
    switch (sort) {
      case 'year-desc':
        return b.y - a.y || a.id.localeCompare(b.id);
      case 'year-asc':
        return a.y - b.y || a.id.localeCompare(b.id);
      case 'difficulty':
        return DIFF_SORT[a.d] - DIFF_SORT[b.d] || a.y - b.y || a.id.localeCompare(b.id);
      case 'subject':
        return a.s.localeCompare(b.s) || a.t.localeCompare(b.t) || a.id.localeCompare(b.id);
      case 'oldest': {
        const ta = index.lastAttemptedAt.get(a.id) ?? -1;
        const tb = index.lastAttemptedAt.get(b.id) ?? -1;
        if (ta !== tb) return ta - tb;
        return a.id.localeCompare(b.id);
      }
      case 'recent':
      default: {
        const ta = index.lastAttemptedAt.get(a.id) ?? -1;
        const tb = index.lastAttemptedAt.get(b.id) ?? -1;
        if (ta !== tb) return tb - ta;
        return a.id.localeCompare(b.id);
      }
    }
  };

  return result.sort(cmp);
}

/** Deterministic shuffle so the list order is stable across re-renders. */
export function seededShuffle<T>(list: T[], seed: number): T[] {
  const out = list.slice();
  let s = (seed || 1) >>> 0;
  const next = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Facet helpers
 * ------------------------------------------------------------------ */

export function topicsFor(metas: QuestionMeta[], subjects: string[]): string[] {
  const set = new Set<string>();
  const wanted = subjects.length ? new Set(subjects) : null;
  for (const m of metas) {
    if (wanted && !wanted.has(m.s)) continue;
    set.add(m.t);
  }
  return [...set].sort();
}

export function yearsFor(metas: QuestionMeta[]): number[] {
  const set = new Set<number>();
  for (const m of metas) set.add(m.y);
  return [...set].sort((a, b) => a - b);
}
