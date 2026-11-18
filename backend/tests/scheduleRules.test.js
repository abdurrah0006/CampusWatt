import { findOverlappingBlock, formatHourRange } from '../src/services/scheduleRules.js';

const existing = [
  { id: 'sch-1', dayOfWeek: 1, startHour: 9, endHour: 11, courseName: 'Physics' },
  { id: 'sch-2', dayOfWeek: 1, startHour: 13, endHour: 15, courseName: 'Maths' },
];

describe('findOverlappingBlock', () => {
  test('finds a block that overlaps on the same day', () => {
    const clash = findOverlappingBlock(existing, { dayOfWeek: 1, startHour: 10, endHour: 12 });
    expect(clash.id).toBe('sch-1');
  });

  test('ignores blocks on a different day', () => {
    expect(findOverlappingBlock(existing, { dayOfWeek: 2, startHour: 10, endHour: 12 })).toBeNull();
  });

  test('allows blocks that only touch', () => {
    expect(findOverlappingBlock(existing, { dayOfWeek: 1, startHour: 11, endHour: 13 })).toBeNull();
  });

  test('ignores the block being edited', () => {
    expect(findOverlappingBlock(existing, { dayOfWeek: 1, startHour: 9, endHour: 10 }, 'sch-1')).toBeNull();
  });
});

describe('formatHourRange', () => {
  test('formats a range for messages', () => {
    expect(formatHourRange(9, 11)).toBe('9:00 to 11:00');
  });
});
