import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />;
}

export function QuestionCardSkeleton() {
  return (
    <div className="panel p-5 sm:p-7" aria-hidden>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
      <div className="mt-6 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[64%]" />
      </div>
      <div className="mt-7 space-y-2.5">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
      <div className="mt-7 flex gap-3">
        <Skeleton className="h-11 w-32 rounded-lg" />
        <Skeleton className="h-11 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function ListRowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
      ))}
    </div>
  );
}
