import type { Question, QuestionState, UserData } from '@/types/question';
import { emptyUserData } from '@/services/storageService';
import type { StatusIndex } from '@/services/filterService';
import { gradeAnswer } from '@/services/gradeService';
import { uid } from '@/lib/uid';

const HISTORY_LIMIT = 40;
const RECENT_LIMIT = 40;

/* ------------------------------------------------------------------ *
 * Derived indexes
 * ------------------------------------------------------------------ */

export function buildStatusIndex(user: UserData): StatusIndex {
  const attempted = new Set<string>();
  const correct = new Set<string>();
  const incorrect = new Set<string>();
  const lastAttemptedAt = new Map<string, number>();

  for (const [id, state] of Object.entries(user.questions)) {
    if (state.attempted || state.attempts > 0) {
      attempted.add(id);
      if (state.lastAttemptAt) lastAttemptedAt.set(id, state.lastAttemptAt);
    }
    if (state.lastResult === 'correct') correct.add(id);
    if (state.lastResult === 'incorrect') incorrect.add(id);
  }

  return {
    attempted,
    correct,
    incorrect,
    marked: new Set(Object.keys(user.revision)),
    lastAttemptedAt,
    wrong: new Set(Object.keys(user.wrong)),
    noteCount: Object.keys(user.notes).length,
  };
}

/* ------------------------------------------------------------------ *
 * Attempts
 * ------------------------------------------------------------------ */

export interface RecordOutcome {
  correct: boolean;
  awarded: number;
  possible: number;
  partialMiss: boolean;
}

export function recordAttempt(
  user: UserData,
  question: Question,
  given: string[],
  natStrict: boolean,
): { next: UserData; outcome: RecordOutcome } {
  const at = Date.now();
  const outcome = gradeAnswer({ question, given, natStrict });
  const prior: QuestionState = user.questions[question.id] ?? {
    attempts: 0,
    lastResult: null,
    lastAttemptAt: null,
    attempted: false,
    streak: 0,
    history: [],
  };

  const streak = outcome.correct ? prior.streak + 1 : 0;

  const nextState: QuestionState = {
    attempts: prior.attempts + 1,
    lastResult: outcome.correct ? 'correct' : 'incorrect',
    lastAttemptAt: at,
    attempted: true,
    streak,
    history: [
      ...prior.history,
      { at, given, correct: outcome.correct, awarded: outcome.awarded, possible: outcome.possible },
    ].slice(-HISTORY_LIMIT),
  };

  const next: UserData = {
    ...user,
    updatedAt: at,
    questions: { ...user.questions, [question.id]: nextState },
    recent: [question.id, ...user.recent.filter((id) => id !== question.id)].slice(0, RECENT_LIMIT),
  };

  // A question stays in the wrong list until the student removes it, so the
  // history of a tricky question is never lost. The counter tracks how many
  // times it has been answered wrongly, which the Wrong Questions page shows.
  if (!outcome.correct) {
    const prevWrong = user.wrong[question.id];
    next.wrong = {
      ...user.wrong,
      [question.id]: { at, attempts: (prevWrong?.attempts ?? 0) + 1 },
    };
  }

  return { next, outcome };
}

/* ------------------------------------------------------------------ *
 * Revision
 * ------------------------------------------------------------------ */

export function toggleRevision(user: UserData, id: string): { next: UserData; marked: boolean } {
  const marked = !user.revision[id];
  const revision = { ...user.revision };
  if (marked) revision[id] = Date.now();
  else delete revision[id];
  return { next: { ...user, revision, updatedAt: Date.now() }, marked };
}

export function setRevision(user: UserData, id: string, marked: boolean): UserData {
  if (Boolean(user.revision[id]) === marked) return user;
  const revision = { ...user.revision };
  if (marked) revision[id] = Date.now();
  else delete revision[id];
  return { ...user, revision, updatedAt: Date.now() };
}

/* ------------------------------------------------------------------ *
 * Wrong questions
 * ------------------------------------------------------------------ */

export function removeFromWrong(user: UserData, id: string): UserData {
  if (!user.wrong[id]) return user;
  const wrong = { ...user.wrong };
  delete wrong[id];
  return { ...user, wrong, updatedAt: Date.now() };
}

export function clearWrong(user: UserData, ids: string[]): UserData {
  const wrong = { ...user.wrong };
  for (const id of ids) delete wrong[id];
  return { ...user, wrong, updatedAt: Date.now() };
}

/* ------------------------------------------------------------------ *
 * Question notes
 * ------------------------------------------------------------------ */

export function upsertQuestionNote(user: UserData, id: string, body: string): UserData {
  const trimmed = body.trim();
  const now = Date.now();
  const notes = { ...user.notes };

  if (!trimmed) {
    delete notes[id];
  } else if (notes[id]) {
    notes[id] = { ...notes[id], body: trimmed, updatedAt: now };
  } else {
    notes[id] = { id, body: trimmed, createdAt: now, updatedAt: now };
  }

  return { ...user, notes, updatedAt: now };
}

export function deleteQuestionNote(user: UserData, id: string): UserData {
  if (!user.notes[id]) return user;
  const notes = { ...user.notes };
  delete notes[id];
  return { ...user, notes, updatedAt: Date.now() };
}

/* ------------------------------------------------------------------ *
 * Subject notes
 * ------------------------------------------------------------------ */

export function saveSubjectNote(
  user: UserData,
  input: { id?: string; subject: string; title: string; body: string; pinned?: boolean },
): UserData {
  const at = Date.now();
  const title = input.title.trim();
  const body = input.body.trim();

  if (input.id) {
    return {
      ...user,
      updatedAt: at,
      subjectNotes: user.subjectNotes.map((n) =>
        n.id === input.id
          ? { ...n, subject: input.subject, title, body, updatedAt: at, pinned: input.pinned ?? n.pinned }
          : n,
      ),
    };
  }

  if (!title && !body) return user;

  return {
    ...user,
    updatedAt: at,
    subjectNotes: [
      { id: uid('sn'), subject: input.subject, title, body, createdAt: at, updatedAt: at, pinned: input.pinned ?? false },
      ...user.subjectNotes,
    ],
  };
}

export function deleteSubjectNote(user: UserData, id: string): UserData {
  return { ...user, subjectNotes: user.subjectNotes.filter((n) => n.id !== id), updatedAt: Date.now() };
}

export function toggleSubjectNotePinned(user: UserData, id: string): UserData {
  return {
    ...user,
    subjectNotes: user.subjectNotes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
  };
}

/* ------------------------------------------------------------------ *
 * Reset
 * ------------------------------------------------------------------ */

export type ResetScope = 'progress' | 'notes' | 'revision' | 'wrong' | 'subjectNotes' | 'all';

export function resetUserData(user: UserData, scope: ResetScope): UserData {
  const base = emptyUserData();
  const next: UserData = { ...user, updatedAt: Date.now() };

  if (scope === 'all') {
    return { ...base, settings: user.settings, createdAt: user.createdAt };
  }
  if (scope === 'progress') {
    next.questions = {};
    next.recent = [];
  }
  if (scope === 'notes') {
    next.notes = {};
    next.subjectNotes = [];
  }
  if (scope === 'revision') next.revision = {};
  if (scope === 'wrong') next.wrong = {};
  return next;
}
