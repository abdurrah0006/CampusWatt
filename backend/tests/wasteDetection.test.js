import { classifyHour, detectWaste, isScheduledAt } from '../src/services/wasteDetection.js';

// 2026-11-16 is a Monday. Campus is UTC+4, so 14:00Z = 18:00 local.
const ref = new Date('2026-11-16T20:00:00Z'); // 00:00 local Tuesday
const room = { id: 'r1', baselineKw: 2 };
const schedules = [{ roomId: 'r1', dayOfWeek: 1, startHour: 9, endHour: 17 }];

const reading = (isoUtc, kwh) => ({ roomId: 'r1', timestamp: new Date(isoUtc), kwh });

describe('isScheduledAt', () => {
  test('covers start hour, excludes end hour', () => {
    expect(isScheduledAt(schedules, 1, 9)).toBe(true);
    expect(isScheduledAt(schedules, 1, 16)).toBe(true);
    expect(isScheduledAt(schedules, 1, 17)).toBe(false);
    expect(isScheduledAt(schedules, 2, 10)).toBe(false);
  });
});

describe('classifyHour', () => {
  test('high usage without a booking is waste', () => {
    expect(classifyHour({ kwh: 5, baselineKw: 2, scheduled: false })).toEqual({ isHigh: true, isWaste: true, excessKwh: 3 });
  });
  test('high usage during a booking is not waste', () => {
    expect(classifyHour({ kwh: 5, baselineKw: 2, scheduled: true }).isWaste).toBe(false);
  });
  test('exactly at the multiplier is not high', () => {
    expect(classifyHour({ kwh: 3, baselineKw: 2, scheduled: false }).isHigh).toBe(false);
  });
});

describe('detectWaste', () => {
  test('flags a room with 2+ waste hours and sums excess over baseline', () => {
    const readings = [
      reading('2026-11-16T08:00:00Z', 6), // 12:00 local, scheduled -> not waste
      reading('2026-11-16T15:00:00Z', 5), // 19:00 local, unscheduled, high -> waste (3)
      reading('2026-11-16T16:00:00Z', 4), // 20:00 local -> waste (2)
      reading('2026-11-16T17:00:00Z', 2.5), // not high
    ];
    const { rooms } = detectWaste({ rooms: [room], schedules, readings, referenceTime: ref });
    expect(rooms[0].flagged).toBe(true);
    expect(rooms[0].wasteHours).toBe(2);
    expect(rooms[0].wasteKwh).toBe(5);
    expect(rooms[0].peakWasteHour.hour).toBe(19);
  });

  test('a single waste hour does not flag the room', () => {
    const readings = [reading('2026-11-16T15:00:00Z', 5)];
    const { rooms } = detectWaste({ rooms: [room], schedules, readings, referenceTime: ref });
    expect(rooms[0].flagged).toBe(false);
    expect(rooms[0].wasteKwh).toBe(0);
  });

  test('ignores readings outside the window', () => {
    const readings = [reading('2026-11-14T15:00:00Z', 9), reading('2026-11-14T16:00:00Z', 9)];
    const { rooms } = detectWaste({ rooms: [room], schedules, readings, referenceTime: ref });
    expect(rooms[0].wasteHours).toBe(0);
  });

  test('respects configurable multiplier and minimum hours', () => {
    const readings = [reading('2026-11-16T15:00:00Z', 5)];
    const { rooms } = detectWaste({
      rooms: [room], schedules, readings, referenceTime: ref,
      options: { highUsageMultiplier: 2, minWasteHours: 1 },
    });
    expect(rooms[0].flagged).toBe(true);
  });
});
