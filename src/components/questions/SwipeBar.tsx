import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronUp, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';

const COMMIT_PX = 64;

interface Props {
  submitted: boolean;
  canSubmit: boolean;
  swipeEnabled: boolean;
  onSubmit: () => void;
  onNext: () => void;
  onRetry?: () => void;
  allowRetry?: boolean;
  nextLabel?: string;
  nextLabelShort?: string;
  nextIcon?: 'arrow' | 'shuffle';
}

/**
 * The primary action, doubling as a swipe surface. Dragging it upwards after
 * the question has been submitted flies it off the top and loads the next
 * question, so the flow never depends on finding a button.
 */
export function SwipeBar({
  submitted,
  canSubmit,
  swipeEnabled,
  onSubmit,
  onNext,
  onRetry,
  allowRetry,
  nextLabel = 'Next question',
  nextLabelShort = 'Next',
  nextIcon = 'arrow',
}: Props) {
  const startY = useRef<number | null>(null);
  const timer = useRef<number>();
  const [pull, setPull] = useState(0);
  const [flying, setFlying] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  // A new question always starts from a clean bar.
  useEffect(() => {
    setPull(0);
    setFlying(false);
    startY.current = null;
  }, [submitted]);

  const armed = submitted && swipeEnabled && pull <= -COMMIT_PX;
  const hint = submitted
    ? swipeEnabled
      ? 'Swipe up for the next one'
      : 'Tap to continue'
    : 'Pick an answer to continue';

  const settle = (to: number) => {
    setFlying(true);
    setPull(to);
    timer.current = window.setTimeout(() => setFlying(false), 200);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (!swipeEnabled) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) return; // only upwards counts
    // Rubber-band while the question is unanswered so the bar cannot be
    // flung away before there is something to move on from.
    setPull(submitted ? Math.max(delta, -220) : delta * 0.14);
  };

  const onTouchEnd = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (armed) {
      settle(-Math.max(window.innerHeight, 400));
      timer.current = window.setTimeout(() => {
        onNext();
        setPull(0);
        setFlying(false);
      }, 190);
      return;
    }
    settle(0);
  };

  if (!submitted) {
    return (
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="group relative flex h-12 w-full select-none items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-brand-hover active:bg-brand disabled:pointer-events-none disabled:opacity-40"
      >
        <Check aria-hidden className="size-[18px]" />
        Submit answer
      </button>
    );
  }

  const NextIcon = nextIcon === 'shuffle' ? RotateCcw : ArrowRight;
  const progress = Math.min(1, Math.abs(pull) / COMMIT_PX);

  return (
    <div className="flex items-stretch gap-2">
      {allowRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Try this question again"
          className="grid size-12 shrink-0 place-items-center rounded-xl border border-line-strong text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
        >
          <RotateCcw aria-hidden className="size-[18px]" />
        </button>
      )}

      <button
        type="button"
        onClick={onNext}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        className={cn(
          'relative flex h-12 flex-1 select-none items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl text-[15px] font-semibold text-white sm:gap-2',
          flying ? 'transition-transform duration-200 ease-out' : '',
          armed ? 'bg-accent' : 'bg-accent/90',
        )}
        style={{ transform: `translate3d(0, ${pull}px, 0)` }}
      >
        {/* progress fill follows the finger */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-accent-ink/20"
          style={{ width: `${progress * 100}%` }}
        />

        <span className="relative flex items-center gap-1.5 sm:gap-2">
          {swipeEnabled && (
            <ChevronUp
              aria-hidden
              className={cn('size-4 transition-opacity duration-150', armed ? 'opacity-100' : 'opacity-40')}
            />
          )}
          <span aria-hidden className="sm:hidden">
            {nextLabelShort}
          </span>
          <span className="hidden sm:inline">{nextLabel}</span>
          <NextIcon aria-hidden className="size-[18px]" />
        </span>
      </button>

      <span aria-live="polite" className="sr-only">
        {hint}
      </span>
    </div>
  );
}

/** Tells the student the swipe exists without adding another button. */
export function SwipeHint({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <p className="mt-1.5 flex animate-fade-in items-center justify-center gap-1.5 text-2xs text-ink-mute">
      <ChevronUp aria-hidden className="size-3.5" />
      Swipe up for the next question
    </p>
  );
}
