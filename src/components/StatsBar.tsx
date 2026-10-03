import { BarChart3, Bookmark, Target, Trophy } from 'lucide-react';

interface StatsBarProps {
  stats: {
    total: number;
    attempted: number;
    correct: number;
    incorrect: number;
    bookmarked: number;
    marks: number;
    possible: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  const accuracy =
    stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-2">
      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />
          <span>
            {stats.correct}/{stats.attempted} correct
          </span>
        </div>
        <div className="flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{accuracy}% accuracy</span>
        </div>
        <div className="flex items-center gap-1">
          <Bookmark className="w-3.5 h-3.5" />
          <span>{stats.bookmarked} saved</span>
        </div>
        {stats.possible > 0 && (
          <div className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
            <Trophy className="w-3.5 h-3.5" />
            <span>
              {stats.marks} / {stats.possible} marks
            </span>
          </div>
        )}
        <div className="ml-auto text-slate-400 dark:text-slate-500">
          {stats.total} available
        </div>
      </div>
    </div>
  );
}
