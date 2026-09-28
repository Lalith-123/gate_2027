import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/common/Button';

export function ErrorState({
  title,
  message,
  onRetry,
  hint,
  className,
  compact,
}: {
  title: string;
  message?: string | null;
  onRetry?: () => void;
  hint?: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border border-danger/25 bg-danger-soft/40',
        compact ? 'px-4 py-4' : 'px-5 py-6 sm:px-6',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-px grid size-8 shrink-0 place-items-center rounded-lg bg-danger-soft text-danger">
          <AlertTriangle aria-hidden className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {message && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{message}</p>}
          {hint && <p className="mt-1.5 text-xs leading-relaxed text-ink-mute">{hint}</p>}
          {onRetry && (
            <Button size="sm" variant="outline" className="mt-3.5" onClick={onRetry} iconLeft={<RefreshCw aria-hidden className="size-3.5" />}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
