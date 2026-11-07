import { X, RotateCcw } from 'lucide-react';
import type { BrowseMode, Filters, Question } from '../types';
import {
  getUniqueYears,
  getUniqueTopics,
  getUniqueSubjects,
  getTopicCounts,
  getUniqueTypes,
  getUniqueDifficulties,
  getUniqueSources,
} from '../utils/filters';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClear: () => void;
  allQuestions: Question[];
}

const MODES: { value: BrowseMode; label: string; hint: string }[] = [
  { value: 'all', label: 'All Questions', hint: 'Every question in the bank' },
  { value: 'previousYear', label: 'Previous Year', hint: 'Real GATE year papers' },
  { value: 'topic', label: 'Topic', hint: 'Browse topic by topic' },
];

const SOURCE_LABELS: Record<string, string> = {
  official: 'Official',
  trusted: 'Trusted',
  recalled: 'Recalled',
  practice_test: 'Practice Test',
};

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClear,
  allQuestions,
}: FilterPanelProps) {
  if (!isOpen) return null;

  const years = getUniqueYears(allQuestions);
  const selectedSubject = filters.subject !== 'all' ? filters.subject : undefined;
  const subjects = getUniqueSubjects(
    allQuestions,
    filters.topic !== 'all' ? filters.topic : undefined
  );
  const topics = getUniqueTopics(allQuestions, selectedSubject);
  const topicCounts = getTopicCounts(allQuestions, selectedSubject);
  const types = getUniqueTypes(allQuestions);
  const difficulties = getUniqueDifficulties(allQuestions);
  const sources = getUniqueSources(allQuestions);

  /** Switching modes clears the selectors that belong to the mode being left. */
  const changeMode = (browseMode: BrowseMode) => {
    onFiltersChange({
      ...filters,
      browseMode,
      year: 'all',
      subject: 'all',
      topic: 'all',
    });
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Browse Questions</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Browse by
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => changeMode(mode.value)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                    filters.browseMode === mode.value
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {MODES.find((m) => m.value === filters.browseMode)?.hint}
            </p>
          </div>

          {filters.browseMode === 'previousYear' &&
            (years.length > 0 ? (
              <FilterSelect
                label="Year"
                value={filters.year}
                options={years}
                allLabel="All Years"
                onChange={(v) =>
                  onFiltersChange({ ...filters, year: v === 'all' ? 'all' : Number(v) })
                }
                formatOption={(year) => `GATE ${year}`}
              />
            ) : (
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  No previous-year papers yet
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Add year-tagged questions as{' '}
                  <code className="font-mono">previous_year/gate_&lt;year&gt;.json</code> and they will
                  appear here automatically.
                </p>
              </div>
            ))}

          {filters.browseMode === 'topic' && (
            <>
              <FilterSelect
                label="Subject"
                value={filters.subject}
                options={subjects}
                allLabel="All Subjects"
                onChange={(v) => onFiltersChange({ ...filters, subject: v, topic: 'all' })}
              />

              <FilterSelect
                label="Topic"
                value={filters.topic}
                options={topics}
                allLabel="All Topics"
                onChange={(v) => onFiltersChange({ ...filters, topic: v })}
                formatOption={(topic) => `${topic} (${topicCounts.get(String(topic)) ?? 0})`}
              />
            </>
          )}

          <FilterSelect
            label="Question Type"
            value={filters.type}
            options={types}
            allLabel="All Types"
            onChange={(v) => onFiltersChange({ ...filters, type: v as Filters['type'] })}
            displayMap={{ MCQ: 'MCQ — one correct', MSQ: 'MSQ — one or more', NAT: 'NAT — numerical' }}
          />

          <FilterSelect
            label="Difficulty"
            value={filters.difficulty}
            options={difficulties}
            allLabel="All Difficulties"
            onChange={(v) => onFiltersChange({ ...filters, difficulty: v as Filters['difficulty'] })}
          />

          <FilterSelect
            label="Source"
            value={filters.source}
            options={sources}
            allLabel="All Sources"
            onChange={(v) => onFiltersChange({ ...filters, source: v as Filters['source'] })}
            displayMap={SOURCE_LABELS}
          />

          <FilterSelect
            label="Status"
            value={filters.status}
            options={['unattempted', 'correct', 'incorrect', 'bookmarked']}
            allLabel="All"
            onChange={(v) => onFiltersChange({ ...filters, status: v as Filters['status'] })}
            displayMap={{
              unattempted: 'Unattempted',
              correct: 'Correct',
              incorrect: 'Incorrect',
              bookmarked: 'Bookmarked',
            }}
          />
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
          <button
            onClick={onClear}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Filters
          </button>
          <button
            onClick={onClose}
            className="flex-1 p-3 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
  displayMap,
  formatOption,
}: {
  label: string;
  value: string | number;
  options: (string | number)[];
  allLabel: string;
  onChange: (v: string) => void;
  displayMap?: Record<string, string>;
  formatOption?: (option: string | number) => string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
      >
        <option value="all">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {displayMap?.[String(o)] ?? formatOption?.(o) ?? String(o)}
          </option>
        ))}
      </select>
    </div>
  );
}
