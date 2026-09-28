import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ListChecks, Play } from 'lucide-react';
import type { PracticeMode } from '@/types/question';
import { bucketise } from '@/services/statisticsService';
import { useBank } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { PracticeQuestion } from '@/components/questions/PracticeQuestion';
import { QuestionCardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button, LinkButton } from '@/components/common/Button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Segmented } from '@/components/common/Segmented';
import { Badge } from '@/components/common/Badge';

const MODES: { value: PracticeMode; label: string }[] = [
  { value: 'random', label: 'Random' },
  { value: 'unattempted', label: 'Unattempted' },
  { value: 'wrong', label: 'Wrong' },
  { value: 'revision', label: 'Revision' },
];

export function SubjectPractice() {
  const { name = '' } = useParams<{ name: string }>();
  const subject = decodeURIComponent(name);
  const navigate = useNavigate();
  const { metas, status, error } = useBank();
  const { user, index, settings } = useUser();
  const [mode, setMode] = useState<PracticeMode>('random');

  const inBank = useMemo(() => metas.some((m) => m.s === subject), [metas, subject]);

  const pool = useMemo(() => metas.filter((m) => m.s === subject).map((m) => m.id), [metas, subject]);
  const session = usePracticeSession({ mode, subject: inBank ? subject : undefined, poolIds: pool });

  const stats = useMemo(
    () => bucketise(metas, user, (m) => m.s, (k) => k).find((s) => s.key === subject),
    [metas, user, subject],
  );

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of metas) {
      if (m.s !== subject) continue;
      counts.set(m.t, (counts.get(m.t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([topic, total]) => ({ topic, total }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [metas, subject]);

  const topicIds = useCallback(
    (topic: string) => {
      const set = new Set<string>();
      for (const m of metas) {
        if (m.s === subject && m.t === topic) set.add(m.id);
      }
      return [...set];
    },
    [metas, subject],
  );

  if (status === 'error') {
    return <ErrorState title="The question bank could not be loaded" message={error ?? undefined} onRetry={() => location.reload()} />;
  }

  if (!inBank) {
    return (
      <EmptyState
        title={`${subject} is not in the question bank`}
        body="Either the subject name is mistyped or that subject has not been added yet."
        action={
          <LinkButton to="/subjects" size="sm" className="mt-5" iconLeft={<ArrowLeft aria-hidden className="size-3.5" />}>
            All subjects
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-semibold tracking-[-0.02em] text-ink">{subject}</h2>
          <p className="text-xs text-ink-mute">
            {pool.length.toLocaleString('en-IN')} questions
            {stats ? ` · ${stats.attempted} attempted` : ''}
            {stats && stats.correct + stats.incorrect > 0 ? ` · ${stats.accuracy}% accuracy` : ''}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate('/subjects')} iconLeft={<ArrowLeft aria-hidden className="size-3.5" />}>
          Subjects
        </Button>
      </div>

      {stats && (
        <div className="panel px-4 py-3.5">
          <div className="flex items-baseline justify-between text-xs text-ink-mute">
            <span>Coverage</span>
            <span className="font-medium tabular-nums text-ink-soft">
              {stats.attempted} / {stats.total}
            </span>
          </div>
          <ProgressBar value={stats.attempted} max={stats.total} className="mt-2" size="sm" label="Subject coverage" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stats.correct > 0 && <Badge tone="accent">{stats.correct} correct</Badge>}
            {stats.incorrect > 0 && <Badge tone="danger">{stats.incorrect} incorrect</Badge>}
            {index.marked.size > 0 && <Badge tone="warn">{index.marked.size} marked overall</Badge>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          ariaLabel="Question selection mode"
          options={MODES}
          value={mode}
          onChange={setMode}
          size="sm"
          className="no-scrollbar max-w-full overflow-x-auto"
        />
        <Button
          size="sm"
          onClick={() => navigate('/practice/pool', { state: { ids: pool, label: subject } })}
          iconLeft={<Play aria-hidden className="size-3.5" />}
        >
          Play as a session
        </Button>
      </div>

      {session.exhausted || !session.question ? (
        <EmptyState
          icon={<ListChecks aria-hidden className="size-5" />}
          title={
            mode === 'unattempted'
              ? `Every ${subject} question has been attempted`
              : mode === 'wrong'
                ? 'No wrong questions in this subject'
                : mode === 'revision'
                  ? 'Nothing marked for revision in this subject'
                  : 'No questions available'
          }
          body="Switch the mode above, or play the whole subject as one session."
          action={
            <Button size="sm" variant="primary" className="mt-5" onClick={() => setMode('random')}>
              Practise randomly
            </Button>
          }
        />
      ) : !session.question && session.loading ? (
        <QuestionCardSkeleton />
      ) : (
        <PracticeQuestion
          question={session.question}
          meta={session.meta}
          onNext={session.next}
          scopeLabel={subject}
          allowRetry={settings.allowRetryAfterCorrect}
        />
      )}

      {topics.length > 0 && (
        <section className="panel p-4">
          <h3 className="text-2xs font-medium uppercase tracking-wider text-ink-mute">Topics in this subject</h3>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <li key={t.topic}>
                <button
                  type="button"
                  onClick={() => navigate('/practice/pool', { state: { ids: topicIds(t.topic), label: `${subject} · ${t.topic}` } })}
                  className="inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
                >
                  {t.topic}
                  <span className="tabular-nums text-ink-mute">{t.total}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default SubjectPractice;
