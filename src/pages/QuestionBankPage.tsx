import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page, PageHeading } from '@/components/layout/AppShell';
import { FilterBar } from '@/components/filters/FilterBar';
import { QuestionRow, useRowBuilder } from '@/components/question/QuestionRow';
import { EmptyState, Skeleton } from '@/components/common/Display';
import { Button } from '@/components/common/Button';
import { useBank } from '@/state/BankStore';
import { useUser } from '@/state/UserStore';
import { getAllMeta } from '@/services/questionService';
import { emptyFilters, filterMetas, type Filters } from '@/services/filterService';
import { count } from '@/utils/format';
import { ListFilter } from 'lucide-react';

/** The full bank, with search, filtering and sorting. */
export function QuestionBankPage() {
  const { status, manifest } = useBank();
  const { index } = useUser();
  const buildRow = useRowBuilder();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });

  const results = useMemo(
    () => filterMetas(getAllMeta(), filters, index),
    [filters, index],
  );

  if (status === 'loading' && !manifest) {
    return (
      <Page width="wide">
        <Skeleton className="mb-4 h-10 w-64" />
        <Skeleton className="mb-3 h-9 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-16 w-full" />
        ))}
      </Page>
    );
  }

  return (
    <Page width="wide">
      <PageHeading
        title="Question bank"
        description={
          manifest
            ? `${count(manifest.total)} questions across ${manifest.years.length} years and ${manifest.subjects.length} subjects.`
            : undefined
        }
      />

      <FilterBar filters={filters} onChange={setFilters} resultCount={results.length} />

      <div className="mt-4">
        {results.length === 0 ? (
          <EmptyState
            icon={<ListFilter aria-hidden className="size-7" />}
            title="No questions match"
            description="Try a different search term, or clear the filters to see the whole bank."
            action={
              <Button onClick={() => setFilters({ ...emptyFilters })}>Clear filters</Button>
            }
          />
        ) : (
          <>
            <ul className="surface overflow-hidden">
              {results.slice(0, 300).map((m) => (
                <QuestionRow key={m.id} row={buildRow(m)} />
              ))}
            </ul>
            {results.length > 300 && (
              <p className="mt-3 text-center text-xs text-fg2">
                Showing the first 300 of {count(results.length)} matches. Narrow the search to
                see more.
              </p>
            )}
            <div className="mt-6 flex justify-center">
              <Button
                variant="primary"
                onClick={() => navigate(`/?mode=${filters.subjects[0] ? 'subject' : 'random'}`)}
              >
                Practise these
              </Button>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
