import { ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { UsageMeter } from '../ui/UsageMeter.jsx';
import { ALERT_SEVERITY } from './alertSeverity.js';
import { formatNumber, formatTime } from '../../utils/formatters.js';

export function AlertsList({ alerts }) {
  if (!alerts.length) {
    return (
      <EmptyState icon={ShieldCheck} title="All buildings within limits" description="No building is above 90% of its hourly or daily energy limit right now." />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {alerts.map((alert) => {
        const severity = ALERT_SEVERITY[alert.severity] || ALERT_SEVERITY.warning;
        const limitLabel = alert.type === 'hourly' ? 'Hourly limit' : 'Daily limit (last 24h)';
        return (
          <li key={alert.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink-primary">{alert.buildingName}</p>
                <p className="mt-0.5 text-xs text-ink-secondary">{limitLabel} · {formatTime(alert.timestamp)}</p>
              </div>
              <Badge tone={severity.tone} icon={severity.icon}>{severity.label}</Badge>
            </div>
            <div className="mt-3">
              <UsageMeter
                percent={alert.percentOfThreshold}
                label="Limit used"
                detail={`${formatNumber(alert.currentValue)} of ${formatNumber(alert.threshold)} ${alert.unit}`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
