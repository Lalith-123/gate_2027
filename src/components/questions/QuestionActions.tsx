import { useState } from 'react';
import { Bookmark, BookmarkCheck, Flag, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Question } from '@/types/question';
import { useUser } from '@/state/UserProvider';
import { useToast } from '@/components/common/Toast';
import { NoteDialog } from '@/components/notes/NoteDialog';

export function QuestionActions({ question, className }: { question: Question; className?: string }) {
  const { user, markForRevision } = useUser();
  const toast = useToast();
  const [noteOpen, setNoteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const marked = Boolean(user.revision[question.id]);
  const hasNote = Boolean(user.notes[question.id]?.body);

  // Icon-only: three words of text here used to eat a whole row on a phone.
  const iconBase =
    'grid size-10 shrink-0 place-items-center rounded-lg transition-colors duration-150 disabled:opacity-45 sm:size-8 sm:rounded-md';

  return (
    <>
      <div className={cn('flex items-center gap-1', className)}>
        <button
          type="button"
          onClick={() => setNoteOpen(true)}
          aria-label={hasNote ? 'Edit note' : 'Add a note'}
          title={hasNote ? 'Edit note' : 'Add a note'}
          className={cn(iconBase, hasNote ? 'bg-brand-soft text-brand-ink' : 'text-ink-mute hover:bg-sunken hover:text-ink')}
        >
          <NotebookPen aria-hidden className="size-[18px] sm:size-[15px]" />
        </button>

        <button
          type="button"
          aria-pressed={marked}
          aria-label={marked ? 'Remove from revision' : 'Mark for revision'}
          title={marked ? 'Remove from revision' : 'Mark for revision'}
          onClick={() => {
            markForRevision(question.id);
            toast(marked ? 'Removed from revision' : 'Marked for revision', marked ? 'default' : 'success');
          }}
          className={cn(iconBase, marked ? 'bg-warn-soft text-warn-ink' : 'text-ink-mute hover:bg-sunken hover:text-ink')}
        >
          {marked ? (
            <BookmarkCheck aria-hidden className="size-[18px] sm:size-[15px]" />
          ) : (
            <Bookmark aria-hidden className="size-[18px] sm:size-[15px]" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setReportOpen((v) => !v)}
          aria-expanded={reportOpen}
          aria-label="Report a problem with this question"
          title="Report a problem"
          className={cn(iconBase, reportOpen && 'bg-sunken text-ink', 'text-ink-mute hover:bg-sunken hover:text-ink')}
        >
          <Flag aria-hidden className="size-[18px] sm:size-[15px]" />
        </button>
      </div>

      {/* the labels are still reachable for screen readers and hover */}
      <span className="sr-only">
        {hasNote ? 'Note saved' : 'No note'} · {marked ? 'Marked for revision' : 'Not marked'}
      </span>

      {reportOpen && (
        <div
          role="status"
          className="mt-3 rounded-lg border border-dashed border-line bg-sunken/60 px-3.5 py-3 text-[13px] leading-relaxed text-ink-soft"
        >
          <p className="font-medium text-ink">Reporting a question</p>
          <p className="mt-1 text-ink-mute">
            Note the question id <span className="font-mono text-xs text-ink-soft">{question.id}</span> and raise it
            with the source PDF. Reports are not uploaded — this build keeps everything on your device.
          </p>
        </div>
      )}

      <NoteDialog question={question} open={noteOpen} onClose={() => setNoteOpen(false)} />
    </>
  );
}
