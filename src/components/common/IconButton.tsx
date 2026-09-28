import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'neutral' | 'brand' | 'warn' | 'danger' | 'accent';
  active?: boolean;
  children: ReactNode;
}

const sizes = {
  sm: 'size-8 rounded-md',
  md: 'size-9 rounded-lg',
  lg: 'size-11 rounded-lg',
};

const tones = {
  neutral: 'text-ink-soft hover:bg-sunken hover:text-ink',
  brand: 'text-brand hover:bg-brand-soft',
  warn: 'text-warn hover:bg-warn-soft',
  danger: 'text-danger hover:bg-danger-soft',
  accent: 'text-accent hover:bg-accent-soft',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', tone = 'neutral', active, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        'inline-grid shrink-0 place-items-center transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40',
        sizes[size],
        tones[tone],
        active && 'bg-brand-soft text-brand-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
