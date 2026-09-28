import { Link } from 'react-router-dom';
import { Bookmark, CircleCheck, CircleX, NotebookPen } from 'lucide-react';
import { TypeTag } from '@/components/common/Display';
import { useUser } from '@/state/UserStore';
import { stripMath } from '@/utils/format';
import type { QuestionMeta } from '@/types/question';

export interface QuestionRowData extends QuestionMeta {
  status: 'unattempted' | 'correct' | 'incorrect' | 'marked';
  attempts: number;
  hasNote: boolean;
}

/**
 * One row in a question list. The whole row links to the practice view with
 * that question pinned, so a student can jump straight into it.
 */
export function QuestionRow({ row }: { row: QuestionRowData }) {
  const preview = stripMath(row.p);

  return (
    <li className="border-b border-hair last:border-0">
      <Link
        to={`/practice?id=${encodeURIComponent(row.id)}`}
        className="flex items-start gap-3 px-3 py-3 transition-colors duration-150 hover:bg-raised"
      >
        <StatusDot status={row.status} />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <TypeTag type={row.k} />
            <span className="truncate text-xs text-fg2">{row.s}</span>
            <span aria-hidden className="text-fg3">
              ·
            </span>
            <span className="tnum text-xs text-fg2">{row.y}</span>
            {row.attempts > 0 && (
              <span className="tnum text-2xs text-fg3">
                {row.attempts} attempt{row.attempts === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <p className="line-clamp-2 text-[14px] leading-relaxed text-fg">{preview}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pt-0.5 text-fg3">
          {row.hasNote && <NotebookPen aria-label="Has a note" className="size-3.5" />}
          {row.status === 'marked' && <Bookmark aria-label="Marked for revision" className="size-3.5" />}
        </div>
      </Link>
    </li>
  );
}

function StatusDot({ status }: { status: QuestionRowData['status'] }) {
  if (status === 'correct') {
    return <CircleCheck aria-label="Answered correctly" className="mt-0.5 size-4 shrink-0 text-ok" />;
  }
  if (status === 'incorrect') {
    return <CircleX aria-label="Answered incorrectly" className="mt-0.5 size-4 shrink-0 text-bad" />;
  }
  if (status === 'marked') {
    return <Bookmark aria-label="Marked for revision" className="mt-0.5 size-4 shrink-0 text-brand" />;
  }
  return (
    <span
      aria-label="Not attempted"
      className="mt-1.5 size-3.5 shrink-0 rounded-full border border-dashed border-edge"
    />
  );
}

/** Derives the display row for a meta from the user's stored state. */
export function useRowBuilder() {
  const { user, index } = useUser();

  return (meta: QuestionMeta): QuestionRowData => {
    const state = user.questions[meta.id];
    const marked = index.marked.has(meta.id);
    const status: QuestionRowData['status'] = !state?.attempted
      ? marked
        ? 'marked'
        : 'unattempted'
      : state.lastResult === 'correct'
        ? 'correct'
        : 'incorrect';

    return {
      ...meta,
      status,
      attempts: state?.attempts ?? 0,
      hasNote: Boolean(user.notes[meta.id]),
    };
  };
}
