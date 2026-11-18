import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { DEFAULTS } from '../config/constants.js';
import { env } from '../config/env.js';
import { computeWaste, loadContext } from '../services/analytics.js';
import { generateRecommendations } from '../services/recommendation.js';

/** POST /api/recommendations { roomIds: [], tariff? } */
export async function createRecommendations(req, res) {
  const { roomIds, tariff = DEFAULTS.tariffAedPerKwh } = req.validated.body;

  const ctx = await loadContext({ historyHours: DEFAULTS.wasteWindowHours });
  const knownIds = new Set(ctx.rooms.map((r) => r.id));
  const unknown = roomIds.filter((id) => !knownIds.has(id));
  if (unknown.length === roomIds.length) throw ApiError.notFound('None of the requested rooms exist');

  const waste = computeWaste(ctx, { tariff });
  const requested = new Set(roomIds);
  const flagged = waste.rooms.filter((r) => requested.has(r.roomId) && r.flagged);
  const notFlagged = waste.rooms.filter((r) => requested.has(r.roomId) && !r.flagged).map((r) => r.roomId);

  const facts = flagged.map((r) => ({
    roomId: r.roomId,
    roomCode: r.roomCode,
    roomName: r.roomName,
    roomType: r.roomType,
    buildingName: r.buildingName,
    wasteHours: r.wasteHours,
    wasteKwh: r.wasteKwh,
    peakHour: r.peakWasteHour?.hour ?? null,
    peakDayOfWeek: r.peakWasteHour?.dayOfWeek,
    peakTimestamp: r.peakWasteHour?.timestamp ?? null,
    wasteHourDetails: r.wasteHourDetails,
    monthlySavingsKwh: r.monthlySavingsKwh,
    monthlySavingsAED: r.monthlySavingsAED,
  }));

  const result = await generateRecommendations(facts, {
    llmApiKey: env.llmApiKey,
    llmModel: env.llmModel,
    llmTimeoutMs: env.llmTimeoutMs,
  });

  const priorityRank = { High: 0, Medium: 1, Low: 2 };
  const items = result.items.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.monthlySavingsAED - a.monthlySavingsAED);

  return sendSuccess(
    res,
    {
      source: result.source,
      label: 'Smart Recommendation',
      items,
      skipped: { notFlagged, unknown },
      totalMonthlySavingsAED: Math.round(items.reduce((acc, i) => acc + i.monthlySavingsAED, 0) * 100) / 100,
    },
    { count: items.length, referenceTime: waste.referenceTime, ...(result.fallbackReason ? { fallbackReason: result.fallbackReason } : {}) },
  );
}
