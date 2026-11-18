import { calculateCampusSavings, calculateSavings } from '../src/services/savings.js';

describe('calculateSavings', () => {
  test('scales daily waste to a 30-day month at the tariff', () => {
    const s = calculateSavings({ wasteKwh: 10, windowHours: 24, tariffAedPerKwh: 0.38 });
    expect(s.dailyWasteKwh).toBe(10);
    expect(s.monthlySavingsKwh).toBe(300);
    expect(s.monthlySavingsAED).toBe(114);
  });

  test('normalises windows that are not 24h', () => {
    expect(calculateSavings({ wasteKwh: 10, windowHours: 48 }).dailyWasteKwh).toBe(5);
  });

  test('never returns negative savings', () => {
    expect(calculateSavings({ wasteKwh: -4 }).monthlySavingsAED).toBe(0);
  });
});

describe('calculateCampusSavings', () => {
  test('only counts flagged rooms', () => {
    const totals = calculateCampusSavings(
      [{ flagged: true, wasteKwh: 10 }, { flagged: true, wasteKwh: 5 }, { flagged: false, wasteKwh: 99 }],
      { tariffAedPerKwh: 0.5 },
    );
    expect(totals.flaggedRooms).toBe(2);
    expect(totals.monthlySavingsKwh).toBe(450);
    expect(totals.monthlySavingsAED).toBe(225);
  });
});
