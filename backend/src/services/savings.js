import { round, sum } from '../utils/math.js';

/**
 * Converts the waste found in one analysis window into monthly savings.
 * dailyWasteKwh = wasteKwh scaled to 24h, monthly = daily x daysPerMonth, AED = kWh x tariff.
 */
export function calculateSavings({ wasteKwh, windowHours = 24, tariffAedPerKwh = 0.38, daysPerMonth = 30 }) {
  const safeWaste = Math.max(0, Number(wasteKwh) || 0);
  const dailyWasteKwh = windowHours > 0 ? safeWaste * (24 / windowHours) : 0;
  const monthlySavingsKwh = dailyWasteKwh * daysPerMonth;
  return {
    dailyWasteKwh: round(dailyWasteKwh, 2),
    monthlySavingsKwh: round(monthlySavingsKwh, 1),
    monthlySavingsAED: round(monthlySavingsKwh * tariffAedPerKwh, 2),
  };
}

/** Totals across flagged rooms only. */
export function calculateCampusSavings(roomResults, options = {}) {
  const flagged = roomResults.filter((r) => r.flagged);
  const wasteKwh = sum(flagged.map((r) => r.wasteKwh));
  return {
    flaggedRooms: flagged.length,
    wasteKwhInWindow: round(wasteKwh, 2),
    ...calculateSavings({ ...options, wasteKwh }),
  };
}
