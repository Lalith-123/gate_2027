import type { ExportFile, UserData } from '@/types/question';
import { emptyUserData } from '@/services/storageService';

const APP_ID = 'gate-practice';
const SCHEMA_VERSION = 1;
const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

export interface TransferResult {
  ok: boolean;
  message: string;
  data?: UserData;
}

/**
 * User data only. The question bank is static and ships with the app, so it is
 * deliberately excluded from the export.
 */
export function serialiseUserData(user: UserData): ExportFile {
  return {
    app: APP_ID,
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      version: user.version,
      createdAt: user.createdAt,
      updatedAt: Date.now(),
      settings: user.settings,
      questions: user.questions,
      notes: user.notes,
      revision: user.revision,
      wrong: user.wrong,
      subjectNotes: user.subjectNotes,
      recent: user.recent,
    },
  };
}

export function downloadUserData(user: UserData): void {
  const payload = serialiseUserData(user);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gate-progress-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Accepts both the app's own export format and a raw user-data object, so a
 * hand-edited or partially written file can still be recovered where possible.
 */
export function parseUserData(text: string): TransferResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `That file is not valid JSON. ${message}` };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, message: 'Expected a JSON object at the top level.' };
  }

  const root = parsed as Record<string, unknown>;
  if (root.app && root.app !== APP_ID) {
    return { ok: false, message: `This file was exported by a different app (${String(root.app)}).` };
  }

  const candidate = (root.data ?? root) as Record<string, unknown>;
  const hasSignal =
    'questions' in candidate || 'settings' in candidate || 'revision' in candidate || 'notes' in candidate;
  if (!hasSignal) {
    return {
      ok: false,
      message: 'No preparation data found. Expected keys such as "questions", "notes" or "settings".',
    };
  }

  return { ok: true, message: 'Progress file read successfully.', data: candidate as unknown as UserData };
}

export async function readFile(file: File): Promise<TransferResult> {
  if (file.size > MAX_IMPORT_BYTES) {
    return { ok: false, message: 'That file is larger than 8 MB and was not imported.' };
  }
  try {
    return parseUserData(await file.text());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Could not read the file. ${message}` };
  }
}

export function freshUserData(): UserData {
  return emptyUserData();
}

export function countRecords(user: UserData) {
  return {
    attempted: Object.values(user.questions).filter((q) => q.attempted).length,
    notes: Object.keys(user.notes).length,
    subjectNotes: user.subjectNotes.length,
    revision: Object.keys(user.revision).length,
    wrong: Object.keys(user.wrong).length,
  };
}
