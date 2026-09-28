import {
  BookOpen,
  Bookmark,
  ChartNoAxesColumn,
  FileText,
  Layers,
  ListChecks,
  Settings,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  /** key into the status counts shown beside the label */
  countKey?: 'revision' | 'wrong' | 'notes';
  end?: boolean;
}

export const primaryNav: NavItem[] = [
  { to: '/', label: 'Practice', short: 'Practice', icon: ListChecks, end: true },
  { to: '/bank', label: 'Question Bank', short: 'Bank', icon: Layers },
  { to: '/subjects', label: 'Subjects', short: 'Subjects', icon: BookOpen },
  { to: '/revision', label: 'Revision', short: 'Revision', icon: Bookmark, countKey: 'revision' },
  { to: '/wrong', label: 'Wrong Questions', short: 'Wrong', icon: TriangleAlert, countKey: 'wrong' },
  { to: '/notes', label: 'Notes', short: 'Notes', icon: FileText, countKey: 'notes' },
  { to: '/progress', label: 'Progress', short: 'Progress', icon: ChartNoAxesColumn },
  { to: '/settings', label: 'Settings', short: 'Settings', icon: Settings },
];

/** The bottom bar on phones holds the first four plus a "More" sheet. */
export const mobileNav: NavItem[] = primaryNav.slice(0, 4);
export const overflowNav: NavItem[] = primaryNav.slice(4);
