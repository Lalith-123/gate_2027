import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Question, AttemptRecord } from '../types';
import { isAnswerCorrect, joinSelection, parseSelection } from '../utils/grade';
import { MathText } from './MathText';
import { OptionButton } from './OptionButton';
import { AnswerResult } from './AnswerResult';
import { ExplanationSection } from './ExplanationSection';
import { BookmarkButton } from './BookmarkButton';
import { NoteSection } from './NoteSection';

interface QuestionCardProps {
  question: Question;
  attempt: AttemptRecord | undefined;
  isBookmarked: boolean;
  note: string;
  onRecordAttempt: (questionId: string, selectedOption: string, isCorrect: boolean) => void;
  onToggleBookmark: (questionId: string) => void;
  onSaveNote: (questionId: string, text: string) => void;
  onNext: () => void;
}

const TYPE_HINT = {
  MCQ: 'Choose one option',
  MSQ: 'Choose all that apply',
  NAT: 'Enter a numerical value',
} as const;

const DIFFICULTY_CLASS = {
  Easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Hard: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
} as const;

export function QuestionCard({
  question,
  attempt,
  isBookmarked,
  note,
  onRecordAttempt,
  onToggleBookmark,
  onSaveNote,
  onNext,
}: QuestionCardProps) {
  const { type, options, marks, difficulty } = question.question;
  const isNat = type === 'NAT';
  const isMsq = type === 'MSQ';

  const initial = attempt ? parseSelection(attempt.selectedOption) : [];
  const [selection, setSelection] = useState<string[]>(initial);
  const [natInput, setNatInput] = useState<string>(initial[0] ?? '');
  const [revealed, setRevealed] = useState(!!attempt);

  const given = isNat ? (natInput.trim() ? [natInput.trim()] : []) : selection;
  const isCorrect = revealed && isAnswerCorrect(question, given);

  const handleOptionClick = (label: string) => {
    if (revealed) return;
    if (isMsq) {
      setSelection((previous) =>
        previous.includes(label)
          ? previous.filter((item) => item !== label)
          : [...previous, label]
      );
    } else {
      setSelection([label]);
    }
  };

  const handleCheck = () => {
    if (given.length === 0) return;
    onRecordAttempt(question.id, joinSelection(given), isAnswerCorrect(question, given));
    setRevealed(true);
  };

  return (
    <article className="min-h-[calc(100vh-80px)] flex flex-col px-4 py-6">
      <div className="flex-1 max-w-2xl mx-auto w-full">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
              {question.exam.name} {question.exam.year}
              {question.exam.session ? ` · ${question.exam.session}` : ''}
            </span>
            {question.classification.subject && (
              <>
                <span className="text-xs text-slate-500 dark:text-slate-400">&middot;</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {question.classification.subject}
                </span>
              </>
            )}
            {question.classification.topic && (
              <>
                <span className="text-xs text-slate-500 dark:text-slate-400">&middot;</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {question.classification.topic}
                </span>
              </>
            )}
          </div>
          <BookmarkButton isBookmarked={isBookmarked} onToggle={() => onToggleBookmark(question.id)} />
        </div>

        <MathText
          text={question.question.text}
          className="block mb-3 text-[16px] leading-relaxed text-slate-900 dark:text-white font-medium"
        />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
            {type}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">{TYPE_HINT[type]}</span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {marks} mark{marks === 1 ? '' : 's'}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${DIFFICULTY_CLASS[difficulty]}`}
          >
            {difficulty}
          </span>
        </div>

        {question.images.length > 0 && (
          <div className="mb-4 space-y-3">
            {question.images.map((image, index) => {
              const src = typeof image === 'string' ? image : image.url;
              const alt = typeof image === 'string' ? '' : image.caption;
              return (
                <figure key={index}>
                  <img
                    src={src}
                    alt={alt}
                    className="w-full rounded-xl object-contain max-h-[50vh] bg-white"
                    loading="lazy"
                  />
                  {alt && (
                    <figcaption className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                      {alt}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        )}

        {isNat ? (
          <div className="mb-6">
            <label
              htmlFor="nat-answer"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5"
            >
              Numerical answer
            </label>
            <input
              id="nat-answer"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={revealed ? given[0] ?? '' : natInput}
              disabled={revealed}
              onChange={(event) => setNatInput(event.target.value)}
              placeholder="e.g. 42"
              className={`w-full p-4 rounded-xl border-2 text-[16px] transition-colors bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                revealed
                  ? isCorrect
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/30'
                  : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'
              }`}
            />
          </div>
        ) : (
          <div
            className="space-y-3 mb-6"
            role={isMsq ? 'group' : 'radiogroup'}
            aria-label="Answer options"
          >
            {options.map((option) => (
              <OptionButton
                key={option.label}
                label={option.label}
                text={option.text}
                selected={selection.includes(option.label)}
                revealed={revealed}
                isCorrect={parseSelection(
                  Array.isArray(question.answer.correctOption)
                    ? question.answer.correctOption.join(',')
                    : question.answer.correctOption
                ).includes(option.label)}
                isUserAnswer={selection.includes(option.label)}
                multiple={isMsq}
                onClick={() => handleOptionClick(option.label)}
              />
            ))}
          </div>
        )}

        {!revealed && (
          <button
            onClick={handleCheck}
            disabled={given.length === 0}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              given.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            Submit Answer
          </button>
        )}

        {revealed && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <AnswerResult question={question} given={given} isCorrect={isCorrect} />

            <div className="mt-4">
              <NoteSection questionId={question.id} note={note} onSave={onSaveNote} />
            </div>

            <ExplanationSection
              explanation={question.answer.explanation}
              source={question.source}
            />

            <button
              onClick={onNext}
              className="w-full mt-4 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
