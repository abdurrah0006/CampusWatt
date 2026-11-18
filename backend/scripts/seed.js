#!/usr/bin/env node
/**
 * Loads src/data/*.json into MongoDB.
 *   npm run seed            - inserts data (skips if buildings already exist)
 *   npm run seed -- --reset - wipes the collections first (recommended before a demo)
 * If the JSON files are missing or stale (> 2h old), they are regenerated first so the
 * dashboard shows data up to the current hour.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { STALE_DATA_HOURS } from '../src/config/constants.js';
import { Building } from '../src/models/Building.js';
import { Room } from '../src/models/Room.js';
import { Schedule } from '../src/models/Schedule.js';
import { EnergyReading } from '../src/models/EnergyReading.js';
import { writeDataset } from './generateData.js';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const reset = process.argv.includes('--reset');

async function loadDataset() {
  try {
    const read = async (name) => JSON.parse(await readFile(path.join(DATA_DIR, `${name}.json`), 'utf8'));
    const [buildings, rooms, schedules, readings, meta] = await Promise.all(
      ['buildings', 'rooms', 'schedules', 'readings', 'meta'].map(read),
    );
    const ageHours = (Date.now() - new Date(meta.referenceTime).getTime()) / 3600000;
    if (ageHours > STALE_DATA_HOURS) {
      console.log(`JSON data is ${Math.round(ageHours)}h old - regenerating so it ends at the current hour...`);
      return writeDataset({ silent: true });
    }
    return { buildings, rooms, schedules, readings, meta };
  } catch {
    console.log('JSON data not found - generating it first...');
    return writeDataset({ silent: true });
  }
}

const withMongoId = ({ id, ...rest }) => ({ _id: id, ...rest });

async function seed() {
  const dataset = await loadDataset();

  console.log(`Connecting to ${env.mongoUri.replace(/\/\/([^@]+)@/, '//***@')} ...`);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: env.mongoTimeoutMs + 2000 });

  if (reset) {
    console.log('--reset: clearing collections');
    await Promise.all([Building.deleteMany({}), Room.deleteMany({}), Schedule.deleteMany({}), EnergyReading.deleteMany({})]);
  } else if (await Building.estimatedDocumentCount()) {
    console.log('Database already has data. Run "npm run seed:reset" to wipe and reseed with fresh data.');
    await mongoose.disconnect();
    return;
  }

  await Promise.all([Building.syncIndexes(), Room.syncIndexes(), Schedule.syncIndexes(), EnergyReading.syncIndexes()]);

  await Building.insertMany(dataset.buildings.map(withMongoId));
  await Room.insertMany(dataset.rooms.map(withMongoId));
  await Schedule.insertMany(dataset.schedules.map(withMongoId));

  const BATCH = 2000;
  for (let i = 0; i < dataset.readings.length; i += BATCH) {
    const batch = dataset.readings.slice(i, i + BATCH).map((r) => ({ ...r, timestamp: new Date(r.timestamp) }));
    await EnergyReading.insertMany(batch, { ordered: false });
  }

  console.log('Seed complete:');
  console.log(`  ${dataset.buildings.length} buildings, ${dataset.rooms.length} rooms, ${dataset.schedules.length} schedule blocks`);
  console.log(`  ${dataset.readings.length} readings ending ${dataset.meta?.referenceTime}`);
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(`\nSeed failed: ${err.message}`);
  console.error('Is MongoDB running and MONGO_URI correct? The API still works without MongoDB (JSON fallback).');
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
