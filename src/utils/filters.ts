import type { Question, Filters, AttemptRecord, BookmarkRecord } from '../types';

/** Canonical GATE subject order used by the browse picker. */
export const SUBJECT_ORDER = [
  'Algorithms',
  'Compiler Design',
  'Computer Networks',
  'Computer Organization and Architecture',
  'Database',
  'Digital Logic',
  'Engineering Mathematics',
  'Logical Ability',
  'Operating System',
  'Programming and Data Structure',
  'Quantitative Ability',
  'Theory of Computation',
  'Verbal Ability',
];

const SUBJECT_RANK = new Map(SUBJECT_ORDER.map((subject, index) => [subject, index]));

export interface PaperOption {
  /** Stable key stored in `Filters.papers` (the PDF filename). */
  key: string;
  subject: string;
  label: string;
  count: number;
}

export function getPaperKey(question: Question): string {
  return question.question.pdfName ?? 'Unknown paper';
}

/** "Database_1.pdf" + subject "Database" becomes "Database 1". */
export function getPaperLabel(subject: string, paperKey: string): string {
  const stem = paperKey.replace(/\.pdf$/i, '');
  const match = stem.match(/(\d+(?:\(\d+\))?)$/);
  if (match) return `${subject} ${match[1]}`;
  return stem.replace(/_/g, ' ');
}

function compareSubjects(a: string, b: string): number {
  const rankA = SUBJECT_RANK.get(a) ?? SUBJECT_ORDER.length;
  const rankB = SUBJECT_RANK.get(b) ?? SUBJECT_ORDER.length;
  return rankA - rankB || a.localeCompare(b);
}

/** Every subject present in the bank, in canonical order. */
export function getSubjects(questions: Question[]): string[] {
  const subjects = new Set<string>();
  questions.forEach((q) => subjects.add(q.classification.subject));
  return [...subjects].sort(compareSubjects);
}

/**
 * Papers belonging to the selected subjects. Returns an empty list when no
 * subject is selected, because the picker is driven by the subject choice.
 */
export function getPaperOptions(questions: Question[], subjects: string[]): PaperOption[] {
  if (subjects.length === 0) return [];

  const selected = new Set(subjects);
  const byKey = new Map<string, PaperOption>();

  for (const question of questions) {
    const subject = question.classification.subject;
    if (!selected.has(subject)) continue;

    const key = getPaperKey(question);
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, {
        key,
        subject,
        label: getPaperLabel(subject, key),
        count: 1,
      });
    }
  }

  return [...byKey.values()].sort(
    (a, b) =>
      compareSubjects(a.subject, b.subject) ||
      a.label.localeCompare(b.label, undefined, { numeric: true })
  );
}

export function filterQuestions(
  questions: Question[],
  filters: Filters,
  attempts: AttemptRecord[],
  bookmarks: BookmarkRecord[]
): Question[] {
  const subjects = new Set(filters.subjects);
  const papers = new Set(filters.papers);
  const attemptByQuestion = new Map(attempts.map((attempt) => [attempt.questionId, attempt]));
  const bookmarked = new Set(bookmarks.map((bookmark) => bookmark.questionId));

  return questions.filter((q) => {
    if (subjects.size > 0 && !subjects.has(q.classification.subject)) return false;
    if (papers.size > 0 && !papers.has(getPaperKey(q))) return false;

    if (filters.onlyIncorrect) {
      const attempt = attemptByQuestion.get(q.id);
      if (!attempt || attempt.isCorrect) return false;
    }

    if (filters.onlySaved && !bookmarked.has(q.id)) return false;

    return true;
  });
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
