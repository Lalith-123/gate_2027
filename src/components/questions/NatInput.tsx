import { useEffect, useRef, useState } from 'react';
import { Hash, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { parseNumeric } from '@/services/gradeService';

interface NatInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  submitted: boolean;
  disabled?: boolean;
  hint?: string;
}

export function NatInput({ value, onChange, onSubmit, submitted, disabled, hint }: NatInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);
  const numeric = parseNumeric(value);
  const invalid = touched && value.trim().length > 0 && numeric === null;

  useEffect(() => {
    if (submitted) ref.current?.blur();
  }, [submitted]);

  return (
    <div className="space-y-2">
      <label htmlFor="nat-answer" className="flex items-center gap-2 text-[13px] font-medium text-ink-soft">
        <Hash aria-hidden className="size-3.5 text-ink-mute" />
        Your answer
        <span className="font-normal text-ink-mute">— a number, or a fraction such as 3/4</span>
      </label>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <input
          id="nat-answer"
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          disabled={disabled || submitted}
          onChange={(e) => {
            setTouched(true);
            onChange(e.target.value);
          }}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !submitted) {
              e.preventDefault();
              onSubmit();
            }
          }}
          aria-invalid={invalid}
          aria-describedby={invalid ? 'nat-error' : hint ? 'nat-hint' : undefined}
          placeholder="0.00"
          className={cn(
            'h-12 w-full rounded-lg border bg-surface px-4 font-mono text-base tabular-nums text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:ring-2 sm:max-w-[240px]',
            invalid ? 'border-danger/60 focus:ring-danger/20' : 'border-line focus:border-brand/60 focus:ring-brand/25',
            submitted && 'opacity-70',
          )}
        />
      </div>

      {invalid ? (
        <p id="nat-error" role="alert" className="flex items-center gap-1.5 text-xs text-danger">
          <Info aria-hidden className="size-3.5" />
          That is not a number the app can read. Enter digits, a decimal, or a fraction such as 3/4.
        </p>
      ) : hint ? (
        <p id="nat-hint" className="text-xs text-ink-mute">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
