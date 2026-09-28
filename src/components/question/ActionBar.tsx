import { useRef, type ReactNode } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/utils/cn';

/* ------------------------------------------------------------------ *
 * The persistent action bar.
 *
 * Submit and Next are always visible — never inside a menu, never hidden
 * behind a swipe. This is the primary control surface of the app.
 * ------------------------------------------------------------------ */

export function ActionBar({
  canSubmit,
  onSubmit,
  graded,
  children,
  hint,
  swipeToAdvance,
  onSwipeUp,
}: {
  canSubmit: boolean;
  onSubmit: () => void;
  graded: boolean;
  /** extra controls shown after grading (mark for revision, notes…) */
  children?: ReactNode;
  hint?: string;
  /** when true, a deliberate upward drag on the bar advances */
  swipeToAdvance: boolean;
  onSwipeUp: () => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);

  /**
   * Deliberate gesture: must start on the bar, travel mostly upward, and
   * clear 72px. Horizontal drift cancels it, so an accidental diagonal
   * scroll never skips a question. The answer is never lost, because
   * advancing requires a submitted result.
   */
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const from = start.current;
    start.current = null;
    if (!from || !swipeToAdvance || !graded) return;

    const t = e.changedTouches[0];
    const dy = from.y - t.clientY; // positive when moving up
    const dx = Math.abs(t.clientX - from.x);

    if (dy > 72 && dx < 48) onSwipeUp();
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      // `touch-none` while the gesture is live: React attaches touchmove
      // passively, so preventDefault() there would only log a warning.
      // Suppressing scroll in CSS is both reliable and cheaper.
      className={cn(
        'sticky bottom-0 z-20 -mx-4 mt-5 border-t border-hair bg-page/95 px-4 pb-3 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6',
        swipeToAdvance && graded && 'touch-none',
      )}
    >
      <div className="flex items-center gap-2">
        {graded ? (
          <div className="flex w-full items-center gap-2">
            <div className="flex flex-1 items-center gap-1">{children}</div>
            {swipeToAdvance && (
              <span className="hidden items-center gap-1 text-2xs text-fg3 sm:flex">
                <ChevronUp aria-hidden className="size-3" />
                swipe up
              </span>
            )}
          </div>
        ) : (
          <>
            {children}
            <Button
              variant="primary"
              size="lg"
              onClick={onSubmit}
              disabled={!canSubmit}
              className="min-w-[9.5rem] flex-1 sm:flex-none"
            >
              Submit answer
            </Button>
          </>
        )}
      </div>

      {hint && !graded && <p className="mt-2 text-center text-2xs text-fg3">{hint}</p>}
    </div>
  );
}
