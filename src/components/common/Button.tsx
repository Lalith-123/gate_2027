import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';
export type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover active:bg-brand-hover border-transparent',
  secondary: 'bg-card text-fg border-hair hover:bg-raised',
  ghost: 'bg-transparent text-fg2 border-transparent hover:bg-raised hover:text-fg',
  danger: 'bg-bad-soft text-bad-ink border-transparent hover:bg-bad/15',
  quiet: 'bg-raised text-fg2 border-transparent hover:bg-hair/70 hover:text-fg',
};

/* Buttons are 36px / 42px / 46px — compact enough to stay out of the way,
   large enough to hit comfortably on a phone. */
const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-3 text-[13px]',
  md: 'h-[42px] gap-2 px-3.5 text-sm',
  lg: 'h-11 gap-2 px-5 text-[15px]',
};

const BASE =
  'inline-flex select-none items-center justify-center rounded-[9px] border font-medium ' +
  'transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-45';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', block, icon, trailing, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
      {...rest}
    >
      {icon}
      {children}
      {trailing}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  size?: Size;
  active?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', active, className, children, ...rest },
  ref,
) {
  const box = size === 'sm' ? 'size-8' : size === 'lg' ? 'size-11' : 'size-9';
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : active}
      className={cn(BASE, VARIANTS[variant], box, 'px-0', active && 'text-brand', className)}
      {...rest}
    >
      {children}
    </button>
  );
});

/** Same visual language as Button, but a router link. */
export function ButtonLink({
  to,
  variant = 'secondary',
  size = 'md',
  block,
  icon,
  className,
  children,
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(BASE, VARIANTS[variant], SIZES[size], block && 'w-full', className)}
    >
      {icon}
      {children}
    </Link>
  );
}
