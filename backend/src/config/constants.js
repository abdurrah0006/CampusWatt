import { env } from './env.js';

export const APP_NAME = 'CampusWatt';
export const API_VERSION = '1.0.0';

export const ROOM_TYPES = Object.freeze(['lecture_hall', 'lab', 'office', 'library', 'server_room']);

export const ROOM_TYPE_LABELS = Object.freeze({
  lecture_hall: 'Lecture hall',
  lab: 'Lab',
  office: 'Office',
  library: 'Library',
  server_room: 'Server room',
});

export const SEVERITY = Object.freeze({ WARNING: 'warning', CRITICAL: 'critical' });

export const DAY_NAMES = Object.freeze(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']);

export const DAYS_PER_MONTH = 30;

export const HISTORY_DAYS = 14;

export const STALE_DATA_HOURS = 2;

export const RUNTIME_OVERRIDES_FILE = 'runtime-overrides.json';

export const DEFAULTS = Object.freeze({
  tariffAedPerKwh: env.tariffAedPerKwh,
  highUsageMultiplier: env.highUsageMultiplier,
  wasteWindowHours: env.wasteWindowHours,
  minWasteHours: env.minWasteHours,
  forecastLookbackDays: env.forecastLookbackDays,
  alertWarningRatio: env.alertWarningRatio,
  dailyLoadFactor: env.dailyLoadFactor,
  utcOffsetHours: env.campusUtcOffsetHours,
});
