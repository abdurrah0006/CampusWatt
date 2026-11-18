import { Trophy } from 'lucide-react';
import { CardSkeleton } from '../ui/CardSkeleton.jsx';
import { Icon } from '../ui/Icon.jsx';
import { formatKwh, formatPercent } from '../../utils/formatters.js';

export function HighestConsumerCard({ consumer, colorVar, loading }) {
  if (loading) return <CardSkeleton lines={2} className="h-full" />;

  if (!consumer) {
    return (
      <div className="card h-full p-5">
        <p className="text-sm font-medium text-ink-secondary">Highest consumer this week</p>
        <p className="mt-3 text-sm text-ink-secondary">No data yet.</p>
      </div>
    );
  }

  const weekChange = consumer.weekOverWeekPct;
  const changeClass = weekChange > 0 ? 'text-energy-critical-ink' : 'text-energy-optimal-ink';

  return (
    <div className="card h-full p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-secondary">Highest consumer this week</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated text-ink-secondary">
          <Icon icon={Trophy} />
        </span>
      </div>

      {/* Value */}
      <p className="mt-2 flex items-center gap-2 text-xl font-bold leading-tight tracking-tight text-ink-primary">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorVar }} aria-hidden="true" />
        <span className="truncate">{consumer.name}</span>
      </p>
      <p className="tabular mt-1 text-sm text-ink-secondary">
        <span className="font-semibold text-ink-primary">{formatKwh(consumer.totalKwh, 0)}</span>
        {typeof weekChange === 'number' && (
          <span className={changeClass}> · {formatPercent(weekChange, { signed: true })} vs last week</span>
        )}
      </p>

      {/* Share */}
      <div className="mt-3">
        <div className="flex justify-between text-xs font-medium text-ink-secondary">
          <span>Share of campus</span>
          <span className="tabular text-ink-primary">{formatPercent(consumer.sharePct)}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-elevated">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, consumer.sharePct)}%`, background: colorVar }} />
        </div>
      </div>
    </div>
  );
}
