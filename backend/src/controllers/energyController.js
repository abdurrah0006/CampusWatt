import { store } from '../repositories/dataStore.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { DEFAULTS } from '../config/constants.js';
import { addHours, campusParts, floorToHour, startOfCampusDay, toMs } from '../utils/dateHelpers.js';
import { round } from '../utils/math.js';
import { logger } from '../utils/logger.js';

const MAX_RANGE_DAYS = 92;

/** GET /api/energy/building/:id?from=&to=&granularity=hour|day */
export async function getBuildingEnergy(req, res) {
  const { id } = req.validated.params;
  const { from, to, granularity } = req.validated.query;

  const building = await store.getBuildingById(id);
  if (!building) throw ApiError.notFound(`Building "${id}" not found`);

  const latest = (await store.getLatestTimestamp()) || floorToHour(new Date());
  const end = to || latest;
  const start = from
    || (granularity === 'day'
      ? startOfCampusDay(addHours(end, -13 * 24), DEFAULTS.utcOffsetHours)
      : addHours(end, -23));
  if (toMs(end) - toMs(start) > MAX_RANGE_DAYS * 24 * 3600 * 1000) {
    throw ApiError.badRequest(`Range too large (max ${MAX_RANGE_DAYS} days)`);
  }

  const readings = await store.getReadings({ from: start, to: end, buildingId: building.id });

  const buckets = new Map();
  readings.forEach((r) => {
    const key = granularity === 'day'
      ? startOfCampusDay(r.timestamp, DEFAULTS.utcOffsetHours).getTime()
      : floorToHour(r.timestamp).getTime();
    buckets.set(key, (buckets.get(key) || 0) + r.kwh);
  });

  const series = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, kwh]) => ({
      timestamp: new Date(t).toISOString(),
      ...(granularity === 'day' ? { date: campusParts(t, DEFAULTS.utcOffsetHours).dateKey } : {}),
      kwh: round(kwh, 2),
    }));

  const total = series.reduce((acc, p) => acc + p.kwh, 0);
  return sendSuccess(
    res,
    {
      building,
      granularity,
      from: new Date(start).toISOString(),
      to: new Date(end).toISOString(),
      totalKwh: round(total, 1),
      series,
    },
    { points: series.length },
  );
}

/** POST /api/energy/ingest - future IoT endpoint (x-api-key protected). */
export async function ingestReadings(req, res) {
  const body = req.validated.body;
  const items = (Array.isArray(body) ? body : [body]).map((i) => ({ ...i, timestamp: i.timestamp || new Date() }));

  const now = Date.now();
  const future = items.filter((i) => toMs(i.timestamp) > now + 5 * 60 * 1000);
  if (future.length) throw ApiError.unprocessable('Timestamps cannot be in the future', { count: future.length });

  const roomIds = [...new Set(items.map((i) => i.roomId))];
  const rooms = await store.getRoomsByIds(roomIds);
  const known = new Set(rooms.map((r) => r.id));
  const unknown = roomIds.filter((rid) => !known.has(rid));
  if (unknown.length) throw ApiError.unprocessable('Unknown roomId(s)', { unknownRoomIds: unknown });

  const result = await store.insertReadings(items);
  logger.info(`Ingested ${items.length} reading(s) for ${roomIds.length} room(s).`);
  return sendSuccess(res, { received: items.length, ...result }, {}, 201);
}
