import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty, Question, QuestionMeta, QuestionType } from '@/types/question';
import type { PracticeMode } from '@/types/question';
import { pickQuestion, describeScope } from '@/services/questionEngine';
import { useBank } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';

export interface SessionScope {
  mode: PracticeMode;
  subject?: string;
  topic?: string;
  year?: number;
  types?: QuestionType[];
  difficulties?: Difficulty[];
  /** restrict the pool to an explicit id set, e.g. a filtered result list */
  poolIds?: string[];
  /** do not draw until the caller says so */
  paused?: boolean;
}

export interface PracticeSession {
  question: Question | undefined;
  meta: QuestionMeta | undefined;
  currentId: string | null;
  next: () => void;
  /** redraw without excluding the current question */
  reshuffle: () => void;
  scopeLabel: string;
  poolSize: number;
  fellBack: boolean;
  loading: boolean;
  exhausted: boolean;
}

const MODE_LABEL: Record<PracticeMode, string> = {
  random: 'random questions',
  unattempted: 'unattempted questions',
  wrong: 'wrong questions',
  revision: 'your revision list',
  subject: 'this subject',
  topic: 'this topic',
  year: 'this year',
  difficult: 'the harder questions',
};

export function usePracticeSession(scope: SessionScope): PracticeSession {
  const { metas, getMeta, getQuestion, ensureQuestion } = useBank();
  const { user, index } = useUser();

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fellBack, setFellBack] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const currentRef = useRef<string | null>(null);
  currentRef.current = currentId;

  const pool = useMemo(() => {
    if (!scope.poolIds) return metas;
    const set = new Set(scope.poolIds);
    return metas.filter((m) => set.has(m.id));
  }, [metas, scope.poolIds]);

  const draw = useCallback(
    (exclude: string | undefined) => {
      const result = pickQuestion({
        metas: pool,
        index,
        recent: user.recent,
        mode: scope.mode,
        subject: scope.subject,
        topic: scope.topic,
        year: scope.year,
        types: scope.types,
        difficulty: scope.difficulties,
        exclude,
      });

      setFellBack(result.fellBack);
      setExhausted(result.meta === null);

      if (!result.meta) {
        setCurrentId(null);
        return;
      }
      setCurrentId(result.meta.id);
      setLoading(true);
      void ensureQuestion(result.meta.id).finally(() => setLoading(false));
    },
    [pool, index, user.recent, scope.mode, scope.subject, scope.topic, scope.year, scope.types, scope.difficulties, ensureQuestion],
  );

  // Draw the first question as soon as the bank is ready.
  const ready = pool.length > 0;
  useEffect(() => {
    if (scope.paused || !ready) return;
    if (currentId && getMeta(currentId)) return;
    draw(undefined);
  }, [scope.paused, ready, currentId, getMeta, draw]);

  const next = useCallback(() => draw(currentRef.current ?? undefined), [draw]);
  const reshuffle = useCallback(() => draw(undefined), [draw]);

  // Redraw whenever the scope itself changes (mode, subject, filters).
  const signature = [
    scope.mode,
    scope.subject ?? '',
    scope.topic ?? '',
    scope.year ?? '',
    scope.types?.join(',') ?? '',
    scope.difficulties?.join(',') ?? '',
    scope.poolIds ? 'pool' : 'all',
  ].join('|');
  const lastSignature = useRef(signature);

  useEffect(() => {
    if (lastSignature.current === signature) return;
    lastSignature.current = signature;
    setCurrentId(null);
  }, [signature]);

  const meta = currentId ? getMeta(currentId) : undefined;
  const question = currentId ? getQuestion(currentId) : undefined;

  const scopeLabel = useMemo(() => {
    if (scope.subject) return scope.subject;
    if (scope.topic) return scope.topic;
    if (scope.year) return `GATE ${scope.year}`;
    const described = describeScope({
      metas: pool,
      index,
      recent: user.recent,
      mode: scope.mode,
      difficulty: scope.difficulties,
      types: scope.types,
    });
    if (scope.difficulties?.length || scope.types?.length) return described.toLowerCase();
    return MODE_LABEL[scope.mode];
  }, [scope.subject, scope.topic, scope.year, scope.mode, scope.difficulties, scope.types, pool, index, user.recent]);

  return {
    question,
    meta,
    currentId,
    next,
    reshuffle,
    scopeLabel,
    poolSize: pool.length,
    fellBack,
    loading,
    exhausted,
  };
}
