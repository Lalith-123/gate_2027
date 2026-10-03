export type QuestionType = 'MCQ' | 'MSQ' | 'NAT';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionOption {
  label: string;
  text: string;
}

export type QuestionImage = string | {
  url: string;
  caption: string;
  source: string;
};

export interface QuestionSource {
  type: 'official' | 'trusted' | 'recalled';
  organization: string;
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
  topic: string | null;
  subtopic: string | null;
  tags: string[];
}

export interface QuestionExam {
  name: string;
  fullName: string;
  year: number;
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
}

export interface QuestionAnswer {
  /** Single option label for MCQ, label list for MSQ, numeric string for NAT. */
  correctOption: string | string[];
  correctText: string;
  explanation: string | null;
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
  images: QuestionImage[];
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

export interface Filters {
  exam: string | 'all';
  year: number | 'all';
  branch: string | 'all';
  subject: string | 'all';
  topic: string | 'all';
  subtopic: string | 'all';
  type: QuestionType | 'all';
  difficulty: Difficulty | 'all';
  source: 'all' | 'official' | 'trusted' | 'recalled';
  status: 'all' | 'unattempted' | 'correct' | 'incorrect' | 'bookmarked';
}

export type Theme = 'light' | 'dark';
