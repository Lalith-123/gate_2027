import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const field =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-mute transition-[border-color,box-shadow] duration-150 hover:border-line-strong focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:opacity-50';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  invalid?: boolean;
  /** adornment rendered inside the field, before the text */
  leading?: ReactNode;
  /** adornment rendered inside the field, after the text */
  trailing?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, leading, trailing, ...rest },
  ref,
) {
  if (!leading && !trailing) {
    return <input ref={ref} className={cn(field, 'h-10', invalid && 'border-danger/60', className)} {...rest} />;
  }
  return (
    <div
      className={cn(
        'flex h-10 items-center rounded-lg border border-line bg-surface transition-[border-color,box-shadow] focus-within:border-brand/60 focus-within:ring-2 focus-within:ring-brand/25',
        invalid && 'border-danger/60',
        className,
      )}
    >
      {leading && <span className="pl-3 text-ink-mute">{leading}</span>}
      <input
        ref={ref}
        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-ink-mute focus:outline-none"
        {...rest}
      />
      {trailing && <span className="pr-3 text-ink-mute">{trailing}</span>}
    </div>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 5, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(field, 'resize-y py-2.5 leading-relaxed', invalid && 'border-danger/60', className)}
      {...rest}
    />
  );
});

export interface FieldShellProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Field({ label, hint, htmlFor, children, className, actions }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-soft">
          {label}
        </label>
        {actions}
      </div>
      {children}
      {hint && <p className="text-xs leading-relaxed text-ink-mute">{hint}</p>}
    </div>
  );
}
