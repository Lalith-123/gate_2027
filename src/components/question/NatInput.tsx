import { useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

/**
 * Numeric answer field for NAT questions.
 *
 * Deliberately a plain text input with `inputMode="decimal"` rather than
 * `type="number"`: number inputs silently discard intermediate states like
 * "1." and "-", which makes typing an answer feel broken.
 */
export function NatInput({
  value,
  onChange,
  disabled,
  state,
  marks,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  state?: 'idle' | 'correct' | 'wrong';
  marks?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);

  // focus the field when a NAT question is served, so the keyboard can answer
  useEffect(() => {
    if (!disabled) ref.current?.focus({ preventScroll: true });
  }, [disabled]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          aria-label="Your numeric answer"
          placeholder="0.00"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled) {
              e.preventDefault();
              // the parent owns submission; Enter is handled by the action bar
            }
          }}
          className={cn(
            'tnum h-12 w-full max-w-[13rem] rounded-[10px] border bg-card px-3.5 text-lg text-fg',
            'placeholder:text-fg3 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/25',
            disabled && 'cursor-default',
            state === 'correct' && 'border-ok/45 bg-ok-soft',
            state === 'wrong' && 'border-bad/45 bg-bad-soft',
            !state || state === 'idle'
              ? 'border-hair focus:border-brand'
              : 'border-transparent',
          )}
        />
        {marks !== undefined && <span className="tnum text-xs text-fg2">{marks} mark{marks === 1 ? '' : 's'}</span>}
      </div>
      <p className="text-xs text-fg2">
        Enter the value only. Accepted answers are matched with a small tolerance.
      </p>
    </div>
  );
}
