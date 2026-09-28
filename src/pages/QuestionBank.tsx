import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, SlidersHorizontal, X } from 'lucide-react';
import type { QuestionMeta } from '@/types/question';
import { emptyFilters, filterMetas, type Filters } from '@/services/filterService';
import { useBank } from '@/state/BankProvider';
import { useUser } from '@/state/UserProvider';
import { FilterChips, FilterPanel } from '@/components/filters/FilterPanel';
import { QuestionRow } from '@/components/questions/QuestionRow';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { ListRowSkeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { VirtualList } from '@/components/common/VirtualList';

const PAGE = 40;

export function QuestionBank() {
  const { metas, status, error, total } = useBank();
  const { user, index } = useUser();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const results = useMemo(
    () => filterMetas(metas, filters, index, 7),
    [metas, filters, index],
  );

  const shown: QuestionMeta[] = results.slice(0, visible);

  const clear = () => {
    setFilters(emptyFilters);
    setVisible(PAGE);
  };

  const open = (meta: QuestionMeta) => navigate(`/practice/${meta.id}`);

  const practiceSelection = () => {
    navigate('/practice/pool', { state: { ids: results.map((m) => m.id), label: `${results.length} filtered questions` } });
  };

  if (status === 'error') {
    return <ErrorState title="The question bank could not be loaded" message={error ?? undefined} onRetry={() => location.reload()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">Browse every question</h2>
          <p className="text-xs text-ink-mute">
            {results.length.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} questions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="lg:hidden"
            onClick={() => setSheetOpen(true)}
            iconLeft={<SlidersHorizontal aria-hidden className="size-3.5" />}
          >
            Filters
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={practiceSelection}
            disabled={results.length === 0}
            iconLeft={<BookOpenCheck aria-hidden className="size-3.5" />}
          >
            Practise selection
          </Button>
        </div>
      </div>

      <div className="panel hidden p-4 lg:block">
        <FilterPanel filters={filters} onChange={(f) => { setFilters(f); setVisible(PAGE); }} onClear={clear} resultCount={results.length} />
      </div>

      <FilterChips filters={filters} onChange={(f) => { setFilters(f); setVisible(PAGE); }} onClear={clear} />

      <div className="panel overflow-hidden">
        {status === 'loading' && metas.length === 0 ? (
          <ListRowSkeleton rows={8} />
        ) : results.length === 0 ? (
          <div className="p-4">
            <EmptyState
              compact
              title={metas.length === 0 ? 'No questions in the bank yet' : 'No questions match these filters'}
              body={
                metas.length === 0
                  ? 'Add a JSON file under src/data/questions to populate the bank.'
                  : 'Try removing a filter or searching for a broader term.'
              }
              action={
                metas.length > 0 ? (
                  <Button size="sm" className="mt-4" onClick={clear} iconLeft={<X aria-hidden className="size-3.5" />}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <VirtualList
            items={shown}
            rowHeight={132}
            height={Math.min(720, Math.max(320, shown.length * 0.5))}
            overscan={6}
            keyExtractor={(m) => m.id}
            renderRow={(meta, i) => (
              <QuestionRow
                meta={meta}
                index={i}
                status={index}
                marked={index.marked.has(meta.id)}
                note={Boolean(user.notes[meta.id])}
                to={`/practice/${meta.id}`}
                actions={
                  <Button size="sm" variant="ghost" onClick={() => open(meta)}>
                    Open
                  </Button>
                }
              />
            )}
          />
        )}
      </div>

      {visible < results.length && (
        <div className="flex justify-center">
          <Button
            onClick={() => setVisible((v) => v + PAGE)}
            loading={false}
          >
            Show {Math.min(PAGE, results.length - visible).toLocaleString('en-IN')} more
          </Button>
          <span className="ml-3 self-center text-xs text-ink-mute">
            {visible.toLocaleString('en-IN')} / {results.length.toLocaleString('en-IN')}
          </span>
        </div>
      )}

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        description={`${results.length.toLocaleString('en-IN')} questions match`}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button size="sm" variant="ghost" onClick={clear}>
              Clear all
            </Button>
            <Button size="sm" variant="primary" onClick={() => setSheetOpen(false)}>
              Show {results.length.toLocaleString('en-IN')} results
            </Button>
          </div>
        }
      >
        <FilterPanel
          filters={filters}
          onChange={(f) => { setFilters(f); setVisible(PAGE); }}
          onClear={clear}
          resultCount={results.length}
        />
      </Modal>
    </div>
  );
}

export default QuestionBank;
