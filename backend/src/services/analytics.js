import { store } from '../repositories/dataStore.js';
import { DEFAULTS, DAYS_PER_MONTH, HISTORY_DAYS, ROOM_TYPE_LABELS } from '../config/constants.js';
import { addHours, toMs } from '../utils/dateHelpers.js';
import { round } from '../utils/math.js';
import { detectWaste } from './wasteDetection.js';
import { calculateCampusSavings, calculateSavings } from './savings.js';
import { evaluateAlerts } from './alerts.js';
import { campusHourlyTotals, hourlyTotalsByBuilding, rankBuildings, sumRange, todayVsYesterday } from './consumption.js';
import { forecastSeries, seriesFromReadings } from './forecast.js';

// Load context
export async function loadContext({ historyHours = HISTORY_DAYS * 24 } = {}) {
  const referenceTime = await store.getLatestTimestamp();
  const [buildings, rooms, schedules] = await Promise.all([store.getBuildings(), store.getRooms(), store.getSchedules()]);
  if (!referenceTime) return { referenceTime: null, buildings, rooms, schedules, readings: [] };
  const readings = await store.getReadings({ from: addHours(referenceTime, -(historyHours - 1)), to: referenceTime });
  return { referenceTime, buildings, rooms, schedules, readings };
}

// Waste
export function computeWaste(ctx, { tariff = DEFAULTS.tariffAedPerKwh } = {}) {
  const windowHours = DEFAULTS.wasteWindowHours;
  const assumptions = {
    tariffAedPerKwh: tariff,
    highUsageMultiplier: DEFAULTS.highUsageMultiplier,
    windowHours,
    minWasteHours: DEFAULTS.minWasteHours,
    daysPerMonth: DAYS_PER_MONTH,
  };

  if (!ctx.referenceTime) {
    const emptyRooms = buildNoDataRooms(ctx);
    return { referenceTime: null, window: null, assumptions, totals: emptyWasteTotals(emptyRooms.length), rooms: emptyRooms };
  }

  const { window, rooms: results } = detectWaste({
    rooms: ctx.rooms,
    schedules: ctx.schedules,
    readings: ctx.readings,
    referenceTime: ctx.referenceTime,
    options: { ...DEFAULTS, windowHours },
  });

  const roomById = new Map(ctx.rooms.map((r) => [r.id, r]));
  const buildingById = new Map(ctx.buildings.map((b) => [b.id, b]));

  const rooms = results.map((r) => {
    const room = roomById.get(r.roomId);
    const building = buildingById.get(room.buildingId);
    const savings = calculateSavings({ wasteKwh: r.wasteKwh, windowHours, tariffAedPerKwh: tariff, daysPerMonth: DAYS_PER_MONTH });
    return {
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
      roomType: room.type,
      roomTypeLabel: ROOM_TYPE_LABELS[room.type] || room.type,
      floor: room.floor,
      baselineKw: room.baselineKw,
      buildingId: room.buildingId,
      buildingCode: building?.code,
      buildingName: building?.name,
      currentKwh: r.currentKwh,
      currentTimestamp: r.currentTimestamp,
      scheduledNow: r.scheduledNow,
      status: r.flagged ? 'waste' : 'ok',
      flagged: r.flagged,
      wasteHours: r.wasteHours,
      wasteKwh: r.wasteKwh,
      peakWasteHour: r.peakWasteHour,
      wasteHourDetails: r.wasteHourDetails,
      ...savings,
    };
  });

  const totals = calculateCampusSavings(rooms, { windowHours, tariffAedPerKwh: tariff, daysPerMonth: DAYS_PER_MONTH });

  return {
    referenceTime: ctx.referenceTime.toISOString(),
    window: { from: window.from.toISOString(), to: window.to.toISOString() },
    assumptions,
    totals: { ...totals, totalRooms: rooms.length },
    rooms,
  };
}

function buildNoDataRooms(ctx) {
  const buildingById = new Map(ctx.buildings.map((b) => [b.id, b]));
  return ctx.rooms.map((room) => {
    const building = buildingById.get(room.buildingId);
    return {
      roomId: room.id,
      roomCode: room.code,
      roomName: room.name,
      roomType: room.type,
      roomTypeLabel: ROOM_TYPE_LABELS[room.type] || room.type,
      floor: room.floor,
      baselineKw: room.baselineKw,
      buildingId: room.buildingId,
      buildingCode: building?.code,
      buildingName: building?.name,
      currentKwh: null,
      currentTimestamp: null,
      scheduledNow: false,
      status: 'ok',
      flagged: false,
      wasteHours: 0,
      wasteKwh: 0,
      peakWasteHour: null,
      wasteHourDetails: [],
      dailyWasteKwh: 0,
      monthlySavingsKwh: 0,
      monthlySavingsAED: 0,
    };
  });
}

function emptyWasteTotals(totalRooms) {
  return { flaggedRooms: 0, wasteKwhInWindow: 0, dailyWasteKwh: 0, monthlySavingsKwh: 0, monthlySavingsAED: 0, totalRooms };
}

// Alerts
export function computeAlerts(ctx, { thresholdMultiplier = 1 } = {}) {
  if (!ctx.referenceTime) return { alerts: [], statuses: [] };
  const totals = hourlyTotalsByBuilding(ctx.readings);
  const ref = ctx.referenceTime;
  const latestByBuilding = {};
  const dailyByBuilding = {};
  ctx.buildings.forEach((b) => {
    const series = totals.get(b.id);
    latestByBuilding[b.id] = series?.get(toMs(ref)) ?? 0;
    dailyByBuilding[b.id] = sumRange(series, addHours(ref, -23), ref);
  });
  return evaluateAlerts({
    buildings: ctx.buildings,
    latestByBuilding,
    dailyByBuilding,
    timestamp: ref,
    options: {
      thresholdMultiplier,
      warningRatio: DEFAULTS.alertWarningRatio,
      dailyLoadFactor: DEFAULTS.dailyLoadFactor,
    },
  });
}

// Dashboard
export function computeDashboard(ctx, { tariff = DEFAULTS.tariffAedPerKwh, thresholdMultiplier = 1 } = {}) {
  const { buildings, readings, referenceTime } = ctx;
  if (!referenceTime) {
    return {
      referenceTime: null,
      kpis: { todayKwh: 0, todayChangePct: null, activeAlerts: 0, criticalAlerts: 0, potentialMonthlySavingsAED: 0, potentialMonthlySavingsKwh: 0, flaggedRooms: 0, tariffAedPerKwh: tariff },
      highestConsumer: null,
      alerts: [],
      buildings: buildings.map((b) => ({ ...b, status: 'normal', latestKwh: 0, last24hKwh: 0, weekKwh: 0, sharePct: 0 })),
      weeklyTotals: [],
      hourlySeries: [],
    };
  }

  const byBuilding = hourlyTotalsByBuilding(readings);
  const campus = campusHourlyTotals(readings);
  const today = todayVsYesterday(campus, referenceTime, DEFAULTS.utcOffsetHours);
  const ranking = rankBuildings({ buildings, totalsByBuilding: byBuilding, referenceTime });
  const { alerts, statuses } = computeAlerts(ctx, { thresholdMultiplier });
  const waste = computeWaste(ctx, { tariff });

  const statusById = new Map(statuses.map((s) => [s.buildingId, s]));
  const rankById = new Map(ranking.ranked.map((r) => [r.buildingId, r]));
  const flaggedByBuilding = waste.rooms.reduce((acc, r) => {
    if (r.flagged) acc[r.buildingId] = (acc[r.buildingId] || 0) + 1;
    return acc;
  }, {});
  const roomCountByBuilding = ctx.rooms.reduce((acc, r) => ({ ...acc, [r.buildingId]: (acc[r.buildingId] || 0) + 1 }), {});

  const buildingCards = buildings.map((b) => {
    const series = byBuilding.get(b.id);
    const s = statusById.get(b.id);
    const rank = rankById.get(b.id);
    return {
      id: b.id,
      code: b.code,
      name: b.name,
      floors: b.floors,
      roomCount: roomCountByBuilding[b.id] || 0,
      flaggedRooms: flaggedByBuilding[b.id] || 0,
      thresholdKwhPerHour: s.thresholds.hourly,
      dailyThresholdKwh: s.thresholds.daily,
      status: s.status,
      hourlyRatio: s.hourlyRatio,
      dailyRatio: s.dailyRatio,
      latestKwh: round(series?.get(toMs(referenceTime)) ?? 0, 1),
      last24hKwh: round(sumRange(series, addHours(referenceTime, -23), referenceTime), 1),
      weekKwh: rank?.totalKwh ?? 0,
      previousWeekKwh: rank?.previousKwh ?? 0,
      weekOverWeekPct: rank?.weekOverWeekPct ?? null,
      sharePct: rank?.sharePct ?? 0,
    };
  });

  const hourlySeries = [];
  for (let i = 23; i >= 0; i -= 1) {
    const t = toMs(addHours(referenceTime, -i));
    const row = { timestamp: new Date(t).toISOString(), total: 0 };
    buildings.forEach((b) => {
      const v = round(byBuilding.get(b.id)?.get(t) ?? 0, 2);
      row[b.id] = v;
      row.total = round(row.total + v, 2);
    });
    hourlySeries.push(row);
  }

  return {
    referenceTime: referenceTime.toISOString(),
    kpis: {
      todayKwh: today.todayKwh,
      todayChangePct: today.changePct,
      yesterdaySamePeriodKwh: today.yesterdaySamePeriodKwh,
      weekCampusKwh: ranking.campusTotalKwh,
      activeAlerts: alerts.length,
      criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
      potentialMonthlySavingsAED: waste.totals.monthlySavingsAED,
      potentialMonthlySavingsKwh: waste.totals.monthlySavingsKwh,
      flaggedRooms: waste.totals.flaggedRooms,
      tariffAedPerKwh: tariff,
    },
    highestConsumer: ranking.top,
    alerts,
    buildings: buildingCards,
    weeklyTotals: ranking.ranked,
    hourlySeries,
  };
}

// Forecast
export function computeForecast(ctx, { buildingId } = {}) {
  if (!ctx.referenceTime) return { buildingId: buildingId || 'all', points: [], summary: null };
  const series = seriesFromReadings(ctx.readings, buildingId);
  const { points, summary } = forecastSeries(series, ctx.referenceTime, {
    lookbackDays: DEFAULTS.forecastLookbackDays,
    utcOffsetHours: DEFAULTS.utcOffsetHours,
  });
  return { buildingId: buildingId || 'all', points, summary };
}
