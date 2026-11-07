import { FileText } from 'lucide-react';
import type { Question } from '../types';
import { MathText } from './MathText';

interface ExplanationSectionProps {
  question: Question;
}

export function ExplanationSection({ question }: ExplanationSectionProps) {
  const { explanation, image } = question.answer;
  const { pdfName } = question.question;
  const { page } = question.source;

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        Explanation
      </h4>

      {explanation ? (
        <MathText
          text={explanation}
          className="block text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
        />
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          Official explanation not available.
        </p>
      )}

      {image && (
        <img
          src={image}
          alt="Solution figure from the source PDF"
          className="mt-3 w-full rounded-lg object-contain max-h-[50vh] bg-white"
          loading="lazy"
        />
      )}

      {pdfName && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <FileText className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {pdfName}
            {page !== null ? ` · page ${page}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
