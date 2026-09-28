import { Link } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import { Button } from '@/components/common/Button';

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-line bg-surface text-ink-mute">
        <Compass aria-hidden className="size-6" />
      </div>

      <h1 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-ink">This page does not exist</h1>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-mute">
        The link may be out of date, or the question it pointed to is not in the bank yet. Everything else still works.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Link
          to="/"
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-[13px] font-medium text-white transition-colors hover:bg-brand-hover"
        >
          <Home aria-hidden className="size-3.5" />
          Dashboard
        </Link>
        <Link
          to="/bank"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-line-strong px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-sunken"
        >
          <Search aria-hidden className="size-3.5" />
          Browse the bank
        </Link>
        <Button size="sm" onClick={() => window.history.back()}>
          Go back
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
