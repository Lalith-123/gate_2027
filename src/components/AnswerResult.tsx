import { Check, X, AlertTriangle, BadgeCheck } from 'lucide-react';
import type { Question } from '../types';
import { correctLabels, awardedMarks } from '../utils/grade';
import { MathText } from './MathText';

interface AnswerResultProps {
  question: Question;
  given: string[];
  isCorrect: boolean;
}

export function AnswerResult({ question, given, isCorrect }: AnswerResultProps) {
  const { type, marks, negativeMarks } = question.question;
  const correct = correctLabels(question);
  const awarded = awardedMarks(question, isCorrect);
  const missed = correct.filter((label) => !given.includes(label));
  const extras = given.filter((label) => !correct.includes(label));

  const isNat = type === 'NAT';
  const isMsq = type === 'MSQ';

  return (
    <div className="mt-4 space-y-3">
      {isCorrect ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
            Correct
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <X className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-300 font-semibold text-sm">Incorrect</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Marks {isCorrect ? `+${awarded}` : awarded} / {marks}
        </span>
        {!isCorrect && negativeMarks > 0 && (
          <span className="text-red-500 dark:text-red-400">
            (negative marking {negativeMarks})
          </span>
        )}
      </div>

      {isNat ? (
        <>
          {!isCorrect && (
            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400">Your answer: </span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                {given[0] ?? '—'}
              </span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">Accepted answer: </span>
            <MathText
              text={question.answer.correctText}
              className="text-emerald-600 dark:text-emerald-400 font-medium"
            />
          </div>
          {(question.answer.natTolerance ?? 0) > 0 && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Answers within {question.answer.natTolerance} of the accepted value are correct.
            </p>
          )}
        </>
      ) : (
        <>
          {!isCorrect && (
            <div className="text-sm">
              <span className="text-slate-500 dark:text-slate-400">Your answer: </span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                {given.length > 0 ? given.join(', ') : '—'}
              </span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              {isMsq ? 'Correct options: ' : 'Correct answer: '}
            </span>
            <MathText
              text={correct.join(', ')}
              className="text-emerald-600 dark:text-emerald-400 font-medium"
            />
          </div>
          {isMsq && !isCorrect && (
            <div className="text-xs space-y-1">
              {missed.length > 0 && (
                <p className="text-slate-500 dark:text-slate-400">
                  Missed: <span className="text-emerald-600 dark:text-emerald-400">{missed.join(', ')}</span>
                </p>
              )}
              {extras.length > 0 && (
                <p className="text-slate-500 dark:text-slate-400">
                  Wrongly chosen: <span className="text-red-600 dark:text-red-400">{extras.join(', ')}</span>
                </p>
              )}
            </div>
          )}
        </>
      )}

      {question.answer.status !== 'confirmed' && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="text-amber-700 dark:text-amber-300 text-xs font-medium">
            Answer status:{' '}
            {question.answer.status.charAt(0).toUpperCase() + question.answer.status.slice(1)}
          </span>
        </div>
      )}

      {!question.verification.answerVerified && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <BadgeCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            This answer was derived from the provided explanation and has not been checked against
            the original paper.
          </span>
        </div>
      )}
    </div>
  );
}
