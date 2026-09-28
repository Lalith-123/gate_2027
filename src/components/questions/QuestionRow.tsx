import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, NotebookPen, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { QuestionMeta } from '@/types/question';
import type { StatusIndex } from '@/services/filterService';
import { Badge } from '@/components/common/Badge';
import { MathText } from '@/components/common/MathText';

const DIFF_TONE = { Easy: 'info', Medium: 'brand', Hard: 'warn' } as const;

export function relativeTime(at: number): string {
  const diff = Date.now() - at;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const QuestionRow = memo(function QuestionRow({
  meta,
  index,
  status,
  marked,
  note,
  to,
  attempts,
  lastResult,
  lastAttemptAt,
  wrongAttempts,
  actions,
}: {
  meta: QuestionMeta;
  index: number;
  status: StatusIndex;
  marked?: boolean;
  note?: boolean;
  to: string;
  attempts?: number;
  lastResult?: 'correct' | 'incorrect' | null;
  lastAttemptAt?: number | null;
  wrongAttempts?: number;
  actions?: React.ReactNode;
}) {
  const state = status.attempted.has(meta.id) ? (status.correct.has(meta.id) ? 'correct' : 'incorrect') : null;
  const inWrong = status.wrong.has(meta.id);


  return (
    <div className="group relative flex gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-sunken/50 sm:px-5">
      <span className="w-6 shrink-0 pt-0.5 text-right text-2xs font-medium tabular-nums text-ink-mute">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs">
          <span className="font-semibold tabular-nums text-ink-soft">GATE {meta.y}</span>
          <span className="text-ink-mute">{meta.s}</span>
          <span aria-hidden className="text-line-strong">
            ·
          </span>
          <span className="text-ink-mute">{meta.t}</span>
        </div>

        <Link to={to} className="mt-1 block focus-visible:outline-none">
          <MathText className="line-clamp-2 text-[14px] leading-relaxed text-ink-soft transition-colors duration-150 group-hover:text-ink">
            {meta.p || 'This question has no text preview.'}
          </MathText>
        </Link>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={meta.k === 'NAT' ? 'info' : meta.k === 'MSQ' ? 'warn' : 'brand'}>{meta.k}</Badge>
          <Badge tone={DIFF_TONE[meta.d]} dot>
            {meta.d}
          </Badge>
          {state === 'correct' && <Badge tone="accent">Correct</Badge>}
          {state === 'incorrect' && <Badge tone="danger">Incorrect</Badge>}
          {!state && <Badge tone="neutral">Not attempted</Badge>}
          {marked && (
            <Badge tone="warn" icon={<Bookmark aria-hidden className="size-2.5" />}>
              Revision
            </Badge>
          )}
          {inWrong && (
            <Badge tone="danger" icon={<TriangleAlert aria-hidden className="size-2.5" />}>
              In wrong list
            </Badge>
          )}
          {note && (
            <Badge tone="brand" icon={<NotebookPen aria-hidden className="size-2.5" />}>
              Note
            </Badge>
          )}
        </div>

        {(attempts !== undefined || inWrong) && (
          <p className="mt-1.5 text-2xs tabular-nums text-ink-mute">
            {attempts ? `${attempts} ${attempts === 1 ? 'attempt' : 'attempts'}` : 'Not attempted yet'}
            {lastResult && (
              <>
                {' · last '}
                <span className={lastResult === 'correct' ? 'text-accent' : 'text-danger'}>{lastResult}</span>
              </>
            )}
            {lastAttemptAt ? ` · ${relativeTime(lastAttemptAt)}` : ''}
            {inWrong && wrongAttempts ? ` · wrong ${wrongAttempts}×` : ''}
          </p>
        )}
      </div>

      {actions && <div className="flex shrink-0 items-start gap-1">{actions}</div>}
    </div>
  );
});

export function RowDivider() {
  return <div className={cn('hairline')} />;
}
