import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/* ------------------------------------------------------------------ *
 * Small display primitives: tags, status marks, empty states, skeletons.
 * ------------------------------------------------------------------ */

type Tone = 'neutral' | 'brand' | 'ok' | 'bad' | 'warn' | 'cyan';

const TONES: Record<Tone, string> = {
  neutral: 'bg-raised text-fg2 border-transparent',
  brand: 'bg-brand-soft text-brand-ink border-transparent',
  ok: 'bg-ok-soft text-ok-ink border-transparent',
  bad: 'bg-bad-soft text-bad-ink border-transparent',
  warn: 'bg-warn-soft text-warn-ink border-transparent',
  cyan: 'bg-cyan-soft text-cyan-ink border-transparent',
};

export function Pill({
  children,
  tone = 'neutral',
  className,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-medium leading-none',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Question type badge — MCQ / MSQ / NAT, always visible for clarity. */
export function TypeTag({ type }: { type: 'MCQ' | 'MSQ' | 'NAT' }) {
  const tone = type === 'MCQ' ? 'brand' : type === 'MSQ' ? 'cyan' : 'warn';
  return <Pill tone={tone}>{type}</Pill>;
}

export function DifficultyTag({ level }: { level: 'Easy' | 'Medium' | 'Hard' }) {
  return <Pill tone={level === 'Hard' ? 'bad' : level === 'Medium' ? 'warn' : 'ok'}>{level}</Pill>;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-fg3">{icon}</div>}
      <div className="space-y-1">
        <p className="text-[15px] font-medium text-fg">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm leading-relaxed text-fg2">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[9px] bg-raised', className)} aria-hidden />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70',
        className,
      )}
    />
  );
}

/** Thin progress bar; `value` is 0-100. */
export function Meter({ value, tone = 'brand', className }: { value: number; tone?: Tone; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const bar: Record<Tone, string> = {
    neutral: 'bg-fg3',
    brand: 'bg-brand',
    ok: 'bg-ok',
    bad: 'bg-bad',
    warn: 'bg-warn',
    cyan: 'bg-cyan',
  };
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-raised', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-300 ease-out', bar[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Section heading used inside pages. */
export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-2.5 flex items-baseline justify-between gap-3', className)}>
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-fg2">{children}</h2>
      {action}
    </div>
  );
}
