import { memo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Question } from '@/types/question';
import { MathText } from '@/components/common/MathText';

interface OptionListProps {
  question: Question;
  selected: string[];
  onToggle: (key: string) => void;
  submitted: boolean;
  disabled?: boolean;
  idPrefix?: string;
}

type State = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed';

function stateFor(
  key: string,
  selected: string[],
  submitted: boolean,
  correctKeys: Set<string>,
): State {
  const isSelected = selected.includes(key);
  if (!submitted) return isSelected ? 'selected' : 'idle';
  const isCorrect = correctKeys.has(key);
  if (isCorrect) return 'correct';
  if (isSelected) return 'wrong';
  return 'missed';
}

const styles: Record<State, string> = {
  idle: 'border-line bg-surface hover:border-line-strong hover:bg-sunken/60',
  selected: 'border-brand/50 bg-brand-soft/60 ring-1 ring-brand/25',
  correct: 'border-accent/45 bg-accent-soft/70',
  wrong: 'border-danger/45 bg-danger-soft/60',
  missed: 'border-line bg-surface/60',
};

const markerStyles: Record<State, string> = {
  idle: 'border-line-strong text-ink-mute',
  selected: 'border-brand bg-brand text-white',
  correct: 'border-accent bg-accent text-white',
  wrong: 'border-danger bg-danger text-white',
  missed: 'border-line text-ink-mute',
};

export const OptionList = memo(function OptionList({
  question,
  selected,
  onToggle,
  submitted,
  disabled,
  idPrefix = 'opt',
}: OptionListProps) {
  const options = question.options ?? [];
  const correctKeys = new Set(question.answer);

  return (
    <fieldset disabled={disabled || submitted} className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Answer options</legend>
      <ul className="space-y-2.5">
        {options.map((option) => {
          const state = stateFor(option.key, selected, submitted, correctKeys);
          const inputId = `${idPrefix}-${question.id}-${option.key}`;
          const isSelected = selected.includes(option.key);
          const showCross = submitted && state === 'wrong';
          const showCheck = submitted && state === 'correct';

          return (
            <li key={option.key}>
              <label
                htmlFor={inputId}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-[border-color,background-color,box-shadow] duration-150',
                  styles[state],
                  (disabled || submitted) && 'cursor-default',
                )}
              >
                <input
                  id={inputId}
                  type={question.type === 'MSQ' ? 'checkbox' : 'radio'}
                  name={`${idPrefix}-${question.id}`}
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => onToggle(option.key)}
                />

                <span
                  aria-hidden
                  className={cn(
                    'mt-px grid size-[22px] shrink-0 place-items-center border text-[11px] font-semibold transition-colors duration-150',
                    question.type === 'MSQ' ? 'rounded-[6px]' : 'rounded-full',
                    markerStyles[state],
                  )}
                >
                  {showCheck ? (
                    <Check className="size-3" strokeWidth={3} />
                  ) : showCross ? (
                    <X className="size-3" strokeWidth={3} />
                  ) : (
                    option.key
                  )}
                </span>

                <span
                  className={cn(
                    'min-w-0 flex-1 text-[15px] leading-relaxed',
                    state === 'missed' ? 'text-ink-mute' : 'text-ink',
                  )}
                >
                  <MathText>{option.text}</MathText>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
});
