import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { bucketise, computeOverall } from '@/services/statisticsService';
import { useBank, useDebouncedValue } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';

export function Subjects() {
  const { facets, metas, status, error, total } = useBank();
  const { user, index } = useUser();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 150);

  const overall = useMemo(() => computeOverall(metas, user, index), [metas, user, index]);

  const rows = useMemo(
    () => bucketise(metas, user, (m) => m.s, (k) => k).sort((a, b) => a.label.localeCompare(b.label)),
    [metas, user],
  );

  const visible = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q));
  }, [rows, debounced]);

  if (status === 'error') {
    return <ErrorState title="The question bank could not be loaded" message={error ?? undefined} onRetry={() => location.reload()} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
            {facets.subjects.length} subjects
          </h2>
          <p className="text-xs text-ink-mute">
            {total.toLocaleString('en-IN')} questions · {overall.attempted.toLocaleString('en-IN')} attempted so far
          </p>
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a subject"
          aria-label="Find a subject"
                      leading={
<Search aria-hidden className="size-4" />}
          className="sm:w-64"
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          compact
          title="No subject matches that search"
          body="Try a shorter term, or clear the search to see every subject."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((row) => {
            const topicCount = facets.subjects.find((s) => s.name === row.key)?.topics.length ?? 0;
            const answered = row.correct + row.incorrect;
            const coverage = row.total ? Math.round((row.attempted / row.total) * 100) : 0;
            const tone = row.accuracy >= 75 ? 'accent' : row.accuracy >= 45 ? 'warn' : answered > 0 ? 'danger' : 'neutral';

            return (
              <li key={row.key}>
                <Link
                  to={`/subject/${encodeURIComponent(row.key)}`}
                  className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-[border-color,transform] duration-150 hover:border-line-strong hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[14px] font-semibold leading-snug tracking-[-0.01em] text-ink">{row.label}</h3>
                    <ArrowRight
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-ink-mute transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
                    />
                  </div>

                  <p className="mt-1 text-xs text-ink-mute">
                    {row.total.toLocaleString('en-IN')} questions · {topicCount} topic{topicCount === 1 ? '' : 's'}
                  </p>

                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-2xs font-medium uppercase tracking-wider text-ink-mute">Accuracy</span>
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        tone === 'accent' && 'text-accent',
                        tone === 'warn' && 'text-warn',
                        tone === 'danger' && 'text-danger',
                        tone === 'neutral' && 'text-ink-mute',
                      )}
                    >
                      {answered === 0 ? '—' : `${row.accuracy}%`}
                    </span>
                  </div>

                  <ProgressBar
                    value={row.attempted}
                    max={row.total}
                    size="sm"
                    className="mt-2"
                    label={`${row.label} coverage`}
                  />

                  <div className="mt-3 flex items-center justify-between text-2xs text-ink-mute">
                    <span className="tabular-nums">
                      {row.attempted} / {row.total} attempted
                    </span>
                    <span className="tabular-nums">{coverage}% covered</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {row.correct > 0 && <Badge tone="accent">{row.correct} correct</Badge>}
                    {row.incorrect > 0 && <Badge tone="danger">{row.incorrect} wrong</Badge>}
                    {answered === 0 && <Badge tone="neutral">Not started</Badge>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Subjects;
