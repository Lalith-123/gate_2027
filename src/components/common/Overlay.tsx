import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { IconButton } from '@/components/common/Button';

/* ------------------------------------------------------------------ *
 * Overlays. Both trap focus, restore it on close, and close on Escape.
 * ------------------------------------------------------------------ */

function useDismiss(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;

      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    // prevent the page behind from scrolling
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // move focus in
    const t = window.setTimeout(() => {
      panel.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus() ?? panel.current?.focus();
    }, 20);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      window.clearTimeout(t);
      restore.current?.focus?.();
    };
  }, [open, onClose]);

  return panel;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const panel = useDismiss(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-fg/25 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[88vh] w-full flex-col rounded-t-2xl border border-hair bg-card shadow-veil',
          'animate-sheet sm:rounded-2xl sm:animate-rise',
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hair px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
            {description && <p className="mt-0.5 text-[13px] text-fg2">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-1.5 -mt-0.5">
            <X aria-hidden className="size-4" />
          </IconButton>
        </header>
        {children && <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
        {footer && <footer className="flex justify-end gap-2 border-t border-hair px-5 py-3.5">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/** Bottom sheet on mobile, right-hand drawer on desktop. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const panel = useDismiss(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade bg-fg/25 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-sm flex-col border-l border-hair bg-card shadow-veil animate-fade"
      >
        <header className="flex items-center justify-between gap-3 border-b border-hair px-4 py-3.5">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X aria-hidden className="size-4" />
          </IconButton>
        </header>
        <div className="scroll-quiet min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <footer className="border-t border-hair px-4 py-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-[42px] rounded-[9px] border border-hair bg-card px-3.5 text-sm text-fg transition-colors hover:bg-raised"
          >
            Cancel
          </button>
          <button
            type="button"
            data-autofocus
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              'h-[42px] rounded-[9px] px-3.5 text-sm font-medium text-white transition-colors',
              danger ? 'bg-bad hover:bg-bad/90' : 'bg-brand hover:bg-brand-hover',
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-fg2">{message}</p>
    </Modal>
  );
}
