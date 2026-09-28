import { Link } from 'react-router-dom';
import { Bookmark, FileText, Target, TriangleAlert, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface StatTile {
  label: string;
  value: string;
  hint?: string;
  to?: string;
  tone?: 'neutral' | 'brand' | 'accent' | 'danger' | 'warn';
  icon?: ReactNode;
}

const tones = {
  neutral: 'text-ink',
  brand: 'text-brand',
  accent: 'text-accent',
  danger: 'text-danger',
  warn: 'text-warn',
};

const iconTones = {
  neutral: 'bg-sunken text-ink-mute',
  brand: 'bg-brand-soft text-brand-ink',
  accent: 'bg-accent-soft text-accent-ink',
  danger: 'bg-danger-soft text-danger-ink',
  warn: 'bg-warn-soft text-warn-ink',
};

/**
 * A deliberately compact statistics strip. The question is the subject of this
 * page, so the numbers stay small and inline.
 */
export function StatStrip({ items, className }: { items: StatTile[]; className?: string }) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 xl:grid-cols-5',
        className,
      )}
    >
      {items.map((item) => {
        const tone = item.tone ?? 'neutral';
        const body = (
          <>
            <dt className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wider text-ink-mute">
              {item.icon && <span className={cn('grid size-5 place-items-center rounded-md', iconTones[tone])}>{item.icon}</span>}
              {item.label}
            </dt>
            <dd className={cn('mt-1.5 text-xl font-semibold tabular-nums tracking-[-0.02em]', tones[tone])}>
              {item.value}
            </dd>
            {item.hint && <p className="mt-0.5 truncate text-2xs text-ink-mute">{item.hint}</p>}
          </>
        );

        return item.to ? (
          <Link
            key={item.label}
            to={item.to}
            className="group bg-surface px-4 py-3 transition-colors duration-150 hover:bg-sunken/70"
          >
            {body}
          </Link>
        ) : (
          <div key={item.label} className="bg-surface px-4 py-3">
            {body}
          </div>
        );
      })}
    </dl>
  );
}

export const statIcons = {
  attempted: <Target aria-hidden className="size-3" />,
  correct: <TrendingUp aria-hidden className="size-3" />,
  incorrect: <TriangleAlert aria-hidden className="size-3" />,
  marked: <Bookmark aria-hidden className="size-3" />,
  notes: <FileText aria-hidden className="size-3" />,
};
