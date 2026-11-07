import type { Question } from '../types';

/** Correct option labels as a list, for every question type. */
export function correctLabels(question: Question): string[] {
  const { correctOption } = question.answer;
  return Array.isArray(correctOption) ? correctOption : [correctOption];
}

/** Storage form for a selection: sorted, comma-joined, so A+C and C+A match. */
export function joinSelection(labels: string[]): string {
  return [...labels].sort().join(',');
}

export function parseSelection(stored: string | null | undefined): string[] {
  if (!stored) return [];
  return stored
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Accepts plain and scientific notation, tolerating thousands separators. */
function toNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/,/g, '');
  if (!cleaned) return null;
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function acceptedValues(question: Question): string[] {
  const { correctOption, acceptedAnswers } = question.answer;
  return [correctOption as string, ...(acceptedAnswers ?? [])];
}

function gradeNat(question: Question, given: string[]): boolean {
  const value = given[0];
  if (value === undefined) return false;

  const accepted = acceptedValues(question);
  const normalised = value.trim().toLowerCase();
  if (accepted.some((candidate) => candidate.trim().toLowerCase() === normalised)) return true;

  const actual = toNumber(value);
  if (actual === null) return false;

  const tolerance = question.answer.natTolerance ?? 0;
  return accepted.some((candidate) => {
    const expected = toNumber(candidate);
    return expected !== null && Math.abs(actual - expected) <= tolerance;
  });
}

/** MSQ needs every correct option and nothing extra; MCQ falls out of the same rule. */
export function isAnswerCorrect(question: Question, given: string[]): boolean {
  if (given.length === 0) return false;
  if (question.question.type === 'NAT') return gradeNat(question, given);

  const selected = joinSelection(given).split(',').filter(Boolean);
  const correct = joinSelection(correctLabels(question)).split(',').filter(Boolean);
  return selected.length === correct.length && selected.every((label, i) => label === correct[i]);
}

export function awardedMarks(question: Question, correct: boolean): number {
  return correct ? question.question.marks : -question.question.negativeMarks;
}
