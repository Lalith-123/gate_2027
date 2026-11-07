export type QuestionType = 'MCQ' | 'MSQ' | 'NAT';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type SourceType = 'official' | 'trusted' | 'recalled' | 'practice_test';

export interface QuestionOption {
  label: string;
  text: string;
  /** Resolved image URL for options rendered as figures, else null. */
  image: string | null;
}

export interface QuestionSource {
  type: SourceType;
  organization: string | null;
  documentTitle: string;
  url: string | null;
  page: number | null;
}

export interface QuestionVerification {
  questionVerified: boolean;
  answerVerified: boolean;
  explanationVerified: boolean;
}

export interface QuestionClassification {
  subject: string | null;
  /** Primary topic, mirroring the raw data label. */
  topic: string | null;
  /**
   * Every topic this question belongs to. Source data packs several topics into
   * one comma-separated `topic` string, and a question is written into one file
   * per topic, so these are derived from `topic` by the loader.
   */
  topics: string[];
  subtopic: string | null;
  tags: string[];
}

export interface QuestionExam {
  name: string;
  fullName: string;
  /** Null for practice tests that are not tied to a real GATE year. */
  year: number | null;
  /** GATE paper code, e.g. CSE. */
  session?: string;
}

export interface QuestionBody {
  text: string;
  type: QuestionType;
  /** Empty for NAT, which is answered with a typed number. */
  options: QuestionOption[];
  marks: number;
  negativeMarks: number;
  difficulty: Difficulty;
  /** Source PDF filename, so the question can be found in the original paper. */
  pdfName: string | null;
  /** Full-question crop/figure from the source PDF, already resolved to a URL. */
  image: string | null;
  /** Shared instruction for a group of questions, shown above the text. */
  direction: string | null;
}

export interface QuestionAnswer {
  /** Single option label for MCQ, label list for MSQ, numeric string for NAT. */
  correctOption: string | string[];
  correctText: string;
  explanation: string | null;
  /** Solution/figure crop from the source PDF, already resolved to a URL. */
  image: string | null;
  status: 'confirmed' | 'disputed' | 'uncertain';
  /** NAT only: absolute error allowed against the accepted value. */
  natTolerance?: number;
  /** NAT only: non-numeric forms that must also be accepted. */
  acceptedAnswers?: string[];
}

export interface Question {
  id: string;
  exam: QuestionExam;
  question: QuestionBody;
  answer: QuestionAnswer;
  classification: QuestionClassification;
  source: QuestionSource;
  verification: QuestionVerification;
}

export interface AttemptRecord {
  questionId: string;
  /** Comma-joined option labels for MSQ, raw typed value for NAT. */
  selectedOption: string;
  isCorrect: boolean;
  lastAttemptedAt: number;
}

export interface UserProgress {
  questionId: string;
  attempted: boolean;
  selectedOption: string | null;
  isCorrect: boolean;
  bookmarked: boolean;
  lastAttemptedAt: number | null;
}

export interface BookmarkRecord {
  questionId: string;
  timestamp: number;
}

export interface NoteRecord {
  questionId: string;
  text: string;
  timestamp: number;
}

export type BrowseMode = 'all' | 'previousYear' | 'topic';

/**
 * `all` serves the entire bank. `previousYear` and `topic` narrow it to one
 * year or one topic, and honour `year` / `subject` / `topic` only when they are
 * not `all`.
 */
export interface Filters {
  browseMode: BrowseMode;
  year: number | 'all';
  subject: string | 'all';
  topic: string | 'all';
  type: QuestionType | 'all';
  difficulty: Difficulty | 'all';
  source: SourceType | 'all';
  status: 'all' | 'unattempted' | 'correct' | 'incorrect' | 'bookmarked';
}

export type Theme = 'light' | 'dark';
