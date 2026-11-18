import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const dataSource = (process.env.DATA_SOURCE || 'mongo').trim().toLowerCase() === 'json' ? 'json' : 'mongo';

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest: process.env.NODE_ENV === 'test',
  isProduction: process.env.NODE_ENV === 'production',
  port: toNumber(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  dataSource,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campuswatt',
  mongoTimeoutMs: toNumber(process.env.MONGO_TIMEOUT_MS, 3000),

  tariffAedPerKwh: toNumber(process.env.TARIFF_AED_PER_KWH, 0.38),
  highUsageMultiplier: toNumber(process.env.HIGH_USAGE_MULTIPLIER, 1.5),
  wasteWindowHours: toNumber(process.env.WASTE_WINDOW_HOURS, 24),
  minWasteHours: toNumber(process.env.MIN_WASTE_HOURS, 2),
  forecastLookbackDays: toNumber(process.env.FORECAST_LOOKBACK_DAYS, 7),
  alertWarningRatio: toNumber(process.env.ALERT_WARNING_RATIO, 0.9),
  dailyLoadFactor: toNumber(process.env.DAILY_LOAD_FACTOR, 0.7),
  campusUtcOffsetHours: toNumber(process.env.CAMPUS_UTC_OFFSET_HOURS, 4),

  ingestApiKey: process.env.INGEST_API_KEY || '',

  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'claude-haiku-5-5',
  llmTimeoutMs: toNumber(process.env.LLM_TIMEOUT_MS, 5000),
});
