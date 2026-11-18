import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDataset } from '../data/generator.js';
import { RUNTIME_OVERRIDES_FILE, STALE_DATA_HOURS } from '../config/constants.js';
import { HOUR_MS, floorToHour, toMs } from '../utils/dateHelpers.js';
import { logger } from '../utils/logger.js';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const OVERRIDES_PATH = path.join(DATA_DIR, RUNTIME_OVERRIDES_FILE);
const GENERATED_FILES = ['buildings', 'rooms', 'schedules', 'readings'];

const copy = (item) => ({ ...item });

async function readJsonFile(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function loadGeneratedFiles() {
  try {
    const [buildings, rooms, schedules, readings] = await Promise.all(
      GENERATED_FILES.map((name) => readJsonFile(path.join(DATA_DIR, `${name}.json`))),
    );
    return { buildings, rooms, schedules, readings };
  } catch (error) {
    logger.warn(`JSON data files not readable (${error.message}).`);
    return null;
  }
}

async function loadOverrides(filePath) {
  try {
    return await readJsonFile(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.warn(`Saved runtime changes could not be read (${error.message}). Using generated data.`);
    }
    return null;
  }
}

function latestTimestampOf(readings) {
  let max = 0;
  for (const reading of readings) {
    max = Math.max(max, toMs(reading.timestamp));
  }
  return max;
}

function isStale(dataset, now) {
  if (!dataset || !dataset.readings?.length) {
    return true;
  }
  return toMs(now) - latestTimestampOf(dataset.readings) > STALE_DATA_HOURS * HOUR_MS;
}

export async function createJsonRepository({ now = new Date(), allowRegenerate = true, overridesPath = OVERRIDES_PATH } = {}) {
  const overrides = await loadOverrides(overridesPath);
  if (overrides) {
    logger.info('Using saved runtime changes from runtime-overrides.json.');
    return buildJsonRepository(overrides, { persistPath: overridesPath });
  }

  let dataset = await loadGeneratedFiles();
  if (allowRegenerate && isStale(dataset, now)) {
    logger.info('JSON data is missing or stale - generating a fresh dataset in memory aligned to the current hour.');
    dataset = generateDataset({ now });
  }
  return buildJsonRepository(dataset, { persistPath: overridesPath });
}

export function buildJsonRepository(dataset, { persistPath = null } = {}) {
  let buildings = dataset.buildings.map(copy);
  let rooms = dataset.rooms.map(copy);
  let schedules = dataset.schedules.map(copy);
  let readings = dataset.readings.map((reading) => ({
    roomId: reading.roomId,
    buildingId: reading.buildingId,
    timestamp: new Date(toMs(reading.timestamp)),
    kwh: Number(reading.kwh),
  }));
  let readingIndex = new Map();
  let saveQueue = Promise.resolve();

  const sortByTime = (a, b) => a.timestamp - b.timestamp;
  const keyOf = (roomId, ms) => `${roomId}|${ms}`;

  const rebuildReadingIndex = () => {
    readingIndex = new Map();
    readings.forEach((reading) => {
      readingIndex.set(keyOf(reading.roomId, reading.timestamp.getTime()), reading);
    });
    readings.sort(sortByTime);
  };

  rebuildReadingIndex();

  const writeSnapshot = async () => {
    if (!persistPath) {
      return;
    }
    const snapshot = {
      savedAt: new Date().toISOString(),
      buildings,
      rooms,
      schedules,
      readings: readings.map((reading) => ({ ...reading, timestamp: reading.timestamp.toISOString() })),
    };
    await mkdir(path.dirname(persistPath), { recursive: true });
    await writeFile(persistPath, JSON.stringify(snapshot));
  };

  const persist = () => {
    saveQueue = saveQueue.then(writeSnapshot).catch((error) => {
      logger.error(`Could not save runtime changes: ${error.message}`);
    });
    return saveQueue;
  };

  return {
    source: 'json',

    async countBuildings() {
      return buildings.length;
    },

    async getBuildings() {
      return [...buildings].sort((a, b) => a.code.localeCompare(b.code)).map(copy);
    },

    async getBuildingById(id) {
      const building = buildings.find((item) => item.id === id || item.code === String(id).toUpperCase());
      return building ? copy(building) : null;
    },

    async createBuilding(building) {
      buildings.push(copy(building));
      await persist();
      return copy(building);
    },

    async updateBuilding(id, fields) {
      const index = buildings.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      buildings[index] = { ...buildings[index], ...fields };
      await persist();
      return copy(buildings[index]);
    },

    async deleteBuilding(id) {
      const existed = buildings.some((item) => item.id === id);
      const roomIds = rooms.filter((room) => room.buildingId === id).map((room) => room.id);
      buildings = buildings.filter((item) => item.id !== id);
      rooms = rooms.filter((room) => room.buildingId !== id);
      schedules = schedules.filter((schedule) => !roomIds.includes(schedule.roomId));
      readings = readings.filter((reading) => reading.buildingId !== id);
      rebuildReadingIndex();
      await persist();
      return existed;
    },

    async getRooms({ buildingId } = {}) {
      return rooms
        .filter((room) => !buildingId || room.buildingId === buildingId)
        .sort((a, b) => a.code.localeCompare(b.code))
        .map(copy);
    },

    async getRoomsByIds(ids) {
      const wanted = new Set(ids);
      return rooms.filter((room) => wanted.has(room.id)).map(copy);
    },

    async createRoom(room) {
      rooms.push(copy(room));
      await persist();
      return copy(room);
    },

    async updateRoom(id, fields) {
      const index = rooms.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      rooms[index] = { ...rooms[index], ...fields };
      if (fields.buildingId) {
        readings = readings.map((reading) => (reading.roomId === id ? { ...reading, buildingId: fields.buildingId } : reading));
        rebuildReadingIndex();
      }
      await persist();
      return copy(rooms[index]);
    },

    async deleteRoom(id) {
      const existed = rooms.some((item) => item.id === id);
      rooms = rooms.filter((room) => room.id !== id);
      schedules = schedules.filter((schedule) => schedule.roomId !== id);
      readings = readings.filter((reading) => reading.roomId !== id);
      rebuildReadingIndex();
      await persist();
      return existed;
    },

    async getSchedules({ roomIds } = {}) {
      const wanted = roomIds ? new Set(roomIds) : null;
      return schedules.filter((schedule) => !wanted || wanted.has(schedule.roomId)).map(copy);
    },

    async getScheduleById(id) {
      const schedule = schedules.find((item) => item.id === id);
      return schedule ? copy(schedule) : null;
    },

    async createSchedule(schedule) {
      schedules.push(copy(schedule));
      await persist();
      return copy(schedule);
    },

    async updateSchedule(id, fields) {
      const index = schedules.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      schedules[index] = { ...schedules[index], ...fields };
      await persist();
      return copy(schedules[index]);
    },

    async deleteSchedule(id) {
      const existed = schedules.some((item) => item.id === id);
      schedules = schedules.filter((schedule) => schedule.id !== id);
      await persist();
      return existed;
    },

    async getReadings({ from, to, buildingId, roomIds } = {}) {
      const fromMs = from ? toMs(from) : -Infinity;
      const toMsValue = to ? toMs(to) : Infinity;
      const wanted = roomIds ? new Set(roomIds) : null;
      return readings
        .filter((reading) => {
          const time = reading.timestamp.getTime();
          return time >= fromMs
            && time <= toMsValue
            && (!buildingId || reading.buildingId === buildingId)
            && (!wanted || wanted.has(reading.roomId));
        })
        .map(copy);
    },

    async getLatestTimestamp() {
      return readings.length ? new Date(readings[readings.length - 1].timestamp) : null;
    },

    async insertReadings(items) {
      let inserted = 0;
      let updated = 0;
      const roomsById = new Map(rooms.map((room) => [room.id, room]));
      items.forEach((item) => {
        const room = roomsById.get(item.roomId);
        const ms = floorToHour(item.timestamp).getTime();
        const existing = readingIndex.get(keyOf(item.roomId, ms));
        if (existing) {
          existing.kwh = Math.round((existing.kwh + item.kwh) * 1000) / 1000;
          updated += 1;
        } else {
          const reading = { roomId: item.roomId, buildingId: room.buildingId, timestamp: new Date(ms), kwh: item.kwh };
          readings.push(reading);
          readingIndex.set(keyOf(item.roomId, ms), reading);
          inserted += 1;
        }
      });
      readings.sort(sortByTime);
      await persist();
      return { inserted, updated, persisted: Boolean(persistPath) };
    },
  };
}
