import { SEVERITY } from '../config/constants.js';
import { round } from '../utils/math.js';

/** "critical" above 100% of the limit, "warning" above warningRatio, otherwise null. */
export function getSeverity(ratio, warningRatio = 0.9) {
  if (!Number.isFinite(ratio)) return null;
  if (ratio > 1) return SEVERITY.CRITICAL;
  if (ratio > warningRatio) return SEVERITY.WARNING;
  return null;
}

export function effectiveThresholds(building, { thresholdMultiplier = 1, dailyLoadFactor = 0.7 } = {}) {
  const hourly = building.thresholdKwhPerHour * thresholdMultiplier;
  return { hourly: round(hourly, 1), daily: round(hourly * 24 * dailyLoadFactor, 0) };
}

const fmt = (n) => Math.round(n).toLocaleString('en-US');

/**
 * Evaluates one building against its hourly and daily limits and returns the worse of the two.
 * Always returns a status object; `alert` is null when the building is within limits.
 */
export function evaluateBuilding({ building, latestKwh, dailyKwh, timestamp, options = {} }) {
  const { warningRatio = 0.9 } = options;
  const thresholds = effectiveThresholds(building, options);

  const checks = [
    { type: 'hourly', value: latestKwh, threshold: thresholds.hourly, unit: 'kWh/h', label: 'hourly' },
    { type: 'daily', value: dailyKwh, threshold: thresholds.daily, unit: 'kWh', label: 'daily (last 24h)' },
  ]
    .filter((c) => Number.isFinite(c.value) && c.threshold > 0)
    .map((c) => ({ ...c, ratio: c.value / c.threshold }));

  const worst = checks.sort((a, b) => b.ratio - a.ratio)[0];
  const severity = worst ? getSeverity(worst.ratio, warningRatio) : null;
  const status = severity || 'normal';

  const alert = severity
    ? {
      id: `${building.id}-${worst.type}`,
      buildingId: building.id,
      buildingCode: building.code,
      buildingName: building.name,
      type: worst.type,
      severity,
      currentValue: round(worst.value, 1),
      threshold: round(worst.threshold, 1),
      unit: worst.unit,
      percentOfThreshold: round(worst.ratio * 100, 1),
      percentOver: round((worst.ratio - 1) * 100, 1),
      timestamp: new Date(timestamp).toISOString(),
      message: worst.ratio > 1
        ? `${building.name} is ${round((worst.ratio - 1) * 100, 1)}% over its ${worst.label} limit (${fmt(worst.value)} vs ${fmt(worst.threshold)} ${worst.unit}).`
        : `${building.name} is at ${round(worst.ratio * 100, 1)}% of its ${worst.label} limit (${fmt(worst.value)} of ${fmt(worst.threshold)} ${worst.unit}).`,
    }
    : null;

  return {
    status,
    alert,
    thresholds,
    hourlyRatio: round((latestKwh || 0) / (thresholds.hourly || 1), 3),
    dailyRatio: round((dailyKwh || 0) / (thresholds.daily || 1), 3),
  };
}

/** Evaluates all buildings; alerts sorted critical first, then by how far over they are. */
export function evaluateAlerts({ buildings, latestByBuilding, dailyByBuilding, timestamp, options = {} }) {
  const statuses = buildings.map((b) => ({
    buildingId: b.id,
    ...evaluateBuilding({
      building: b,
      latestKwh: latestByBuilding[b.id] ?? 0,
      dailyKwh: dailyByBuilding[b.id] ?? 0,
      timestamp,
      options,
    }),
  }));

  const rank = { critical: 2, warning: 1 };
  const alerts = statuses
    .map((s) => s.alert)
    .filter(Boolean)
    .sort((a, b) => rank[b.severity] - rank[a.severity] || b.percentOfThreshold - a.percentOfThreshold);

  return { alerts, statuses };
}
