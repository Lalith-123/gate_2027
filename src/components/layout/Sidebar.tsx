import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { primaryNav } from '@/navigation';
import { useUser } from '@/state/UserProvider';
import { ProgressBar } from '@/components/common/ProgressBar';

export function Sidebar() {
  const { user, index } = useUser();

  const counts = useMemo(
    () => ({ revision: index.marked.size, wrong: index.wrong.size, notes: index.noteCount }),
    [index],
  );

  const total = Object.keys(user.questions).length;
  const answered = useMemo(() => {
    let n = 0;
    for (const state of Object.values(user.questions)) if (state.attempted) n += 1;
    return n;
  }, [user.questions]);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--nav-w)] flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white">
          <GraduationCap aria-hidden className="size-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold leading-tight tracking-[-0.01em] text-ink">GATE Practice</span>
          <span className="block text-2xs leading-tight text-ink-mute">Computer Science · 2027</span>
        </span>
      </div>

      <nav aria-label="Main" className="scroll-thin flex-1 overflow-y-auto px-3 pb-4 pt-2">
        <ul className="space-y-0.5">
          {primaryNav.map((item) => {
            const count = item.countKey ? counts[item.countKey] : 0;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors duration-150',
                      isActive ? 'bg-brand-soft text-brand-ink' : 'text-ink-soft hover:bg-sunken hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden
                        className={cn(
                          'absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-brand transition-opacity duration-150',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <item.icon aria-hidden className="size-[17px] shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-2xs font-semibold tabular-nums',
                            isActive ? 'bg-brand/12 text-brand-ink' : 'bg-sunken text-ink-mute',
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="text-2xs font-medium uppercase tracking-wider text-ink-mute">Answered</span>
          <span className="text-2xs font-semibold tabular-nums text-ink-soft">
            {answered.toLocaleString('en-IN')}
          </span>
        </div>
        <ProgressBar value={answered} max={Math.max(total, answered, 1)} className="mt-2" size="sm" label="Questions answered" />
        <p className="mt-2 text-2xs leading-relaxed text-ink-mute">
          {total === 0 ? 'No attempts recorded yet' : `${(answered / total * 100).toFixed(0)}% of attempted questions`}
        </p>
      </div>
    </aside>
  );
}
