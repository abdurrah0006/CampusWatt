import { Icon } from './Icon.jsx';

const BADGE_TONES = {
  optimal: 'bg-energy-optimal-soft text-energy-optimal-ink',
  moderate: 'bg-energy-moderate-soft text-energy-moderate-ink',
  critical: 'bg-energy-critical-soft text-energy-critical-ink',
  info: 'bg-energy-info-soft text-energy-info-ink',
  brand: 'bg-brand-soft text-brand-primary',
  neutral: 'bg-elevated text-ink-secondary',
};

export function Badge({ tone = 'neutral', icon, className = '', children }) {
  const toneClass = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold leading-none ${toneClass} ${className}`}>
      {icon && <Icon icon={icon} size="sm" />}
      {children}
    </span>
  );
}
