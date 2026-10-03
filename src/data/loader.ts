import type { Question, QuestionType } from '../types';

const VALID_QUESTION_TYPES: QuestionType[] = ['MCQ', 'MSQ', 'NAT'];
const VALID_SOURCE_TYPES = ['official', 'trusted', 'recalled'] as const;

type RawModule = { default: unknown };

/**
 * Every JSON file in `src/data/questions/` becomes its own batch, so adding a
 * new year is a matter of dropping in `gate_2027.json`.
 */
const modules = import.meta.glob<RawModule>('/src/data/questions/*.json', { eager: true });

const allRawBatches: unknown[][] = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, mod]) => (Array.isArray(mod.default) ? (mod.default as unknown[]) : []));

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function validateQuestion(raw: unknown, index: number, batchName: string): raw is Question {
  const obj = asRecord(raw);
  if (!obj) {
    console.warn(`[${batchName}] Skipping item ${index}: not an object`);
    return false;
  }

  if (typeof obj.id !== 'string' || !obj.id) {
    console.warn(`[${batchName}] Skipping item ${index}: missing or invalid id`);
    return false;
  }

  const exam = asRecord(obj.exam);
  if (!exam?.name || !exam.year) {
    console.warn(`[${batchName}] Skipping ${obj.id}: missing exam info`);
    return false;
  }

  const body = asRecord(obj.question);
  if (!body || typeof body.text !== 'string' || !body.text) {
    console.warn(`[${batchName}] Skipping ${obj.id}: missing question text`);
    return false;
  }

  const type = body.type as QuestionType;
  if (!VALID_QUESTION_TYPES.includes(type)) {
    console.warn(`[${batchName}] Skipping ${obj.id}: unknown type "${String(body.type)}"`);
    return false;
  }

  const rawOptions = body.options;
  if (!Array.isArray(rawOptions)) {
    console.warn(`[${batchName}] Skipping ${obj.id}: options is not an array`);
    return false;
  }

  if (type !== 'NAT' && rawOptions.length === 0) {
    console.warn(`[${batchName}] Skipping ${obj.id}: ${type} needs at least one option`);
    return false;
  }

  for (const option of rawOptions) {
    const record = asRecord(option);
    if (!record?.label || typeof record.text !== 'string') {
      console.warn(`[${batchName}] Skipping ${obj.id}: malformed option`);
      return false;
    }
  }

  const answer = asRecord(obj.answer);
  if (!answer || answer.correctOption === undefined || answer.correctOption === null) {
    console.warn(`[${batchName}] Skipping ${obj.id}: missing answer`);
    return false;
  }

  const correct = answer.correctOption;
  const correctList = Array.isArray(correct) ? correct : [correct];

  if (correctList.length === 0 || correctList.some((value) => typeof value !== 'string' || value === '')) {
    console.warn(`[${batchName}] Skipping ${obj.id}: invalid correct answer`);
    return false;
  }

  if (type === 'NAT') {
    if (correctList.length !== 1) {
      console.warn(`[${batchName}] Skipping ${obj.id}: NAT must have exactly one accepted value`);
      return false;
    }
  } else {
    const labels = rawOptions.map((option) => (asRecord(option) as Record<string, unknown>).label);
    if (correctList.some((label) => !labels.includes(label as string))) {
      console.warn(`[${batchName}] Skipping ${obj.id}: correct answer does not match any option`);
      return false;
    }
    if (type === 'MCQ' && correctList.length !== 1) {
      console.warn(`[${batchName}] Skipping ${obj.id}: MCQ must have exactly one correct option`);
      return false;
    }
  }

  if (!asRecord(obj.classification)) {
    console.warn(`[${batchName}] Skipping ${obj.id}: missing classification`);
    return false;
  }

  const source = asRecord(obj.source);
  if (!source || !VALID_SOURCE_TYPES.includes(source.type as typeof VALID_SOURCE_TYPES[number])) {
    console.warn(`[${batchName}] Skipping ${obj.id}: invalid source type`);
    return false;
  }

  if (!asRecord(obj.verification)) {
    console.warn(`[${batchName}] Skipping ${obj.id}: missing verification`);
    return false;
  }

  return true;
}

let cache: Question[] | null = null;

export function getQuestions(): Question[] {
  if (cache) return cache;

  const seen = new Set<string>();
  const questions: Question[] = [];

  allRawBatches.forEach((batch, batchIndex) => {
    const batchName = `batch-${batchIndex}`;
    batch.forEach((raw, index) => {
      if (!validateQuestion(raw, index, batchName)) return;
      if (seen.has(raw.id)) {
        console.warn(`Skipping duplicate id: ${raw.id}`);
        return;
      }
      seen.add(raw.id);
      questions.push(raw);
    });
  });

  cache = questions;
  return questions;
}
