import { NavLink } from 'react-router-dom';
import { Keyboard } from 'lucide-react';
import { NAV, type NavItem } from '@/components/navigation/navItems';
import { useUser } from '@/state/UserStore';
import { count } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Desktop sidebar. Quiet and always visible — it is navigation, not a
 * dashboard. Counts come from the status index, so they are accurate the
 * moment a question is graded.
 */
export function Sidebar() {
  const badges = useBadges();
  const main = NAV.filter((i) => i.badge !== 'wrong');
  const wrong = NAV.find((i) => i.to === '/wrong')!;

  return (
    <aside className="sticky top-0 hidden h-dvh w-sidebar shrink-0 flex-col border-r border-hair bg-card lg:flex">
      <div className="flex h-14 items-center gap-2.5 px-5">
        <Mark />
        <div className="leading-tight">
          <p className="text-[13px] font-semibold text-fg">GATE 2027</p>
          <p className="text-2xs text-fg2">Previous year questions</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main">
        {main.map((item) => (
          <SideLink key={item.to} item={item} badge={badges[item.badge!]} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-hair px-3 py-3">
        <SideLink item={wrong} badge={badges.wrong} />
        <p className="flex items-center gap-2 px-3 pt-2 text-2xs text-fg3">
          <Keyboard aria-hidden className="size-3.5" />
          <span>Progress is saved on this device</span>
        </p>
      </div>
    </aside>
  );
}

function useBadges(): Record<string, number> {
  const { index, user } = useUser();
  return {
    marked: index.marked.size,
    wrong: index.wrong.size,
    notes: Object.keys(user.notes).length,
  };
}

function SideLink({ item, badge }: { item: NavItem; badge?: number }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive: on }) =>
        cn(
          'flex h-9 items-center gap-2.5 rounded-[9px] px-3 text-[13px] font-medium transition-colors duration-150',
          on ? 'bg-brand-soft text-brand-ink' : 'text-fg2 hover:bg-raised hover:text-fg',
        )
      }
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {badge ? (
        <span className="tnum rounded bg-raised px-1.5 py-0.5 text-2xs font-medium text-fg2">
          {count(badge)}
        </span>
      ) : null}
    </NavLink>
  );
}

/** Small wordmark: one indigo mark, no illustration. */
export function Mark() {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-brand text-[13px] font-bold text-white">
      G
    </span>
  );
}
