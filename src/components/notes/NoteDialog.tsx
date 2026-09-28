import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Input';
import { useToast } from '@/components/common/Toast';
import { useUser } from '@/state/UserProvider';
import type { Question } from '@/types/question';

export function NoteDialog({
  question,
  open,
  onClose,
}: {
  question: Question;
  open: boolean;
  onClose: () => void;
}) {
  const { user, saveNote, deleteNote } = useUser();
  const toast = useToast();
  const existing = user.notes[question.id];
  const [body, setBody] = useState(existing?.body ?? '');

  useEffect(() => {
    if (open) setBody(existing?.body ?? '');
    // Re-seed whenever the dialog is reopened for a different question.
  }, [open, question.id, existing?.body]);

  const save = () => {
    saveNote(question.id, body);
    toast(body.trim() ? 'Note saved' : 'Note removed', 'success');
    onClose();
  };

  const remove = () => {
    deleteNote(question.id);
    toast('Note deleted');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your note"
      description={`GATE ${question.year} · ${question.subject} · ${question.topic}`}
      footer={
        <div className="flex items-center justify-between gap-3">
          {existing ? (
            <Button variant="ghost" size="sm" iconLeft={<Trash2 aria-hidden className="size-3.5" />} onClick={remove}>
              Delete
            </Button>
          ) : (
            <span className="text-xs text-ink-mute">Saved on this device only</span>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={save}>
              Save note
            </Button>
          </div>
        </div>
      }
    >
      <Textarea
        data-autofocus
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={9}
        placeholder="Why this question trips you up, the method to remember, a mnemonic…"
        aria-label="Note text"
      />
      <p className="mt-2 text-xs text-ink-mute">
        {body.trim().length} characters · an empty note is removed when you save.
      </p>
    </Modal>
  );
}
