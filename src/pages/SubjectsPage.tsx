import { useNavigate } from 'react-router-dom';
import { Page, PageHeading } from '@/components/layout/AppShell';
import { Meter, EmptyState, Skeleton, TypeTag } from '@/components/common/Display';
import { useBank } from '@/state/BankStore';
import { useUser } from '@/state/UserStore';
import { getAllMeta } from '@/services/questionService';
import { count, percent } from '@/utils/format';
import { Library } from 'lucide-react';

/**
 * Subjects, with how far the student has come through each. Tapping a subject
 * starts a session scoped to it.
 */
export function SubjectsPage() {
  const { manifest, status } = useBank();
  const { user } = useUser();
  const navigate = useNavigate();

  if (status === 'loading' && !manifest) {
    return (
      <Page>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-16 w-full" />
        ))}
      </Page>
    );
  }

  const subjects = manifest?.subjects ?? [];
  if (!subjects.length) {
    return (
      <Page>
        <EmptyState
          icon={<Library aria-hidden className="size-7" />}
          title="No subjects loaded"
          description="The question bank has not been indexed yet. Refresh the page to try again."
        />
      </Page>
    );
  }

  // aggregate each subject's per-question state into a single progress figure
  const progress = subjects.map((subject) => {
    const ids = getAllMeta()
      .filter((m) => m.s === subject.name)
      .map((m) => user.questions[m.id])
      .filter(Boolean);

    const attempted = ids.filter((s) => s!.attempted).length;
    const correct = ids.filter((s) => s!.lastResult === 'correct').length;
    const types = Array.from(
      new Set(getAllMeta().filter((m) => m.s === subject.name).map((m) => m.k)),
    );

    return {
      ...subject,
      attempted,
      correct,
      coverage: percent(attempted, subject.total),
      accuracy: percent(correct, attempted),
      types,
    };
  });

  return (
    <Page>
      <PageHeading
        title="Subjects"
        description="Pick a subject to start a focused session."
      />

      <ul className="space-y-2">
        {progress.map((subject) => (
          <li key={subject.name}>
            <button
              type="button"
              onClick={() => navigate(`/?mode=subject&subject=${encodeURIComponent(subject.name)}`)}
              className="surface flex w-full items-center gap-4 px-3.5 py-3 text-left transition-colors duration-150 hover:bg-raised"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-medium text-fg">{subject.name}</span>
                  {subject.types.map((t) => (
                    <TypeTag key={t} type={t} />
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2.5">
                  <Meter value={subject.coverage} className="max-w-[180px]" />
                  <span className="tnum shrink-0 text-2xs text-fg2">
                    {subject.attempted}/{count(subject.total)} done
                    {subject.attempted > 0 && ` · ${subject.accuracy}% correct`}
                  </span>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </Page>
  );
}
