import { evaluateAlerts, evaluateBuilding, getSeverity } from '../src/services/alerts.js';

const building = { id: 'b1', code: 'B1', name: 'Test Hall', thresholdKwhPerHour: 100 };
const ts = new Date('2026-11-16T10:00:00Z');

describe('getSeverity', () => {
  test.each([
    [0.5, null],
    [0.9, null],
    [0.95, 'warning'],
    [1.0, 'warning'],
    [1.01, 'critical'],
  ])('ratio %p -> %p', (ratio, expected) => {
    expect(getSeverity(ratio)).toBe(expected);
  });
});

describe('evaluateBuilding', () => {
  test('raises a critical hourly alert above the threshold', () => {
    const { alert, status } = evaluateBuilding({ building, latestKwh: 120, dailyKwh: 100, timestamp: ts });
    expect(status).toBe('critical');
    expect(alert.type).toBe('hourly');
    expect(alert.percentOver).toBe(20);
    expect(alert.threshold).toBe(100);
  });

  test('uses the daily limit (threshold x 24 x load factor)', () => {
    const { alert } = evaluateBuilding({ building, latestKwh: 10, dailyKwh: 1764, timestamp: ts }); // limit 1680
    expect(alert.type).toBe('daily');
    expect(alert.severity).toBe('critical');
    expect(alert.threshold).toBe(1680);
  });

  test('threshold multiplier relaxes the limit', () => {
    const { alert, status } = evaluateBuilding({
      building, latestKwh: 120, dailyKwh: 0, timestamp: ts, options: { thresholdMultiplier: 1.5 },
    });
    expect(alert).toBeNull();
    expect(status).toBe('normal');
  });

  test('warning band between 90% and 100%', () => {
    expect(evaluateBuilding({ building, latestKwh: 95, dailyKwh: 0, timestamp: ts }).status).toBe('warning');
  });
});

describe('evaluateAlerts', () => {
  test('sorts critical before warning', () => {
    const b2 = { ...building, id: 'b2', code: 'B2', name: 'Other' };
    const { alerts } = evaluateAlerts({
      buildings: [building, b2],
      latestByBuilding: { b1: 95, b2: 150 },
      dailyByBuilding: {},
      timestamp: ts,
    });
    expect(alerts.map((a) => a.buildingId)).toEqual(['b2', 'b1']);
  });
});
