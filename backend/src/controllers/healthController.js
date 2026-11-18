import { store, getActiveSource } from '../repositories/dataStore.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { API_VERSION, APP_NAME } from '../config/constants.js';
import { env } from '../config/env.js';

export async function getHealth(req, res) {
  let latestReading = null;
  try {
    latestReading = await store.getLatestTimestamp();
  } catch {
    latestReading = null;
  }
  return sendSuccess(res, {
    status: 'ok',
    app: APP_NAME,
    version: API_VERSION,
    dataSource: getActiveSource(),
    configuredDataSource: env.dataSource,
    latestReading,
    recommendationProvider: env.llmApiKey ? 'ai (with rule-based fallback)' : 'rule-based',
    ingestEnabled: Boolean(env.ingestApiKey),
    uptimeSeconds: Math.round(process.uptime()),
  });
}
