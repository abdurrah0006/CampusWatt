import { Lightbulb } from 'lucide-react';
import { Icon } from './Icon.jsx';

export function EmptyState({ icon = Lightbulb, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-primary">
        <Icon icon={icon} size="lg" />
      </span>
      <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
