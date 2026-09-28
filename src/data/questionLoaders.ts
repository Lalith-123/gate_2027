/**
 * Per-year question chunk loaders.
 *
 * `import.meta.glob` turns every JSON file in `src/data/questions/` into its
 * own lazily loaded chunk, keyed by file name. Dropping in a new file such as
 * `gate-2027.json` therefore adds a new year to the app with no code change.
 */
import type { Question } from '@/types/question';

type RawModule = { default: unknown };

const modules = import.meta.glob<RawModule>('/src/data/questions/*.json');

/** basename -> chunk loader */
export const yearChunks: Record<string, () => Promise<RawModule>> = {};
for (const [path, load] of Object.entries(modules)) {
  const name = path.slice(path.lastIndexOf('/') + 1);
  yearChunks[name] = load;
}

export const availableFiles = Object.keys(yearChunks).sort();

export type { Question };
