import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { Icon } from './Icon.jsx';
import { IconButton } from './IconButton.jsx';

export const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { icon: CheckCircle2, colorClass: 'text-energy-optimal-ink' },
  error: { icon: AlertCircle, colorClass: 'text-energy-critical-ink' },
  info: { icon: Info, colorClass: 'text-energy-info-ink' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(0);

  // Actions
  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((type, title, description, duration = 4500) => {
    nextIdRef.current += 1;
    const id = nextIdRef.current;
    setToasts((list) => [...list.slice(-3), { id, type, title, description }]);
    setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const toastApi = useMemo(() => ({
    success: (title, description) => show('success', title, description),
    error: (title, description) => show('error', title, description, 6500),
    info: (title, description) => show('info', title, description),
    dismiss,
  }), [show, dismiss]);

  // Render
  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type];
          return (
            <div key={toast.id} role="status" className="pointer-events-auto flex animate-fade-in items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-popover">
              <span className={`mt-0.5 ${style.colorClass}`}><Icon icon={style.icon} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-primary">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-sm text-ink-secondary">{toast.description}</p>}
              </div>
              <IconButton icon={X} label="Dismiss notification" onClick={() => dismiss(toast.id)} className="-mr-2 -mt-2" />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
