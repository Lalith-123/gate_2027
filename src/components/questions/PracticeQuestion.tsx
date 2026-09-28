import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Question, QuestionMeta } from '@/types/question';
import type { RecordOutcome } from '@/services/progressService';
import { normaliseNatInput, parseNumeric } from '@/services/gradeService';
import { useUser } from '@/state/UserProvider';
import { Badge } from '@/components/common/Badge';
import { MathText } from '@/components/common/MathText';
import { OptionList } from '@/components/questions/OptionList';
import { NatInput } from '@/components/questions/NatInput';
import { QuestionFigure } from '@/components/questions/QuestionFigure';
import { AnswerResult } from '@/components/questions/AnswerResult';
import { QuestionActions } from '@/components/questions/QuestionActions';
import { SwipeBar, SwipeHint } from '@/components/questions/SwipeBar';

/* Green and red are reserved for correct/incorrect, so difficulty uses the
   cool half of the palette instead. */
const DIFFICULTY_TONE = { Easy: 'info', Medium: 'brand', Hard: 'warn' } as const;

const TYPE_HINT: Record<Question['type'], string> = {
  MCQ: 'Exactly one option is correct.',
  MSQ: 'One or more options may be correct. Select every correct one.',
  NAT: 'Enter a natural number or a decimal value.',
};

function QuestionMetaRow({ question, meta }: { question: Question; meta?: QuestionMeta }) {
  const year = question.year || meta?.y;
  const subject = question.subject && question.subject !== 'Uncategorised' ? question.subject : (meta?.s ?? question.subject);
  const topic = question.topic && question.topic !== 'General' ? question.topic : (meta?.t ?? question.topic);
  const negative = question.negativeMarks > 0 ? `−${question.negativeMarks}` : '0';
  return (
    <div className="flex items-center gap-2 text-[13px] sm:flex-wrap sm:gap-x-2.5 sm:gap-y-1.5">
      <span className="shrink-0 font-semibold tabular-nums text-ink">GATE {year}</span>
      <span aria-hidden className="hidden text-line-strong sm:inline">
        /
      </span>
      {/* on a phone this is one clipped line rather than a wrapping block */}
      <span className="min-w-0 flex-1 truncate text-ink-soft sm:flex-none">
        {subject}
        <span aria-hidden className="mx-1.5 hidden text-line-strong sm:inline">
          /
        </span>
        <span className="hidden text-ink-mute sm:inline">{topic}</span>
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-1.5">
        <Badge tone={DIFFICULTY_TONE[question.difficulty]} dot>
          {question.difficulty}
        </Badge>
        <Badge tone={question.type === 'NAT' ? 'info' : question.type === 'MSQ' ? 'warn' : 'brand'}>{question.type}</Badge>
        <span className="hidden text-2xs tabular-nums text-ink-mute sm:inline">
          +{question.marks} / −{negative}
        </span>
      </span>
    </div>
  );
}

export function PracticeQuestion({
  question,
  meta,
  onNext,
  nextLabel = 'Next question',
  scopeLabel,
  isFavouriteMode,
  allowRetry,
}: {
  question: Question;
  meta?: QuestionMeta;
  onNext: () => void;
  nextLabel?: string;
  scopeLabel?: string;
  isFavouriteMode?: boolean;
  allowRetry?: boolean;
}) {
  const { settings, submit, user } = useUser();
  const [selected, setSelected] = useState<string[]>([]);
  const [nat, setNat] = useState('');
  const [outcome, setOutcome] = useState<RecordOutcome | null>(null);
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const submitted = outcome !== null;

  useEffect(() => {
    setSelected([]);
    setNat('');
    setOutcome(null);
    setTouchedSubmit(false);
    headingRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [question.id]);

  const toggle = useCallback(
    (key: string) => {
      setSelected((prev) => {
        if (question.type === 'MSQ') return prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        return prev.length === 1 && prev[0] === key ? [] : [key];
      });
    },
    [question.type],
  );

  const given = useMemo(
    () => (question.type === 'NAT' ? (nat.trim() ? [normaliseNatInput(nat)] : []) : selected),
    [question.type, nat, selected],
  );

  const natValid = question.type !== 'NAT' || (parseNumeric(nat) !== null && nat.trim().length > 0);
  const canSubmit = given.length > 0 && natValid;

  const onSubmit = useCallback(() => {
    if (!canSubmit || submitted) return;
    setTouchedSubmit(true);
    setOutcome(submit(question, given));
  }, [canSubmit, submitted, submit, question, given]);

  // Number keys pick an option, Enter submits or advances.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (submitted && e.key === 'Enter') {
        e.preventDefault();
        onNext();
        return;
      }
      if (submitted) return;

      if (/^[1-9]$/.test(e.key)) {
        const index = Number(e.key) - 1;
        const option = question.options?.[index];
        if (option) {
          e.preventDefault();
          toggle(option.key);
        }
        return;
      }
      if (e.key === 'Enter' && canSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question.options, submitted, canSubmit, onNext, onSubmit, toggle]);

  const attempts = user.questions[question.id]?.attempts ?? 0;

  return (
    // Re-keyed per question so the card replays its entrance and the swipe
    // bar resets, which is what makes a session feel like a feed.
    <article key={question.id} className="panel animate-fade-rise overflow-hidden">
      <div ref={headingRef} className="scroll-mt-20 border-b border-line px-4 py-2.5 sm:px-6 sm:py-3.5">
        <QuestionMetaRow question={question} meta={meta} />
        {scopeLabel && (
          <p className="mt-1 truncate text-2xs font-medium uppercase tracking-wider text-brand">
            Practising {scopeLabel}
          </p>
        )}
        <p className="mt-1 hidden font-mono text-2xs text-ink-mute sm:block">
          {question.id}
          {attempts > 0 && !submitted && (
            <span className="ml-2 font-sans text-ink-mute">
              · {attempts} previous {attempts === 1 ? 'attempt' : 'attempts'}
            </span>
          )}
        </p>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <MathText className="block text-[16px] font-medium leading-[1.7] text-ink sm:text-[17px]">
          {question.question}
        </MathText>

        {settings.showQuestionImages && question.image && (
          <QuestionFigure src={question.image} alt={`Figure for question ${question.id}`} className="mt-5" />
        )}

        {question.hint && !submitted && (
          <p className="mt-4 rounded-lg border border-line bg-sunken/60 px-3.5 py-2.5 text-[13px] leading-relaxed text-ink-soft">
            <span className="font-medium text-ink">Hint.</span> {question.hint}
          </p>
        )}

        <div className="mt-6">
          {question.type === 'NAT' ? (
            <NatInput
              value={nat}
              onChange={setNat}
              onSubmit={onSubmit}
              submitted={submitted}
              hint={TYPE_HINT.NAT}
            />
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-ink-mute">{TYPE_HINT[question.type]}</p>
              <OptionList
                question={question}
                selected={selected}
                onToggle={toggle}
                submitted={submitted}
              />
            </div>
          )}
        </div>

        {submitted && outcome && (
          <div className="mt-6">
            <AnswerResult
              question={question}
              given={given}
              outcome={outcome}
              showExplanation={settings.showExplanations}
            />
          </div>
        )}

        {touchedSubmit && !canSubmit && !submitted && (
          <p role="alert" className="mt-4 text-[13px] text-danger">
            {question.type === 'NAT'
              ? 'Enter a number before submitting.'
              : 'Select an option before submitting.'}
          </p>
        )}
      </div>

      <div className="border-t border-line bg-surface px-3 py-2.5 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <QuestionActions question={question} />
          <div className="min-w-0 flex-1">
            <SwipeBar
              submitted={submitted}
              canSubmit={canSubmit}
              swipeEnabled={settings.swipeToAdvance}
              onSubmit={onSubmit}
              onNext={onNext}
              onRetry={onSubmit}
              allowRetry={allowRetry && outcome?.correct === true}
              nextLabel={nextLabel}
              nextIcon={isFavouriteMode ? 'shuffle' : 'arrow'}
            />
          </div>
        </div>
        <SwipeHint visible={settings.swipeToAdvance && submitted} />
      </div>
    </article>
  );
}
