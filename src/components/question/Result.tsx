import { useState } from 'react';
import { CheckCircle2, ChevronDown, CircleX, Lightbulb } from 'lucide-react';
import { MathText } from '@/components/common/MathText';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';
import { signed } from '@/utils/format';
import type { Question } from '@/types/question';
import type { AttemptRecord } from '@/state/UserStore';

/**
 * Outcome banner. One line, unambiguous, and it states the marks — a student
 * should never have to infer the score.
 */
export function ResultBanner({ outcome }: { outcome: AttemptRecord }) {
  const correct = outcome.correct;
  const partial = !correct && outcome.partialMiss;

  const tone = correct
    ? 'border-ok/35 bg-ok-soft text-ok-ink'
    : partial
      ? 'border-warn/40 bg-warn-soft text-warn-ink'
      : 'border-bad/35 bg-bad-soft text-bad-ink';

  const headline = correct
    ? 'Correct'
    : partial
      ? 'Partially correct'
      : 'Incorrect';

  return (
    <div
      className={cn('flex animate-rise items-center gap-3 rounded-[10px] border px-3.5 py-3', tone)}
      role="status"
    >
      {correct ? (
        <CheckCircle2 aria-hidden className="size-5 shrink-0" />
      ) : (
        <CircleX aria-hidden className="size-5 shrink-0" />
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{headline}</p>
        <p className="tnum text-xs opacity-80">
          {signed(outcome.awarded)} of {outcome.possible} mark{outcome.possible === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}

/** The correct answer, shown after submitting. */
export function AnswerReveal({ question }: { question: Question }) {
  if (question.type === 'NAT') {
    return (
      <p className="text-sm text-fg">
        Accepted value:{' '}
        <MathText as="span" className="tnum font-medium text-ok-ink">
          {question.answer.join(' or ')}
        </MathText>
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-fg2">Correct answer</p>
      <ul className="space-y-1">
        {question.answer.map((key) => {
          const option = question.options?.find((o) => o.key === key);
          return (
            <li key={key} className="flex gap-2 text-sm text-fg">
              <span className="tnum shrink-0 font-semibold text-ok-ink">{key}</span>
              <MathText as="span" className="min-w-0 flex-1">
                {option?.text ?? ''}
              </MathText>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The explanation, collapsed by default. Most explanations are long, and
 * collapsing keeps the result panel from pushing the next-question control
 * off screen on a phone.
 */
export function Explanation({
  question,
  defaultOpen = false,
}: {
  question: Question;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!question.explanation.trim()) return null;

  return (
    <div className="border-t border-hair pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-sm font-medium text-fg"
      >
        <Lightbulb aria-hidden className="size-4 text-brand" />
        Explanation
        <ChevronDown
          aria-hidden
          className={cn('ml-auto size-4 text-fg2 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="animate-rise mt-2.5 space-y-3">
          <MathText as="div" className="text-[15px] leading-relaxed text-fg2">
            {question.explanation}
          </MathText>
          {question.hint && (
            <p className="rounded-[9px] bg-raised px-3 py-2 text-[13px] leading-relaxed text-fg2">
              <span className="font-medium text-fg">Hint:</span> {question.hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Wraps the post-submit content and the "next" affordance together. */
export function ResultPanel({
  question,
  outcome,
  onNext,
  isLast,
  onRetry,
  allowRetry,
  showExplanations,
}: {
  question: Question;
  outcome: AttemptRecord;
  onNext: () => void;
  isLast: boolean;
  onRetry: () => void;
  allowRetry: boolean;
  /** the "Show explanations" setting */
  showExplanations: boolean;
}) {
  return (
    <div className="animate-rise space-y-4">
      <ResultBanner outcome={outcome} />

      <div className="space-y-3 rounded-[10px] border border-hair bg-raised/60 px-3.5 py-3">
        <AnswerReveal question={question} />
      </div>

      {showExplanations && <Explanation question={question} />}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button variant="primary" size="lg" onClick={onNext} className="flex-1 sm:flex-none">
          {isLast ? 'Finish session' : 'Next question'}
        </Button>
        {allowRetry && !outcome.correct && (
          <Button size="lg" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
