import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dices, Library, SlidersHorizontal, Sparkles } from 'lucide-react';
import type { PracticeMode } from '@/types/question';
import { computeOverall } from '@/services/statisticsService';
import { useBank } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { PracticeQuestion } from '@/components/questions/PracticeQuestion';
import { StatStrip, statIcons } from '@/components/statistics/StatStrip';
import { Segmented } from '@/components/common/Segmented';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { QuestionCardSkeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';

const MODES: { value: PracticeMode; label: string }[] = [
  { value: 'random', label: 'Random' },
  { value: 'unattempted', label: 'Unattempted' },
  { value: 'wrong', label: 'Wrong' },
  { value: 'revision', label: 'Revision' },
];

export function Dashboard() {
  const { metas, status, error } = useBank();
  const { user, index, settings } = useUser();
  const [mode, setMode] = useState<PracticeMode>(settings.defaultMode);

  const stats = useMemo(() => computeOverall(metas, user, index), [metas, user, index]);

  const session = usePracticeSession({ mode });

  if (status === 'error') {
    return <ErrorState title="The question bank could not be loaded" message={error ?? undefined} onRetry={() => location.reload()} />;
  }

  return (
    <div className="space-y-5">
      <StatStrip
        items={[
          {
            label: 'Attempted',
            value: stats.attempted.toLocaleString('en-IN'),
            hint: `of ${stats.total.toLocaleString('en-IN')} in the bank`,
            icon: statIcons.attempted,
          },
          { label: 'Correct', value: stats.correct.toLocaleString('en-IN'), tone: 'accent', icon: statIcons.correct },
          { label: 'Incorrect', value: stats.incorrect.toLocaleString('en-IN'), tone: 'danger', icon: statIcons.incorrect },
          {
            label: 'Accuracy',
            value: stats.correct + stats.incorrect === 0 ? '—' : `${stats.accuracy}%`,
            hint: stats.coverage > 0 ? `${stats.coverage}% of the bank covered` : 'Answer a question to begin',
          },
          {
            label: 'For revision',
            value: stats.marked.toLocaleString('en-IN'),
            tone: 'warn',
            icon: statIcons.marked,
            to: '/revision',
          },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand-ink">
            <Sparkles aria-hidden className="size-4" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Random practice</h2>
            <p className="text-xs text-ink-mute">
              {session.poolSize.toLocaleString('en-IN')} questions available · drawn without repeats
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Segmented
            ariaLabel="Question selection mode"
            options={MODES}
            value={mode}
            onChange={setMode}
            className="no-scrollbar max-w-full overflow-x-auto"
            size="sm"
          />
          <Button
            size="sm"
            onClick={session.reshuffle}
            aria-label="Draw a different question"
            title="Draw a different question"
          >
            <Dices aria-hidden className="size-4" />
          </Button>
        </div>
      </div>

      {session.fellBack && (
        <p className="rounded-lg border border-line bg-sunken/70 px-3.5 py-2.5 text-[13px] text-ink-soft">
          Nothing matches that mode yet, so a general question was drawn instead.
        </p>
      )}

      {status === 'loading' && metas.length === 0 ? (
        <QuestionCardSkeleton />
      ) : metas.length === 0 ? (
        <EmptyState
          icon={<Library aria-hidden className="size-5" />}
          title="No questions in the bank yet"
          body="Add a JSON file such as src/data/questions/gate-2027.json and it will appear here after a reload."
        />
      ) : session.exhausted || !session.question ? (
        <EmptyState
          icon={<SlidersHorizontal aria-hidden className="size-5" />}
          title={
            mode === 'unattempted'
              ? 'Every question has been attempted'
              : mode === 'wrong'
                ? 'No wrong questions right now'
                : mode === 'revision'
                  ? 'Your revision list is empty'
                  : 'No questions to show'
          }
          body="Switch the mode above, or browse the full question bank and filter it yourself."
          action={
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="primary" onClick={() => setMode('random')}>
                Practise randomly
              </Button>
              <Link
                to="/bank"
                className="inline-flex h-8 items-center rounded-lg border border-line-strong px-3 text-[13px] font-medium text-ink transition-colors hover:bg-sunken"
              >
                Open question bank
              </Link>
            </div>
          }
        />
      ) : session.loading && !session.question ? (
        <QuestionCardSkeleton />
      ) : (
        <PracticeQuestion
          question={session.question}
          meta={session.meta}
          onNext={session.next}
          scopeLabel={session.scopeLabel}
          isFavouriteMode
          allowRetry={settings.allowRetryAfterCorrect}
        />
      )}

      <p className="px-1 text-center text-2xs text-ink-mute sm:text-left">
        Press <kbd className="rounded border border-line bg-sunken px-1 py-0.5 font-mono">1</kbd>–
        <kbd className="rounded border border-line bg-sunken px-1 py-0.5 font-mono">4</kbd> to pick an option, then{' '}
        <kbd className="rounded border border-line bg-sunken px-1 py-0.5 font-mono">Enter</kbd> to submit.
      </p>
    </div>
  );
}

export default Dashboard;
