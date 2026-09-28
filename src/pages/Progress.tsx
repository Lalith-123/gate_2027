import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Flame, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  activitySeries,
  byDifficulty,
  bySubject,
  byType,
  byYear,
  computeOverall,
  weakSpots,
} from '@/services/statisticsService';
import { useBank } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';
import { AccuracyList, CoveragePanel } from '@/components/statistics/AccuracyList';
import { StatStrip, statIcons } from '@/components/statistics/StatStrip';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';

function Panel({ title, hint, children, action }: { title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-2xs text-ink-mute">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ActivityChart({ user }: { user: ReturnType<typeof useUser>['user'] }) {
  const series = useMemo(() => activitySeries(user, 14), [user]);
  const max = Math.max(1, ...series.map((p) => p.attempted));

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex h-28 items-end gap-1.5">
        {series.map((point) => {
          const height = (point.attempted / max) * 100;
          const correctHeight = point.attempted ? (point.correct / point.attempted) * height : 0;
          return (
            <div key={point.day} className="group relative flex flex-1 flex-col justify-end gap-0.5" style={{ height: '100%' }}>
              <div
                className="w-full rounded-t-[3px] bg-danger/25"
                style={{ height: `${height}%` }}
                title={`${point.attempted} attempts, ${point.correct} correct`}
              >
                <div className="w-full rounded-t-[3px] bg-accent" style={{ height: `${(correctHeight / Math.max(height, 0.001)) * 100}%` }} />
              </div>
              {height === 0 && <div className="h-px w-full bg-line" />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between text-2xs text-ink-mute">
        <span>{series[0]?.label}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span aria-hidden className="size-2 rounded-sm bg-accent" /> correct
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden className="size-2 rounded-sm bg-danger/40" /> wrong
          </span>
          <span>{series[series.length - 1]?.label}</span>
        </span>
      </div>
    </div>
  );
}

export function Progress() {
  const { metas, total, status, error } = useBank();
  const { user, index } = useUser();

  const stats = useMemo(() => computeOverall(metas, user, index), [metas, user, index]);
  const subjects = useMemo(() => bySubject(metas, user), [metas, user]);
  const years = useMemo(() => byYear(metas, user), [metas, user]);
  const types = useMemo(() => byType(metas, user), [metas, user]);
  const difficulties = useMemo(() => byDifficulty(metas, user), [metas, user]);
  const weak = useMemo(() => weakSpots(metas, user), [metas, user]);

  const started = stats.attempted > 0;

  if (status === 'error') {
    return <ErrorState title="The question bank could not be loaded" message={error ?? undefined} onRetry={() => location.reload()} />;
  }

  if (!started) {
    return (
      <div className="space-y-4">
        <StatStrip
          items={[
            { label: 'Questions', value: total.toLocaleString('en-IN') },
            { label: 'Attempted', value: '0' },
            { label: 'Correct', value: '0', tone: 'accent' },
            { label: 'Accuracy', value: '—' },
            { label: 'For revision', value: '0', tone: 'warn' },
          ]}
        />
        <EmptyState
          icon={<Activity aria-hidden className="size-5" />}
          title="No attempts recorded yet"
          body="Once you answer a few questions this page fills in with subject-wise accuracy, weak areas and a daily activity streak. Nothing is tracked until you submit an answer."
          action={
            <Link
              to="/"
              className="mt-5 inline-flex h-9 items-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Start with a random question
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatStrip
        items={[
          {
            label: 'Attempted',
            value: stats.attempted.toLocaleString('en-IN'),
            hint: `${stats.totalAttempts.toLocaleString('en-IN')} total tries`,
            icon: statIcons.attempted,
          },
          { label: 'Correct', value: stats.correct.toLocaleString('en-IN'), tone: 'accent', icon: statIcons.correct },
          { label: 'Incorrect', value: stats.incorrect.toLocaleString('en-IN'), tone: 'danger', icon: statIcons.incorrect },
          { label: 'Accuracy', value: `${stats.accuracy}%`, icon: <TrendingUp aria-hidden className="size-3" /> },
          { label: 'For revision', value: stats.marked.toLocaleString('en-IN'), tone: 'warn', icon: statIcons.marked, to: '/revision' },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Subject-wise performance" hint="Accuracy over every question you have answered in that subject.">
            <div className="max-h-[440px] overflow-y-auto scroll-thin">
              <AccuracyList rows={subjects} linkTo={(key) => `/subject/${encodeURIComponent(key)}`} />
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <CoveragePanel attempted={stats.attempted} total={stats.total} />

          <Panel title="Needs attention" hint="Lowest accuracy, at least three attempts each.">
            {weak.length === 0 ? (
              <p className="px-5 py-5 text-[13px] leading-relaxed text-ink-mute">
                No subject stands out yet. Attempt at least three questions in a subject for it to appear here.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {weak.map((w) => (
                  <li key={w.subject}>
                    <Link
                      to={`/subject/${encodeURIComponent(w.subject)}`}
                      className="flex items-center justify-between gap-3 px-5 py-2.5 transition-colors hover:bg-sunken/60"
                    >
                      <span className="min-w-0 truncate text-[13px] text-ink">{w.subject}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-2xs tabular-nums text-ink-mute">{w.attempted} tried</span>
                        <span className="text-[13px] font-semibold tabular-nums text-danger">{w.accuracy}%</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Last 14 days" hint="Green is correct, red is incorrect.">
            <ActivityChart user={user} />
          </Panel>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="By question type" hint="How the three GATE formats are going.">
          <AccuracyList rows={types} />
        </Panel>
        <Panel title="By difficulty" hint="Difficulty is taken from the question bank.">
          <AccuracyList rows={difficulties} />
        </Panel>
        <Panel title="By GATE year" hint="Paper-wise accuracy across the bank.">
          <AccuracyList rows={years} />
        </Panel>
      </div>

      <div className="panel px-4 py-4 sm:px-5">
        <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-ink">Marks</h2>
        <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <Target aria-hidden className="size-4 text-ink-mute" />
            <span className="text-2xs uppercase tracking-wider text-ink-mute">Earned</span>
            <span className="text-[15px] font-semibold tabular-nums text-ink">{stats.marksEarned.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xs uppercase tracking-wider text-ink-mute">Possible</span>
            <span className="text-[15px] font-semibold tabular-nums text-ink-soft">{stats.marksPossible.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame aria-hidden className="size-4 text-warn" />
            <span className="text-2xs uppercase tracking-wider text-ink-mute">Lost to negatives</span>
            <span className="text-[15px] font-semibold tabular-nums text-danger">
              −{stats.negativeLost.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      <div className={cn('flex flex-wrap gap-2')}>
        <Link
          to="/wrong"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-sunken"
        >
          Review {stats.wrong} wrong {stats.wrong === 1 ? 'question' : 'questions'}
        </Link>
        <Link
          to="/revision"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-sunken"
        >
          Practise {stats.marked} marked
        </Link>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            window.location.href = '/';
          }}
        >
          Keep practising
        </Button>
        <Badge tone="neutral" className="self-center">
          Progress is stored on this device
        </Badge>
      </div>
    </div>
  );
}

export default Progress;
