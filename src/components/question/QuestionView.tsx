import { MathText } from '@/components/common/MathText';
import { TypeTag, Pill } from '@/components/common/Display';
import { cn } from '@/utils/cn';
import type { Question } from '@/types/question';

/**
 * One compact line of context above the question. It answers "what am I
 * looking at, and what is it worth" without a dashboard-style header card.
 */
export function QuestionMetaBar({ question, id }: { question: Question; id?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-fg2">
      <TypeTag type={question.type} />
      <Pill>{question.subject}</Pill>
      {question.topic && <span className="truncate">{question.topic}</span>}
      <span aria-hidden className="text-fg3">
        ·
      </span>
      <span className="tnum">{question.year}</span>
      <span aria-hidden className="text-fg3">
        ·
      </span>
      <span className="tnum">
        {question.marks} mark{question.marks === 1 ? '' : 's'}
      </span>
      {question.type === 'MSQ' && question.negativeMarks > 0 && (
        <span className="tnum">negative {question.negativeMarks}</span>
      )}
      {id && <span className="tnum ml-auto hidden text-fg3 sm:inline">{id}</span>}
    </div>
  );
}

/**
 * The question body. Deliberately not a card: it sits directly on the page
 * background with the meta line above it, so the content reads as reading
 * material rather than a component.
 */
export function QuestionBody({
  question,
  showImage = true,
}: {
  question: Question;
  showImage?: boolean;
}) {
  return (
    <div className="space-y-3">
      <MathText as="div" className="text-[17px] font-medium leading-[1.65] text-fg sm:text-lg">
        {question.question}
      </MathText>

      {showImage && question.image && (
        <figure className="surface overflow-hidden p-2">
          <img
            src={question.image}
            alt=""
            loading="lazy"
            className="mx-auto max-h-64 w-auto rounded-md object-contain"
          />
        </figure>
      )}
    </div>
  );
}

/** Used above the options for MSQ so the "choose any that apply" rule is clear. */
export function InstructionLine({ question }: { question: Question }) {
  const text =
    question.type === 'MCQ'
      ? 'Select one option'
      : question.type === 'MSQ'
        ? 'Select all that apply'
        : 'Enter a numeric value';

  return (
    <p className="text-xs text-fg2">
      {text}
      {question.type === 'MSQ' && question.negativeMarks > 0 && (
        <span className="text-warn-ink"> · partial marking applies</span>
      )}
    </p>
  );
}

export function MarksLine({ question }: { question: Question }) {
  return (
    <p className={cn('text-xs text-fg2')}>
      {question.marks} mark{question.marks === 1 ? '' : 's'}
      {question.negativeMarks > 0 && ` · −${question.negativeMarks} for a wrong choice`}
    </p>
  );
}
