import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/common/IconButton';

function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { body } = document;
    const previous = body.style.overflow;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = previous;
      body.style.paddingRight = '';
    };
  }, [active]);
}

function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !ref.current) return;
      const focusables = ref.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);
  return ref;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** slides up from the bottom edge on small screens */
  sheetOnMobile?: boolean;
  className?: string;
}

const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' };

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  sheetOnMobile = true,
  className,
}: ModalProps) {
  const ref = useDismiss(open, onClose);
  useLockScroll(open);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const target = ref.current?.querySelector<HTMLElement>(
        '[data-autofocus],textarea,input:not([type="hidden"]),button',
      );
      target?.focus();
    }, 60);
    return () => window.clearTimeout(t);
  }, [open, ref]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/25 backdrop-blur-[2px] dark:bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden border border-line bg-elevated shadow-pop',
          'rounded-t-2xl sm:rounded-xl',
          widths[size],
          sheetOnMobile ? 'animate-sheet-up sm:animate-pop-in' : 'animate-pop-in',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] leading-relaxed text-ink-mute">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-1.5 -mt-1">
            <X aria-hidden className="size-4" />
          </IconButton>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="border-t border-line bg-surface px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
