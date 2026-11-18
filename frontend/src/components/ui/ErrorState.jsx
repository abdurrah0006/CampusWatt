import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './Button.jsx';
import { Icon } from './Icon.jsx';

export function ErrorState({ title = "We couldn't load this data", error, onRetry, className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-energy-critical-soft text-energy-critical-ink">
        <Icon icon={AlertTriangle} size="lg" />
      </span>
      <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-secondary">{error?.message || 'Something went wrong. Please try again.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onClick={onRetry} className="mt-4">
          Try again
        </Button>
      )}
    </div>
  );
}
