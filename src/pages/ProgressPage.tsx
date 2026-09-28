import { useMemo } from 'react';
import { Page, PageHeading } from '@/components/layout/AppShell';
import { Meter, SectionTitle, EmptyState } from '@/components/common/Display';
import { useUser } from '@/state/UserStore';
import { useBank } from '@/state/BankStore';
import { getAllMeta } from '@/services/questionService';
import {
  activitySeries,
  byDifficulty,
  bySubject,
  byType,
  byYear,
  computeOverall,
  weakSpots,
} from '@/services/statisticsService';
import { count, percent, signed } from '@/utils/format';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Progress. Numbers first, then breakdowns — a page to check in on, not a
 * dashboard to admire. No charts beyond a simple bar, no fake trends.
 */
export function ProgressPage() {
  const { user, index } = useUser();
  const { manifest } = useBank();
  const metas = getAllMeta();

  const overall = useMemo(() => computeOverall(metas, user, index), [metas, user, index]);
  const subjects = useMemo(() => bySubject(metas, user), [metas, user]);
  const years = useMemo(() => byYear(metas, user), [metas, user]);
  const types = useMemo(() => byType(metas, user), [metas, user]);
  const difficulties = useMemo(() => byDifficulty(metas, user), [metas, user]);
  const weak = useMemo(() => weakSpots(metas, user), [metas, user]);
  const activity = useMemo(() => activitySeries(user, 14), [user]);

  const peak = Math.max(1, ...activity.map((d) => d.attempted));

  if (overall.total === 0) {
    return (
      <Page>
        <EmptyState
          icon={<BarChart3 aria-hidden className="size-7" />}
          title="No progress yet"
          description="Answer a few questions and your accuracy, coverage and weak areas will appear here."
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeading
        title="Progress"
        description={
          manifest
            ? `${count(overall.attempted)} of ${count(overall.total)} questions attempted.`
            : undefined
        }
      />

      {/* the four numbers that matter, in a plain grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Accuracy" value={`${overall.accuracy}%`} hint={`${count(overall.correct)} correct`} />
        <Stat label="Coverage" value={`${overall.coverage}%`} hint={`${count(overall.unattempted)} left`} />
        <Stat label="Marks" value={signed(overall.marksEarned)} hint={`of ${count(overall.marksPossible)}`} />
        <Stat
          label="Wrong"
          value={count(overall.wrong)}
          hint={overall.wrong ? 'to revisit' : 'all clear'}
          tone={overall.wrong ? 'bad' : 'ok'}
        />
      </div>

      <section className="mt-7">
        <SectionTitle>Coverage of the bank</SectionTitle>
        <Meter value={overall.coverage} />
        <p className="mt-1.5 text-xs text-fg2">
          {count(overall.attempted)} attempted · {count(overall.unattempted)} not seen
        </p>
      </section>

      <section className="mt-7">
        <SectionTitle>Last 14 days</SectionTitle>
        {overall.totalAttempts === 0 ? (
          <p className="text-sm text-fg2">No activity recorded yet.</p>
        ) : (
          <ul className="flex h-24 items-end gap-1">
            {activity.map((d) => (
              <li
                key={d.day}
                className="flex flex-1 flex-col items-center gap-1.5"
                title={`${d.label}: ${d.attempted} attempted, ${d.correct} correct`}
              >
                <div
                  className={cn(
                    'w-full rounded-t-[3px] transition-[height] duration-300',
                    d.attempted ? 'bg-brand' : 'bg-raised',
                  )}
                  style={{ height: `${Math.max(3, (d.attempted / peak) * 100)}%` }}
                />
                <span className="text-[9px] text-fg3">{d.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {weak.length > 0 && (
        <section className="mt-7">
          <SectionTitle>Needs work</SectionTitle>
          <ul className="space-y-2">
            {weak.map((w) => (
              <li key={w.subject} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{w.subject}</span>
                <span className="tnum w-14 shrink-0 text-right text-xs text-fg2">
                  {w.attempted} attempts
                </span>
                <Meter
                  value={w.accuracy}
                  tone={w.accuracy < 50 ? 'bad' : w.accuracy < 75 ? 'warn' : 'ok'}
                  className="w-24 shrink-0"
                />
                <span className="tnum w-11 shrink-0 text-right text-xs text-fg2">{w.accuracy}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <Breakdown title="By subject" rows={subjects} />
        <Breakdown title="By year" rows={years} />
        <Breakdown title="By type" rows={types} />
        <Breakdown title="By difficulty" rows={difficulties} />
      </div>
    </Page>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'ok' | 'bad';
}) {
  return (
    <div className="surface px-3.5 py-3">
      <p className="text-2xs font-medium uppercase tracking-wide text-fg2">{label}</p>
      <p
        className={cn(
          'tnum mt-1 text-2xl font-semibold',
          tone === 'ok' ? 'text-ok' : tone === 'bad' ? 'text-bad' : 'text-fg',
        )}
      >
        {value}
      </p>
      {hint && <p className="tnum mt-0.5 text-2xs text-fg3">{hint}</p>}
    </div>
  );
}

interface Bucket {
  key: string;
  label: string;
  total: number;
  attempted: number;
  correct: number;
}

function Breakdown({ title, rows }: { title: string; rows: Bucket[] }) {
  if (!rows?.length) return null;
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-2">
        {rows.map((r) => {
          const coverage = percent(r.attempted, r.total);
          const accuracy = r.attempted ? percent(r.correct, r.attempted) : 0;
          return (
            <li key={r.key} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm text-fg">{r.label}</span>
              <span className="tnum w-12 shrink-0 text-right text-xs text-fg2">{count(r.attempted)}</span>
              <Meter value={coverage} className="w-20 shrink-0" />
              <span className="tnum w-11 shrink-0 text-right text-xs text-fg2">
                {r.attempted ? `${accuracy}%` : '—'}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
