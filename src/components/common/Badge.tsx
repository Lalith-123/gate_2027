import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'brand' | 'accent' | 'danger' | 'warn' | 'info';

const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-soft',
  brand: 'bg-brand-soft text-brand-ink',
  accent: 'bg-accent-soft text-accent-ink',
  danger: 'bg-danger-soft text-danger-ink',
  warn: 'bg-warn-soft text-warn-ink',
  info: 'bg-info-soft text-info-ink',
};

const dots: Record<Tone, string> = {
  neutral: 'bg-ink-mute',
  brand: 'bg-brand',
  accent: 'bg-accent',
  danger: 'bg-danger',
  warn: 'bg-warn',
  info: 'bg-info',
};

export interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
  size?: 'sm' | 'md';
}

export function Badge({ tone = 'neutral', dot, icon, className, children, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium tabular-nums',
        size === 'sm' ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-1 text-xs',
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', dots[tone])} />}
      {icon}
      {children}
    </span>
  );
}
