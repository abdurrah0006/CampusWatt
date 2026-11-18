import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton.jsx';

export function Modal({ open, title, description, onClose, children, footer, size = 'md' }) {
  const panelRef = useRef(null);

  // Keyboard
  useEffect(() => {
    if (!open) return undefined;
    const firstInput = panelRef.current?.querySelector('input, select, textarea, button');
    firstInput?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  const widthClass = size === 'sm' ? 'max-w-md' : 'max-w-lg';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} className={`relative w-full ${widthClass} animate-fade-in rounded-xl border border-line bg-surface shadow-popover`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-ink-primary">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
          </div>
          <IconButton icon={X} label="Close dialog" onClick={onClose} className="-mr-2 -mt-1" />
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scrollbar-thin">{children}</div>

        {/* Footer */}
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
