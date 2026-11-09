import { useState } from 'react';
import { ChevronDown, RotateCcw, X } from 'lucide-react';
import type { Filters, Question } from '../types';
import { getSubjects, getPaperOptions } from '../utils/filters';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onClear: () => void;
  allQuestions: Question[];
}

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClear,
  allQuestions,
}: FilterPanelProps) {
  if (!isOpen) return null;

  const subjects = getSubjects(allQuestions);
  const papers = getPaperOptions(allQuestions, filters.subjects);

  /** Drop paper selections that no longer belong to the chosen subjects. */
  const changeSubjects = (nextSubjects: string[]) => {
    const allowed = new Set(getPaperOptions(allQuestions, nextSubjects).map((paper) => paper.key));
    onFiltersChange({
      ...filters,
      subjects: nextSubjects,
      papers: filters.papers.filter((paper) => allowed.has(paper)),
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
          <MultiSelect
            label="Subjects"
            options={subjects.map((subject) => ({ value: subject, label: subject }))}
            selected={filters.subjects}
            onChange={changeSubjects}
            allLabel="All Subjects"
          />

          <MultiSelect
            label="Question Papers"
            options={papers.map((paper) => ({
              value: paper.key,
              label: paper.label,
              hint: `${paper.count}`,
            }))}
            selected={filters.papers}
            onChange={(nextPapers) => onFiltersChange({ ...filters, papers: nextPapers })}
            allLabel="All Papers"
            emptyText="Select subjects first"
          />

          <div className="space-y-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
            <CheckRow
              checked={filters.onlyIncorrect}
              onChange={(checked) => onFiltersChange({ ...filters, onlyIncorrect: checked })}
              label="Show only incorrect questions"
              hint="From the selected papers"
            />
            <CheckRow
              checked={filters.onlySaved}
              onChange={(checked) => onFiltersChange({ ...filters, onlySaved: checked })}
              label="Only saved questions"
              hint="Bookmarked questions"
            />
          </div>
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

interface MultiSelectOption {
  value: string;
  label: string;
  hint?: string;
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  allLabel,
  emptyText,
}: {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedSet = new Set(selected);
  const disabled = options.length === 0;

  const summary = (() => {
    if (disabled) return emptyText ?? allLabel;
    if (selected.length === 0) return allLabel;
    if (selected.length === 1) {
      return options.find((option) => option.value === selected[0])?.label ?? selected[0];
    }
    return `${selected.length} selected`;
  })();

  const toggle = (value: string) => {
    onChange(
      selectedSet.has(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  };

  const allSelected =
    options.length > 0 && options.every((option) => selectedSet.has(option.value));

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[11px] font-medium text-blue-600 dark:text-blue-400"
          >
            Clear
          </button>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="truncate text-left">{summary}</span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-slate-400 transition-transform ${
            open && !disabled ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 space-y-0.5">
          <label className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 border-b border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => onChange(allSelected ? [] : options.map((option) => option.value))}
              className="w-4 h-4 accent-blue-500 flex-shrink-0"
            />
            <span className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
              Select all
            </span>
          </label>
          {options.map((option) => {
            const checked = selectedSet.has(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                  className="w-4 h-4 accent-blue-500 flex-shrink-0"
                />
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">{option.label}</span>
                {option.hint && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{option.hint}</span>
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 w-4 h-4 accent-blue-500 flex-shrink-0"
      />
      <span>
        <span className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="block text-[11px] text-slate-500 dark:text-slate-400">{hint}</span>
      </span>
    </label>
  );
}
