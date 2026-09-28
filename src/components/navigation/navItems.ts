import {
  BookOpen,
  BookmarkCheck,
  CircleX,
  ListFilter,
  PenLine,
  Settings,
  Target,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** shown in the four-item mobile tab bar */
  primary?: boolean;
  /** a small live count shown beside the label */
  badge?: 'marked' | 'wrong' | 'notes';
  /** matched loosely so sibling routes keep the parent highlighted */
  match?: (path: string) => boolean;
}

/**
 * One source of truth for navigation. The sidebar renders everything; the
 * mobile tab bar renders only `primary`; the "More" sheet renders the rest.
 */
export const NAV: NavItem[] = [
  {
    to: '/',
    label: 'Practice',
    icon: Target,
    primary: true,
    match: (p) => p === '/' || p.startsWith('/practice'),
  },
  {
    to: '/questions',
    label: 'Questions',
    icon: ListFilter,
    primary: true,
    match: (p) => p.startsWith('/questions') || p.startsWith('/subjects'),
  },
  {
    to: '/revision',
    label: 'Revision',
    icon: BookmarkCheck,
    primary: true,
    badge: 'marked',
    match: (p) => p.startsWith('/revision') || p.startsWith('/wrong'),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: BookOpen,
    primary: true,
    match: (p) => p.startsWith('/progress'),
  },
  { to: '/notes', label: 'Notebook', icon: PenLine, badge: 'notes', match: (p) => p.startsWith('/notes') },
  { to: '/wrong', label: 'Wrong answers', icon: CircleX, badge: 'wrong', match: (p) => p.startsWith('/wrong') },
  { to: '/settings', label: 'Settings', icon: Settings, match: (p) => p.startsWith('/settings') },
];

/** The four items in the mobile tab bar, in order. */
export const PRIMARY_NAV = NAV.filter((i) => i.primary);

/** Everything that is not in the tab bar; opened from the "More" sheet. */
export const SECONDARY_NAV = NAV.filter((i) => !i.primary);

export function isActive(item: NavItem, path: string): boolean {
  return item.match ? item.match(path) : path.startsWith(item.to);
}
