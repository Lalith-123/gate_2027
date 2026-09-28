import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkX, Play, SlidersHorizontal } from 'lucide-react';
import { emptyFilters, filterMetas, type Filters } from '@/services/filterService';
import { useBank } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';
import { FilterChips, FilterPanel } from '@/components/filters/FilterPanel';
import { QuestionRow } from '@/components/questions/QuestionRow';
import { Button } from '@/components/common/Button';
import { IconButton } from '@/components/common/IconButton';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/components/common/Toast';
import { VirtualList } from '@/components/common/VirtualList';

export function Revision() {
  const { metas } = useBank();
  const { index, markForRevision } = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sheetOpen, setSheetOpen] = useState(false);

  const markedIds = useMemo(() => index.marked, [index.marked]);

  const candidates = useMemo(
    () => metas.filter((m) => markedIds.has(m.id)),
    [metas, markedIds],
  );

  const results = useMemo(
    () => filterMetas(candidates, { ...filters, status: 'all' }, index, 11),
    [candidates, filters, index],
  );

  const clear = () => setFilters(emptyFilters);

  const practiceAll = () =>
    navigate('/practice/pool', { state: { ids: results.map((m) => m.id), label: 'your revision list' } });

  const practiceWeakest = () => {
    const wrong = results.filter((m) => index.wrong.has(m.id));
    const pool = wrong.length ? wrong : results;
    navigate('/practice/pool', {
      state: { ids: pool.map((m) => m.id), label: wrong.length ? 'the questions you got wrong' : 'your revision list' },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
            {candidates.length.toLocaleString('en-IN')} marked for revision
          </h2>
          <p className="text-xs text-ink-mute">
            {results.length.toLocaleString('en-IN')} shown after filters
            {results.filter((m) => index.wrong.has(m.id)).length > 0 &&
              ` · ${results.filter((m) => index.wrong.has(m.id)).length} still wrong`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="lg:hidden" onClick={() => setSheetOpen(true)} iconLeft={<SlidersHorizontal aria-hidden className="size-3.5" />}>
            Filters
          </Button>
          <Button size="sm" onClick={practiceWeakest} disabled={results.length === 0} iconLeft={<Play aria-hidden className="size-3.5" />}>
            Practise
          </Button>
        </div>
      </div>

      <FilterChips filters={filters} onChange={setFilters} onClear={clear} />

      <div className="panel overflow-hidden">
        {results.length === 0 ? (
          <div className="p-4">
            {candidates.length === 0 ? (
              <EmptyState
                compact
                icon={<Bookmark aria-hidden className="size-5" />}
                title="No questions marked for revision"
                body="Use “Mark for revision” while solving a question and it will collect here for a focused session."
                action={
                  <Button size="sm" variant="primary" className="mt-5" onClick={() => navigate('/')} iconLeft={<Play aria-hidden className="size-3.5" />}>
                    Start practising
                  </Button>
                }
              />
            ) : (
              <EmptyState
                compact
                title="No marked questions match these filters"
                body="Loosen the filters to see the rest of your revision list."
                action={
                  <Button size="sm" className="mt-4" onClick={clear}>
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
              <p className="text-2xs text-ink-mute">
                Sorted by{' '}
                {filters.sort === 'recent'
                  ? 'recent attempts'
                  : filters.sort === 'year-asc'
                    ? 'oldest year'
                    : filters.sort === 'difficulty'
                      ? 'difficulty'
                      : filters.sort}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={practiceAll}
                iconLeft={<Play aria-hidden className="size-3.5" />}
              >
                Practise all {results.length}
              </Button>
            </div>

            <VirtualList
              items={results}
              rowHeight={132}
              height={Math.min(680, Math.max(300, results.length * 0.5))}
              keyExtractor={(m) => m.id}
              renderRow={(meta, i) => (
                <QuestionRow
                  meta={meta}
                  index={i}
                  status={index}
                  marked
                  to={`/practice/${meta.id}`}
                  actions={
                    <IconButton
                      label="Remove from revision"
                      size="sm"
                      tone="warn"
                      onClick={() => {
                        markForRevision(meta.id, false);
                        toast('Removed from revision');
                      }}
                    >
                      <BookmarkX aria-hidden className="size-4" />
                    </IconButton>
                  }
                />
              )}
            />
          </>
        )}
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        description={`${results.length.toLocaleString('en-IN')} marked questions`}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button size="sm" variant="ghost" onClick={clear}>
              Clear all
            </Button>
            <Button size="sm" variant="primary" onClick={() => setSheetOpen(false)}>
              Show results
            </Button>
          </div>
        }
      >
        <FilterPanel filters={filters} onChange={setFilters} onClear={clear} showStatus={false} resultCount={results.length} />
      </Modal>
    </div>
  );
}

export default Revision;
