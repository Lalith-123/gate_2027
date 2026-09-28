import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Command, GraduationCap, Moon, Search, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUser } from '@/state/UserProvider';
import { useBank } from '@/state/BankProvider';
import { IconButton } from '@/components/common/IconButton';
import { Badge } from '@/components/common/Badge';
import { searchMetas } from '@/services/filterService';
import type { QuestionMeta } from '@/types/question';
import { MathText } from '@/components/common/MathText';

export function TopBar({ title }: { title: string }) {
  const { theme, setTheme } = useUser();
  const { total, status } = useBank();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setOpen(false);
    setQuery('');
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full max-w-[var(--shell-max)] items-center gap-2.5 px-3 sm:h-14 sm:gap-3 sm:px-6 lg:h-16 lg:px-8">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white lg:hidden">
          <GraduationCap aria-hidden className="size-[18px]" />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-ink lg:text-[17px]">{title}</h1>
          <p className="hidden text-2xs text-ink-mute sm:block">
            {status === 'ready' ? `${total.toLocaleString('en-IN')} questions in the bank` : 'Loading question bank…'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[13px] text-ink-mute transition-colors hover:border-line-strong hover:text-ink-soft md:flex xl:w-72"
        >
          <Search aria-hidden className="size-4" />
          <span className="flex-1 text-left">Search questions</span>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-line bg-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-mute">
            <Command aria-hidden className="size-2.5" />K
          </kbd>
        </button>

        <IconButton label="Search" className="md:hidden" onClick={() => setOpen(true)}>
          <Search aria-hidden className="size-[18px]" />
        </IconButton>

        <IconButton
          label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun aria-hidden className="size-[18px]" /> : <Moon aria-hidden className="size-[18px]" />}
        </IconButton>
      </div>

      <GlobalSearch open={open} onClose={() => setOpen(false)} query={query} setQuery={setQuery} navigate={navigate} />
    </header>
  );
}

function GlobalSearch({
  open,
  onClose,
  query,
  setQuery,
  navigate,
}: {
  open: boolean;
  onClose: () => void;
  query: string;
  setQuery: (v: string) => void;
  navigate: (to: string) => void;
}) {
  const { metas, status } = useBank();

  const results = useMemo<QuestionMeta[]>(() => {
    const scored = searchMetas(metas, query);
    return scored ? scored.slice(0, 8).map((s) => s.meta) : metas.slice(0, 6);
  }, [metas, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search questions">
      <div className="absolute inset-0 animate-fade-in bg-ink/25 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl animate-pop-in overflow-hidden rounded-xl border border-line bg-elevated shadow-pop">
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search aria-hidden className="size-4 shrink-0 text-ink-mute" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) {
                navigate(`/practice/${results[0].id}`);
                onClose();
              }
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search by question text, subject, topic, year or id"
            aria-label="Search questions"
            className="h-12 w-full bg-transparent text-sm text-ink placeholder:text-ink-mute focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-line bg-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-mute sm:block">
            ESC
          </kbd>
        </div>

        <div className="scroll-thin max-h-[52vh] overflow-y-auto p-1.5">
          {status !== 'ready' ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-mute">Loading the question index…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-mute">
              No questions match “{query}”. Try a subject, a topic or a year.
            </p>
          ) : (
            <>
              {!query && <p className="px-3 pb-1 pt-2 text-2xs font-medium uppercase tracking-wider text-ink-mute">Recently added</p>}
              <ul>
                {results.map((meta) => (
                  <li key={meta.id}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/practice/${meta.id}`);
                        onClose();
                      }}
                      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sunken"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone="neutral">GATE {meta.y}</Badge>
                          <span className="truncate text-xs font-medium text-ink-soft">{meta.s}</span>
                          <span className="truncate text-xs text-ink-mute">· {meta.t}</span>
                        </div>
                        <MathText className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">
                          {meta.p}
                        </MathText>
                      </div>
                      <Badge tone={meta.k === 'NAT' ? 'info' : meta.k === 'MSQ' ? 'warn' : 'brand'}>{meta.k}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-2xs text-ink-mute">
          <span className={cn('tabular-nums')}>{query ? `${results.length} shown` : 'Type to search'}</span>
          <span>Enter to open</span>
        </div>
      </div>
    </div>
  );
}
