import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import {
  emptyFilters,
  activeFilterCount,
  STATUS_LABELS,
  SORT_LABELS,
  type Filters,
  type SortKey,
  type StatusFilter,
} from '@/services/filterService';
import { useBank } from '@/state/BankStore';
import { Button } from '@/components/common/Button';
import { TextInput, Select, ChipGroup } from '@/components/common/Form';
import { Sheet } from '@/components/common/Overlay';
import { count } from '@/utils/format';
import type { Difficulty, QuestionType } from '@/types/question';

/**
 * Desktop: one horizontal bar. Mobile: a search box plus a "Filters" button
 * that opens a bottom sheet. Same state, two presentations.
 */
export function FilterBar({
  filters,
  onChange,
  resultCount,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  resultCount: number;
}) {
  const [sheet, setSheet] = useState(false);
  const { manifest } = useBank();
  const active = activeFilterCount(filters);

  const patch = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  const clearAll = () => onChange({ ...emptyFilters });

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <TextInput
          type="search"
          value={filters.q}
          onChange={(e) => patch({ q: e.target.value })}
          placeholder="Search questions, topics, keywords"
          aria-label="Search questions"
          className="flex-1"
        />

        {/* filters collapse into a sheet on small screens */}
        <Button
          variant="secondary"
          onClick={() => setSheet(true)}
          className="lg:hidden"
          icon={<SlidersHorizontal aria-hidden className="size-4" />}
        >
          Filters
          {active > 0 && (
            <span className="tnum ml-0.5 rounded bg-brand px-1.5 text-2xs font-semibold text-white">
              {active}
            </span>
          )}
        </Button>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <Select
          value={filters.status}
          onChange={(e) => patch({ status: e.target.value as StatusFilter })}
          options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          aria-label="Status"
          className="w-40"
        />
        <Select
          value={filters.sort}
          onChange={(e) => patch({ sort: e.target.value as SortKey })}
          options={Object.entries(SORT_LABELS).map(([value, label]) => ({ value, label }))}
          aria-label="Sort"
          className="w-44"
        />
        <Select
          value={filters.subjects[0] ?? ''}
          onChange={(e) => patch({ subjects: e.target.value ? [e.target.value] : [] })}
          placeholder="All subjects"
          options={(manifest?.subjects ?? []).map((s) => ({ value: s.name, label: s.name, count: s.total }))}
          aria-label="Subject"
          className="w-48"
        />
        <Select
          value={filters.years[0] ? String(filters.years[0]) : ''}
          onChange={(e) => patch({ years: e.target.value ? [Number(e.target.value)] : [] })}
          placeholder="All years"
          options={(manifest?.years ?? [])
            .map((y) => {
              const total = manifest?.yearTotals[String(y)];
              return { value: String(y), label: String(y), count: total };
            })
            .sort((a, b) => Number(b.value) - Number(a.value))}
          aria-label="Year"
          className="w-32"
        />
        {active > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} icon={<X aria-hidden className="size-3.5" />}>
            Clear
          </Button>
        )}
        <p className="tnum ml-auto text-xs text-fg2">{count(resultCount)} results</p>
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <p className="tnum text-xs text-fg2">{count(resultCount)} results</p>
        {active > 0 && (
          <button type="button" onClick={clearAll} className="text-xs text-brand">
            Clear filters
          </button>
        )}
      </div>

      <Sheet
        open={sheet}
        onClose={() => setSheet(false)}
        title="Filters"
        footer={
          <>
            <Button onClick={clearAll}>Clear all</Button>
            <Button variant="primary" onClick={() => setSheet(false)}>
              Show {count(resultCount)} results
            </Button>
          </>
        }
      >
        <div className="space-y-5 p-4">
          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => patch({ status: e.target.value as StatusFilter })}
            options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Sort by"
            value={filters.sort}
            onChange={(e) => patch({ sort: e.target.value as SortKey })}
            options={Object.entries(SORT_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <ChipGroup
            legend="Years"
            options={[...(manifest?.years ?? [])]
              .sort((a, b) => b - a)
              .map((y) => ({ value: String(y), label: String(y), count: manifest?.yearTotals[String(y)] }))}
            value={filters.years.map(String)}
            onChange={(v) => patch({ years: v.map(Number) })}
            columns
          />
          <ChipGroup
            legend="Subjects"
            options={(manifest?.subjects ?? []).map((s) => ({ value: s.name, label: s.name, count: s.total }))}
            value={filters.subjects}
            onChange={(v) => patch({ subjects: v })}
            columns
          />
          <ChipGroup<QuestionType>
            legend="Question type"
            options={[
              { value: 'MCQ' as QuestionType, label: 'MCQ' },
              { value: 'MSQ' as QuestionType, label: 'MSQ' },
              { value: 'NAT' as QuestionType, label: 'NAT' },
            ]}
            value={filters.types}
            onChange={(v) => patch({ types: v })}
          />
          <ChipGroup<Difficulty>
            legend="Difficulty"
            options={[
              { value: 'Easy' as Difficulty, label: 'Easy' },
              { value: 'Medium' as Difficulty, label: 'Medium' },
              { value: 'Hard' as Difficulty, label: 'Hard' },
            ]}
            value={filters.difficulties}
            onChange={(v) => patch({ difficulties: v })}
          />
        </div>
      </Sheet>
    </div>
  );
}
