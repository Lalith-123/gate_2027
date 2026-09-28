import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, Play, SlidersHorizontal, Trash2, TriangleAlert } from 'lucide-react';
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

export function WrongQuestions() {
  const { metas } = useBank();
  const { index, user, removeWrong, clearWrongQuestions } = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const candidates = useMemo(() => metas.filter((m) => index.wrong.has(m.id)), [metas, index.wrong]);
  const results = useMemo(
    () => filterMetas(candidates, { ...filters, status: 'all' }, index, 13),
    [candidates, filters, index],
  );

  const clear = () => setFilters(emptyFilters);

  const solvedCount = candidates.filter((m) => index.correct.has(m.id)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-ink">
            {candidates.length.toLocaleString('en-IN')} wrong questions
          </h2>
          <p className="text-xs text-ink-mute">
            {solvedCount > 0
              ? `${solvedCount} since answered correctly — kept here until you remove them`
              : 'Every one of these is still unanswered correctly'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="lg:hidden" onClick={() => setSheetOpen(true)} iconLeft={<SlidersHorizontal aria-hidden className="size-3.5" />}>
            Filters
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={results.length === 0}
            onClick={() => navigate('/practice/pool', { state: { ids: results.map((m) => m.id), label: 'your wrong questions' } })}
            iconLeft={<Play aria-hidden className="size-3.5" />}
          >
            Practise wrong
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
                icon={<CircleCheck aria-hidden className="size-5" />}
                title="No wrong questions yet"
                body="Anything you answer incorrectly is collected here automatically, with the number of attempts and the result of your last try."
                action={
                  <Button size="sm" variant="primary" className="mt-5" onClick={() => navigate('/')} iconLeft={<Play aria-hidden className="size-3.5" />}>
                    Start practising
                  </Button>
                }
              />
            ) : (
              <EmptyState
                compact
                title="No wrong questions match these filters"
                body="Loosen the filters to see the rest of your list."
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5 sm:px-5">
              <p className="text-2xs text-ink-mute">{results.length.toLocaleString('en-IN')} questions in this view</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmClear(true)}
                iconLeft={<Trash2 aria-hidden className="size-3.5" />}
              >
                Remove all from list
              </Button>
            </div>

            <VirtualList
              items={results}
              rowHeight={150}
              height={Math.min(680, Math.max(300, results.length * 0.5))}
              keyExtractor={(m) => m.id}
              renderRow={(meta, i) => {
                const state = user.questions[meta.id];
                const wrong = user.wrong[meta.id];
                return (
                  <QuestionRow
                    meta={meta}
                    index={i}
                    status={index}
                    note={Boolean(user.notes[meta.id])}
                    to={`/practice/${meta.id}`}
                    attempts={state?.attempts ?? 0}
                    lastResult={state?.lastResult ?? null}
                    lastAttemptAt={state?.lastAttemptAt ?? null}
                    wrongAttempts={wrong?.attempts ?? 0}
                    actions={
                      <IconButton
                        label="Remove from wrong questions"
                        size="sm"
                        tone="danger"
                        onClick={() => {
                          removeWrong(meta.id);
                          toast('Removed from wrong questions');
                        }}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </IconButton>
                    }
                  />
                );
              }}
            />
          </>
        )}
      </div>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Remove all wrong questions?"
        description="This only clears your list. Attempt history, notes and revision marks are left untouched."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                clearWrongQuestions(candidates.map((m) => m.id));
                setConfirmClear(false);
                toast('Wrong question list cleared');
              }}
            >
              Remove all
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {candidates.length.toLocaleString('en-IN')} questions will be removed from the wrong list. You can always find
          them again in the question bank.
        </p>
        {solvedCount > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-warn-soft/60 px-3 py-2.5 text-[13px] text-warn-ink">
            <TriangleAlert aria-hidden className="mt-px size-4 shrink-0" />
            <span>
              {solvedCount} of these {solvedCount === 1 ? 'has' : 'have'} already been answered correctly.
            </span>
          </div>
        )}
      </Modal>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
        description={`${results.length.toLocaleString('en-IN')} wrong questions`}
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

export default WrongQuestions;
