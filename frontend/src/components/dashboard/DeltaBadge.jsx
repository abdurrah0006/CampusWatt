import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Icon } from '../ui/Icon.jsx';

export function DeltaBadge({ delta, goodWhen }) {
  const isUp = delta > 0;
  const isGood = goodWhen === 'down' ? delta <= 0 : delta >= 0;
  const toneClass = isGood ? 'bg-energy-optimal-soft text-energy-optimal-ink' : 'bg-energy-critical-soft text-energy-critical-ink';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${toneClass}`}>
      <Icon icon={isUp ? ArrowUpRight : ArrowDownRight} size="sm" />
      <span className="sr-only">{isUp ? 'Up' : 'Down'}</span>
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}
