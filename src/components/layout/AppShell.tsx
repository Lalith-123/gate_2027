import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileHeader, TabBar } from '@/components/layout/MobileNav';
import { useBank } from '@/state/BankStore';
import { Spinner } from '@/components/common/Display';

/**
 * App shell: a fixed desktop sidebar and a single scrolling column.
 *
 * The mobile header title is derived from the route so pages do not have to
 * pass it, and scroll position resets on navigation so a new question
 * always starts at the top.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const { status } = useBank();

  const title = titleFor(pathname);

  useEffect(() => {
    document.title = title === 'GATE 2027' ? 'GATE 2027 — Previous Year Questions' : `${title} · GATE 2027`;
  }, [title]);

  // a new question or page should always start at the top
  useEffect(() => {
    document.getElementById('app-scroll')?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader title={title} action={<BankStatusPill status={status} />} />

        {status === 'loading' && (
          <div className="h-0.5 w-full overflow-hidden bg-raised" role="progressbar" aria-label="Loading questions">
            <div className="h-full w-1/3 animate-[sweep_1.1s_ease-in-out_infinite] bg-brand" />
          </div>
        )}

        <main className="min-w-0 flex-1 pb-[calc(58px+env(safe-area-inset-bottom))] lg:pb-0">
          <Outlet />
        </main>
      </div>

      <TabBar />
    </div>
  );
}

function titleFor(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/practice')) return 'Practice';
  if (pathname.startsWith('/questions')) return 'Questions';
  if (pathname.startsWith('/subjects')) return 'Subjects';
  if (pathname.startsWith('/revision')) return 'Revision';
  if (pathname.startsWith('/wrong')) return 'Wrong answers';
  if (pathname.startsWith('/notes')) return 'Notebook';
  if (pathname.startsWith('/progress')) return 'Progress';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'GATE 2027';
}

/** Desktop-only loading hint; the mobile header keeps a compact dot. */
function BankStatusPill({ status }: { status: 'loading' | 'ready' | 'error' }) {
  if (status === 'ready') return null;
  if (status === 'error') return null;

  return (
    <span className="flex items-center gap-1.5 text-2xs text-fg2 lg:hidden">
      <Spinner className="size-3" />
      Loading
    </span>
  );
}

/** Page wrapper: one readable column, consistent gutters on every page. */
export function Page({
  children,
  width = 'measure',
  className,
}: {
  children: React.ReactNode;
  width?: 'measure' | 'wide' | 'full';
  className?: string;
}) {
  const widths = {
    measure: 'max-w-measure',
    wide: 'max-w-5xl',
    full: 'max-w-none',
  } as const;

  return (
    <div className={`mx-auto w-full px-4 py-5 sm:px-6 sm:py-7 ${widths[width]} ${className ?? ''}`}>
      {children}
    </div>
  );
}

/** Desktop page heading, hidden on mobile where the header carries it. */
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 hidden items-end justify-between gap-4 lg:flex">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-sm text-fg2">{description}</p>}
      </div>
      {action}
    </div>
  );
}
