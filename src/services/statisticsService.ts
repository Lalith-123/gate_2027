import type { Difficulty, QuestionMeta, QuestionType, UserData } from '@/types/question';
import type { StatusIndex } from '@/services/filterService';

export interface OverallStats {
  total: number;
  attempted: number;
  unattempted: number;
  correct: number;
  incorrect: number;
  marked: number;
  wrong: number;
  notes: number;
  accuracy: number;
  /** share of the bank answered, 0–100 */
  coverage: number;
  totalAttempts: number;
  marksEarned: number;
  marksPossible: number;
  negativeLost: number;
}

export interface BucketStat {
  key: string;
  label: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

export interface DailyPoint {
  day: string;
  label: string;
  attempted: number;
  correct: number;
}

export function computeOverall(metas: QuestionMeta[], user: UserData, index: StatusIndex): OverallStats {
  let correct = 0;
  let incorrect = 0;
  let attempted = 0;
  let totalAttempts = 0;
  let marksEarned = 0;
  let marksPossible = 0;
  let negativeLost = 0;

  for (const meta of metas) {
    const state = user.questions[meta.id];
    if (!state) continue;
    if (state.attempted || state.attempts > 0) attempted += 1;
    if (state.lastResult === 'correct') correct += 1;
    else if (state.lastResult === 'incorrect') incorrect += 1;
    totalAttempts += state.attempts;
    for (const attempt of state.history) {
      marksEarned += attempt.awarded;
      marksPossible += attempt.possible;
      if (attempt.awarded < 0) negativeLost += -attempt.awarded;
    }
  }

  const answered = correct + incorrect;
  return {
    total: metas.length,
    attempted,
    unattempted: Math.max(0, metas.length - attempted),
    correct,
    incorrect,
    marked: index.marked.size,
    wrong: index.wrong.size,
    notes: Object.keys(user.notes).length,
    accuracy: answered ? Math.round((correct / answered) * 1000) / 10 : 0,
    coverage: metas.length ? Math.round((attempted / metas.length) * 1000) / 10 : 0,
    totalAttempts,
    marksEarned: Math.round(marksEarned * 100) / 100,
    marksPossible: Math.round(marksPossible * 100) / 100,
    negativeLost: Math.round(negativeLost * 100) / 100,
  };
}

export function bucketise(
  metas: QuestionMeta[],
  user: UserData,
  keyOf: (m: QuestionMeta) => string,
  labelOf: (m: string) => string,
): BucketStat[] {
  const map = new Map<string, BucketStat>();
  for (const meta of metas) {
    const key = keyOf(meta);
    const stat =
      map.get(key) ??
      ({ key, label: labelOf(key), total: 0, attempted: 0, correct: 0, incorrect: 0, accuracy: 0 } as BucketStat);
    stat.total += 1;
    const state = user.questions[meta.id];
    if (state?.attempted || (state?.attempts ?? 0) > 0) {
      stat.attempted += 1;
      if (state?.lastResult === 'correct') stat.correct += 1;
      else if (state?.lastResult === 'incorrect') stat.incorrect += 1;
    }
    map.set(key, stat);
  }
  return [...map.values()].map((s) => ({
    ...s,
    accuracy: s.correct + s.incorrect ? Math.round((s.correct / (s.correct + s.incorrect)) * 1000) / 10 : 0,
  }));
}

export const bySubject = (metas: QuestionMeta[], user: UserData) =>
  bucketise(metas, user, (m) => m.s, (k) => k).sort((a, b) => a.label.localeCompare(b.label));

export const byYear = (metas: QuestionMeta[], user: UserData) =>
  bucketise(metas, user, (m) => String(m.y), (k) => `GATE ${k}`).sort((a, b) => a.key.localeCompare(b.key));

export const byType = (metas: QuestionMeta[], user: UserData) =>
  bucketise(
    metas,
    user,
    (m) => m.k,
    (k) => ({ MCQ: 'MCQ', MSQ: 'MSQ', NAT: 'NAT' })[k] ?? k,
  ).sort((a, b) => a.label.localeCompare(b.label));

export const byDifficulty = (metas: QuestionMeta[], user: UserData) => {
  const order: Difficulty[] = ['Easy', 'Medium', 'Hard'];
  return bucketise(
    metas,
    user,
    (m) => m.d,
    (k) => k,
  ).sort((a, b) => order.indexOf(a.key as Difficulty) - order.indexOf(b.key as Difficulty));
};

export const byTopic = (metas: QuestionMeta[], user: UserData) =>
  bucketise(metas, user, (m) => m.t, (k) => k)
    .filter((s) => s.attempted > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempted - a.attempted);

export const typesIn = (metas: QuestionMeta[]): QuestionType[] => {
  const set = new Set<QuestionType>();
  for (const m of metas) set.add(m.k);
  return (['MCQ', 'MSQ', 'NAT'] as QuestionType[]).filter((t) => set.has(t));
};

/** Attempts per day for the last `days` days, oldest first. */
export function activitySeries(user: UserData, days = 14): DailyPoint[] {
  const buckets = new Map<string, DailyPoint>();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 86400000);
    const day = d.toISOString().slice(0, 10);
    buckets.set(day, {
      day,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      attempted: 0,
      correct: 0,
    });
  }

  for (const state of Object.values(user.questions)) {
    for (const attempt of state.history) {
      const day = new Date(attempt.at).toISOString().slice(0, 10);
      const bucket = buckets.get(day);
      if (!bucket) continue;
      bucket.attempted += 1;
      if (attempt.correct) bucket.correct += 1;
    }
  }

  return [...buckets.values()];
}

export interface WeakSpot {
  subject: string;
  accuracy: number;
  attempted: number;
  total: number;
}

/** Subjects ranked by weakness, with a minimum sample size. */
export function weakSpots(metas: QuestionMeta[], user: UserData, minAttempts = 3, limit = 5): WeakSpot[] {
  return bySubject(metas, user)
    .filter((s) => s.correct + s.incorrect >= minAttempts)
    .map((s) => ({ subject: s.key, accuracy: s.accuracy, attempted: s.attempted, total: s.total }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}
