import { computeDashboard, computeForecast, computeWaste } from '../src/services/analytics.js';

const emptyContext = {
  referenceTime: null,
  buildings: [{ id: 'bld-new', code: 'NEW', name: 'New Hall', floors: 2, thresholdKwhPerHour: 30 }],
  rooms: [{ id: 'room-new-1', code: 'NEW-1', name: 'New Room', buildingId: 'bld-new', floor: 1, type: 'lab', areaM2: 50, baselineKw: 2 }],
  schedules: [],
  readings: [],
};

describe('Campus with no readings', () => {
  test('waste list shows every room with no data yet', () => {
    const waste = computeWaste(emptyContext);
    expect(waste.rooms).toHaveLength(1);
    expect(waste.rooms[0]).toMatchObject({ roomId: 'room-new-1', status: 'ok', flagged: false, currentKwh: null, monthlySavingsKwh: 0 });
    expect(waste.totals).toMatchObject({ flaggedRooms: 0, totalRooms: 1, monthlySavingsKwh: 0 });
  });

  test('dashboard and forecast return empty results without throwing', () => {
    expect(computeDashboard(emptyContext).referenceTime).toBeNull();
    expect(computeForecast(emptyContext).points).toEqual([]);
  });
});
