import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { mobileNav, overflowNav } from '@/navigation';
import { useUser } from '@/state/UserProvider';
import { Modal } from '@/components/common/Modal';

export function MobileNav() {
  const { index } = useUser();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const counts = { revision: index.marked.size, wrong: index.wrong.size, notes: index.noteCount };
  const overflowActive = overflowNav.some((item) => location.pathname.startsWith(item.to));

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const count = item.countKey ? counts[item.countKey] : 0;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'relative flex h-[58px] flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors duration-150',
                      isActive ? 'text-brand' : 'text-ink-mute',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative">
                        <item.icon aria-hidden className="size-[19px]" />
                        {count > 0 && (
                          <span className="absolute -right-1.5 -top-1 min-w-[15px] rounded-full bg-brand px-1 text-[9px] font-bold leading-[15px] text-white">
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                      </span>
                      <span>{item.short}</span>
                      <span
                        aria-hidden
                        className={cn(
                          'absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-brand transition-opacity duration-150',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                'flex h-[58px] w-full flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors',
                overflowActive ? 'text-brand' : 'text-ink-mute',
              )}
            >
              <MoreHorizontal aria-hidden className="size-[19px]" />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More" size="sm">
        <ul className="divide-y divide-line -mx-5">
          {overflowNav.map((item) => {
            const count = item.countKey ? counts[item.countKey] : 0;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-brand-soft text-brand-ink' : 'text-ink hover:bg-sunken',
                    )
                  }
                >
                  <item.icon aria-hidden className="size-[18px] text-ink-soft" />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 && (
                    <span className="rounded bg-sunken px-1.5 py-0.5 text-2xs font-semibold tabular-nums text-ink-mute">
                      {count}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
