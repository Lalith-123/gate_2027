import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { useBank, useEnsureQuestion } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';
import { PracticeQuestion } from '@/components/questions/PracticeQuestion';
import { QuestionCardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button, LinkButton } from '@/components/common/Button';
import { usePracticeSession } from '@/hooks/usePracticeSession';

export function SingleQuestion() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMeta } = useBank();
  const { settings } = useUser();
  const { question, ready } = useEnsureQuestion(id);
  const meta = id ? getMeta(id) : undefined;

  // A random pool is drawn in the background so “Next question” always has a
  // destination that is different from the question on screen.
  const pool = usePracticeSession({ mode: 'random' });
  const [pendingNext, setPendingNext] = useState(false);

  useEffect(() => {
    if (!pendingNext || !pool.currentId) return;
    setPendingNext(false);
    navigate(`/practice/${pool.currentId}`, { replace: true });
  }, [pendingNext, pool.currentId, navigate]);

  const next = useCallback(() => {
    setPendingNext(true);
    pool.next();
  }, [pool]);

  if (!id) {
    return <ErrorState title="No question id in the address" message="Open a question from the question bank." />;
  }

  if (meta === undefined) {
    return (
      <EmptyState
        title="That question is not in the bank"
        body="The id in the address does not match any question. It may belong to a year that has not been added yet."
        action={
          <LinkButton to="/bank" size="sm" className="mt-5" iconLeft={<ArrowLeft aria-hidden className="size-3.5" />}>
            Back to the question bank
          </LinkButton>
        }
      />
    );
  }

  if (!ready || !question) return <QuestionCardSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(-1)}
          iconLeft={<ArrowLeft aria-hidden className="size-3.5" />}
        >
          Back
        </Button>
        <Link
          to="/bank"
          className="text-xs font-medium text-ink-mute transition-colors hover:text-ink sm:inline"
        >
          Question bank
        </Link>
        <Link
          to="/"
          aria-label="Random practice"
          title="Random practice"
          className="grid size-8 place-items-center rounded-lg text-ink-mute transition-colors hover:bg-sunken hover:text-ink sm:hidden"
        >
          <Shuffle aria-hidden className="size-4" />
        </Link>
      </div>

      <PracticeQuestion
        question={question}
        meta={meta}
        onNext={next}
        nextLabel="Next question"
        scopeLabel={`${meta.s} · ${meta.t}`}
        allowRetry={settings.allowRetryAfterCorrect}
      />

      <div className="hidden justify-center sm:flex">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate('/')}
          iconLeft={<Shuffle aria-hidden className="size-3.5" />}
        >
          Back to random practice
        </Button>
      </div>
    </div>
  );
}

export default SingleQuestion;
