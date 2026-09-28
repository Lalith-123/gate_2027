/* ------------------------------------------------------------------ *
 * Question schema
 *
 * This is the contract between the question bank and the UI. Adding a new
 * GATE year means dropping one JSON file into `src/data/questions/`; the
 * build-time manifest picks it up automatically and no component changes.
 *
 * Only the fields marked required are read by the app. Every other field is
 * optional metadata that the UI renders when present and ignores otherwise,
 * so the schema can grow without breaking older files.
 * ------------------------------------------------------------------ */

export type QuestionType = 'MCQ' | 'MSQ' | 'NAT';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionOption {
  key: string;
  text: string;
}

/** A fully hydrated question, as loaded from a per-year JSON chunk. */
export interface Question {
  id: string;
  year: number;
  branch: string;
  subject: string;
  topic: string;
  type: QuestionType;
  marks: number;
  negativeMarks: number;
  difficulty: Difficulty;
  question: string;
  options?: QuestionOption[];
  /** MCQ/MSQ: option keys. NAT: accepted numeric strings. */
  answer: string[];
  natTolerance: number;
  explanation: string;
  hint: string;
  image: string;
  source: string;
  tags: string[];
}

/**
 * Compact question record shipped in the manifest. Deliberately narrow:
 * it powers listing, filtering, search and statistics without ever carrying
 * the correct answer to the client.
 */
export interface QuestionMeta {
  /** unique id */
  id: string;
  /** year */
  y: number;
  /** subject */
  s: string;
  /** topic */
  t: string;
  /** type */
  k: QuestionType;
  /** difficulty */
  d: Difficulty;
  /** marks */
  m: number;
  /** negative marks */
  n: number;
  /** plain-text preview */
  p: string;
  /** plain-text explanation preview */
  x: string;
  /** has figure */
  h?: 1;
  /** option count */
  o?: number;
}

export interface QuestionManifest {
  version: number;
  generatedAt: string;
  total: number;
  years: number[];
  branches: string[];
  types: QuestionType[];
  difficulties: Difficulty[];
  tags: string[];
  /** year -> source file basename, used to lazily fetch that year's chunk */
  yearFiles: Record<string, string>;
  subjects: { name: string; total: number; topics: string[] }[];
  yearTotals: Record<string, number>;
  questions: QuestionMeta[];
  error?: string;
}

/* ------------------------------------------------------------------ *
 * User data
 * ------------------------------------------------------------------ */

export interface Attempt {
  /** epoch ms */
  at: number;
  /** ids the user chose, sorted; for NAT the normalised answer string */
  given: string[];
  correct: boolean;
  /** marks awarded (already net of negative marking for MSQ) */
  awarded: number;
  /** marks possible */
  possible: number;
}

export type PracticeMode =
  | 'random'
  | 'unattempted'
  | 'wrong'
  | 'revision'
  | 'subject'
  | 'topic'
  | 'year'
  | 'difficult';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  defaultMode: PracticeMode;
  showExplanations: boolean;
  allowRetryAfterCorrect: boolean;
  showQuestionImages: boolean;
  reduceMotion: boolean;
  natStrict: boolean;
  /** allow swiping up on the answer bar to move to the next question */
  swipeToAdvance: boolean;
}

export interface QuestionState {
  attempts: number;
  lastResult: 'correct' | 'incorrect' | null;
  lastAttemptAt: number | null;
  /** whether the question has ever been answered */
  attempted: boolean;
  /** consecutive correct answers */
  streak: number;
  history: Attempt[];
}

export interface Note {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
}

export interface SubjectNote {
  id: string;
  subject: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

export interface UserData {
  version: number;
  createdAt: number;
  updatedAt: number;
  settings: Settings;
  /** questionId -> state */
  questions: Record<string, QuestionState>;
  /** questionId -> note */
  notes: Record<string, Note>;
  /** questionId -> mark for revision */
  revision: Record<string, number>;
  /** questionId -> last known incorrect (kept even after a later correct) */
  wrong: Record<string, { at: number; attempts: number }>;
  subjectNotes: SubjectNote[];
  /** ids in the order they were last served, most recent last */
  recent: string[];
}

export interface ExportFile {
  app: 'gate-practice';
  version: number;
  exportedAt: string;
  data: UserData;
}
