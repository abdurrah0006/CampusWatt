import { Icon } from './Icon.jsx';
import { getUsageLevel } from '../../utils/usageLevel.js';

export function UsageMeter({ percent, label, detail }) {
  const safePercent = Number.isFinite(percent) ? Math.max(0, Math.round(percent)) : 0;
  const level = getUsageLevel(safePercent);
  const barWidth = Math.min(100, safePercent);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-ink-secondary">{label}</span>
        <span className={`inline-flex items-center gap-1 font-semibold ${level.textClass}`}>
          <Icon icon={level.icon} size="sm" />
          <span>{level.label}</span>
          <span className="tabular text-ink-primary">{safePercent}%</span>
        </span>
      </div>

      {/* Bar */}
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-elevated"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, safePercent)}
        aria-valuetext={`${safePercent}% (${level.label})`}
      >
        <div className={`h-full rounded-full ${level.barClass}`} style={{ width: `${barWidth}%` }} />
      </div>

      {/* Detail */}
      {detail && <p className="tabular mt-1 text-xs text-ink-muted">{detail}</p>}
    </div>
  );
}
