import type {
  Difficulty,
  Question,
  QuestionOption,
  QuestionType,
  SourceType,
} from '../types';

const VALID_QUESTION_TYPES: QuestionType[] = ['MCQ', 'MSQ', 'NAT'];
const VALID_SOURCE_TYPES: SourceType[] = ['official', 'trusted', 'recalled', 'practice_test'];

/** Applied when a data file leaves scoring or difficulty metadata empty. */
const DEFAULT_MARKS = 1;
const DEFAULT_NEGATIVE_MARKS = 0;
const DEFAULT_DIFFICULTY: Difficulty = 'Medium';

type RawModule = { default: unknown };

/**
 * Questions are read from two folders: `topics/<name>.json` for topic banks and
 * `previous_year/gate_<year>.json` for real year papers. Dropping a new file in
 * either folder is all it takes to extend the bank, and `getQuestions`
 * deduplicates by id in case a question ever appears in more than one file.
 */
const topicModules = import.meta.glob<RawModule>('/src/data/questions/topics/*.json', {
  eager: true,
});
const yearModules = import.meta.glob<RawModule>('/src/data/questions/previous_year/*.json', {
  eager: true,
});

/**
 * Question images live beside the data as real files and are grouped into one
 * sub-folder per source paper, e.g. `images/Engineering_mathematics_1/...`, so
 * the glob is recursive. Vite only emits an image if its URL is requested
 * through the bundler rather than written as a bare string.
 */
const imageModules = import.meta.glob<string>(
  '/src/data/questions/images/**/*.{png,jpg,jpeg,webp,svg,gif,avif}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  }
);

/** Keys are both the path below `images/` and the bare filename, so either works. */
const imageUrlsByKey = new Map<string, string>();
const IMAGES_MARKER = '/images/';

for (const [path, url] of Object.entries(imageModules)) {
  const markerIndex = path.lastIndexOf(IMAGES_MARKER);
  const relative = markerIndex === -1 ? path.split('/').pop() ?? path : path.slice(markerIndex + IMAGES_MARKER.length);
  imageUrlsByKey.set(relative, url);
  const name = relative.split('/').pop();
  if (name && !imageUrlsByKey.has(name)) imageUrlsByKey.set(name, url);
}

function resolveImage(url: string | null | undefined, questionId: string): string | null {
  const raw = url?.trim();
  if (!raw) return null;

  const relative = raw.startsWith('images/') ? raw.slice('images/'.length) : raw;
  const resolved =
    imageUrlsByKey.get(relative) ??
    imageUrlsByKey.get(relative.split('/').pop() ?? relative);

  if (!resolved) {
    console.warn(`[loader] ${questionId}: image not found in images/ -> ${raw}`);
    return raw;
  }
  return resolved;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Source data packs several topics into one comma-separated string. */
function splitTopics(value: unknown): string[] {
  const raw = asString(value);
  if (!raw) return [];
  return [...new Set(raw.split(',').map((t) => t.trim()).filter(Boolean))];
}

/**
 * A few papers carry inconsistent subject labels (e.g. COA papers filed under
 * Programming and Data Structures). Normalise them so the browse filter always
 * offers the canonical GATE subject names, regardless of the source data.
 */
function normalizeSubject(subject: string | null, pdfName: string | null): string {
  if (pdfName?.startsWith('Computer_Organization_and_Architecture')) {
    return 'Computer Organization and Architecture';
  }
  if (subject === 'Databases') return 'Database';
  if (subject === 'Probability and Statistics') return 'Engineering Mathematics';
  if (subject === 'Programming and Data Structures') return 'Programming and Data Structure';
  return subject ?? 'Unknown';
}

function normalizeOptions(value: unknown, questionId: string): QuestionOption[] | null {
  if (!Array.isArray(value)) return null;
  const options: QuestionOption[] = [];
  for (const entry of value) {
    const record = asRecord(entry);
    const label = asString(record?.label);
    if (!record || !label || typeof record.text !== 'string') return null;
    options.push({
      label,
      text: record.text,
      image: resolveImage(asString(record.image), questionId),
    });
  }
  return options;
}

const VALID_STATUSES = ['confirmed', 'disputed', 'uncertain'] as const;
type AnswerStatus = (typeof VALID_STATUSES)[number];

/**
 * Validates one raw record and fills in the optional metadata that the source
 * PDFs leave blank, so scoring, difficulty badges and filters always get real
 * values instead of null.
 */
function normalizeQuestion(raw: unknown, batchName: string, index: number): Question | null {
  const obj = asRecord(raw);
  const label = `[${batchName}] item ${index}`;
  if (!obj) {
    console.warn(`${label}: not an object`);
    return null;
  }

  const id = asString(obj.id);
  if (!id) {
    console.warn(`${label}: missing or invalid id`);
    return null;
  }

  const exam = asRecord(obj.exam);
  const examName = asString(exam?.name);
  if (!exam || !examName) {
    console.warn(`${id}: missing exam info`);
    return null;
  }

  const body = asRecord(obj.question);
  const text = asString(body?.text);
  if (!body || !text) {
    console.warn(`${id}: missing question text`);
    return null;
  }

  const type = body.type as QuestionType;
  if (!VALID_QUESTION_TYPES.includes(type)) {
    console.warn(`${id}: unknown type "${String(body.type)}"`);
    return null;
  }

  const options = normalizeOptions(body.options, id);
  if (!options) {
    console.warn(`${id}: options is not a valid array`);
    return null;
  }
  if (type !== 'NAT' && options.length === 0) {
    console.warn(`${id}: ${type} needs at least one option`);
    return null;
  }

  const answer = asRecord(obj.answer);
  const correct = answer?.correctOption;
  const correctList = Array.isArray(correct) ? correct : [correct];
  if (!answer || correct === undefined || correct === null || correctList.length === 0) {
    console.warn(`${id}: missing answer`);
    return null;
  }
  if (correctList.some((value) => typeof value !== 'string' || value === '')) {
    console.warn(`${id}: invalid correct answer`);
    return null;
  }
  if (type === 'NAT' && correctList.length !== 1) {
    console.warn(`${id}: NAT must have exactly one accepted value`);
    return null;
  }
  if (type !== 'NAT') {
    const labels = options.map((option) => option.label);
    if (correctList.some((value) => !labels.includes(value as string))) {
      console.warn(`${id}: correct answer does not match any option`);
      return null;
    }
    if (type === 'MCQ' && correctList.length !== 1) {
      console.warn(`${id}: MCQ must have exactly one correct option`);
      return null;
    }
  }

  const classification = asRecord(obj.classification);
  if (!classification) {
    console.warn(`${id}: missing classification`);
    return null;
  }

  const source = asRecord(obj.source);
  const sourceType = source?.type as SourceType;
  if (!source || !VALID_SOURCE_TYPES.includes(sourceType)) {
    console.warn(`${id}: invalid source type "${String(source?.type)}"`);
    return null;
  }

  const verification = asRecord(obj.verification);
  if (!verification) {
    console.warn(`${id}: missing verification`);
    return null;
  }

  const topics = splitTopics(classification.topic);
  const difficulty = body.difficulty as Difficulty;
  const pdfName = asString(body.pdfName) ?? asString(obj.pdfName);

  return {
    id,
    exam: {
      name: examName,
      fullName: asString(exam.fullName) ?? examName,
      year: asFiniteNumber(exam.year),
      session: asString(exam.session) ?? undefined,
    },
    question: {
      text,
      type,
      options,
      marks: asFiniteNumber(body.marks) ?? DEFAULT_MARKS,
      negativeMarks: asFiniteNumber(body.negativeMarks) ?? DEFAULT_NEGATIVE_MARKS,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : DEFAULT_DIFFICULTY,
      // `pdfName` is accepted either inside `question` or at the top level,
      // since generated files have used both placements. There is deliberately
      // no fallback to `source.documentTitle`: the UI must show the real PDF
      // filename, not a generic test title.
      pdfName,
      image: resolveImage(asString(body.image), id),
      direction: asString(body.direction),
    },
    answer: {
      // Kept in its original shape: a bare string for MCQ/NAT, a list for MSQ.
      // `grade.ts` relies on that distinction when reading NAT accepted values.
      correctOption: correct as string | string[],
      correctText: asString(answer.correctText) ?? '',
      explanation: typeof answer.explanation === 'string' ? answer.explanation : null,
      image: resolveImage(asString(answer.image), id),
      status: VALID_STATUSES.includes(answer.status as AnswerStatus)
        ? (answer.status as AnswerStatus)
        : 'uncertain',
      natTolerance: asFiniteNumber(answer.natTolerance) ?? undefined,
      acceptedAnswers: Array.isArray(answer.acceptedAnswers)
        ? answer.acceptedAnswers.filter((v): v is string => typeof v === 'string')
        : undefined,
    },
    classification: {
      subject: normalizeSubject(
        asString(classification.subject) ?? asString(exam.session),
        pdfName
      ),
      topic: topics[0] ?? null,
      topics,
      subtopic: asString(classification.subtopic),
      tags: Array.isArray(classification.tags)
        ? classification.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
    },
    source: {
      type: sourceType,
      organization: asString(source.organization),
      documentTitle: asString(source.documentTitle) ?? 'Unknown source',
      url: asString(source.url),
      page: asFiniteNumber(source.page),
    },
    verification: {
      questionVerified: verification.questionVerified === true,
      answerVerified: verification.answerVerified === true,
      explanationVerified: verification.explanationVerified === true,
    },
  };
}

type Batch = { name: string; items: unknown[] };

function collectBatches(): Batch[] {
  const batches: Batch[] = [];

  const add = (label: string, modules: Record<string, RawModule>) => {
    for (const [path, mod] of Object.entries(modules).sort(([a], [b]) => a.localeCompare(b))) {
      const file = path.split('/').pop() ?? path;
      batches.push({
        name: `${label}/${file.replace(/\.json$/, '')}`,
        items: Array.isArray(mod.default) ? (mod.default as unknown[]) : [],
      });
    }
  };

  add('topics', topicModules);
  add('previous_year', yearModules);

  return batches;
}

const batches = collectBatches();

let cache: Question[] | null = null;

function fileSlug(batchName: string): string {
  const stem = batchName.split('/').pop() ?? batchName;
  return stem.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'copy';
}

/**
 * Two different papers can reuse the same question ids. Rather than dropping
 * the later file, give the colliding question a stable id derived from its
 * paper filename so both stay browsable.
 */
function makeUniqueId(baseId: string, batchName: string, byId: Map<string, Question>): string {
  const slug = fileSlug(batchName);
  let candidate = `${baseId}__${slug}`;
  let attempt = 2;
  while (byId.has(candidate)) candidate = `${baseId}__${slug}-${attempt++}`;
  return candidate;
}

export function getQuestions(): Question[] {
  if (cache) return cache;

  const byId = new Map<string, Question>();
  const fingerprintById = new Map<string, string>();
  let skipped = 0;
  let renamed = 0;

  for (const batch of batches) {
    batch.items.forEach((raw, index) => {
      const question = normalizeQuestion(raw, batch.name, index);
      if (!question) {
        skipped += 1;
        return;
      }

      const existing = byId.get(question.id);
      if (!existing) {
        byId.set(question.id, question);
        fingerprintById.set(question.id, JSON.stringify(question));
        return;
      }

      // The same question copied into several files is intentional, so keep one.
      if (fingerprintById.get(question.id) === JSON.stringify(question)) return;

      const originalId = question.id;
      question.id = makeUniqueId(originalId, batch.name, byId);
      console.warn(
        `[loader] duplicate id ${originalId} in ${batch.name} is a different question; loaded as ${question.id}`
      );
      byId.set(question.id, question);
      fingerprintById.set(question.id, JSON.stringify(question));
      renamed += 1;
    });
  }

  const questions = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));

  if (skipped > 0) console.warn(`[loader] skipped ${skipped} invalid question(s)`);
  if (renamed > 0) console.warn(`[loader] renamed ${renamed} duplicate id(s) from other papers`);
  if (questions.length === 0) console.warn('[loader] no questions loaded');

  cache = questions;
  return questions;
}

/** Years that actually have data, newest first. Practice tests have none. */
export function getAvailableYears(): number[] {
  return [...new Set(getQuestions().map((q) => q.exam.year).filter((y): y is number => y !== null))].sort(
    (a, b) => b - a
  );
}
