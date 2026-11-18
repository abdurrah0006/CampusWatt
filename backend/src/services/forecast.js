import { DAY_MS, HOUR_MS, campusParts, floorToHour, toMs } from '../utils/dateHelpers.js';
import { average, round, sum } from '../utils/math.js';

/**
 * Seasonal-naive forecast (no ML): the forecast for a future hour is the average kWh
 * recorded at the same hour of day on each of the previous `lookbackDays` days.
 *
 * @param {Map<number, number>} series  hourly totals keyed by timestamp (ms)
 * @param {Date} referenceTime          last hour with actual data
 * @returns {{ points: object[], summary: object }}
 *   points: history (actual) then forecast; the last actual point also carries `forecast`
 *   so the dashed line starts exactly where the solid line ends.
 */
export function forecastSeries(series, referenceTime, { horizonHours = 24, historyHours = 24, lookbackDays = 7, utcOffsetHours = 4 } = {}) {
  const ref = floorToHour(referenceTime).getTime();
  const points = [];

  for (let i = historyHours - 1; i >= 0; i -= 1) {
    const t = ref - i * HOUR_MS;
    const value = series.get(t);
    points.push({
      timestamp: new Date(t).toISOString(),
      hour: campusParts(t, utcOffsetHours).hour,
      actual: value === undefined ? null : round(value, 2),
      forecast: null,
    });
  }

  const forecastPoints = [];
  for (let i = 1; i <= horizonHours; i += 1) {
    const t = ref + i * HOUR_MS;
    const samples = [];
    for (let d = 1; d <= lookbackDays; d += 1) {
      const past = t - d * DAY_MS;
      if (past <= ref && series.has(past)) samples.push(series.get(past));
    }
    forecastPoints.push({
      timestamp: new Date(t).toISOString(),
      hour: campusParts(t, utcOffsetHours).hour,
      actual: null,
      forecast: samples.length ? round(average(samples), 2) : null,
      samples: samples.length,
    });
  }

  const last = points[points.length - 1];
  if (last && last.actual !== null) last.forecast = last.actual;

  const forecastValues = forecastPoints.map((p) => p.forecast).filter((v) => v !== null);
  const peak = forecastPoints.reduce((best, p) => (p.forecast !== null && (!best || p.forecast > best.forecast) ? p : best), null);

  return {
    points: [...points, ...forecastPoints],
    summary: {
      referenceTime: new Date(ref).toISOString(),
      historyTotalKwh: round(sum(points.map((p) => p.actual || 0)), 1),
      forecastTotalKwh: round(sum(forecastValues), 1),
      forecastPeak: peak ? { timestamp: peak.timestamp, kwh: peak.forecast } : null,
      lookbackDays,
      method: `Average of the same hour over the previous ${lookbackDays} days`,
    },
  };
}

/** Helper for callers that hold readings and want a single building's (or the campus) hourly series. */
export function seriesFromReadings(readings, buildingId) {
  const series = new Map();
  readings.forEach((r) => {
    if (buildingId && r.buildingId !== buildingId) return;
    const t = toMs(r.timestamp);
    series.set(t, (series.get(t) || 0) + r.kwh);
  });
  return series;
}
