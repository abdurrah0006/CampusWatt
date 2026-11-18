import { jest } from '@jest/globals';
import { generateRecommendations } from '../src/services/recommendation.js';
import { priorityFor, wasteProfile } from '../src/services/providers/ruleBasedProvider.js';

const facts = [
  {
    roomId: 'room-a', roomCode: 'ENG-101', roomName: 'Lecture Hall A', roomType: 'lecture_hall', buildingName: 'Engineering',
    wasteHours: 5, wasteKwh: 25, peakHour: 20, peakDayOfWeek: 1, monthlySavingsKwh: 750, monthlySavingsAED: 285,
    wasteHourDetails: [18, 19, 20, 21, 22].map((hour) => ({ hour, dayOfWeek: 1, timestamp: `2026-11-16T${String(hour - 4).padStart(2, '0')}:00:00.000Z` })),
  },
  {
    roomId: 'room-b', roomCode: 'LIB-G10', roomName: 'Main Reading Hall', roomType: 'library', buildingName: 'Library',
    wasteHours: 7, wasteKwh: 30, peakHour: 2, peakDayOfWeek: 2, monthlySavingsKwh: 900, monthlySavingsAED: 342,
    wasteHourDetails: [23, 0, 1, 2, 3, 4, 5].map((hour) => ({ hour, dayOfWeek: 2, timestamp: '2026-11-16T20:00:00.000Z' })),
  },
];

describe('rule-based engine', () => {
  test('produces specific text with numbers, a tag and a priority', async () => {
    const { source, items } = await generateRecommendations(facts);
    expect(source).toBe('rule-based');
    expect(items).toHaveLength(2);
    expect(items[0].recommendation).toMatch(/Lecture Hall A/);
    expect(items[0].recommendation).toMatch(/AED 285/);
    expect(items[0].actionTag).toBe('Schedule auto-shutoff');
    expect(items[1].actionTag).toBe('Lighting timer');
    expect(items[0].recommendation).not.toEqual(items[1].recommendation);
  });

  test('wasteProfile and priority rules', () => {
    expect(wasteProfile([{ hour: 2, dayOfWeek: 2 }, { hour: 3, dayOfWeek: 2 }])).toBe('overnight');
    expect(wasteProfile([{ hour: 14, dayOfWeek: 6 }])).toBe('weekend');
    expect(priorityFor({ monthlySavingsAED: 500, wasteHours: 2 })).toBe('High');
    expect(priorityFor({ monthlySavingsAED: 200, wasteHours: 2 })).toBe('Medium');
    expect(priorityFor({ monthlySavingsAED: 50, wasteHours: 2 })).toBe('Low');
  });
});

describe('LLM provider fallback', () => {
  test('uses AI text when the provider returns valid JSON', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(facts.map((f) => ({ roomId: f.roomId, recommendation: `AI says: switch off ${f.roomName} after hours to save energy every night.` }))) }],
      }),
    });
    const { source, items } = await generateRecommendations(facts, { llmApiKey: 'k', llmModel: 'm', fetchImpl });
    expect(source).toBe('ai');
    expect(items[0].recommendation).toMatch(/^AI says/);
    expect(items[0].priority).toBeDefined();
  });

  test('falls back to rule-based on HTTP error', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const { source, items } = await generateRecommendations(facts, { llmApiKey: 'k', fetchImpl });
    expect(source).toBe('rule-based');
    expect(items).toHaveLength(2);
  });

  test('falls back on invalid output', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'not json' }] }) });
    const { source } = await generateRecommendations(facts, { llmApiKey: 'k', fetchImpl });
    expect(source).toBe('rule-based');
  });

  test('falls back on timeout', async () => {
    const fetchImpl = (url, { signal }) => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    });
    const { source } = await generateRecommendations(facts, { llmApiKey: 'k', llmTimeoutMs: 50, fetchImpl });
    expect(source).toBe('rule-based');
  });
});
