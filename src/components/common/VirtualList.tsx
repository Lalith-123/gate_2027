import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface VirtualListProps<T> {
  items: T[];
  rowHeight: number;
  height: number;
  overscan?: number;
  keyExtractor: (item: T, index: number) => string;
  renderRow: (item: T, index: number) => ReactNode;
  className?: string;
  /** measured row height for variable content */
  estimate?: boolean;
}

/**
 * Windowed list. Keeps the DOM small when the bank grows to thousands of
 * questions, which matters on low-end phones.
 */
export function VirtualList<T>({
  items,
  rowHeight,
  height,
  overscan = 6,
  keyExtractor,
  renderRow,
  className,
}: VirtualListProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    setScrollTop(0);
    ref.current?.scrollTo({ top: 0 });
  }, [items]);

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const end = Math.min(items.length, start + visibleCount);
  const slice = items.slice(start, end);

  return (
    <div
      ref={ref}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className={cn('scroll-thin overflow-y-auto overscroll-contain', className)}
      style={{ height }}
      role="list"
    >
      <div style={{ height: items.length * rowHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {slice.map((item, i) => (
            <div key={keyExtractor(item, start + i)} role="listitem" style={{ height: rowHeight }}>
              {renderRow(item, start + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
