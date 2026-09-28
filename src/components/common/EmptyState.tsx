import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  to?: string;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon, title, body, action, to, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-line text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 grid size-11 place-items-center rounded-xl bg-sunken text-ink-mute">{icon}</div>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {body && <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-mute">{body}</p>}
      {action ?? (to ? <Link to={to} className="mt-5 text-sm font-medium text-brand hover:underline">{title} →</Link> : null)}
    </div>
  );
}
