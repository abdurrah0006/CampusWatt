import { AlertTriangle, Gauge, Leaf } from 'lucide-react';

// Usage levels
const USAGE_LEVELS = {
  optimal: {
    label: 'Optimal',
    icon: Leaf,
    barClass: 'bg-energy-optimal',
    textClass: 'text-energy-optimal-ink',
    softClass: 'bg-energy-optimal-soft',
  },
  moderate: {
    label: 'Moderate',
    icon: Gauge,
    barClass: 'bg-energy-moderate',
    textClass: 'text-energy-moderate-ink',
    softClass: 'bg-energy-moderate-soft',
  },
  high: {
    label: 'High',
    icon: AlertTriangle,
    barClass: 'bg-energy-critical',
    textClass: 'text-energy-critical-ink',
    softClass: 'bg-energy-critical-soft',
  },
};

export function getUsageLevel(percent) {
  if (percent >= 86) return USAGE_LEVELS.high;
  if (percent >= 61) return USAGE_LEVELS.moderate;
  return USAGE_LEVELS.optimal;
}
