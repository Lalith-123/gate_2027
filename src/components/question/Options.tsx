import { Check, Minus } from 'lucide-react';
import { MathText } from '@/components/common/MathText';
import { cn } from '@/utils/cn';
import type { Question } from '@/types/question';

/* ------------------------------------------------------------------ *
 * Option rows.
 *
 * State is expressed with a border, a tint and a leading marker rather than
 * a fill, so the states stay distinguishable for colour-blind readers and
 * do not fight the page background. Each state also carries an icon.
 * ------------------------------------------------------------------ */

type State = 'idle' | 'selected' | 'correct' | 'missed' | 'wrong';

const STYLES: Record<State, string> = {
  idle: 'border-hair bg-card hover:border-edge',
  selected: 'border-brand/45 bg-brand-soft',
  correct: 'border-ok/45 bg-ok-soft',
  missed: 'border-ok/45 bg-ok-soft',
  wrong: 'border-bad/45 bg-bad-soft',
};

export function Options({
  question,
  given,
  locked,
  onSelect,
}: {
  question: Question;
  given: string[];
  locked: boolean;
  onSelect: (key: string) => void;
}) {
  const options = question.options ?? [];
  const answer = new Set(question.answer);
  const chosen = new Set(given);

  return (
    <ul className="space-y-2" role={question.type === 'MSQ' ? 'group' : 'radiogroup'}>
      {options.map((option) => {
        const isChosen = chosen.has(option.key);
        const isAnswer = answer.has(option.key);

        let state: State = 'idle';
        if (locked) {
          if (isAnswer) state = 'correct';
          else if (isChosen) state = 'wrong';
        } else if (isChosen) {
          state = 'selected';
        }

        return (
          <li key={option.key}>
            <button
              type="button"
              role={question.type === 'MSQ' ? 'checkbox' : 'radio'}
              aria-checked={isChosen}
              disabled={locked}
              onClick={() => onSelect(option.key)}
              className={cn(
                'flex w-full items-start gap-3 rounded-[10px] border px-3 py-2.5 text-left',
                'transition-colors duration-150 disabled:cursor-default',
                STYLES[state],
              )}
            >
              <Marker
                state={state}
                kind={question.type === 'MSQ' ? 'square' : 'round'}
                letter={option.key}
              />

              <MathText
                as="span"
                className={cn(
                  'min-w-0 flex-1 text-[15px] leading-relaxed',
                  state === 'wrong' ? 'text-bad-ink' : 'text-fg',
                )}
              >
                {option.text}
              </MathText>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Marker({
  state,
  kind,
  letter,
}: {
  state: State;
  kind: 'square' | 'round';
  letter: string;
}) {
  const base = cn(
    'mt-px grid size-6 shrink-0 place-items-center border text-2xs font-semibold uppercase transition-colors duration-150',
    kind === 'round' ? 'rounded-full' : 'rounded-md',
  );

  const tone =
    state === 'correct' || state === 'missed'
      ? 'border-ok bg-ok text-white'
      : state === 'wrong'
        ? 'border-bad bg-bad text-white'
        : state === 'selected'
          ? 'border-brand bg-brand text-white'
          : 'border-hair bg-card text-fg2';

  if (state === 'correct') return <span className={cn(base, tone)}>{letter || <Check aria-hidden className="size-3.5" />}</span>;
  if (state === 'wrong') return <span className={cn(base, tone)}>{letter || <Minus aria-hidden className="size-3.5" />}</span>;

  return <span className={cn(base, tone)}>{letter}</span>;
}
