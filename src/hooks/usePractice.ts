import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAllMeta, getQuestion, getYearFor, isYearLoaded, loadYear } from '@/services/questionService';
import { pickQuestion } from '@/services/questionEngine';
import { filterMetas, type Filters, type StatusIndex } from '@/services/filterService';
import { useUser, type AttemptRecord } from '@/state/UserStore';
import type { PracticeMode, Question } from '@/types/question';

export interface Scope {
  mode: PracticeMode;
  subject?: string;
  topic?: string;
  year?: number;
  /**
   * Serve exactly this question, bypassing the picker. Used when a student
   * taps a row in a list, where the question must be deterministic.
   */
  pin?: string | null;
}

export interface FeedState {
  question: Question | null;
  loading: boolean;
  /** true while a year chunk is being fetched */
  hydrating: boolean;
  /** the student's in-progress answer; never cleared by a remount */
  given: string[];
  natValue: string;
  graded: AttemptRecord | null;
  served: number;
  fellBack: boolean;
  poolSize: number;
  select: (key: string) => void;
  setNatValue: (value: string) => void;
  canSubmit: boolean;
  submit: () => void;
  next: () => void;
  retry: () => void;
  mark: () => boolean;
}

/**
 * Drives the one-question-at-a-time practice surface.
 *
 * Two things this deliberately gets right:
 *  1. The pending answer lives here rather than in the question component, so
 *     a remount (scroll, theme change, a lazy chunk arriving) never clears it.
 *  2. The next question is chosen *after* the current attempt has been
 *     recorded, so "unattempted" and "wrong" modes never re-serve the
 *     question that was just answered.
 */
export function usePractice(scope: Scope, filters?: Filters): FeedState {
  const { user, index, submit, toggleMark } = useUser();

  const [question, setQuestion] = useState<Question | null>(null);
  const [given, setGiven] = useState<string[]>([]);
  const [natValue, setNatValue] = useState('');
  const [graded, setGraded] = useState<AttemptRecord | null>(null);
  const [served, setServed] = useState(0);
  const [fellBack, setFellBack] = useState(false);
  const [hydrating, setHydrating] = useState(false);
  const [loading, setLoading] = useState(true);

  // loading a year chunk is async, so an older pick can resolve late —
  // a token makes sure only the newest pick is allowed to commit
  const pickToken = useRef(0);

  /**
   * Progress and the recent window are read through refs, deliberately.
   *
   * They change on every submission, and if they were effect dependencies
   * each answer would immediately trigger a fresh pick — skipping the
   * explanation and destroying the result the student just earned. Reading
   * them at pick time instead means the newest pick sees the newest state,
   * without a re-pick being scheduled by a state change.
   */
  const indexRef = useRef(index);
  indexRef.current = index;
  const recentRef = useRef(user.recent);
  recentRef.current = user.recent;

  const { mode, subject, topic, year, pin } = scope;

  const advance = useCallback(() => {
    const token = ++pickToken.current;

    setGraded(null);
    setGiven([]);
    setNatValue('');
    setFellBack(false);
    setServed((n) => n + 1);

    const live = indexRef.current;
    const pool = filters ? filterMetas(getAllMeta(), filters, live as StatusIndex) : getAllMeta();

    // a pinned question is served directly, with no fallback widening
    const pick = pin
      ? { meta: pool.find((m) => m.id === pin) ?? null, fellBack: false, mode }
      : pickQuestion({
          mode,
          subject,
          topic,
          year,
          metas: pool,
          index: live as StatusIndex,
          recent: recentRef.current,
        });
    setFellBack(pick.fellBack);

    const meta = pick.meta;
    if (!meta) {
      setQuestion(null);
      setLoading(false);
      return;
    }

    const wanted = meta.id;
    const needed = getYearFor(wanted);

    if (needed === undefined || isYearLoaded(needed)) {
      setQuestion(getQuestion(wanted) ?? null);
      setLoading(false);
      return;
    }

    // fetch the year chunk, then hydrate
    setHydrating(true);
    setQuestion(null);
    void loadYear(needed)
      .then(() => {
        if (pickToken.current !== token) return; // superseded by a newer pick
        setQuestion(getQuestion(wanted) ?? null);
      })
      .finally(() => {
        if (pickToken.current !== token) return;
        setHydrating(false);
        setLoading(false);
      });
  }, [mode, subject, topic, year, pin, filters]);

  // re-pick only when the scope or the filters change — never on a submission
  useEffect(() => {
    setLoading(true);
    advance();
  }, [advance]);

  const locked = graded !== null;

  const select = useCallback(
    (key: string) => {
      if (locked) return; // the answer is committed once submitted
      setGiven((current) => {
        if (question?.type === 'MSQ') {
          return current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
        }
        return [key];
      });
    },
    [locked, question?.type],
  );

  const canSubmit = useMemo(() => {
    if (!question || locked) return false;
    if (question.type === 'NAT') return natValue.trim() !== '';
    return given.length > 0;
  }, [question, given, natValue, locked]);

  const submitAnswer = useCallback(() => {
    if (!question || !canSubmit) return;
    const answer = question.type === 'NAT' ? [natValue.trim()] : given;
    setGraded(submit(question, answer));
  }, [question, canSubmit, natValue, given, submit]);

  const retry = useCallback(() => {
    setGraded(null);
    setGiven([]);
    setNatValue('');
  }, []);

  // display only, so it can track the live index without affecting picking
  const poolSize = useMemo(
    () => (filters ? filterMetas(getAllMeta(), filters, index as StatusIndex) : getAllMeta()).length,
    [filters, index],
  );

  return {
    question,
    loading,
    hydrating,
    given,
    natValue,
    graded,
    served,
    fellBack,
    poolSize,
    select,
    setNatValue,
    canSubmit,
    submit: submitAnswer,
    next: advance,
    retry,
    mark: () => (question ? toggleMark(question.id) : false),
  };
}
