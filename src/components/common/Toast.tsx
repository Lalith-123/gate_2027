import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';
import { uid } from '@/utils/uid';

/* ------------------------------------------------------------------ *
 * Toasts — confirmation only. Nothing critical ever routes through here.
 * ------------------------------------------------------------------ */

type ToastTone = 'info' | 'success';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

type Action = { type: 'push'; toast: ToastItem } | { type: 'dismiss'; id: string };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case 'push':
      // newest last, and never more than three on screen
      return [...state.slice(-2), action.toast];
    case 'dismiss':
      return state.filter((t) => t.id !== action.id);
  }
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const push = useMemo(
    () => (message: string, tone: ToastTone = 'info') =>
      dispatch({ type: 'push', toast: { id: uid('t'), message, tone } }),
    [],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((t) => (
          <ToastRow key={t.id} toast={t} onDismiss={() => dispatch({ type: 'dismiss', id: t.id })} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastRow({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 2600);
    return () => window.clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="pointer-events-auto flex animate-rise items-center gap-2.5 rounded-lg border border-hair bg-card px-3.5 py-2.5 shadow-veil">
      {toast.tone === 'success' ? (
        <CheckCircle2 aria-hidden className="size-4 shrink-0 text-ok" />
      ) : (
        <Info aria-hidden className="size-4 shrink-0 text-fg2" />
      )}
      <span className="text-[13px] text-fg">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1 ml-1 grid size-6 place-items-center rounded text-fg3 transition-colors hover:text-fg"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
