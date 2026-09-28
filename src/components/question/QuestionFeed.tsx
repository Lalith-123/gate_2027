import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, NotebookPen, RotateCcw } from 'lucide-react';
import { usePractice, type Scope } from '@/hooks/usePractice';
import { useUser } from '@/state/UserStore';
import { IconButton } from '@/components/common/Button';
import { EmptyState, Spinner, Skeleton } from '@/components/common/Display';
import { QuestionBody, QuestionMetaBar, InstructionLine } from '@/components/question/QuestionView';
import { Options } from '@/components/question/Options';
import { NatInput } from '@/components/question/NatInput';
import { ResultPanel } from '@/components/question/Result';
import { ActionBar } from '@/components/question/ActionBar';
import { QuestionNoteSheet } from '@/components/notes/QuestionNoteSheet';
import { useToast } from '@/components/common/Toast';
import { ordinal } from '@/utils/format';
import type { Filters } from '@/services/filterService';

/**
 * The practice surface: one question, full height, nothing else competing
 * for attention. Progress is a small counter, not a dashboard.
 */
export function QuestionFeed({
  scope,
  filters,
  poolLabel,
}: {
  scope: Scope;
  filters?: Filters;
  poolLabel?: string;
}) {
  const feed = usePractice(scope, filters);
  const { index, settings, user } = useUser();
  const toast = useToast();
  const [noteOpen, setNoteOpen] = useState(false);

  const q = feed.question;
  const marked = q ? index.marked.has(q.id) : false;
  const hasNote = q ? Boolean(user.notes[q.id]) : false;

  // keyboard: 1-4 pick an option, Enter submits
  const { select, canSubmit, submit: submitAnswer, graded: result } = feed;
  useEffect(() => {
    if (!q || result) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Enter' && canSubmit) {
        e.preventDefault();
        submitAnswer();
        return;
      }
      if (q.type === 'NAT' || !q.options) return;

      const position = '1234'.indexOf(e.key);
      if (position >= 0 && q.options[position]) {
        e.preventDefault();
        select(q.options[position].key);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, result, canSubmit, select, submitAnswer]);

  if (feed.loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading question">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-4/5" />
      </div>
    );
  }

  if (!q) {
    return (
      <EmptyState
        title="Nothing to practise here yet"
        description={
          feed.poolSize === 0
            ? 'No questions match the current filters. Widen the filters or pick another subject.'
            : 'Every question in this set has been answered. Try another mode or come back later.'
        }
        action={null}
      />
    );
  }

  const natState = feed.graded
    ? feed.graded.correct
      ? 'correct'
      : 'wrong'
    : 'idle';

  return (
    <div className="flex min-h-dvh flex-col">
      {/* slim progress line: how far through the pool we are */}
      <header className="mb-4 flex items-center gap-3">
        <p className="tnum text-xs text-fg2">
          {ordinal(feed.served)} question{feed.served === 1 ? '' : 's'} served
        </p>
        {poolLabel && <span className="truncate text-2xs text-fg3">· {poolLabel}</span>}
        {feed.hydrating && <Spinner className="ml-auto size-3.5 text-fg3" />}
        <span className="tnum ml-auto hidden text-2xs text-fg3 sm:block">
          {feed.poolSize} in pool
        </span>
      </header>

      <article className="animate-rise flex-1 space-y-4" key={q.id}>
        <QuestionMetaBar question={q} id={q.id} />
        <QuestionBody question={q} showImage={settings.showQuestionImages} />
        <InstructionLine question={q} />

        {q.type === 'NAT' ? (
          <NatInput
            value={feed.natValue}
            onChange={feed.setNatValue}
            disabled={feed.graded !== null}
            state={natState}
            marks={q.marks}
          />
        ) : (
          <Options
            question={q}
            given={feed.given}
            locked={feed.graded !== null}
            onSelect={feed.select}
          />
        )}

        {feed.graded && (
          <ResultPanel
            question={q}
            outcome={feed.graded}
            onNext={feed.next}
            isLast={false}
            onRetry={feed.retry}
            allowRetry={settings.allowRetryAfterCorrect}
            showExplanations={settings.showExplanations}
          />
        )}
      </article>

      <ActionBar
        canSubmit={feed.canSubmit}
        onSubmit={feed.submit}
        graded={feed.graded !== null}
        swipeToAdvance={settings.swipeToAdvance}
        onSwipeUp={feed.next}
        hint={
          feed.canSubmit
            ? 'Press Enter to submit'
            : q.type === 'NAT'
              ? 'Type an answer to continue'
              : 'Select an option to continue'
        }
      >
        <div className="flex w-full items-center gap-1.5">
          <IconButton
            label={marked ? 'Remove from revision' : 'Mark for revision'}
            variant="secondary"
            active={marked}
            onClick={() => {
              const now = feed.mark();
              toast(now ? 'Added to revision' : 'Removed from revision');
            }}
          >
            {marked ? (
              <BookmarkCheck aria-hidden className="size-4 text-brand" />
            ) : (
              <Bookmark aria-hidden className="size-4" />
            )}
          </IconButton>

          <IconButton
            label={hasNote ? 'Edit note' : 'Add note'}
            variant="secondary"
            onClick={() => setNoteOpen(true)}
          >
            <NotebookPen aria-hidden className={hasNote ? 'size-4 text-brand' : 'size-4'} />
          </IconButton>

          {feed.graded && !feed.graded.correct && (
            <IconButton label="Try again" variant="secondary" onClick={feed.retry}>
              <RotateCcw aria-hidden className="size-4" />
            </IconButton>
          )}
        </div>
      </ActionBar>

      <QuestionNoteSheet questionId={q.id} open={noteOpen} onClose={() => setNoteOpen(false)} />
    </div>
  );
}
