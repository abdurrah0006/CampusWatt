import { connectDB, isMongoConnected } from '../config/db.js';
import { env } from '../config/env.js';
import { createJsonRepository } from './jsonRepository.js';
import { createMongoRepository } from './mongoRepository.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

let mongoRepo = null;
let jsonRepo = null;
let lastSource = 'json';
let warnedFailure = false;
let mongoConfigured = false;

export async function initDataStore({ preferred = env.dataSource, jsonRepository } = {}) {
  mongoRepo = null;
  mongoConfigured = preferred === 'mongo';
  if (preferred === 'mongo') {
    try {
      await connectDB();
      const repo = createMongoRepository();
      const count = await repo.countBuildings();
      if (!count) {
        throw new Error('database is empty - run "npm run seed"');
      }
      mongoRepo = repo;
      lastSource = 'mongo';
      logger.info('Data source: MongoDB');
    } catch (err) {
      logger.warn(`MongoDB unavailable (${err.message}). Falling back to JSON data so the demo keeps working.`);
    }
  }

  jsonRepo = jsonRepository || (await createJsonRepository());
  if (!mongoRepo) {
    lastSource = 'json';
    logger.info('Data source: JSON (in-memory)');
  }
  return lastSource;
}

const mongoUsable = () => Boolean(mongoRepo) && isMongoConnected();

async function readCall(method, ...args) {
  if (!jsonRepo) {
    throw new Error('Data store not initialised. Call initDataStore() first.');
  }
  if (mongoUsable()) {
    try {
      const result = await mongoRepo[method](...args);
      lastSource = 'mongo';
      warnedFailure = false;
      return result;
    } catch (err) {
      if (!warnedFailure) {
        logger.error(`MongoDB query "${method}" failed (${err.message}). Serving JSON fallback.`);
      }
      warnedFailure = true;
    }
  }
  lastSource = 'json';
  return jsonRepo[method](...args);
}

async function writeCall(method, ...args) {
  if (mongoUsable()) {
    lastSource = 'mongo';
    return mongoRepo[method](...args);
  }
  if (mongoConfigured) {
    throw ApiError.unavailable('The database is offline, so this change cannot be saved right now. Try again in a moment.');
  }
  lastSource = 'json';
  return jsonRepo[method](...args);
}

export const getActiveSource = () => (mongoRepo ? (mongoUsable() ? 'mongo' : 'json') : lastSource);

export const store = {
  countBuildings: () => readCall('countBuildings'),
  getBuildings: () => readCall('getBuildings'),
  getBuildingById: (id) => readCall('getBuildingById', id),
  createBuilding: (building) => writeCall('createBuilding', building),
  updateBuilding: (id, fields) => writeCall('updateBuilding', id, fields),
  deleteBuilding: (id) => writeCall('deleteBuilding', id),
  getRooms: (filter) => readCall('getRooms', filter),
  getRoomsByIds: (ids) => readCall('getRoomsByIds', ids),
  createRoom: (room) => writeCall('createRoom', room),
  updateRoom: (id, fields) => writeCall('updateRoom', id, fields),
  deleteRoom: (id) => writeCall('deleteRoom', id),
  getSchedules: (filter) => readCall('getSchedules', filter),
  getScheduleById: (id) => readCall('getScheduleById', id),
  createSchedule: (schedule) => writeCall('createSchedule', schedule),
  updateSchedule: (id, fields) => writeCall('updateSchedule', id, fields),
  deleteSchedule: (id) => writeCall('deleteSchedule', id),
  getReadings: (filter) => readCall('getReadings', filter),
  getLatestTimestamp: () => readCall('getLatestTimestamp'),
  insertReadings: (items) => writeCall('insertReadings', items),
};
