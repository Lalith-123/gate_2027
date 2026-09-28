import { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({ checked, onChange, label, description, disabled, className, id }: SwitchProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn('flex items-start justify-between gap-6 py-3', className)}>
      <div className="min-w-0">
        <label htmlFor={inputId} className="block cursor-pointer text-sm font-medium text-ink">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-mute">{description}</p>}
      </div>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-10 shrink-0 rounded-full border transition-colors duration-200 ease-out disabled:opacity-40',
          checked ? 'border-brand bg-brand' : 'border-line-strong bg-sunken',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-1/2 size-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-[left] duration-200 ease-out',
            checked ? 'left-[19px]' : 'left-[2px]',
          )}
        />
        <Check aria-hidden className="sr-only" />
      </button>
    </div>
  );
}
