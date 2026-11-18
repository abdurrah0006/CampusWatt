import { CardSkeleton } from '../ui/CardSkeleton.jsx';
import { DeltaBadge } from './DeltaBadge.jsx';
import { Icon } from '../ui/Icon.jsx';

const ICON_TONES = {
  neutral: 'bg-elevated text-ink-secondary',
  optimal: 'bg-energy-optimal-soft text-energy-optimal-ink',
  moderate: 'bg-energy-moderate-soft text-energy-moderate-ink',
  critical: 'bg-energy-critical-soft text-energy-critical-ink',
  info: 'bg-energy-info-soft text-energy-info-ink',
  brand: 'bg-brand-soft text-brand-primary',
};

export function KpiCard({ label, value, unit, sub, icon, tone = 'neutral', delta, deltaGoodWhen = 'down', loading, footer, highlight = false }) {
  if (loading) return <CardSkeleton lines={2} className="h-full" />;
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);

  return (
    <div className={`card h-full p-5 ${highlight ? 'border-brand-primary' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-secondary">{label}</p>
        {icon && (
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ICON_TONES[tone] || ICON_TONES.neutral}`}>
            <Icon icon={icon} />
          </span>
        )}
      </div>

      {/* Value */}
      <p className="tabular mt-2 text-[28px] font-bold leading-tight tracking-tight text-ink-primary">
        {value}
        {unit && <span className="ml-1 text-base font-semibold text-ink-muted">{unit}</span>}
      </p>

      {/* Detail */}
      <div className="mt-2 flex min-h-[20px] flex-wrap items-center gap-2 text-xs">
        {hasDelta && <DeltaBadge delta={delta} goodWhen={deltaGoodWhen} />}
        {sub && <span className="text-ink-secondary">{sub}</span>}
      </div>
      {footer}
    </div>
  );
}
