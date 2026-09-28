import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/* ------------------------------------------------------------------ *
 * Form controls. One border treatment, one focus treatment, one error
 * treatment — a native select is restyled rather than replaced so mobile
 * browsers still open their native picker.
 * ------------------------------------------------------------------ */

const FIELD =
  'w-full rounded-[9px] border border-hair bg-card text-fg placeholder:text-fg3 ' +
  'transition-colors duration-150 hover:border-edge focus:border-brand focus:outline-none ' +
  'focus:ring-2 focus:ring-brand/25 disabled:opacity-50';

function Wrapper({
  id,
  label,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-fg">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-xs text-bad-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-xs text-fg2">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
}>(function TextInput({ label, hint, error, className, id, ...rest }, ref) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error} className={className}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={cn(FIELD, 'h-10 px-3 text-sm', error && 'border-bad focus:border-bad focus:ring-bad/25')}
        {...rest}
      />
    </Wrapper>
  );
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
}>(function TextArea({ label, hint, error, className, id, rows = 5, ...rest }, ref) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error} className={className}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={cn(
          FIELD,
          'scroll-quiet resize-y px-3 py-2.5 text-sm leading-relaxed',
          error && 'border-bad focus:border-bad focus:ring-bad/25',
          className,
        )}
        {...rest}
      />
    </Wrapper>
  );
});

export interface Option<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  options: Option<string>[];
  placeholder?: string;
}>(function Select(
  { label, hint, error, options, placeholder, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <Wrapper id={fieldId} label={label} hint={hint} error={error} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          className={cn(FIELD, 'h-10 cursor-pointer appearance-none py-0 pl-3 pr-9 text-sm')}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.count === undefined ? o.label : `${o.label} (${o.count})`}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg2"
        />
      </div>
    </Wrapper>
  );
});

/** Multi-select rendered as toggleable chips — faster than a checkbox list. */
export function ChipGroup<T extends string>({
  legend,
  options,
  value,
  onChange,
  columns = false,
}: {
  legend: string;
  options: { value: T; label: string; count?: number }[];
  value: T[];
  onChange: (next: T[]) => void;
  columns?: boolean;
}) {
  const toggle = (v: T) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium text-fg">{legend}</legend>
      <div className={cn('flex flex-wrap gap-1.5', columns && 'grid grid-cols-2 gap-1.5 sm:grid-cols-3')}>
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(o.value)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-[9px] border px-3 text-[13px] transition-colors duration-150',
                on
                  ? 'border-brand/30 bg-brand-soft text-brand-ink'
                  : 'border-hair bg-card text-fg2 hover:border-edge hover:text-fg',
              )}
            >
              {on && <Check aria-hidden className="size-3.5" />}
              {o.label}
              {o.count !== undefined && <span className="tnum text-fg3">{o.count}</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm text-fg">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-fg2">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-[22px] w-[38px] shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-brand bg-brand' : 'border-hair bg-raised',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 size-[16px] -translate-y-1/2 rounded-full bg-white shadow-quiet transition-[left] duration-200 ease-out',
            checked ? 'left-[18px]' : 'left-[2px]',
          )}
        />
      </button>
    </div>
  );
}

/** Compact radio row used for theme and single-choice settings. */
export function Segmented<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-[13px] font-medium text-fg">{legend}</legend>
      <div className="inline-flex rounded-[9px] border border-hair bg-raised p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-8 rounded-[7px] px-3 text-[13px] font-medium transition-colors duration-150',
              value === o.value ? 'bg-card text-fg shadow-quiet' : 'text-fg2 hover:text-fg',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
