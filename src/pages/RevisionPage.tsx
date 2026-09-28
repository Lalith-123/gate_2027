import { useMemo, useState } from 'react';
import { BookmarkCheck, CircleX } from 'lucide-react';
import { Page, PageHeading } from '@/components/layout/AppShell';
import { FilterBar } from '@/components/filters/FilterBar';
import { QuestionRow, useRowBuilder } from '@/components/question/QuestionRow';
import { EmptyState, SectionTitle } from '@/components/common/Display';
import { ButtonLink } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/Overlay';
import { useUser } from '@/state/UserStore';
import { getAllMeta } from '@/services/questionService';
import { clearWrong } from '@/services/progressService';
import { emptyFilters, filterMetas, type Filters } from '@/services/filterService';
import { useToast } from '@/components/common/Toast';
import { count } from '@/utils/format';

/** Questions the student marked for later. */
export function RevisionPage() {
  const { index } = useUser();
  const buildRow = useRowBuilder();
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });

  const marked = useMemo(() => {
    const all = getAllMeta().filter((m) => index.marked.has(m.id));
    return filterMetas(all, filters, index);
  }, [filters, index]);

  return (
    <Page>
      <PageHeading
        title="Revision"
        description="Questions you marked while practising. Answer them again until they stick."
      />

      {index.marked.size === 0 ? (
        <EmptyState
          icon={<BookmarkCheck aria-hidden className="size-7" />}
          title="Nothing marked yet"
          description="Tap the bookmark on any question to add it here for later."
          action={<ButtonLink to="/" variant="primary">Start practising</ButtonLink>}
        />
      ) : (
        <>
          <FilterBar filters={filters} onChange={setFilters} resultCount={marked.length} />
          <div className="mt-4">
            {marked.length === 0 ? (
              <EmptyState title="No matches" description="No marked questions match these filters." />
            ) : (
              <ul className="surface overflow-hidden">
                {marked.map((m) => (
                  <QuestionRow key={m.id} row={buildRow(m)} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Page>
  );
}

/** Questions answered incorrectly at least once. */
export function WrongPage() {
  const { user, index, replaceAll } = useUser();
  const buildRow = useRowBuilder();
  const toast = useToast();
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });
  const [confirm, setConfirm] = useState(false);

  const wrong = useMemo(() => {
    const all = getAllMeta().filter((m) => index.wrong.has(m.id));
    return filterMetas(all, filters, index);
  }, [filters, index]);

  return (
    <Page>
      <PageHeading
        title="Wrong answers"
        description="Kept until you answer correctly. Use this to find weak spots."
      />

      {index.wrong.size === 0 ? (
        <EmptyState
          icon={<CircleX aria-hidden className="size-7" />}
          title="No wrong answers"
          description="Nothing here means your recent attempts are all correct."
        />
      ) : (
        <>
          <FilterBar filters={filters} onChange={setFilters} resultCount={wrong.length} />

          <SectionTitle
            className="mt-5"
            action={
              <button
                type="button"
                onClick={() => setConfirm(true)}
                className="text-xs text-bad-ink hover:underline"
              >
                Clear list
              </button>
            }
          >
            {count(wrong.length)} questions
          </SectionTitle>

          {wrong.length === 0 ? (
            <EmptyState title="No matches" description="No wrong answers match these filters." />
          ) : (
            <ul className="surface overflow-hidden">
              {wrong.map((m) => (
                <QuestionRow key={m.id} row={buildRow(m)} />
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          const ids = Object.keys(user.wrong);
          replaceAll(clearWrong(user, ids));
          toast(`Cleared ${count(ids.length)} wrong answers`);
        }}
        title="Clear wrong answers?"
        message="This removes every question from the wrong-answer list. Your attempt history and notes are kept."
        confirmLabel="Clear list"
        danger
      />
    </Page>
  );
}
