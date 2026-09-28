import { useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Difficulty, QuestionType } from '@/types/question';
import {
  SORT_LABELS,
  activeFilterCount,
  emptyFilters,
  type Filters,
  type SortKey,
  type StatusFilter,
  STATUS_LABELS,
} from '@/services/filterService';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/common/Select';
import { useBank } from '@/state/BankProvider';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Chip({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors duration-150',
        active
          ? 'border-brand/40 bg-brand-soft text-brand-ink'
          : 'border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink',
      )}
    >
      {children}
      {count !== undefined && <span className="tabular-nums opacity-60">{count}</span>}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-2xs font-medium uppercase tracking-wider text-ink-mute">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/** The filter body, shared by the desktop toolbar and the mobile bottom sheet. */
export function FilterPanel({
  filters,
  onChange,
  onClear,
  showStatus = true,
  resultCount,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onClear: () => void;
  showStatus?: boolean;
  resultCount: number;
}) {
  const { facets, metas } = useBank();

  const counts = useMemo(() => {
    const years = new Map<number, number>();
    const subjects = new Map<string, number>();
    const types = new Map<QuestionType, number>();
    const diffs = new Map<Difficulty, number>();
    for (const m of metas) {
      years.set(m.y, (years.get(m.y) ?? 0) + 1);
      subjects.set(m.s, (subjects.get(m.s) ?? 0) + 1);
      types.set(m.k, (types.get(m.k) ?? 0) + 1);
      diffs.set(m.d, (diffs.get(m.d) ?? 0) + 1);
    }
    return { years, subjects, types, diffs };
  }, [metas]);

  const topics = useMemo(() => {
    const wanted = filters.subjects.length ? new Set(filters.subjects) : null;
    const set = new Set<string>();
    for (const m of metas) {
      if (wanted && !wanted.has(m.s)) continue;
      set.add(m.t);
    }
    return [...set].sort();
  }, [metas, filters.subjects]);

  const active = activeFilterCount(filters);

  return (
    <div className="space-y-5">
      <SearchInput
        value={filters.q}
        onChange={(q) => onChange({ ...filters, q })}
        placeholder="Search question text, topic, year or id"
        label="Search questions"
        hint={`${metas.length.toLocaleString('en-IN')} total`}
      />

      <Group label="GATE year">
        {facets.years.map((y) => (
          <Chip
            key={y.year}
            active={filters.years.includes(y.year)}
            count={counts.years.get(y.year)}
            onClick={() => onChange({ ...filters, years: toggle(filters.years, y.year) })}
          >
            {y.year}
          </Chip>
        ))}
      </Group>

      <Group label="Subject">
        {facets.subjects.map((s) => (
          <Chip
            key={s.name}
            active={filters.subjects.includes(s.name)}
            count={counts.subjects.get(s.name)}
            onClick={() => onChange({ ...filters, subjects: toggle(filters.subjects, s.name) })}
          >
            {s.name}
          </Chip>
        ))}
      </Group>

      {topics.length > 0 && (
        <Group label="Topic">
          {topics.map((t) => (
            <Chip
              key={t}
              active={filters.topics.includes(t)}
              onClick={() => onChange({ ...filters, topics: toggle(filters.topics, t) })}
            >
              {t}
            </Chip>
          ))}
        </Group>
      )}

      <Group label="Question type">
        {facets.types.map((t) => (
          <Chip
            key={t}
            active={filters.types.includes(t)}
            count={counts.types.get(t)}
            onClick={() => onChange({ ...filters, types: toggle(filters.types, t) })}
          >
            {t}
          </Chip>
        ))}
      </Group>

      <Group label="Difficulty">
        {facets.difficulties.map((d) => (
          <Chip
            key={d}
            active={filters.difficulties.includes(d)}
            count={counts.diffs.get(d)}
            onClick={() => onChange({ ...filters, difficulties: toggle(filters.difficulties, d) })}
          >
            {d}
          </Chip>
        ))}
      </Group>

      {showStatus && (
        <Group label="Status">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
            <Chip
              key={s}
              active={filters.status === s}
              onClick={() => onChange({ ...filters, status: s })}
            >
              {STATUS_LABELS[s]}
            </Chip>
          ))}
        </Group>
      )}

      <div className="flex items-center gap-2 border-t border-line pt-4">
        <Select
          aria-label="Sort order"
          label="Sort order"
          className="h-9 text-[13px]"
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortKey })}
          options={(Object.keys(SORT_LABELS) as SortKey[]).map((k) => ({ value: k, label: SORT_LABELS[k] }))}
        />
        {active > 0 && (
          <Button size="sm" variant="ghost" onClick={onClear} iconLeft={<X aria-hidden className="size-3.5" />}>
            Clear {active} filter{active === 1 ? '' : 's'}
          </Button>
        )}
      </div>

      <p className="text-2xs text-ink-mute">
        <span className="font-medium tabular-nums text-ink-soft">{resultCount.toLocaleString('en-IN')}</span> of{' '}
        {metas.length.toLocaleString('en-IN')} questions match
      </p>
    </div>
  );
}

export function FilterChips({ filters, onChange, onClear }: { filters: Filters; onChange: (f: Filters) => void; onClear: () => void }) {
  const active = activeFilterCount(filters);
  if (active === 0) return null;

  const chips: { key: string; label: string; remove: () => void }[] = [];
  for (const y of filters.years) chips.push({ key: `y${y}`, label: `GATE ${y}`, remove: () => onChange({ ...filters, years: filters.years.filter((v) => v !== y) }) });
  for (const s of filters.subjects) chips.push({ key: `s${s}`, label: s, remove: () => onChange({ ...filters, subjects: filters.subjects.filter((v) => v !== s) }) });
  for (const t of filters.topics) chips.push({ key: `t${t}`, label: t, remove: () => onChange({ ...filters, topics: filters.topics.filter((v) => v !== t) }) });
  for (const t of filters.types) chips.push({ key: `k${t}`, label: t, remove: () => onChange({ ...filters, types: filters.types.filter((v) => v !== t) }) });
  for (const d of filters.difficulties) chips.push({ key: `d${d}`, label: d, remove: () => onChange({ ...filters, difficulties: filters.difficulties.filter((v) => v !== d) }) });
  if (filters.status !== 'all')
    chips.push({ key: 'st', label: STATUS_LABELS[filters.status], remove: () => onChange({ ...filters, status: 'all' }) });
  if (filters.q.trim()) chips.push({ key: 'q', label: `“${filters.q.trim()}”`, remove: () => onChange({ ...filters, q: '' }) });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Badge key={chip.key} tone="brand" className="pr-1">
          {chip.label}
          <button
            type="button"
            onClick={chip.remove}
            aria-label={`Remove filter ${chip.label}`}
            className="-mr-0.5 grid size-4 place-items-center rounded text-brand-ink/70 transition-colors hover:bg-brand/15 hover:text-brand-ink"
          >
            <X aria-hidden className="size-2.5" />
          </button>
        </Badge>
      ))}
      <button type="button" onClick={onClear} className="text-xs font-medium text-ink-mute underline-offset-2 hover:text-ink hover:underline">
        Clear all
      </button>
    </div>
  );
}

export { emptyFilters };
