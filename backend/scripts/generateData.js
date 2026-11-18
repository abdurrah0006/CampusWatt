#!/usr/bin/env node
/**
 * Generates realistic, reproducible fake data into src/data/*.json.
 * Usage: npm run generate            (data ends at the current hour)
 *        npm run generate -- --days 21
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDataset } from '../src/data/generator.js';
import { HISTORY_DAYS } from '../src/config/constants.js';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');

export async function writeDataset({ now = new Date(), days = HISTORY_DAYS, silent = false } = {}) {
  const dataset = generateDataset({ now, days });
  await mkdir(DATA_DIR, { recursive: true });
  await Promise.all(
    ['buildings', 'rooms', 'schedules', 'readings', 'meta'].map((name) =>
      writeFile(path.join(DATA_DIR, `${name}.json`), JSON.stringify(dataset[name], null, name === 'readings' ? 0 : 2)),
    ),
  );
  if (!silent) {
    console.log('CampusWatt data generated:');
    console.log(`  buildings : ${dataset.buildings.length}`);
    console.log(`  rooms     : ${dataset.rooms.length}`);
    console.log(`  schedules : ${dataset.schedules.length} weekly blocks`);
    console.log(`  readings  : ${dataset.readings.length} hourly readings (${days} days, ending ${dataset.meta.referenceTime})`);
    console.log(`  written to: ${DATA_DIR}`);
  }
  return dataset;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const daysArg = process.argv.indexOf('--days');
  const days = daysArg > -1 ? Number(process.argv[daysArg + 1]) || HISTORY_DAYS : HISTORY_DAYS;
  writeDataset({ days }).catch((err) => {
    console.error(`Data generation failed: ${err.message}`);
    process.exit(1);
  });
}
