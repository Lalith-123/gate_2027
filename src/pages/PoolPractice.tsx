import { useMemo } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ListChecks } from 'lucide-react';
import { useUser } from '@/state/UserProvider';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { PracticeQuestion } from '@/components/questions/PracticeQuestion';
import { QuestionCardSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';

interface PoolState {
  ids: string[];
  label: string;
}

export function PoolPractice() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useUser();
  const state = location.state as PoolState | null;

  const ids = useMemo(() => (Array.isArray(state?.ids) ? state!.ids : []), [state]);
  const label = state?.label ?? 'the selected questions';

  const session = usePracticeSession({ mode: 'random', poolIds: ids });

  if (!ids.length) return <Navigate to="/bank" replace />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Practising {label}</h2>
          <p className="text-xs text-ink-mute">
            {session.poolSize.toLocaleString('en-IN')} questions in this session
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => navigate('/bank')} iconLeft={<ArrowLeft aria-hidden className="size-3.5" />}>
          Edit filters
        </Button>
      </div>

      {session.exhausted || !session.question ? (
        <EmptyState
          icon={<ListChecks aria-hidden className="size-5" />}
          title="No questions left in this selection"
          body="Every question in the filtered set has been served. Change the filters or practise from the full bank."
          action={
            <Link
              to="/bank"
              className="mt-5 inline-flex h-9 items-center rounded-lg border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-sunken"
            >
              Back to the question bank
            </Link>
          }
        />
      ) : !session.question && session.loading ? (
        <QuestionCardSkeleton />
      ) : (
        <PracticeQuestion
          question={session.question}
          meta={session.meta}
          onNext={session.next}
          scopeLabel={label}
          allowRetry={settings.allowRetryAfterCorrect}
        />
      )}
    </div>
  );
}

export default PoolPractice;
