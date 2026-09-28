import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { uid } from '@/lib/uid';

type ToastTone = 'default' | 'success' | 'error';

interface Toast {
  id: string;
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

const icons: Record<ToastTone, ReactNode> = {
  default: <Info aria-hidden className="size-4 text-info" />,
  success: <CheckCircle2 aria-hidden className="size-4 text-accent" />,
  error: <X aria-hidden className="size-4 text-danger" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = 'default') => {
      const id = uid('t');
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      timers.current[id] = window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          aria-atomic="false"
          className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex max-w-md animate-fade-rise items-center gap-2.5 rounded-lg border border-line bg-elevated px-3.5 py-2.5 text-[13px] font-medium text-ink shadow-pop',
              )}
            >
              {icons[toast.tone]}
              <span className="leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="-mr-1 ml-1 grid size-5 place-items-center rounded text-ink-mute transition-colors hover:text-ink"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
