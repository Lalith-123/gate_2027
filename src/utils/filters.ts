import type {
  Question,
  Filters,
  AttemptRecord,
  BookmarkRecord,
  Difficulty,
  QuestionType,
} from '../types';

const DIFFICULTY_ORDER: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const TYPE_ORDER: QuestionType[] = ['MCQ', 'MSQ', 'NAT'];

export function filterQuestions(
  questions: Question[],
  filters: Filters,
  attempts: AttemptRecord[],
  bookmarks: BookmarkRecord[]
): Question[] {
  return questions.filter((q) => {
    if (filters.exam !== 'all' && q.exam.name !== filters.exam) return false;
    if (filters.year !== 'all' && q.exam.year !== filters.year) return false;
    if (filters.branch !== 'all' && q.exam.session !== filters.branch) return false;
    if (filters.subject !== 'all' && q.classification.subject !== filters.subject) return false;
    if (filters.topic !== 'all' && q.classification.topic !== filters.topic) return false;
    if (filters.subtopic !== 'all' && q.classification.subtopic !== filters.subtopic) return false;
    if (filters.type !== 'all' && q.question.type !== filters.type) return false;
    if (filters.difficulty !== 'all' && q.question.difficulty !== filters.difficulty) return false;
    if (filters.source !== 'all' && q.source.type !== filters.source) return false;

    if (filters.status !== 'all') {
      const attempt = attempts.find((a) => a.questionId === q.id);
      const bookmarked = bookmarks.some((b) => b.questionId === q.id);
      if (filters.status === 'unattempted' && attempt) return false;
      if (filters.status === 'correct' && (!attempt || !attempt.isCorrect)) return false;
      if (filters.status === 'incorrect' && (!attempt || attempt.isCorrect)) return false;
      if (filters.status === 'bookmarked' && !bookmarked) return false;
    }

    return true;
  });
}

export function getUniqueExams(questions: Question[]): string[] {
  return Array.from(new Set(questions.map((q) => q.exam.name))).sort();
}

export function getUniqueYears(questions: Question[], exam?: string): number[] {
  const filtered = exam && exam !== 'all'
    ? questions.filter((q) => q.exam.name === exam)
    : questions;
  return Array.from(new Set(filtered.map((q) => q.exam.year))).sort((a, b) => b - a);
}

export function getUniqueBranches(questions: Question[]): string[] {
  return Array.from(
    new Set(questions.map((q) => q.exam.session).filter((s): s is string => Boolean(s)))
  ).sort();
}

export function getUniqueSubjects(questions: Question[]): string[] {
  return Array.from(
    new Set(questions.map((q) => q.classification.subject).filter((s): s is string => s !== null))
  ).sort();
}

export function getUniqueTopics(questions: Question[], subject?: string): string[] {
  const filtered = subject && subject !== 'all'
    ? questions.filter((q) => q.classification.subject === subject)
    : questions;
  return Array.from(
    new Set(filtered.map((q) => q.classification.topic).filter((t): t is string => t !== null))
  ).sort();
}

export function getUniqueSubtopics(questions: Question[], subject?: string, topic?: string): string[] {
  let filtered = questions;
  if (subject && subject !== 'all') {
    filtered = filtered.filter((q) => q.classification.subject === subject);
  }
  if (topic && topic !== 'all') {
    filtered = filtered.filter((q) => q.classification.topic === topic);
  }
  return Array.from(
    new Set(filtered.map((q) => q.classification.subtopic).filter((s): s is string => s !== null))
  ).sort();
}

export function getUniqueTypes(questions: Question[]): QuestionType[] {
  const present = new Set(questions.map((q) => q.question.type));
  return TYPE_ORDER.filter((type) => present.has(type));
}

export function getUniqueDifficulties(questions: Question[]): Difficulty[] {
  const present = new Set(questions.map((q) => q.question.difficulty));
  return DIFFICULTY_ORDER.filter((level) => present.has(level));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
