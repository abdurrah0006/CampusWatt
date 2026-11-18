import { useState } from 'react';
import { ChevronDown, Siren, X } from 'lucide-react';
import { Icon } from '../ui/Icon.jsx';
import { AlertDetailCard } from './AlertDetailCard.jsx';

// Helpers
function buildHeadline(criticalAlerts) {
  if (criticalAlerts.length === 1) return `${criticalAlerts[0].buildingName} is over its energy limit`;
  return `${criticalAlerts.length} buildings are over their energy limit`;
}

export function AlertBanner({ alerts }) {
  const criticalAlerts = alerts.filter((alert) => alert.severity === 'critical');
  const alertSignature = criticalAlerts.map((alert) => alert.id).join('|');
  const [dismissedSignature, setDismissedSignature] = useState(null);
  const [expanded, setExpanded] = useState(false);

  if (!criticalAlerts.length || dismissedSignature === alertSignature) return null;

  return (
    <div role="alert" className="animate-fade-in overflow-hidden rounded-xl bg-danger text-on-danger">
      {/* Summary */}
      <div className="flex items-start gap-3 p-4 sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-current">
          <Icon icon={Siren} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Critical alert: {buildHeadline(criticalAlerts)}</p>
          <p className="text-sm">{criticalAlerts[0].message}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex h-10 items-center gap-1 rounded-lg border border-current px-3 text-sm font-semibold"
          aria-expanded={expanded}
        >
          <span className="hidden sm:inline">Details</span>
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}><Icon icon={ChevronDown} size="sm" /></span>
        </button>
        <button type="button" onClick={() => setDismissedSignature(alertSignature)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-danger-hover" aria-label="Dismiss alert">
          <Icon icon={X} />
        </button>
      </div>

      {/* Details */}
      {expanded && (
        <div className="grid gap-px border-t border-current sm:grid-cols-2 xl:grid-cols-3">
          {criticalAlerts.map((alert) => <AlertDetailCard key={alert.id} alert={alert} />)}
        </div>
      )}
    </div>
  );
}
