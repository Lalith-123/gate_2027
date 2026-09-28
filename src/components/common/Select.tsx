import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  label?: string;
  /** visually hides the label but keeps it for screen readers */
  hideLabel?: boolean;
  wrapperClassName?: string;
  leading?: ReactNode;
}

export function Select({
  options,
  label,
  hideLabel,
  className,
  wrapperClassName,
  leading,
  ...rest
}: SelectProps) {
  const id = useId();
  return (
    <div className={cn('relative', wrapperClassName)}>
      {label && (
        <label htmlFor={id} className={cn(hideLabel ? 'sr-only' : 'mb-1.5 block text-[13px] font-medium text-ink-soft')}>
          {label}
        </label>
      )}
      {leading && <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-mute">{leading}</span>}
      <select
        id={id}
        className={cn(
          'h-10 w-full cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-3 pr-8 text-sm text-ink transition-[border-color,box-shadow] duration-150 hover:border-line-strong focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/25',
          leading && 'pl-8',
          className,
        )}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-mute"
      />
    </div>
  );
}
