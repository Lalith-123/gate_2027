import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-45';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-hover',
  secondary: 'bg-sunken text-ink hover:bg-line/60',
  outline: 'border border-line-strong bg-transparent text-ink hover:bg-sunken',
  ghost: 'text-ink-soft hover:bg-sunken hover:text-ink',
  danger: 'bg-danger text-white hover:brightness-110',
  success: 'bg-accent text-white hover:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 rounded-lg px-3 text-[13px]',
  md: 'h-10 rounded-lg px-4 text-sm',
  lg: 'h-12 rounded-xl px-6 text-[15px]',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', loading, block, iconLeft, iconRight, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export interface LinkButtonProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children?: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  block,
  className,
  children,
  iconLeft,
  iconRight,
  ...rest
}: LinkButtonProps) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], block && 'w-full', className)} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
