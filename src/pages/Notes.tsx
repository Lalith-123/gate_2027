import { useEffect, useMemo, useState } from 'react';
import { FileText, NotebookPen, Pin, PinOff, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBank, useDebouncedValue } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';

import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { Input, Textarea, Field } from '@/components/common/Input';
import { SearchInput } from '@/components/common/SearchInput';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { Badge } from '@/components/common/Badge';
import { Segmented } from '@/components/common/Segmented';
import { MathText } from '@/components/common/MathText';
import { useToast } from '@/components/common/Toast';
import { relativeTime } from '@/components/questions/QuestionRow';
import { VirtualList } from '@/components/common/VirtualList';

type Tab = 'question' | 'subject';

export function Notes() {
  const { metas, facets } = useBank();
  const { user, saveNote, deleteNote, saveSubjectNote, deleteSubjectNote, togglePinned } = useUser();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('question');
  const [query, setQuery] = useState('');
  const [noteDraft, setNoteDraft] = useState<{ id: string; body: string } | null>(null);
  const [subjectDraft, setSubjectDraft] = useState<{ id?: string; subject: string; title: string; body: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const debounced = useDebouncedValue(query, 150);

  const metaById = useMemo(() => new Map(metas.map((m) => [m.id, m])), [metas]);

  /* ---------------- question notes ---------------- */

  const questionNotes = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return Object.values(user.notes)
      .filter((n) => n.body.trim())
      .map((n) => ({ note: n, meta: metaById.get(n.id) }))
      .filter((row) => {
        if (!q) return true;
        if (row.note.body.toLowerCase().includes(q)) return true;
        if (row.meta && `${row.meta.s} ${row.meta.t} ${row.meta.y}`.toLowerCase().includes(q)) return true;
        return row.meta ? row.meta.id.toLowerCase().includes(q) : false;
      })
      .sort((a, b) => b.note.updatedAt - a.note.updatedAt);
  }, [user.notes, debounced, metaById]);

  const editingNote = noteDraft ? user.notes[noteDraft.id] : undefined;

  /* ---------------- subject notes ---------------- */

  const [subjectFilter, setSubjectFilter] = useState('all');

  const subjectNotes = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return user.subjectNotes
      .filter((n) => (subjectFilter === 'all' ? true : n.subject === subjectFilter))
      .filter((n) => {
        if (!q) return true;
        return `${n.title} ${n.body} ${n.subject}`.toLowerCase().includes(q);
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
  }, [user.subjectNotes, subjectFilter, debounced]);

  useEffect(() => {
    setNoteDraft(null);
  }, [tab]);

  const newSubjectNote = () =>
    setSubjectDraft({ subject: facets.subjects[0]?.name ?? 'General', title: '', body: '' });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          ariaLabel="Note type"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'question', label: `Question notes (${Object.keys(user.notes).length})`, icon: <NotebookPen aria-hidden className="size-3.5" /> },
            { value: 'subject', label: `Subject notes (${user.subjectNotes.length})`, icon: <FileText aria-hidden className="size-3.5" /> },
          ]}
        />
        {tab === 'subject' && (
          <Button size="sm" variant="primary" onClick={newSubjectNote} iconLeft={<Plus aria-hidden className="size-3.5" />}>
            New note
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          className="flex-1"
          value={query}
          onChange={setQuery}
          placeholder={tab === 'question' ? 'Search your notes' : 'Search subject notes'}
          label="Search notes"
        />
        {tab === 'subject' && facets.subjects.length > 0 && (
          <select
            aria-label="Filter by subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:border-line-strong focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/25"
          >
            <option value="all">All subjects</option>
            {facets.subjects.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {tab === 'question' ? (
        questionNotes.length === 0 ? (
          <EmptyState
            icon={<NotebookPen aria-hidden className="size-5" />}
            title={Object.keys(user.notes).length === 0 ? 'No notes created yet' : 'No notes match that search'}
            body={
              Object.keys(user.notes).length === 0
                ? 'Every question has an “Add note” action. Write down the method, the trap, or a mnemonic while the question is fresh.'
                : 'Try a different word, or clear the search.'
            }
            action={
              Object.keys(user.notes).length > 0 ? (
                <Button size="sm" className="mt-4" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="panel overflow-hidden">
            <VirtualList
              items={questionNotes}
              rowHeight={132}
              height={Math.min(640, Math.max(260, questionNotes.length * 0.5))}
              keyExtractor={(r) => r.note.id}
              renderRow={(row) => (
                <div className="border-b border-line px-4 py-3.5 last:border-b-0 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {row.meta ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs">
                          <span className="font-semibold tabular-nums text-ink-soft">GATE {row.meta.y}</span>
                          <span className="text-ink-mute">{row.meta.s}</span>
                          <span aria-hidden className="text-line-strong">·</span>
                          <span className="text-ink-mute">{row.meta.t}</span>
                        </div>
                      ) : (
                        <span className="text-2xs text-warn-ink">This question is no longer in the bank</span>
                      )}
                      <MathText className="mt-1 line-clamp-1 text-[13px] text-ink-soft">
                        {row.meta?.p ?? '—'}
                      </MathText>
                      <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-ink">
                        {row.note.body}
                      </p>
                      <p className="mt-1.5 text-2xs text-ink-mute">Updated {relativeTime(row.note.updatedAt)}</p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <IconButton
                        label="Edit note"
                        size="sm"
                        onClick={() => setNoteDraft({ id: row.note.id, body: row.note.body })}
                      >
                        <NotebookPen aria-hidden className="size-4" />
                      </IconButton>
                      <IconButton
                        label="Delete note"
                        size="sm"
                        tone="danger"
                        onClick={() => setConfirmDelete(row.note.id)}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              )}
            />
          </div>
        )
      ) : subjectNotes.length === 0 ? (
        <EmptyState
          icon={<FileText aria-hidden className="size-5" />}
          title={user.subjectNotes.length === 0 ? 'No subject notes yet' : 'No notes match'}
          body="Subject notes are the better place for general preparation notes: formulas to revise, a list of weak sub-topics, or a study plan for the week."
          action={
            user.subjectNotes.length === 0 ? (
              <Button size="sm" variant="primary" className="mt-5" onClick={newSubjectNote} iconLeft={<Plus aria-hidden className="size-3.5" />}>
                Write the first note
              </Button>
            ) : (
              <Button size="sm" className="mt-4" onClick={() => setQuery('')}>
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {subjectNotes.map((note) => (
            <li
              key={note.id}
              className={cn('flex flex-col rounded-xl border bg-surface p-4', note.pinned ? 'border-warn/40' : 'border-line')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Badge tone={note.pinned ? 'warn' : 'neutral'}>{note.subject}</Badge>
                  <h3 className="mt-2 text-[14px] font-semibold leading-snug text-ink">
                    {note.title || 'Untitled note'}
                  </h3>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <IconButton
                    label={note.pinned ? 'Unpin note' : 'Pin note'}
                    size="sm"
                    tone="warn"
                    active={note.pinned}
                    onClick={() => togglePinned(note.id)}
                  >
                    {note.pinned ? <Pin aria-hidden className="size-4" /> : <PinOff aria-hidden className="size-4" />}
                  </IconButton>
                  <IconButton
                    label="Edit note"
                    size="sm"
                    onClick={() => setSubjectDraft({ id: note.id, subject: note.subject, title: note.title, body: note.body })}
                  >
                    <NotebookPen aria-hidden className="size-4" />
                  </IconButton>
                  <IconButton label="Delete note" size="sm" tone="danger" onClick={() => setConfirmDelete(note.id)}>
                    <Trash2 aria-hidden className="size-4" />
                  </IconButton>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">{note.body}</p>
              <p className="mt-3 text-2xs text-ink-mute">Updated {relativeTime(note.updatedAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {/* question note editor */}
      <Modal
        open={Boolean(noteDraft)}
        onClose={() => setNoteDraft(null)}
        title="Edit note"
        description={noteDraft ? metaById.get(noteDraft.id)?.s : undefined}
        footer={
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setNoteDraft(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (noteDraft) {
                  saveNote(noteDraft.id, noteDraft.body);
                  toast('Note saved', 'success');
                }
                setNoteDraft(null);
              }}
            >
              Save changes
            </Button>
          </div>
        }
      >
        {noteDraft && editingNote && (
          <Textarea
            data-autofocus
            rows={10}
            value={noteDraft.body}
            aria-label="Note text"
            onChange={(e) => setNoteDraft({ ...noteDraft, body: e.target.value })}
          />
        )}
      </Modal>

      {/* subject note editor */}
      <Modal
        open={Boolean(subjectDraft)}
        onClose={() => setSubjectDraft(null)}
        title={subjectDraft?.id ? 'Edit subject note' : 'New subject note'}
        description="Subject notes stay on this device and are never uploaded."
        footer={
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setSubjectDraft(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (subjectDraft) {
                  saveSubjectNote(subjectDraft);
                  toast('Subject note saved', 'success');
                }
                setSubjectDraft(null);
              }}
            >
              Save note
            </Button>
          </div>
        }
      >
        {subjectDraft && (
          <div className="space-y-4">
            <Field label="Subject" htmlFor="note-subject">
              <select
                id="note-subject"
                value={subjectDraft.subject}
                onChange={(e) => setSubjectDraft({ ...subjectDraft, subject: e.target.value })}
                className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/25"
              >
                {facets.subjects.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
                <option value="General">General</option>
              </select>
            </Field>
            <Field label="Title" htmlFor="note-title">
              <Input
                id="note-title"
                value={subjectDraft.title}
                onChange={(e) => setSubjectDraft({ ...subjectDraft, title: e.target.value })}
                placeholder="e.g. Deadlock conditions to revise"
              />
            </Field>
            <Field label="Note" htmlFor="note-body">
              <Textarea
                id="note-body"
                data-autofocus
                rows={10}
                value={subjectDraft.body}
                onChange={(e) => setSubjectDraft({ ...subjectDraft, body: e.target.value })}
                placeholder="What you want to remember before the exam."
              />
            </Field>
          </div>
        )}
      </Modal>

      {/* delete confirmation */}
      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete this note?"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setConfirmDelete(null)}>
              Keep it
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (!confirmDelete) return;
                if (user.subjectNotes.some((n) => n.id === confirmDelete)) deleteSubjectNote(confirmDelete);
                else deleteNote(confirmDelete);
                setConfirmDelete(null);
                toast('Note deleted');
              }}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-soft">This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default Notes;
