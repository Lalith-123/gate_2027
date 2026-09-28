export interface ManifestQuestionMeta {
  id: string;
  y: number;
  q: number;
  k: string;
  s: string;
  t: string;
  d: string;
  marks: number;
  negativeMarks: number;
  options?: number;
  answerCount: number;
  hasImage: boolean;
  hasMath: boolean;
  hasExplanation: boolean;
  sText: string;
  tText: string;
}

export interface QuestionManifest {
  version: number;
  generatedAt: string;
  total: number;
  years: number[];
  yearFiles: Record<number, string>;
  subjects: { name: string; count: number }[];
  questions: ManifestQuestionMeta[];
}

export interface ManifestResult {
  manifest: QuestionManifest;
  warnings: string[];
  issues: { file: string; message: string }[];
}

export declare const MANIFEST_URL: string;
export declare function buildManifest(): ManifestResult;
