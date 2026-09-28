import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { Page, PageHeading } from '@/components/layout/AppShell';
import { EmptyState, SectionTitle } from '@/components/common/Display';
import { Button, IconButton } from '@/components/common/Button';
import { Modal, ConfirmDialog } from '@/components/common/Overlay';
import { TextArea, TextInput, Select } from '@/components/common/Form';
import { useUser } from '@/state/UserStore';
import { useToast } from '@/components/common/Toast';
import { uid } from '@/utils/uid';
import { formatDate, relativeTime } from '@/utils/format';
import type { SubjectNote } from '@/types/question';

/**
 * A deliberately simple notebook: free-form subject notes only. The richer
 * per-question notes live on the question itself, not here, which keeps this
 * screen to one job.
 */
export function NotesPage() {
  const { user, upsertSubjectNote, removeSubjectNote, pinSubjectNote } = useUser();
  const toast = useToast();
  const [editing, setEditing] = useState<SubjectNote | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<SubjectNote | null>(null);
  const [filter, setFilter] = useState('');

  const subjects = useMemo(
    () => Array.from(new Set(user.subjectNotes.map((n) => n.subject))).sort(),
    [user.subjectNotes],
  );

  const notes = useMemo(() => {
    const list = [...user.subjectNotes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
    return filter ? list.filter((n) => n.subject === filter) : list;
  }, [user.subjectNotes, filter]);

  const questionNotes = useMemo(
    () => Object.values(user.notes).sort((a, b) => b.updatedAt - a.updatedAt),
    [user.notes],
  );

  return (
    <Page>
      <PageHeading
        title="Notebook"
        description="Notes you wrote while practising. Everything is stored on this device."
        action={
          <Button
            variant="primary"
            icon={<Plus aria-hidden className="size-4" />}
            onClick={() => setCreating(true)}
          >
            New note
          </Button>
        }
      />

      <div className="space-y-6">
        <section>
          <SectionTitle
            action={
              subjects.length > 0 ? (
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter by subject"
                  className="h-7 rounded-md border border-hair bg-card px-2 text-xs text-fg2"
                >
                  <option value="">All subjects</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : null
            }
          >
            Subject notes
          </SectionTitle>

          {notes.length === 0 ? (
            <div className="surface">
              <EmptyState
                icon={<NotebookPen aria-hidden className="size-7" />}
                title="No subject notes"
                description="Capture a formula, a shortcut, or a topic you want to revisit."
                action={
                  <Button variant="primary" onClick={() => setCreating(true)}>
                    Write a note
                  </Button>
                }
              />
            </div>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li key={note.id} className="surface p-3.5">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {note.pinned && <Pin aria-hidden className="size-3 text-brand" />}
                        <span className="truncate text-sm font-medium text-fg">{note.title}</span>
                        <span className="text-2xs text-fg3">· {note.subject}</span>
                      </div>
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-[14px] leading-relaxed text-fg2">
                        {note.body}
                      </p>
                      <p className="mt-1.5 text-2xs text-fg3">
                        Updated {relativeTime(note.updatedAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-0.5">
                      <IconButton
                        label={note.pinned ? 'Unpin' : 'Pin'}
                        size="sm"
                        onClick={() => pinSubjectNote(note.id)}
                      >
                        {note.pinned ? (
                          <PinOff aria-hidden className="size-4 text-brand" />
                        ) : (
                          <Pin aria-hidden className="size-4" />
                        )}
                      </IconButton>
                      <IconButton label="Edit" size="sm" onClick={() => setEditing(note)}>
                        <NotebookPen aria-hidden className="size-4" />
                      </IconButton>
                      <IconButton
                        label="Delete"
                        size="sm"
                        onClick={() => setDeleting(note)}
                        className="hover:text-bad"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </IconButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {questionNotes.length > 0 && (
          <section>
            <SectionTitle>Notes on questions</SectionTitle>
            <ul className="surface divide-y divide-hair overflow-hidden">
              {questionNotes.slice(0, 50).map((note) => (
                <li key={note.id}>
                  <Link
                    to={`/practice?id=${encodeURIComponent(note.id)}`}
                    className="block px-3.5 py-2.5 transition-colors hover:bg-raised"
                  >
                    <p className="line-clamp-2 text-[14px] leading-relaxed text-fg">{note.body}</p>
                    <p className="mt-0.5 text-2xs text-fg3">
                      {note.id} · {formatDate(note.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {(creating || editing) && (
        <NoteEditor
          initial={editing}
          subjects={subjects}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(note) => {
            upsertSubjectNote(note);
            setCreating(false);
            setEditing(null);
            toast('Note saved');
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            removeSubjectNote(deleting.id);
            toast('Note deleted');
          }
        }}
        title="Delete this note?"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </Page>
  );
}

function NoteEditor({
  initial,
  subjects,
  onClose,
  onSave,
}: {
  initial: SubjectNote | null;
  subjects: string[];
  onClose: () => void;
  onSave: (note: SubjectNote) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [subject, setSubject] = useState(initial?.subject ?? subjects[0] ?? 'General');
  const [body, setBody] = useState(initial?.body ?? '');
  const now = Date.now();
  const valid = title.trim() !== '' && body.trim() !== '';

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'Edit note' : 'New note'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              onSave({
                id: initial?.id ?? uid('sn'),
                subject,
                title: title.trim(),
                body: body.trim(),
                createdAt: initial?.createdAt ?? now,
                updatedAt: now,
                pinned: initial?.pinned ?? false,
              })
            }
          >
            Save note
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <TextInput
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Fourier series shortcuts"
          data-autofocus
        />
        <Select
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Choose a subject"
          options={subjects.map((s) => ({ value: s, label: s }))}
        />
        <TextArea
          label="Note"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={9}
          placeholder="Write anything you want to remember."
        />
      </div>
    </Modal>
  );
}
