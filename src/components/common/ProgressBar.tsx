import { cn } from '@/lib/cn';

export function ProgressBar({
  value,
  max = 100,
  tone = 'brand',
  className,
  label,
  size = 'md',
}: {
  value: number;
  max?: number;
  tone?: 'brand' | 'accent' | 'danger' | 'warn' | 'info' | 'neutral';
  className?: string;
  label?: string;
  size?: 'sm' | 'md';
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const fills = {
    brand: 'bg-brand',
    accent: 'bg-accent',
    danger: 'bg-danger',
    warn: 'bg-warn',
    info: 'bg-info',
    neutral: 'bg-ink-mute',
  };

  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-sunken', size === 'sm' ? 'h-1' : 'h-1.5', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full origin-left rounded-full', fills[tone], size === 'md' && 'animate-draw-bar')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
