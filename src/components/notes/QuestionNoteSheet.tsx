import { useEffect, useState } from 'react';
import { NotebookPen, Trash2 } from 'lucide-react';
import { Modal } from '@/components/common/Overlay';
import { Button } from '@/components/common/Button';
import { TextArea } from '@/components/common/Form';
import { useUser } from '@/state/UserStore';
import { useToast } from '@/components/common/Toast';

/**
 * Per-question note. Opened from the practice action bar, autosaving as the
 * student types so closing the sheet never loses text.
 */
export function QuestionNoteSheet({
  questionId,
  open,
  onClose,
}: {
  questionId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { user, saveNote, removeNote } = useUser();
  const toast = useToast();
  const [draft, setDraft] = useState('');

  const existing = questionId ? user.notes[questionId] : undefined;

  useEffect(() => {
    if (open && questionId) setDraft(user.notes[questionId]?.body ?? '');
  }, [open, questionId, user.notes]);

  if (!questionId) return null;

  const close = () => {
    saveNote(questionId, draft.trim());
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add a note"
      description="Saved against this question and available in your notebook."
      footer={
        <>
          {existing && (
            <Button
              variant="danger"
              size="md"
              className="mr-auto"
              icon={<Trash2 aria-hidden className="size-4" />}
              onClick={() => {
                removeNote(questionId);
                setDraft('');
                toast('Note removed');
                onClose();
              }}
            >
              Delete
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={close} data-autofocus>
            Save note
          </Button>
        </>
      }
    >
      <TextArea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={8}
        placeholder="What tripped you up? A shortcut, a formula, a better method…"
        aria-label="Note body"
      />
    </Modal>
  );
}

/** Compact button that shows whether this question already has a note. */
export function NoteButton({ questionId }: { questionId: string }) {
  const { user } = useUser();
  const has = Boolean(user.notes[questionId]);
  return (
    <span className="relative inline-flex">
      <NotebookPen aria-hidden className="size-4" />
      {has && <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-brand" />}
    </span>
  );
}
