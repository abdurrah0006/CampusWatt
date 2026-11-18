import { Leaf, TrendingDown, Zap } from 'lucide-react';
import { Icon } from '../ui/Icon.jsx';
import { SavingsStat } from './SavingsStat.jsx';
import { useCountUp } from '../../hooks/useCountUp.js';
import { formatNumber } from '../../utils/formatters.js';

export function SavingsBanner({ monthlyAED, monthlyKwh, flaggedRooms, totalRooms, tariff, action }) {
  const animatedAED = useCountUp(monthlyAED);
  const animatedKwh = useCountUp(monthlyKwh);

  return (
    <section className="card overflow-hidden">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          {/* Badge */}
          <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-primary">
            <Icon icon={Leaf} size="sm" /> Potential savings
          </p>

          {/* Headline */}
          {flaggedRooms === 0 && (
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-primary sm:text-4xl">No energy waste detected right now</h2>
          )}
          {flaggedRooms > 0 && (
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-primary sm:text-4xl lg:text-5xl">
              You could save{' '}
              <span className="tabular whitespace-nowrap text-brand-primary">AED {formatNumber(Math.round(animatedAED))}</span>
              <span className="text-ink-muted">/month</span>
            </h2>
          )}
          <p className="mt-3 max-w-2xl text-sm text-ink-secondary sm:text-base">
            by fixing energy waste in <span className="font-semibold text-ink-primary">{flaggedRooms} of {totalRooms} rooms</span> that use power while nothing is scheduled.
          </p>

          {/* Stats */}
          <div className="mt-6 flex flex-wrap gap-3">
            <SavingsStat icon={Zap} value={`${formatNumber(Math.round(animatedKwh))} kWh`} label="wasted per month" />
            <SavingsStat icon={TrendingDown} value={`AED ${formatNumber(Math.round(monthlyAED * 12))}`} label="per year" />
          </div>
        </div>
        {action && <div className="lg:pl-6">{action}</div>}
      </div>

      {/* Footnote */}
      <p className="border-t border-line bg-canvas px-6 py-3 text-xs text-ink-secondary sm:px-8">
        Estimate from simulated readings: the last 24 hours × 30 days, at an assumed tariff of AED {tariff.toFixed(2)}/kWh (editable in Settings). Real rates depend on the utility and tariff band.
      </p>
    </section>
  );
}
