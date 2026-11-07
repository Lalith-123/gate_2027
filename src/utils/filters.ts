import type {
  Question,
  Filters,
  AttemptRecord,
  BookmarkRecord,
  Difficulty,
  QuestionType,
  SourceType,
} from '../types';

const DIFFICULTY_ORDER: Difficulty[] = ['Easy', 'Medium', 'Hard'];
const TYPE_ORDER: QuestionType[] = ['MCQ', 'MSQ', 'NAT'];
const SOURCE_ORDER: SourceType[] = ['official', 'trusted', 'recalled', 'practice_test'];

/** Questions carrying a real GATE year, which is what the previous-year mode browses. */
export function hasYear(question: Question): boolean {
  return question.exam.year !== null;
}

export function matchesBrowseMode(question: Question, filters: Filters): boolean {
  if (filters.browseMode === 'previousYear') {
    if (!hasYear(question)) return false;
    return filters.year === 'all' || question.exam.year === filters.year;
  }

  if (filters.browseMode === 'topic') {
    if (question.classification.topics.length === 0) return false;
    return filters.topic === 'all' || question.classification.topics.includes(filters.topic);
  }

  return true;
}

export function filterQuestions(
  questions: Question[],
  filters: Filters,
  attempts: AttemptRecord[],
  bookmarks: BookmarkRecord[]
): Question[] {
  return questions.filter((q) => {
    if (!matchesBrowseMode(q, filters)) return false;
    if (filters.subject !== 'all' && q.classification.subject !== filters.subject) return false;
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

/** Only years that actually have question files, newest first. */
export function getUniqueYears(questions: Question[]): number[] {
  const years = new Set<number>();
  questions.forEach((q) => {
    if (q.exam.year !== null) years.add(q.exam.year);
  });
  return [...years].sort((a, b) => b - a);
}

/**
 * Every topic across the bank, including the secondary topics of questions whose
 * raw label packs several topics into one comma-separated string. Narrowed to a
 * single subject when one is selected.
 */
export function getUniqueTopics(questions: Question[], subject?: string): string[] {
  const filtered =
    subject && subject !== 'all' ? questions.filter((q) => q.classification.subject === subject) : questions;
  const topics = new Set<string>();
  filtered.forEach((q) => {
    q.classification.topics.forEach((topic) => topics.add(topic));
  });
  return [...topics].sort((a, b) => a.localeCompare(b));
}

/** Every subject in the bank, narrowed to those that actually hold the given topic. */
export function getUniqueSubjects(questions: Question[], topic?: string): string[] {
  const filtered =
    topic && topic !== 'all' ? questions.filter((q) => q.classification.topics.includes(topic)) : questions;
  const subjects = new Set<string>();
  filtered.forEach((q) => {
    if (q.classification.subject) subjects.add(q.classification.subject);
  });
  return [...subjects].sort((a, b) => a.localeCompare(b));
}

/** How many questions each topic holds, so the picker can show counts. */
export function getTopicCounts(questions: Question[], subject?: string): Map<string, number> {
  const filtered =
    subject && subject !== 'all' ? questions.filter((q) => q.classification.subject === subject) : questions;
  const counts = new Map<string, number>();
  filtered.forEach((q) => {
    q.classification.topics.forEach((topic) => {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    });
  });
  return counts;
}

export function getUniqueTypes(questions: Question[]): QuestionType[] {
  const present = new Set(questions.map((q) => q.question.type));
  return TYPE_ORDER.filter((type) => present.has(type));
}

export function getUniqueDifficulties(questions: Question[]): Difficulty[] {
  const present = new Set(questions.map((q) => q.question.difficulty));
  return DIFFICULTY_ORDER.filter((level) => present.has(level));
}

export function getUniqueSources(questions: Question[]): SourceType[] {
  const present = new Set(questions.map((q) => q.source.type));
  return SOURCE_ORDER.filter((source) => present.has(source));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
