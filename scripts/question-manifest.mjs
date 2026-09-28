/**
 * Question bank manifest builder.
 *
 * Scans `src/data/questions/gate-<year>[-<branch>].json` (or a single object /
 * array in any of those files) and produces a lightweight manifest that the app
 * can load instantly for listing, filtering, search and statistics without
 * shipping every answer to the client up front.
 *
 * Rules that matter for scaling:
 *  - Adding a year = dropping one JSON file into `src/data/questions/`.
 *    No component, route or registry edit required.
 *  - Full question bodies (including `answer`) stay in per-year chunks that are
 *    code-split by the bundler and fetched only when a year is actually needed.
 *  - The manifest never contains answers.
 *
 * Usage:  node scripts/question-manifest.mjs [--write] [--check]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(HERE, '..');
export const QUESTION_DIR = join(ROOT, 'src', 'data', 'questions');
export const OUT_DIR = join(ROOT, 'public', 'data');
export const OUT_FILE = join(OUT_DIR, 'questions.manifest.json');
export const MANIFEST_URL = '/data/questions.manifest.json';

const FILE_RE = /^gate-(\d{4})(?:-(.+))?\.json$/i;

const str = (v) => (typeof v === 'string' ? v : undefined);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const arr = (v) => (Array.isArray(v) ? v : undefined);

const TYPE_ALIASES = new Map([
  ['mcq', 'MCQ'],
  ['mCQ'.toLowerCase(), 'MCQ'],
  ['single', 'MCQ'],
  ['single-correct', 'MCQ'],
  ['single-mcq', 'MCQ'],
  ['msq', 'MSQ'],
  ['multi', 'MSQ'],
  ['multiple', 'MSQ'],
  ['multiple-correct', 'MSQ'],
  ['nat', 'NAT'],
  ['numerical', 'NAT'],
  ['numeric', 'NAT'],
]);

const DIFF_ALIASES = new Map([
  ['easy', 'Easy'],
  ['low', 'Easy'],
  ['1', 'Easy'],
  ['2', 'Medium'],
  ['medium', 'Medium'],
  ['moderate', 'Medium'],
  ['3', 'Hard'],
  ['hard', 'Hard'],
  ['tough', 'Hard'],
]);

function normaliseType(v) {
  if (typeof v !== 'string') return 'MCQ';
  return TYPE_ALIASES.get(v.trim().toLowerCase()) ?? 'MCQ';
}

function normaliseDifficulty(v) {
  if (v === undefined || v === null || v === '') return 'Medium';
  return DIFF_ALIASES.get(String(v).trim().toLowerCase()) ?? 'Medium';
}

/** Strips markup and `$...$` so the manifest stays plain-text and small. */
function plainText(v) {
  if (typeof v !== 'string') return '';
  return v
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]*)\$/g, ' $1 ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectType(q) {
  if (arr(q.options)?.length) return normaliseType(q.type ?? 'MCQ');
  if (q.answer !== undefined && q.answer !== null && q.answer !== '') {
    if (normaliseType(q.type) === 'MCQ') return 'NAT';
  }
  return normaliseType(q.type ?? 'NAT');
}

/** Accepts `answer`, `correctAnswer`, `correct`; MSQ may be string | string[]. */
function correctKeys(q) {
  const raw = q.answer ?? q.correctAnswer ?? q.correct ?? q.answerKey;
  if (raw === undefined || raw === null) return [];
  if (Array.isArray(raw)) return raw.map((x) => String(x).trim()).filter(Boolean);
  if (typeof raw === 'number') return [String(raw)];
  if (typeof raw === 'string' && raw.includes(';') && !/^[\s\S]*\$[\s\S]*$/.test(raw)) {
    return raw
      .split(';')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [String(raw).trim()].filter(Boolean);
}

function coerceOptions(q) {
  const raw = q.options;
  if (!Array.isArray(raw)) return undefined;
  const letters = 'ABCDEFGH';
  return raw.map((o, i) => {
    if (typeof o === 'string') return { key: letters[i] ?? `O${i + 1}`, text: o };
    if (o && typeof o === 'object') {
      return {
        key: str(o.key) ?? str(o.id) ?? letters[i] ?? `O${i + 1}`,
        text: str(o.text) ?? str(o.label) ?? str(o.value) ?? '',
      };
    }
    return { key: letters[i] ?? `O${i + 1}`, text: String(o ?? '') };
  });
}

function coerceQuestion(raw, file, index, warnings) {
  if (!raw || typeof raw !== 'object') {
    warnings.push(`${basename(file)}[#${index}]: entry is not an object — skipped`);
    return null;
  }

  const year = num(raw.year) ?? Number(/gate-(\d{4})/i.exec(file)?.[1] ?? NaN);
  if (!Number.isFinite(year)) {
    warnings.push(`${basename(file)}[#${index}]: missing "year" and year not inferable from filename — skipped`);
    return null;
  }

  const questionText = str(raw.question) ?? str(raw.text) ?? str(raw.stem) ?? '';
  if (!questionText.trim()) {
    warnings.push(`${basename(file)}[#${index}]: missing "question" — skipped`);
    return null;
  }

  const id = str(raw.id) ?? `gate-${year}-${String(index + 1).padStart(4, '0')}`;
  const type = detectType(raw);
  const options = type === 'NAT' ? undefined : coerceOptions(raw);
  const answer = correctKeys(raw);

  if (options && !answer.length) {
    warnings.push(`${basename(file)}[${id}]: no correct answer provided`);
  }
  if (type !== 'NAT' && options && options.length < 2) {
    warnings.push(`${basename(file)}[${id}]: fewer than 2 options`);
  }

  const natTolerance = num(raw.natTolerance) ?? num(raw.tolerance) ?? 0;

  return {
    id,
    year,
    branch: str(raw.branch) ?? str(raw.paper) ?? '',
    subject: str(raw.subject) ?? str(raw.category) ?? 'Uncategorised',
    topic: str(raw.topic) ?? str(raw.subtopic) ?? 'General',
    type,
    marks: num(raw.marks) ?? (type === 'MSQ' ? 2 : 1),
    negativeMarks: num(raw.negativeMarks) ?? num(raw.negative) ?? 0,
    difficulty: normaliseDifficulty(raw.difficulty),
    question: questionText,
    options,
    answer,
    natTolerance,
    explanation: str(raw.explanation) ?? str(raw.solution) ?? '',
    hint: str(raw.hint) ?? '',
    image: str(raw.image) ?? str(raw.imageUrl) ?? str(raw.figure) ?? '',
    source: str(raw.source) ?? '',
    tags: arr(raw.tags)?.filter((t) => typeof t === 'string') ?? [],
  };
}

function readQuestions(file, warnings) {
  const text = readFileSync(file, 'utf8');
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    warnings.push(`${basename(file)}: invalid JSON — ${err.message}`);
    return [];
  }

  let list;
  if (Array.isArray(data)) list = data;
  else if (Array.isArray(data?.questions)) list = data.questions;
  else if (Array.isArray(data?.data)) list = data.data;
  else if (data && typeof data === 'object') list = [data];
  else {
    warnings.push(`${basename(file)}: expected an array, or an object with a "questions" array`);
    return [];
  }

  return list
    .map((q, i) => coerceQuestion(q, file, i, warnings))
    .filter(Boolean);
}

/**
 * @returns {{ manifest: object, files: Record<string, string>, warnings: string[] }}
 *   `files` maps year -> absolute path, so the bundler can import per-year chunks.
 */
export function buildManifest() {
  const warnings = [];
  const files = {};
  const questions = [];

  let entries = [];
  if (existsSync(QUESTION_DIR)) {
    entries = readdirSync(QUESTION_DIR)
      .filter((f) => extname(f).toLowerCase() === '.json')
      .filter((f) => FILE_RE.test(f) || f === 'questions.json')
      .sort();
  } else {
    warnings.push('src/data/questions does not exist yet');
  }

  for (const name of entries) {
    const abs = join(QUESTION_DIR, name);
    const parsed = readQuestions(abs, warnings);
    if (!parsed.length) continue;
    const year = parsed[0].year;
    files[year] = abs;
    questions.push(...parsed);
  }

  // Later files win on duplicate ids; keep the last occurrence stable.
  const byId = new Map();
  for (const q of questions) {
    if (byId.has(q.id)) warnings.push(`duplicate id "${q.id}" — keeping last occurrence`);
    byId.set(q.id, q);
  }
  const finalQuestions = [...byId.values()].sort(
    (a, b) => a.year - b.year || a.id.localeCompare(b.id),
  );

  const subjects = new Map();
  const topicsBySubject = new Map();
  const types = new Set();
  const difficulties = new Set();
  const branches = new Set();
  const tags = new Set();
  const years = new Set();

  const index = finalQuestions.map((q) => {
    years.add(q.year);
    types.add(q.type);
    difficulties.add(q.difficulty);
    if (q.branch) branches.add(q.branch);
    q.tags.forEach((t) => tags.add(t));

    const s = subjects.get(q.subject) ?? { subject: q.subject, total: 0, topics: new Set() };
    s.total += 1;
    s.topics.add(q.topic);
    subjects.set(q.subject, s);

    const ts = topicsBySubject.get(q.subject) ?? new Set();
    ts.add(q.topic);
    topicsBySubject.set(q.subject, ts);

    return {
      id: q.id,
      y: q.year,
      s: q.subject,
      t: q.topic,
      k: q.type,
      d: q.difficulty,
      m: q.marks,
      n: q.negativeMarks,
      p: plainText(q.question).slice(0, 220),
      x: plainText(q.explanation).slice(0, 120),
      h: q.image ? 1 : undefined,
      o: q.options?.length,
    };
  });

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    total: index.length,
    years: [...years].sort((a, b) => a - b),
    branches: [...branches].sort(),
    types: [...types].sort(),
    difficulties: ['Easy', 'Medium', 'Hard'].filter((d) => difficulties.has(d)),
    tags: [...tags].sort(),
    /** year -> source file basename, so the client can code-split by year */
    yearFiles: Object.fromEntries(
      Object.entries(files).map(([year, abs]) => [year, basename(abs)]),
    ),
    subjects: [...subjects.values()]
      .map((s) => ({ name: s.subject, total: s.total, topics: [...s.topics].sort() }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    yearTotals: years.size
      ? [...years]
          .sort((a, b) => a - b)
          .reduce((acc, y) => ({ ...acc, [y]: finalQuestions.filter((q) => q.year === y).length }), {})
      : {},
    questions: index,
  };

  return { manifest, files, warnings };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const { manifest, warnings } = buildManifest();
  if (process.argv.includes('--write')) {
    writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));
    console.log(`wrote ${OUT_FILE} (${manifest.total} questions)`);
  } else {
    console.log(JSON.stringify({ total: manifest.total, subjects: manifest.subjects.length }, null, 2));
  }
  for (const w of warnings) console.warn(`  warning: ${w}`);
}
