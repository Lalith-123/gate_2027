import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import type { BucketStat } from '@/services/statisticsService';
import { ProgressBar } from '@/components/common/ProgressBar';

function toneFor(accuracy: number, answered: number) {
  if (!answered) return 'neutral' as const;
  if (accuracy >= 75) return 'accent' as const;
  if (accuracy >= 50) return 'warn' as const;
  return 'danger' as const;
}

const barTone = {
  accent: 'bg-accent',
  warn: 'bg-warn',
  danger: 'bg-danger',
  neutral: 'bg-ink-mute',
  brand: 'bg-brand',
  info: 'bg-info',
};

export function AccuracyList({
  rows,
  emptyLabel = 'Nothing attempted yet',
  linkTo,
  showTotal = true,
}: {
  rows: BucketStat[];
  emptyLabel?: string;
  linkTo?: (key: string) => string;
  showTotal?: boolean;
}) {
  if (!rows.length) return <p className="py-4 text-[13px] text-ink-mute">{emptyLabel}</p>;

  return (
    <ul className="divide-y divide-line">
      {rows.map((row) => {
        const answered = row.correct + row.incorrect;
        const tone = toneFor(row.accuracy, answered);

        const body = (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-[13px] font-medium text-ink">{row.label}</span>
              <span
                className={cn(
                  'shrink-0 text-[13px] font-semibold tabular-nums',
                  tone === 'accent' && 'text-accent',
                  tone === 'warn' && 'text-warn',
                  tone === 'danger' && 'text-danger',
                  tone === 'neutral' && 'text-ink-mute',
                )}
              >
                {answered === 0 ? '—' : `${row.accuracy}%`}
              </span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sunken">
              <div
                className={cn('h-full origin-left rounded-full', barTone[tone])}
                style={{ width: `${answered === 0 ? 0 : Math.max(2, row.accuracy)}%` }}
              />
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs tabular-nums text-ink-mute">
              <span>
                {showTotal
                  ? `${row.attempted} / ${row.total} attempted`
                  : `${row.attempted} attempted`}
              </span>
              {answered > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-accent">{row.correct} right</span>
                  <span aria-hidden>·</span>
                  <span className="text-danger">{row.incorrect} wrong</span>
                </>
              )}
            </div>
          </>
        );

        return (
          <li key={row.key}>
            {linkTo ? (
              <Link
                to={linkTo(row.key)}
                className="block px-4 py-3 transition-colors duration-150 hover:bg-sunken/60 sm:px-5"
              >
                {body}
              </Link>
            ) : (
              <div className="px-4 py-3 sm:px-5">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function CoveragePanel({ attempted, total }: { attempted: number; total: number }) {
  const pct = total ? Math.round((attempted / total) * 1000) / 10 : 0;
  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-2xs font-medium uppercase tracking-wider text-ink-mute">Bank coverage</h3>
        <span className="text-[13px] font-semibold tabular-nums text-ink">{pct}%</span>
      </div>
      <ProgressBar value={attempted} max={Math.max(total, 1)} className="mt-2.5" label="Bank coverage" />
      <p className="mt-2 text-2xs tabular-nums text-ink-mute">
        {attempted.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} questions attempted
      </p>
    </div>
  );
}
