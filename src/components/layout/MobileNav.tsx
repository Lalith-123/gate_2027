import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Ellipsis } from 'lucide-react';
import { PRIMARY_NAV, SECONDARY_NAV, isActive } from '@/components/navigation/navItems';
import { Sheet } from '@/components/common/Overlay';
import { Mark } from '@/components/layout/Sidebar';
import { useUser } from '@/state/UserStore';
import { cn } from '@/utils/cn';

/**
 * Mobile header. Compact — title plus one contextual control, nothing that
 * competes with the question. The title is the current section, not a logo
 * lockup, so the student always knows where they are.
 */
export function MobileHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-hair bg-page/95 px-4 backdrop-blur-md lg:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        <Mark />
        <h1 className="truncate text-[15px] font-semibold text-fg">{title}</h1>
      </div>
      {action}
    </header>
  );
}

/**
 * Four-item bottom tab bar. Fixed, always reachable with a thumb, with
 * safe-area padding so it clears the home indicator on iOS.
 */
export function TabBar() {
  const [more, setMore] = useState(false);
  const { pathname } = useLocation();
  const { index } = useUser();
  const secondaryActive = SECONDARY_NAV.some((i) => isActive(i, pathname));

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const badge = item.badge === 'marked' ? index.marked.size : 0;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive: on }) =>
                    cn(
                      'relative flex h-[58px] flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors duration-150',
                      on ? 'text-brand' : 'text-fg2',
                    )
                  }
                >
                  <span className="relative">
                    <Icon aria-hidden className="size-5" />
                    {badge > 0 && (
                      <span className="tnum absolute -right-2 -top-1 min-w-[15px] rounded-full bg-brand px-1 text-[9px] font-semibold leading-[15px] text-white">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  {item.label}
                </NavLink>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMore(true)}
              aria-haspopup="dialog"
              className={cn(
                'flex h-[58px] w-full flex-col items-center justify-center gap-1 text-2xs font-medium transition-colors duration-150',
                secondaryActive ? 'text-brand' : 'text-fg2',
              )}
            >
              <Ellipsis aria-hidden className="size-5" />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="More">
        <nav className="p-2" aria-label="Secondary">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            const badge =
              item.badge === 'wrong' ? index.wrong.size : item.badge === 'marked' ? index.marked.size : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMore(false)}
                className={({ isActive: on }) =>
                  cn(
                    'flex h-11 items-center gap-3 rounded-[9px] px-3 text-sm font-medium transition-colors duration-150',
                    on ? 'bg-brand-soft text-brand-ink' : 'text-fg2 hover:bg-raised hover:text-fg',
                  )
                }
              >
                <Icon aria-hidden className="size-[18px]" />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && <span className="tnum text-2xs text-fg3">{badge}</span>}
              </NavLink>
            );
          })}
        </nav>
      </Sheet>
    </>
  );
}
