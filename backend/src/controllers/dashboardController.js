import { store } from '../repositories/dataStore.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { DEFAULTS } from '../config/constants.js';
import { computeAlerts, computeDashboard, computeForecast, loadContext } from '../services/analytics.js';

export async function getSummary(req, res) {
  const { tariff = DEFAULTS.tariffAedPerKwh, thresholdMultiplier = 1 } = req.validated.query;
  const ctx = await loadContext();
  const data = computeDashboard(ctx, { tariff, thresholdMultiplier });
  return sendSuccess(res, data, { referenceTime: data.referenceTime, tariffAedPerKwh: tariff, thresholdMultiplier });
}

export async function getForecast(req, res) {
  const { buildingId } = req.validated.query;
  let building = null;
  if (buildingId && buildingId !== 'all') {
    building = await store.getBuildingById(buildingId);
    if (!building) throw ApiError.notFound(`Building "${buildingId}" not found`);
  }
  // Forecast needs today plus `lookbackDays` days of history.
  const ctx = await loadContext({ historyHours: (DEFAULTS.forecastLookbackDays + 1) * 24 });
  const data = computeForecast(ctx, { buildingId: building?.id });
  return sendSuccess(res, { ...data, buildingName: building?.name || 'All buildings' }, { referenceTime: ctx.referenceTime });
}

export async function getAlerts(req, res) {
  const { thresholdMultiplier = 1 } = req.validated.query;
  const ctx = await loadContext({ historyHours: 24 });
  const { alerts, statuses } = computeAlerts(ctx, { thresholdMultiplier });
  return sendSuccess(
    res,
    { alerts, statuses: statuses.map(({ alert, ...rest }) => rest) },
    { count: alerts.length, referenceTime: ctx.referenceTime },
  );
}
