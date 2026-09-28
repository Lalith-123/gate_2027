import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const TITLES: Record<string, string> = {
  '/': 'GATE Practice',
  '/bank': 'Question Bank',
  '/subjects': 'Subjects',
  '/revision': 'Revision',
  '/wrong': 'Wrong Questions',
  '/notes': 'Notes',
  '/progress': 'Progress',
  '/settings': 'Settings',
};

function titleFor(pathname: string) {
  if (pathname.startsWith('/practice/')) return 'Practice';
  if (pathname.startsWith('/subject/')) return 'Subject Practice';
  return TITLES[pathname] ?? 'GATE Practice';
}

export function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="lg:pl-[var(--nav-w)]">
        <TopBar title={titleFor(pathname)} />
        <main
          id="main"
          className="mx-auto w-full max-w-[var(--shell-max)] px-3 pb-24 pt-3 sm:px-6 sm:pb-28 sm:pt-5 lg:px-8 lg:pb-12 lg:pt-7"
        >
          <ErrorBoundary resetKey={pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="panel mt-6 p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[86%]" />
          <Skeleton className="h-4 w-[64%]" />
        </div>
      </div>
    </div>
  );
}
