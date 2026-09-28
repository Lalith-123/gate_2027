import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
  size = 'md',
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
  ariaLabel: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5 rounded-lg bg-sunken p-0.5', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[7px] font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute hover:text-ink',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
