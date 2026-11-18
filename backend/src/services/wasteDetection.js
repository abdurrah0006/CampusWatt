import { campusParts, hourWindow, toMs } from '../utils/dateHelpers.js';
import { round, sum } from '../utils/math.js';

/** Groups schedule blocks by roomId for fast lookups. */
export function buildScheduleIndex(schedules) {
  const index = new Map();
  schedules.forEach((s) => {
    if (!index.has(s.roomId)) index.set(s.roomId, []);
    index.get(s.roomId).push(s);
  });
  return index;
}

export function isScheduledAt(roomSchedules = [], dayOfWeek, hour) {
  return roomSchedules.some((s) => s.dayOfWeek === dayOfWeek && hour >= s.startHour && hour < s.endHour);
}

/**
 * Classifies one hourly reading.
 * wasteHour = usage is high (kwh > baseline x multiplier) AND no booking covers that hour.
 */
export function classifyHour({ kwh, baselineKw, scheduled, highUsageMultiplier = 1.5 }) {
  const isHigh = kwh > baselineKw * highUsageMultiplier;
  const isWaste = isHigh && !scheduled;
  return { isHigh, isWaste, excessKwh: isWaste ? Math.max(0, kwh - baselineKw) : 0 };
}

/**
 * Finds rooms that use a lot of energy while nothing is scheduled.
 *
 * @param {object}   params
 * @param {object[]} params.rooms          Rooms ({ id, baselineKw, ... })
 * @param {object[]} params.schedules      Schedule blocks ({ roomId, dayOfWeek, startHour, endHour })
 * @param {object[]} params.readings       Hourly readings ({ roomId, timestamp, kwh })
 * @param {Date}     params.referenceTime  End of the analysis window ("now")
 * @param {object}   [params.options]      { highUsageMultiplier, windowHours, minWasteHours, utcOffsetHours }
 * @returns {{ window: {from: Date, to: Date}, rooms: object[] }} one entry per room, flagged first
 */
export function detectWaste({ rooms, schedules, readings, referenceTime, options = {} }) {
  const {
    highUsageMultiplier = 1.5,
    windowHours = 24,
    minWasteHours = 2,
    utcOffsetHours = 4,
  } = options;

  const window = hourWindow(referenceTime, windowHours);
  const fromMs = window.from.getTime();
  const toMsValue = window.to.getTime();
  const scheduleIndex = buildScheduleIndex(schedules);
  const nowParts = campusParts(window.to, utcOffsetHours);

  const readingsByRoom = new Map();
  readings.forEach((r) => {
    const t = toMs(r.timestamp);
    if (t < fromMs || t > toMsValue) return;
    if (!readingsByRoom.has(r.roomId)) readingsByRoom.set(r.roomId, []);
    readingsByRoom.get(r.roomId).push(r);
  });

  const results = rooms.map((room) => {
    const roomSchedules = scheduleIndex.get(room.id) || [];
    const roomReadings = (readingsByRoom.get(room.id) || []).sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp));

    const wasteHours = [];
    roomReadings.forEach((r) => {
      const { dayOfWeek, hour } = campusParts(r.timestamp, utcOffsetHours);
      const scheduled = isScheduledAt(roomSchedules, dayOfWeek, hour);
      const { isWaste, excessKwh } = classifyHour({ kwh: r.kwh, baselineKw: room.baselineKw, scheduled, highUsageMultiplier });
      if (isWaste) {
        wasteHours.push({ timestamp: new Date(toMs(r.timestamp)).toISOString(), hour, dayOfWeek, kwh: round(r.kwh, 2), excessKwh: round(excessKwh, 2) });
      }
    });

    const latest = roomReadings[roomReadings.length - 1];
    const peak = wasteHours.reduce((best, h) => (!best || h.excessKwh > best.excessKwh ? h : best), null);
    const wasteKwh = round(sum(wasteHours.map((h) => h.excessKwh)), 2);
    const flagged = wasteHours.length >= minWasteHours;

    return {
      roomId: room.id,
      wasteHours: wasteHours.length,
      wasteKwh: flagged ? wasteKwh : 0,
      flagged,
      peakWasteHour: flagged ? peak : null,
      wasteHourDetails: flagged ? wasteHours : [],
      currentKwh: latest ? round(latest.kwh, 2) : null,
      currentTimestamp: latest ? new Date(toMs(latest.timestamp)).toISOString() : null,
      scheduledNow: isScheduledAt(roomSchedules, nowParts.dayOfWeek, nowParts.hour),
      readingsInWindow: roomReadings.length,
    };
  });

  results.sort((a, b) => Number(b.flagged) - Number(a.flagged) || b.wasteKwh - a.wasteKwh);
  return { window, rooms: results };
}
