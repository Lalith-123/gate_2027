import type { Question } from '@/types/question';

export interface GradeInput {
  question: Question;
  /** option keys for MCQ/MSQ, raw text for NAT */
  given: string[];
  /** exact string match required for NAT when true */
  natStrict: boolean;
}

export interface GradeResult {
  correct: boolean;
  awarded: number;
  possible: number;
  /** MSQ only: the student picked at least one wrong option */
  partialMiss: boolean;
}

/** Accepts `2`, `2.0`, `+2`, `2e0`, ` 2 ` and fractions like `3/4`. */
export function parseNumeric(input: string): number | null {
  const text = String(input).trim();
  if (!text) return null;

  const fraction = /^([+-]?[\d.]+)\s*\/\s*([+-]?[\d.]+)$/.exec(text);
  if (fraction) {
    const num = Number(fraction[1]);
    const den = Number(fraction[2]);
    if (Number.isFinite(num) && Number.isFinite(den) && den !== 0) return num / den;
    return null;
  }

  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function natMatches(given: string, expected: string[], tolerance: number, strict: boolean): boolean {
  const g = String(given).trim();
  if (!g) return false;

  for (const raw of expected) {
    const want = String(raw).trim();
    if (g === want) return true;
    if (strict) continue;

    const a = parseNumeric(g);
    const b = parseNumeric(want);
    if (a === null || b === null) continue;
    if (a === b) return true;
    if (tolerance > 0 && Math.abs(a - b) <= tolerance) return true;
    if (a !== 0 && Math.abs((a - b) / b) <= 1e-6) return true;
  }
  return false;
}

export function gradeAnswer({ question, given, natStrict }: GradeInput): GradeResult {
  const possible = question.marks;
  const cleaned = given.map((g) => String(g).trim()).filter(Boolean);

  if (cleaned.length === 0) {
    return { correct: false, awarded: 0, possible, partialMiss: false };
  }

  if (question.type === 'NAT') {
    const correct = natMatches(cleaned[0], question.answer, question.natTolerance, natStrict);
    return { correct, awarded: correct ? possible : 0, possible, partialMiss: false };
  }

  const expected = new Set(question.answer);
  const chosen = new Set(cleaned);

  if (question.type === 'MCQ') {
    const correct = chosen.size === 1 && expected.has(chosen.values().next().value ?? '');
    return {
      correct,
      awarded: correct ? possible : -question.negativeMarks,
      possible,
      partialMiss: !correct,
    };
  }

  // MSQ — GATE awards no partial credit.
  const hasWrong = [...chosen].some((k) => !expected.has(k));
  const correct = !hasWrong && chosen.size === expected.size;

  if (correct) return { correct: true, awarded: possible, possible, partialMiss: false };
  if (hasWrong) {
    const penalty = question.negativeMarks > 0 ? question.negativeMarks : 1;
    return { correct: false, awarded: -penalty, possible, partialMiss: true };
  }
  return { correct: false, awarded: 0, possible, partialMiss: true };
}

/** Formats a NAT submission for storage and display. */
export function normaliseNatInput(input: string): string {
  const text = String(input).trim();
  const n = parseNumeric(text);
  if (n === null) return text;
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(12)));
}

export function describeMarks(awarded: number, possible: number): string {
  const sign = awarded > 0 ? '+' : '';
  if (awarded === possible) return `+${possible}`;
  return `${sign}${Number(awarded.toFixed(2))} / ${possible}`;
}
