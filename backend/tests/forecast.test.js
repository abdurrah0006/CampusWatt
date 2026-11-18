import { forecastSeries } from '../src/services/forecast.js';
import { HOUR_MS, DAY_MS } from '../src/utils/dateHelpers.js';

const ref = new Date('2026-11-16T12:00:00Z').getTime();

function buildSeries(days, valueFor) {
  const series = new Map();
  for (let t = ref - days * DAY_MS + HOUR_MS; t <= ref; t += HOUR_MS) series.set(t, valueFor(t));
  return series;
}

describe('forecastSeries', () => {
  test('forecast equals the average of the same hour on previous days', () => {
    // value = day index, so the 7-day average for any hour is predictable
    const series = buildSeries(8, (t) => Math.floor((ref - t) / DAY_MS) + 1);
    const { points } = forecastSeries(series, new Date(ref), { lookbackDays: 3 });
    const firstForecast = points.find((p) => p.actual === null);
    // t = ref+1h; samples at ref+1h-1d (age 0d23h -> 1), -2d (2), -3d (3)
    expect(firstForecast.forecast).toBe(2);
  });

  test('returns 24 history points then 24 forecast points', () => {
    const series = buildSeries(8, () => 10);
    const { points, summary } = forecastSeries(series, new Date(ref));
    expect(points).toHaveLength(48);
    expect(points.slice(0, 24).every((p) => p.actual === 10)).toBe(true);
    expect(points.slice(24).every((p) => p.forecast === 10)).toBe(true);
    expect(summary.forecastTotalKwh).toBe(240);
  });

  test('last actual point also carries the forecast so the lines connect', () => {
    const series = buildSeries(8, () => 7);
    const { points } = forecastSeries(series, new Date(ref));
    expect(points[23]).toMatchObject({ actual: 7, forecast: 7 });
  });

  test('handles missing history gracefully', () => {
    const { points } = forecastSeries(new Map(), new Date(ref));
    expect(points.slice(24).every((p) => p.forecast === null)).toBe(true);
  });
});
