import { addHours, campusParts, toMs } from '../utils/dateHelpers.js';
import { percentChange, round, sum } from '../utils/math.js';

/** Sums readings into a Map<buildingId, Map<timestampMs, kWh>>. */
export function hourlyTotalsByBuilding(readings) {
  const result = new Map();
  readings.forEach((r) => {
    const t = toMs(r.timestamp);
    if (!result.has(r.buildingId)) result.set(r.buildingId, new Map());
    const series = result.get(r.buildingId);
    series.set(t, (series.get(t) || 0) + r.kwh);
  });
  return result;
}

/** Campus-wide hourly totals: Map<timestampMs, kWh>. */
export function campusHourlyTotals(readings) {
  const series = new Map();
  readings.forEach((r) => {
    const t = toMs(r.timestamp);
    series.set(t, (series.get(t) || 0) + r.kwh);
  });
  return series;
}

/** Sum of a series between two instants (inclusive). */
export function sumRange(series, from, to) {
  const f = toMs(from);
  const t = toMs(to);
  let total = 0;
  if (!series) return 0;
  series.forEach((value, ms) => {
    if (ms >= f && ms <= t) total += value;
  });
  return total;
}

/**
 * Ranks buildings by consumption over the last 7 days and compares with the 7 days before.
 * Returns the ranked list and the top building with its campus share.
 */
export function rankBuildings({ buildings, totalsByBuilding, referenceTime }) {
  const weekStart = addHours(referenceTime, -167);
  const prevEnd = addHours(referenceTime, -168);
  const prevStart = addHours(referenceTime, -335);

  const rows = buildings.map((b) => {
    const series = totalsByBuilding.get(b.id);
    const totalKwh = sumRange(series, weekStart, referenceTime);
    const previousKwh = sumRange(series, prevStart, prevEnd);
    return { buildingId: b.id, code: b.code, name: b.name, totalKwh, previousKwh };
  });

  const campusTotal = sum(rows.map((r) => r.totalKwh));
  const ranked = rows
    .map((r) => ({
      ...r,
      totalKwh: round(r.totalKwh, 1),
      previousKwh: round(r.previousKwh, 1),
      sharePct: campusTotal > 0 ? round((r.totalKwh / campusTotal) * 100, 1) : 0,
      weekOverWeekPct: percentChange(r.totalKwh, r.previousKwh),
    }))
    .sort((a, b) => b.totalKwh - a.totalKwh);

  return { ranked, top: ranked[0] || null, campusTotalKwh: round(campusTotal, 1) };
}

/** Total kWh for the campus-local calendar day containing referenceTime, plus the same period yesterday. */
export function todayVsYesterday(campusSeries, referenceTime, utcOffsetHours = 4) {
  const todayKey = campusParts(referenceTime, utcOffsetHours).dateKey;
  const yesterdayKey = campusParts(addHours(referenceTime, -24), utcOffsetHours).dateKey;
  const cutoffYesterday = toMs(addHours(referenceTime, -24));
  let today = 0;
  let yesterdaySamePeriod = 0;
  campusSeries.forEach((value, ms) => {
    const key = campusParts(ms, utcOffsetHours).dateKey;
    if (key === todayKey && ms <= toMs(referenceTime)) today += value;
    if (key === yesterdayKey && ms <= cutoffYesterday) yesterdaySamePeriod += value;
  });
  return {
    todayKwh: round(today, 1),
    yesterdaySamePeriodKwh: round(yesterdaySamePeriod, 1),
    changePct: percentChange(today, yesterdaySamePeriod),
  };
}
