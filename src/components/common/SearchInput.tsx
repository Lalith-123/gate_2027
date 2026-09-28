import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

export interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  label?: string;
  /** shows a live result count next to the field */
  hint?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onChange, placeholder = 'Search', className, autoFocus, label = 'Search', hint },
  ref,
) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search aria-hidden className="pointer-events-none absolute left-3 size-4 text-ink-mute" />
      <input
        ref={ref}
        type="search"
        role="searchbox"
        aria-label={label}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-24 text-sm text-ink placeholder:text-ink-mute transition-[border-color,box-shadow] duration-150 hover:border-line-strong focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/25"
      />
      {hint && !value && (
        <span className="pointer-events-none absolute right-3 text-2xs font-medium text-ink-mute">{hint}</span>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 grid size-7 place-items-center rounded-md text-ink-mute transition-colors hover:bg-sunken hover:text-ink"
        >
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </div>
  );
});
