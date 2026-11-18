import { sendSuccess } from '../utils/apiResponse.js';
import { DEFAULTS } from '../config/constants.js';
import { computeWaste, loadContext } from '../services/analytics.js';

export async function getWaste(req, res) {
  const { tariff = DEFAULTS.tariffAedPerKwh } = req.validated.query;
  const ctx = await loadContext({ historyHours: DEFAULTS.wasteWindowHours });
  const data = computeWaste(ctx, { tariff });
  return sendSuccess(res, data, { referenceTime: data.referenceTime, flaggedRooms: data.totals.flaggedRooms });
}
