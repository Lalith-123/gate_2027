import { BookOpen, CircleCheck, CircleX, Lightbulb, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Question } from '@/types/question';
import type { RecordOutcome } from '@/services/progressService';
import { MathText } from '@/components/common/MathText';

function optionText(question: Question, key: string): string | null {
  const option = question.options?.find((o) => o.key === key);
  return option ? option.text : null;
}

function AnswerLine({ label, keys, question, tone }: { label: string; keys: string[]; question: Question; tone: 'good' | 'bad' | 'mute' }) {
  const texts = keys.map((k) => optionText(question, k));
  const unresolved = texts.some((t) => t === null);

  return (
    <div className="min-w-0">
      <p
        className={cn(
          'text-2xs font-medium uppercase tracking-wider',
          tone === 'good' ? 'text-accent-ink' : tone === 'bad' ? 'text-danger-ink' : 'text-ink-mute',
        )}
      >
        {label}
      </p>
      {keys.length === 0 ? (
        <p className="mt-1 text-sm text-ink-mute">Not answered</p>
      ) : unresolved && question.type === 'NAT' ? (
        <p className="mt-1 font-mono text-[15px] font-medium tabular-nums text-ink">{keys.join(', ')}</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {keys.map((key, i) => (
            <li key={key} className="flex gap-2 text-[15px] leading-relaxed text-ink">
              <span className="mt-px font-semibold text-ink-mute">{key}</span>
              <span className="min-w-0">
                <MathText>{texts[i] ?? key}</MathText>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnswerResult({
  question,
  given,
  outcome,
  showExplanation,
}: {
  question: Question;
  given: string[];
  outcome: RecordOutcome;
  showExplanation: boolean;
}) {
  const correct = outcome.correct;
  const partialMiss = outcome.partialMiss;

  const Icon = correct ? CircleCheck : partialMiss ? MinusCircle : CircleX;
  const heading = correct ? 'Correct' : partialMiss ? 'Partially correct' : 'Incorrect';

  return (
    <section
      aria-live="polite"
      className={cn(
        'animate-fade-rise overflow-hidden rounded-lg border',
        correct ? 'border-accent/35 bg-accent-soft/45' : 'border-danger/30 bg-danger-soft/35',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-semibold',
            correct ? 'text-accent-ink' : 'text-danger-ink',
          )}
        >
          <Icon aria-hidden className="size-[18px]" />
          {heading}
        </span>

        <span className="h-3.5 w-px bg-line" aria-hidden />

        <span
          className={cn(
            'text-[13px] font-medium tabular-nums',
            outcome.awarded > 0 ? 'text-accent-ink' : outcome.awarded < 0 ? 'text-danger-ink' : 'text-ink-soft',
          )}
        >
          {outcome.awarded > 0 ? '+' : ''}
          {Number(outcome.awarded.toFixed(2))} of {outcome.possible} mark{outcome.possible === 1 ? '' : 's'}
        </span>

        {question.negativeMarks > 0 && !correct && (
          <span className="text-xs text-ink-mute">Negative marking applied</span>
        )}
        {partialMiss && !correct && question.type === 'MSQ' && (
          <span className="text-xs text-ink-mute">No partial credit for MSQ</span>
        )}
      </div>

      <div className="grid gap-4 border-t border-line/60 px-4 py-4 sm:grid-cols-2">
        <AnswerLine
          label="Your answer"
          keys={given}
          question={question}
          tone={correct ? 'mute' : 'bad'}
        />
        <AnswerLine label="Correct answer" keys={question.answer} question={question} tone="good" />
      </div>

      {partialMiss && !correct && question.type === 'MSQ' && (
        <p className="border-t border-line/60 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          {given.some((g) => question.answer.includes(g))
            ? 'You selected a correct option along with an incorrect one. GATE MSQ questions carry no partial credit, so an option that is not in the answer key cancels the whole question.'
            : 'You did not select every option that belongs to the answer key. MSQ questions require the complete set of correct options.'}
        </p>
      )}

      {showExplanation && question.explanation && (
        <div className="border-t border-line/60 px-4 py-4">
          <p className="flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wider text-ink-mute">
            <BookOpen aria-hidden className="size-3.5" />
            Explanation
          </p>
          <MathText className="mt-2 block text-[15px] leading-[1.75] text-ink-soft">{question.explanation}</MathText>
        </div>
      )}

      {!showExplanation && question.explanation && (
        <div className="border-t border-line/60 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[13px] text-ink-mute">
            <Lightbulb aria-hidden className="size-3.5" />
            An explanation is available. Turn on “Show explanations after submission” in Settings to see it here.
          </p>
        </div>
      )}
    </section>
  );
}
